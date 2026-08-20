'use client';

import { useState, useEffect } from "react"
import { 
  Plus, 
  Search, 
  Loader2,
  FileSignature,
  Save,
  CheckCircle,
  Clock,
  User,
  ArrowRight,
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
import { toast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser,
  setDocumentNonBlocking
} from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
import { format, parseISO } from "date-fns"

export default function RescisaoPortalPage() {
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

  // Buscar solicitações de rescisão na coleção de tarefas
  const tasksQuery = useMemoFirebase(() => 
    cnpj ? query(
      collection(firestore, "tasks"), 
      where("clientId", "==", cnpj), 
      where("origem", "==", "PORTAL_CLIENTE"), 
      where("tipo", "==", "RESCISAO")
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
    tipoAviso: "trabalhado",
    dataInicioAviso: ""
  })

  const handleCreateRequest = async () => {
    if (!cnpj) {
      toast({ title: "Erro", description: "Selecione uma empresa válida.", variant: "destructive" })
      return
    }
    if (!newRequest.funcionarioId || !newRequest.tipoAviso || !newRequest.dataInicioAviso) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" })
      return
    }

    const emp = emps.find(e => e.id === newRequest.funcionarioId)
    if (!emp) {
      toast({ title: "Erro", description: "Funcionário selecionado inválido.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const id = Math.random().toString(36).substr(2, 9)
      const taskRef = doc(firestore, "tasks", id)

      const notesHtml = `
        Solicitação de Rescisão criada via Portal do Cliente.
        Funcionário: ${emp.nome} (CPF: ${emp.cpf})
        Tipo de Aviso: ${newRequest.tipoAviso === 'trabalhado' ? 'Trabalhado' : 'Indenizado'}
        Início do Aviso: ${format(parseISO(newRequest.dataInicioAviso), "dd/MM/yyyy")}
      `.trim()

      const taskData = {
        id,
        clientId: cnpj,
        clientName: companyName || emp.clientName,
        title: `SOLICITAÇÃO DE RESCISÃO - ${emp.nome}`,
        responsibleId: "Geral",
        responsibleName: "Departamento Pessoal",
        notes: notesHtml,
        status: "pendente", // PENDENTE
        origem: "PORTAL_CLIENTE",
        tipo: "RESCISAO",
        departamento: "DP",
        funcionarioId: emp.id,
        funcionarioNome: emp.nome,
        tipoAviso: newRequest.tipoAviso,
        dataInicioAviso: newRequest.dataInicioAviso,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setDocumentNonBlocking(taskRef, taskData, { merge: true })
      
      setIsAddOpen(false)
      setNewRequest({ funcionarioId: "", tipoAviso: "trabalhado", dataInicioAviso: "" })
      toast({ title: "Solicitação Enviada!", description: `A demanda de rescisão para ${emp.nome} foi enviada ao Departamento Pessoal.` })
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao enviar a solicitação.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C4156] tracking-tight">Rescisão de Contrato</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Comunique desligamentos de funcionários e acompanhe o andamento das rescisões.</p>
        </div>
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-bold shadow-lg h-11" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> Nova Rescisão
        </Button>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-blue-600" />
            Histórico de Solicitações de Rescisão
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Desligamentos enviados para o processamento do Departamento Pessoal.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-500 font-semibold text-xs">Funcionário</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Tipo de Aviso</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Início do Aviso</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Data da Solicitação</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Status DP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTasks ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
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
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase border-slate-200 text-slate-600">
                          {req.tipoAviso === 'trabalhado' ? 'TRABALHADO' : 'INDENIZADO'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-bold">
                        {req.dataInicioAviso ? new Date(req.dataInicioAviso + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}
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
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <FolderOpen className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nenhuma solicitação de rescisão registrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL NOVA RESCISÃO */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Nova Rescisão</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Solicite o desligamento e o cálculo de rescisão de um colaborador.
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
                ) : emps.length > 0 ? (
                  <Select value={newRequest.funcionarioId} onValueChange={(v) => setNewRequest({...newRequest, funcionarioId: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-11">
                      <SelectValue placeholder="Selecione o trabalhador..." />
                    </SelectTrigger>
                    <SelectContent>
                      {emps.map(e => (
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
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Tipo de Aviso *</Label>
                  <Select value={newRequest.tipoAviso} onValueChange={(v) => setNewRequest({...newRequest, tipoAviso: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trabalhado" className="text-xs font-bold">TRABALHADO</SelectItem>
                      <SelectItem value="indenizado" className="text-xs font-bold">INDENIZADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Início do Aviso *</Label>
                  <Input 
                    type="date"
                    value={newRequest.dataInicioAviso} 
                    onChange={(e) => setNewRequest({...newRequest, dataInicioAviso: e.target.value})}
                    className="border-[#D2D7DB] h-11 font-bold"
                  />
                </div>
              </div>

            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="font-bold text-xs uppercase h-11 border-slate-300">Cancelar</Button>
            <Button 
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-8 shadow-lg shadow-blue-500/20 h-11" 
              onClick={handleCreateRequest}
              disabled={isSaving || emps.length === 0}
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
