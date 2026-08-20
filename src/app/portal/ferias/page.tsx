'use client';

import { useState, useEffect } from "react"
import { 
  Plus, 
  Search, 
  Loader2,
  Calendar,
  Save,
  CheckCircle,
  HelpCircle,
  Clock,
  User,
  ArrowRight,
  Calculator,
  RefreshCw,
  FolderOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser,
  setDocumentNonBlocking
} from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
import { addDays, format, parseISO, isValid } from "date-fns"
import { cn } from "@/lib/utils"

export default function FeriasPortalPage() {
  const firestore = useFirestore()
  const { selectedUser } = useUser()
  const [cnpj, setCnpj] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Sincroniza CNPJ da empresa ativa no portal
  useEffect(() => {
    const container = document.getElementById("portal-context-container")
    if (container) {
      setCnpj(container.getAttribute("data-active-cnpj") || "")
      setCompanyName(container.getAttribute("data-active-company") || "")
    }

    const handleCnpjChange = (e: any) => {
      if (e.detail?.cnpj) {
        setCnpj(e.detail.cnpj)
        if (e.detail.client) {
          setCompanyName(e.detail.client.nomeFantasia || e.detail.client.razaoSocial || "")
        }
      }
    }
    window.addEventListener("portalCompanyChanged", handleCnpjChange)
    return () => window.removeEventListener("portalCompanyChanged", handleCnpjChange)
  }, [])

  // Buscar funcionários ativos da empresa atual
  const empsQuery = useMemoFirebase(() => 
    cnpj ? query(collection(firestore, "funcionarios"), where("clientCnpj", "==", cnpj), where("status", "==", "ATIVO")) : null, 
    [firestore, cnpj]
  )
  const { data: emps = [], isLoading: loadingEmps } = useCollection(empsQuery)

  // Buscar solicitações de férias na coleção de tarefas
  const tasksQuery = useMemoFirebase(() => 
    cnpj ? query(
      collection(firestore, "tasks"), 
      where("clientId", "==", cnpj), 
      where("origem", "==", "PORTAL_CLIENTE"), 
      where("tipo", "==", "FERIAS")
    ) : null,
    [firestore, cnpj]
  )
  const { data: rawRequests = [], isLoading: loadingTasks } = useCollection(tasksQuery)

  const requests = (rawRequests || []).sort((a: any, b: any) => 
    new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
  )

  // Formulário do Modal
  const [newRequest, setNewRequest] = useState({
    funcionarioId: "",
    dataInicio: "",
    dias: 30,
    abonoPecuniario: false,
    diasAbono: 10
  })

  // Datas calculadas automaticamente
  const [calculatedDates, setCalculatedDates] = useState({
    dataFim: "",
    dataRetorno: ""
  })

  // Realiza o cálculo automático das datas de férias
  useEffect(() => {
    if (newRequest.dataInicio && newRequest.dias > 0) {
      try {
        const start = parseISO(newRequest.dataInicio)
        if (isValid(start)) {
          // Data Final = Início + Dias - 1
          const end = addDays(start, newRequest.dias - 1)
          // Retorno ao Trabalho = Data Final + 1 (ou Início + Dias)
          const ret = addDays(end, 1)

          setCalculatedDates({
            dataFim: format(end, "yyyy-MM-dd"),
            dataRetorno: format(ret, "yyyy-MM-dd")
          })
        }
      } catch (e) {
        console.error("Erro ao calcular datas", e)
      }
    } else {
      setCalculatedDates({ dataFim: "", dataRetorno: "" })
    }
  }, [newRequest.dataInicio, newRequest.dias])

  const handleCreateRequest = async () => {
    if (!cnpj) {
      toast({ title: "Erro", description: "Selecione uma empresa válida.", variant: "destructive" })
      return
    }
    if (!newRequest.funcionarioId || !newRequest.dataInicio || !newRequest.dias) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" })
      return
    }

    const emp = (emps || []).find(e => e.id === newRequest.funcionarioId)
    if (!emp) {
      toast({ title: "Erro", description: "Funcionário selecionado inválido.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const id = Math.random().toString(36).substr(2, 9)
      const taskRef = doc(firestore, "tasks", id)

      const notesHtml = `
        Solicitação de Férias criada via Portal do Cliente.
        Funcionário: ${emp.nome} (CPF: ${emp.cpf})
        Período de Gozo: ${format(parseISO(newRequest.dataInicio), "dd/MM/yyyy")} a ${format(parseISO(calculatedDates.dataFim), "dd/MM/yyyy")}
        Quantidade de Dias: ${newRequest.dias} dias
        Retorno ao Trabalho: ${format(parseISO(calculatedDates.dataRetorno), "dd/MM/yyyy")}
        Abono Pecuniário (Venda de 1/3): ${newRequest.abonoPecuniario ? `Sim (${newRequest.diasAbono} dias)` : "Não"}
      `.trim()

      const taskData = {
        id,
        clientId: cnpj,
        clientName: companyName || emp.clientName,
        title: `SOLICITAÇÃO DE FÉRIAS - ${emp.nome}`,
        responsibleId: "Geral",
        responsibleName: "Departamento Pessoal",
        notes: notesHtml,
        status: "pendente", // PENDENTE
        origem: "PORTAL_CLIENTE",
        tipo: "FERIAS",
        departamento: "DP",
        funcionarioId: emp.id,
        funcionarioNome: emp.nome,
        dataInicio: newRequest.dataInicio,
        dias: newRequest.dias,
        dataFim: calculatedDates.dataFim,
        dataRetorno: calculatedDates.dataRetorno,
        abonoPecuniario: newRequest.abonoPecuniario,
        diasAbono: newRequest.abonoPecuniario ? newRequest.diasAbono : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setDocumentNonBlocking(taskRef, taskData, { merge: true })
      
      setIsAddOpen(false)
      setNewRequest({ funcionarioId: "", dataInicio: "", dias: 30, abonoPecuniario: false, diasAbono: 10 })
      toast({ title: "Solicitação Enviada!", description: `A demanda de férias para ${emp.nome} foi enviada ao Departamento Pessoal.` })
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao enviar a solicitação.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // Seeding inicial de funcionários para testes se o banco estiver vazio
  const handleSeedEmployees = async () => {
    if (!cnpj) return
    setIsSaving(true)
    try {
      const mockEmps = [
        { id: "emp1", nome: "MARIO SOUZA DA SILVA", cpf: "123.456.789-00", clientCnpj: cnpj, clientName: companyName, status: "ATIVO", cargo: "Analista de TI", dataAdmissao: "2024-01-15" },
        { id: "emp2", nome: "ANA PAULA SANTOS", cpf: "987.654.321-11", clientCnpj: cnpj, clientName: companyName, status: "ATIVO", cargo: "Gerente Geral", dataAdmissao: "2022-06-10" },
        { id: "emp3", nome: "CARLOS PEREIRA ALMEIDA", cpf: "456.789.123-22", clientCnpj: cnpj, clientName: companyName, status: "ATIVO", cargo: "Assistente Administrativo", dataAdmissao: "2025-02-01" }
      ]

      for (const e of mockEmps) {
        const empRef = doc(firestore, "funcionarios", e.id)
        setDocumentNonBlocking(empRef, e, { merge: true })
      }
      toast({ title: "Base de Testes Semeada!", description: "3 funcionários de teste foram criados para esta empresa." })
    } catch (e) {
      toast({ title: "Erro ao semear", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C4156] tracking-tight">Férias de Funcionários</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Registre programações de gozo e controle o histórico de solicitações.</p>
        </div>
        <div className="flex gap-2">
          {(emps || []).length === 0 && (
            <Button variant="outline" className="border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-bold" onClick={handleSeedEmployees} disabled={isSaving}>
              Semear Funcionários Demo
            </Button>
          )}
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-bold shadow-lg h-11" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" /> Nova Férias
          </Button>
        </div>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Histórico de Solicitações de Férias
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Lista de pedidos enviados para o departamento pessoal do escritório contábil.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-500 font-semibold text-xs">Funcionário</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Período de Gozo</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Quantidade de Dias</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Retorno Previsto</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Venda (Abono)</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Data da Solicitação</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Status DP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTasks ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase mt-2">Sincronizando histórico...</p>
                  </TableCell>
                </TableRow>
              ) : requests.length > 0 ? (
                requests.map((req: any) => {
                  const statusLabel = req.status === 'concluido' ? 'GERADA' : 'PENDENTE'
                  return (
                    <TableRow key={req.id} className="hover:bg-slate-50/40 transition-colors">
                      <TableCell className="font-semibold text-sm text-[#2C4156]">
                        {req.funcionarioNome}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{req.dataInicio ? new Date(req.dataInicio + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          <span>{req.dataFim ? new Date(req.dataFim + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">
                        {req.dias} dias
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-700">
                        {req.dataRetorno ? new Date(req.dataRetorno + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}
                      </TableCell>
                      <TableCell>
                        {req.abonoPecuniario ? (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-bold">
                            Sim ({req.diasAbono} dias)
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('pt-BR') : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-none text-[9px] font-bold tracking-wide uppercase px-2 py-0.5",
                          statusLabel === 'GERADA' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <FolderOpen className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nenhuma solicitação de férias registrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL NOVA FÉRIAS */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Nova Férias</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Gere uma nova solicitação de gozo de férias para o funcionário selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="modal-scroll-content">
            <div className="p-6 space-y-5 bg-white">
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3" /> Selecionar Funcionário *
                </Label>
                {loadingEmps ? (
                  <div className="h-11 flex items-center justify-center border border-dashed rounded-lg bg-slate-50">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                    <span className="text-xs font-medium text-slate-400">Buscando funcionários...</span>
                  </div>
                ) : (emps || []).length > 0 ? (
                  <Select value={newRequest.funcionarioId} onValueChange={(v) => setNewRequest({...newRequest, funcionarioId: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-11">
                      <SelectValue placeholder="Selecione o trabalhador..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(emps || []).map(e => (
                        <SelectItem key={e.id} value={e.id} className="text-xs font-bold uppercase">
                          {e.nome} - {e.cargo || "Sem cargo"} (CPF: {e.cpf})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 border rounded-xl bg-amber-50 border-amber-200 text-center space-y-2">
                    <p className="text-xs text-amber-700 font-bold">Nenhum funcionário ativo cadastrado para este CNPJ.</p>
                    <p className="text-[10px] text-amber-600 font-semibold uppercase">Peça ao escritório contábil para cadastrar funcionários nesta empresa no painel administrativo.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Início do Gozo *
                  </Label>
                  <Input 
                    type="date"
                    value={newRequest.dataInicio} 
                    onChange={(e) => setNewRequest({...newRequest, dataInicio: e.target.value})}
                    className="border-[#D2D7DB] h-11 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                    <Calculator className="h-3 w-3" /> Dias de Gozo *
                  </Label>
                  <Input 
                    type="number"
                    min={1}
                    max={30}
                    value={newRequest.dias} 
                    onChange={(e) => setNewRequest({...newRequest, dias: parseInt(e.target.value) || 0})}
                    className="border-[#D2D7DB] h-11 font-bold"
                  />
                </div>
              </div>

              {/* Campos Calculados Automaticamente */}
              {newRequest.dataInicio && newRequest.dias > 0 && (
                <div className="p-4 rounded-xl bg-[#2563EB]/5 border border-[#2563EB]/10 grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-[#2563EB] tracking-wider">Fim do Gozo</span>
                    <p className="text-sm font-bold text-slate-800">
                      {calculatedDates.dataFim ? new Date(calculatedDates.dataFim + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-[#2563EB] tracking-wider">Retorno ao Trabalho</span>
                    <p className="text-sm font-bold text-slate-800">
                      {calculatedDates.dataRetorno ? new Date(calculatedDates.dataRetorno + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}
                    </p>
                  </div>
                </div>
              )}

              {/* Venda de Férias */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-0.5">
                    <Label htmlFor="abono" className="text-xs font-bold text-slate-700">Vender Férias (Abono Pecuniário)?</Label>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Permite vender 1/3 do período de férias</span>
                  </div>
                  <Switch 
                    id="abono" 
                    checked={newRequest.abonoPecuniario} 
                    onCheckedChange={(v) => setNewRequest({...newRequest, abonoPecuniario: v})}
                  />
                </div>

                {newRequest.abonoPecuniario && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Quantos dias?</Label>
                    <Input 
                      type="number" 
                      min={1} 
                      max={10} 
                      value={newRequest.diasAbono} 
                      onChange={(e) => setNewRequest({...newRequest, diasAbono: parseInt(e.target.value) || 0})}
                      className="border-[#2563EB] focus-visible:ring-[#2563EB] h-11 font-bold text-blue-700 bg-blue-50/10"
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="font-bold text-xs uppercase h-11 border-slate-300">Cancelar</Button>
            <Button 
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-8 shadow-lg shadow-blue-500/20 h-11" 
              onClick={handleCreateRequest}
              disabled={isSaving || (emps || []).length === 0}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
