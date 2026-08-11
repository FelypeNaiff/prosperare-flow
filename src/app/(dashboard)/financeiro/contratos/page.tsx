"use client"

import { useState, useMemo } from "react"
import { 
  Plus, 
  FileText, 
  Search, 
  Download, 
  FileCheck, 
  History, 
  AlertTriangle, 
  Loader2, 
  Save, 
  Trash2, 
  Edit2,
  Printer,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { cn, numberToExtensoBRL } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { ClientCombobox } from "@/components/shared/client-combobox"

const formatDateExtenso = (dateStr?: string) => {
  if (!dateStr) return "01 de janeiro de 2026"
  const parts = dateStr.split("-")
  if (parts.length !== 3) return dateStr

  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ]
  
  const day = parseInt(parts[2], 10)
  const monthIdx = parseInt(parts[1], 10) - 1
  const year = parts[0]

  return `${day.toString().padStart(2, "0")} de ${months[monthIdx] || "janeiro"} de ${year}`
}

const AVAILABLE_SERVICES = [
  { id: "pessoal", label: "DEPARTAMENTO PESSOAL" },
  { id: "tributario", label: "DEPARTAMENTO TRIBUTÁRIO" },
  { id: "contabil", label: "DEPARTAMENTO CONTÁBIL" },
  { id: "legalizacao", label: "ABERTURA E LEGALIZAÇÃO" }
]

export default function ContatosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false)

  const contractsQuery = useMemoFirebase(() => collection(firestore, "contracts"), [firestore])
  const { data: contracts = [], isLoading } = useCollection(contractsQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    clientId: "",
    employeeCount: 0,
    services: ["DEPARTAMENTO PESSOAL", "DEPARTAMENTO TRIBUTÁRIO"] as string[],
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    dueDay: 10,
    notes: "",
    status: "Ativo"
  })

  const stats = useMemo(() => {
    const list = contracts || []
    const active = list.filter(c => c.status === 'Ativo').length
    const revenue = list.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
    return { active, revenue }
  }, [contracts])

  const handleOpenNew = () => {
    setEditingId(null)
    setFormData({
      clientId: "",
      employeeCount: 0,
      services: ["DEPARTAMENTO PESSOAL", "DEPARTAMENTO TRIBUTÁRIO"],
      value: 0,
      startDate: new Date().toISOString().split('T')[0],
      dueDay: 10,
      notes: "",
      status: "Ativo"
    })
    setIsModalOpen(true)
  }

  const handleEdit = (contract: any) => {
    setEditingId(contract.id)
    setFormData({
      clientId: contract.clientId,
      employeeCount: contract.employeeCount !== undefined ? contract.employeeCount : 0,
      services: Array.isArray(contract.services) && contract.services.length > 0 
        ? contract.services 
        : ["DEPARTAMENTO PESSOAL", "DEPARTAMENTO TRIBUTÁRIO"],
      value: contract.value,
      startDate: contract.startDate,
      dueDay: contract.dueDay,
      notes: contract.notes || "",
      status: contract.status || "Ativo"
    })
    setIsModalOpen(true)
  }

  const handleSaveContract = () => {
    if (!formData.clientId || !formData.value) {
      toast({ title: "Campo Obrigatório", description: "Selecione o cliente e preencha o valor mensal.", variant: "destructive" })
      return
    }

    if (!formData.services || formData.services.length === 0) {
      toast({ title: "Selecione Serviços", description: "Escolha ao menos um serviço contratado para continuar.", variant: "destructive" })
      return
    }

    const client = (clients || []).find(c => c.id === formData.clientId)
    const id = editingId || Math.random().toString(36).substr(2, 9)
    const contractRef = doc(firestore, "contracts", id)

    const contractData = {
      ...formData,
      id,
      employeeCount: Number(formData.employeeCount ?? 0),
      clientName: client?.corporateName || "Empresa não identificada",
      clientCnpj: client?.cnpj || "00.000.000/0000-00",
      clientRegime: client?.taxRegime || "Simples Nacional",
      updatedAt: new Date().toISOString(),
      createdAt: editingId ? ((contracts || []).find(c => c.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    }

    setDocumentNonBlocking(contractRef, contractData, { merge: true })

    // Se for novo contrato, gera a primeira parcela em Contas a Receber
    if (!editingId) {
      const receivableId = Math.random().toString(36).substr(2, 9)
      const receivableRef = doc(firestore, "receivables", receivableId)
      const today = new Date()
      const vencimentoStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${formData.dueDay.toString().padStart(2, '0')}`

      const servicosResumo = formData.services.join(", ")
      const receivableData = {
        id: receivableId,
        descricao: `HONORÁRIO CONTÁBIL - ${servicosResumo} (${formData.employeeCount ?? 0} FUNC)`.toUpperCase(),
        cliente: client?.corporateName || "Cliente Avulso",
        clientId: formData.clientId,
        pagamento: "PIX",
        data: vencimentoStr,
        valor: Number(formData.value),
        situacao: "Pendente",
        recorrente: true,
        tipoValue: "Fixo",
        createdAt: new Date().toISOString()
      }
      setDocumentNonBlocking(receivableRef, receivableData, { merge: true })
    }
    
    setIsModalOpen(false)
    toast({ 
      title: editingId ? "Contrato Atualizado!" : "Contrato Ativado!", 
      description: "Parâmetros do contrato salvos com sucesso." 
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este contrato?")) {
      deleteDocumentNonBlocking(doc(firestore, "contracts", id))
      toast({ title: "Contrato removido", variant: "destructive" })
    }
  }

  const handleOpenPreview = (contract: any) => {
    setSelectedContract(contract)
    setIsPreviewOpen(true)
  }

  const handleDownloadDocx = async (contract: any) => {
    setIsGeneratingDocx(true)
    try {
      const client = (clients || []).find((c: any) => c.id === contract.clientId) || {}
      const socio = client?.qsa?.[0] || {}

      const res = await fetch("/api/financeiro/gerar-contrato-servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contrato: contract, cliente: client, socio })
      })

      if (!res.ok) throw new Error("Falha na geração do documento Word.")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `contrato_prestacao_servicos_${(client.corporateName || contract.clientName || "empresa").replace(/\s+/g, "_")}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({ title: "Documento Word Gerado!", description: "O contrato .docx foi baixado com sucesso." })
    } catch (err: any) {
      toast({ title: "Erro na geração", description: err.message || "Erro desconhecido ao gerar contrato.", variant: "destructive" })
    } finally {
      setIsGeneratingDocx(false)
    }
  }

  const filteredContracts = (contracts || []).filter(c => 
    c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.clientCnpj?.includes(searchTerm)
  )

  const selectedClient = useMemo(() => {
    if (!selectedContract?.clientId) return null
    return (clients || []).find((c: any) => c.id === selectedContract.clientId)
  }, [selectedContract, clients])

  const socioAdm = useMemo(() => {
    if (!selectedClient?.qsa || selectedClient.qsa.length === 0) {
      return {
        nome: selectedClient?.corporateName ? `SÓCIO ADMINISTRADOR DE ${selectedClient.corporateName}` : "ANA PATRICIA CORDEIRO RAMOS",
        cpfCnpj: "724.255.982-00",
        qualificacao: "Sócio-Administrador"
      }
    }
    const found = selectedClient.qsa.find((s: any) => 
      s.condicaoAdministrador?.toLowerCase().includes("administrador") || 
      s.qualificacao?.toLowerCase().includes("administrador") ||
      s.condicaoSocio?.toLowerCase().includes("administrador")
    )
    return found || selectedClient.qsa[0]
  }, [selectedClient])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-semibold shadow-lg shadow-blue-500/20 h-11 px-6 order-2 md:order-1" onClick={handleOpenNew}>
          <Plus className="h-4 w-4" /> Novo Contrato
        </Button>

        <div className="text-left md:text-right order-1 md:order-2">
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Gestão de Contratos</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Controle jurídico e faturamento de serviços contábeis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Contratos Ativos" value={stats.active} icon={FileText} color="#2C4156" />
        <MetricCard label="Receita Recorrente" value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={FileCheck} color="#2563EB" />
        <MetricCard label="A Renovar (30d)" value="0" icon={History} color="#F2B705" />
        <MetricCard label="Suspensos" value="0" icon={AlertTriangle} color="#E74C3C" />
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold text-[#2C4156]">Contratos Vigentes</CardTitle>
            <CardDescription className="text-xs font-medium text-[#98A7AA]">Listagem completa de honorários recorrentes.</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input 
              placeholder="Buscar por empresa ou CNPJ..." 
              className="pl-9 h-9 w-[280px] bg-white border-[#D2D7DB]" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium text-sm">Empresa / CNPJ</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-center">Qtd. Funcionários</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Início da Vigência</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-right">Honorário Mensal</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-center">Status</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                  </TableCell>
                </TableRow>
              ) : filteredContracts.length > 0 ? (
                filteredContracts.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F7F7F7]/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#2C4156]">{item.clientName}</span>
                        <span className="text-[10px] text-[#98A7AA] font-mono">{item.clientCnpj}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5">
                        <Users className="h-3 w-3 mr-1" /> {item.employeeCount !== undefined ? item.employeeCount : 0} func/sócio
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-[#39586D]">
                      {item.startDate ? new Date(item.startDate).toLocaleDateString('pt-BR') : '--'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#2563EB]">
                      R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[9px] font-medium border-none",
                        item.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      )}>{item.status || "Ativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-blue-600 hover:text-blue-800 font-bold text-xs gap-1" 
                          onClick={() => handleOpenPreview(item)}
                          title="Visualizar Contrato em Tela"
                        >
                          <Printer className="h-3.5 w-3.5" /> Visualizar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-emerald-600 hover:text-emerald-800 font-bold text-xs gap-1" 
                          onClick={() => handleDownloadDocx(item)}
                          title="Baixar Contrato em Word (.docx)"
                        >
                          <Download className="h-3.5 w-3.5" /> .DOCX
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-[#2574A9]" 
                          onClick={() => handleEdit(item)}
                          title="Editar Parâmetros do Contrato"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-[#E74C3C]" 
                          onClick={() => handleDelete(item.id)}
                          title="Excluir Contrato"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA] font-bold">
                    Nenhum contrato cadastrado até o momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DE CADASTRO/EDIÇÃO DE CONTRATO (IMAGEM 1) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-[#2C4156] uppercase tracking-wide">
              {editingId ? "EDITAR CONTRATO CONTÁBIL" : "NOVO CONTRATO CONTÁBIL"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#98A7AA] font-medium">
              Defina o escopo de serviços e os parâmetros de faturamento.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* EMPRESA (CLIENTE) */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider">
                EMPRESA (CLIENTE)
              </Label>
              <ClientCombobox 
                value={formData.clientId} 
                onChange={(v: string) => setFormData({...formData, clientId: v})} 
                disabled={!!editingId}
              />
            </div>

            {/* SERVIÇOS CONTRATADOS (MÚLTIPLA ESCOLHA - CONFORME IMAGEM 2) */}
            <div className="col-span-2 space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider block">
                SERVIÇOS CONTRATADOS (MÚLTIPLA ESCOLHA)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {AVAILABLE_SERVICES.map((s) => {
                  const isSelected = formData.services.includes(s.label)
                  return (
                    <label 
                      key={s.id} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                        isSelected 
                          ? "bg-blue-50/80 border-blue-600 text-blue-900 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50"
                      )}
                    >
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            services: isSelected 
                              ? prev.services.filter(item => item !== s.label)
                              : [...prev.services, s.label]
                          }))
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                      />
                      <span className="uppercase text-[11px] font-extrabold tracking-tight">{s.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* QUANTIDADE DE FUNCIONÁRIOS (PERMITE 0 FUNCIONÁRIOS CONFORME IMAGEM 1) */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider">
                QUANTIDADE DE FUNCIONÁRIOS
              </Label>
              <Input 
                type="number" 
                min="0" 
                placeholder="Ex: 0" 
                className="border-[#D2D7DB] bg-white font-bold" 
                value={formData.employeeCount}
                onChange={(e) => setFormData({...formData, employeeCount: Math.max(0, Number(e.target.value))})}
              />
            </div>

            {/* VALOR MENSAL (R$) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider">
                VALOR MENSAL (R$)
              </Label>
              <Input 
                type="number" 
                placeholder="0,00" 
                className="border-[#D2D7DB] bg-white font-bold text-blue-700" 
                value={formData.value || ""}
                onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
              />
            </div>

            {/* INÍCIO DA VIGÊNCIA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider">
                INÍCIO DA VIGÊNCIA
              </Label>
              <Input 
                type="date" 
                className="border-[#D2D7DB] bg-white" 
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>

            {/* DIA DE VENCIMENTO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider">
                DIA DE VENCIMENTO
              </Label>
              <Input 
                type="number" 
                min="1" 
                max="28" 
                placeholder="Ex: 10" 
                className="border-[#D2D7DB] bg-white font-bold" 
                value={formData.dueDay}
                onChange={(e) => setFormData({...formData, dueDay: Number(e.target.value)})}
              />
            </div>

            {/* STATUS DO CONTRATO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider">
                STATUS DO CONTRATO
              </Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="border-[#D2D7DB] bg-white font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo" className="font-bold text-emerald-700">ATIVO</SelectItem>
                  <SelectItem value="Suspenso" className="font-bold text-amber-700">SUSPENSO</SelectItem>
                  <SelectItem value="Cancelado" className="font-bold text-red-700">CANCELADO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* OBSERVAÇÕES INTERNAS */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider">
                OBSERVAÇÕES INTERNAS
              </Label>
              <Textarea 
                placeholder="Detalhes sobre fidelidade, bonificações, etc..." 
                className="border-[#D2D7DB] bg-white text-xs" 
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-bold px-6 shadow-md" onClick={handleSaveContract}>
              <Save className="h-4 w-4 mr-2" /> Ativar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE VISUALIZAÇÃO DO CONTRATO COMPLETO (IMAGENS 2, 3, 4) */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-100 p-0 border-none">
          <DialogHeader className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm flex flex-row items-center justify-between no-print">
            <div>
              <DialogTitle className="text-lg font-bold text-[#2C4156]">
                Contrato de Prestação de Serviços Contábeis
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-500">
                Cliente: <strong className="text-slate-800">{selectedContract?.clientName}</strong> | CNPJ: {selectedContract?.clientCnpj}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="font-bold text-xs" 
                onClick={() => setIsPreviewOpen(false)}
              >
                Fechar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="font-bold text-xs gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                onClick={() => handleDownloadDocx(selectedContract)}
                disabled={isGeneratingDocx}
              >
                {isGeneratingDocx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Baixar Word (.DOCX)
              </Button>
              <Button 
                size="sm" 
                className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
              </Button>
            </div>
          </DialogHeader>
          
          {/* FOLHA DO CONTRATO FORMATADA COM DESTAQUES EM AMARELO */}
          <div className="p-12 md:p-16 bg-white shadow-xl mx-auto my-6 w-full max-w-[850px] text-slate-800 text-[13px] leading-relaxed font-sans border border-slate-200 print-container">
            
            {/* LOGO TIMBRADO PROSPERARE */}
            <div className="flex items-center justify-between pb-6 mb-8 border-b-2 border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-[#003366] text-white font-serif italic text-xl flex items-center justify-center font-bold shadow-sm">
                  Psc
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold italic text-[#003366] leading-none font-serif">Prosperare</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 mt-1">Serviços Contábeis</span>
                </div>
              </div>
            </div>

            {/* TÍTULO DO INSTRUMENTO */}
            <div className="text-center my-8">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS
              </h2>
            </div>
            
            <div className="space-y-6 text-justify">
              {/* CONTRATADA */}
              <p>
                <strong className="font-bold text-slate-900">CONTRATADA: </strong>
                PROSPERARE SERVIÇOS CONTÁBEIS LTDA, inscrita no CNPJ/MF sob o nº 23.077.213/0001-17, CRC nº AP-000149/O, com sede na Avenida Acelino de Leão, 1046, Letra B, Trem, Macapá/AP, representada por seu sócio administrador FELYPE MACIEL NAIFF, CPF nº 917.722.812-04.
              </p>

              {/* CONTRATANTE */}
              <p>
                <strong className="font-bold text-slate-900">CONTRATANTE: </strong>
                <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400">
                  {selectedContract?.clientName?.toUpperCase() || "A. P. CORDEIRO RAMOS"}
                </span>, inscrita no CNPJ sob o nº{" "}
                <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400">
                  {selectedContract?.clientCnpj || "470.341.0001/21"}
                </span>, com sede na{" "}
                <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400">
                  {selectedClient?.address ? `${selectedClient.address}, ${selectedClient.neighborhood || ""}, ${selectedClient.city || "Macapá"}/${selectedClient.state || "AP"}` : "Avenida Paraíba, 770, Pacoval, Macapá/AP"}
                </span>, representada por sua sócia administradora{" "}
                <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400">
                  {socioAdm?.nome?.toUpperCase() || "ANA PATRICIA CORDEIRO RAMOS"}
                </span>, CPF nº{" "}
                <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400">
                  {socioAdm?.cpfCnpj || socioAdm?.cpf || "724.255.982-00"}
                </span>.
              </p>

              {/* CLÁUSULA PRIMEIRA */}
              <div>
                <h3 className="font-bold uppercase text-slate-900 mb-1">
                  CLÁUSULA PRIMEIRA – DO OBJETO
                </h3>
                <p>
                  O presente contrato tem por objeto a prestação de serviços profissionais de assessoria de{" "}
                  <strong>
                    {Array.isArray(selectedContract?.services) && selectedContract.services.length > 0 
                      ? selectedContract.services.join(", ") 
                      : "Departamento Pessoal e Departamento Tributário"}
                  </strong>{" "}
                  para a CONTRATANTE, nos limites estabelecidos neste instrumento.
                </p>
              </div>

              {/* CLÁUSULA SEGUNDA */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-slate-900 mb-1">
                  CLÁUSULA SEGUNDA – DOS SERVIÇOS INCLUSOS NO PACOTE MENSAL
                </h3>
                
                {(!selectedContract?.services || selectedContract.services.some((s: string) => s.toUpperCase().includes("TRIBUTÁRIO") || s.toUpperCase().includes("TRIBUTARIO") || s.toUpperCase().includes("FISCAL"))) && (
                  <>
                    <p className="font-bold text-slate-900">2.1. Área Fiscal e Tributária:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Apuração mensal dos tributos (DAS/PGDAS-D) e monitoramento das regras operacionais vigentes.</li>
                      <li>Cumprimento das obrigações acessórias fiscais de rotina (DEFIS, EFD-Reinf e acompanhamento do IBS/CBS).</li>
                    </ol>
                  </>
                )}

                {(!selectedContract?.services || selectedContract.services.some((s: string) => s.toUpperCase().includes("PESSOAL"))) && (
                  <>
                    <p className="font-bold text-slate-900 mt-3">
                      2.2. Departamento Pessoal (para{" "}
                      <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400">
                        {(selectedContract?.employeeCount !== undefined ? selectedContract.employeeCount : 0).toString().padStart(2, "0")}
                      </span>{" "}
                      funcionário/sócio):
                    </p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Processamento de folha de pagamento, pró-labore, férias e rescisões.</li>
                      <li>Transmissão mensal das obrigações no eSocial, DCTFWeb e emissão das guias de FGTS Digital e INSS.</li>
                    </ol>
                  </>
                )}

                {selectedContract?.services?.some((s: string) => s.toUpperCase().includes("CONTÁBIL") || s.toUpperCase().includes("CONTABIL")) && (
                  <>
                    <p className="font-bold text-slate-900 mt-3">2.3. Área Contábil:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Escrituração contábil regular conforme as normas vigentes.</li>
                    </ol>
                  </>
                )}

                {selectedContract?.services?.some((s: string) => s.toUpperCase().includes("LEGALIZAÇÃO") || s.toUpperCase().includes("LEGALIZACAO") || s.toUpperCase().includes("ABERTURA")) && (
                  <>
                    <p className="font-bold text-slate-900 mt-3">2.4. Abertura e Legalização:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Assessoria e trâmites de alterações cadastrais e suporte de regularização junto aos órgãos públicos.</li>
                    </ol>
                  </>
                )}

                <p className="italic text-slate-700 mt-2 pl-2 border-l-2 border-slate-300">
                  <strong>Parágrafo Único:</strong> A inclusão de funcionários excedentes gerará um acréscimo de R$ 50,00 (cinquenta reais) por funcionário/mês na fatura.
                </p>
              </div>

              {/* CLÁUSULA TERCEIRA */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-slate-900 mb-1">
                  CLÁUSULA TERCEIRA – DOS SERVIÇOS EXCLUÍDOS E CONTABILIDADE AVULSA
                </h3>
                <p>
                  <strong>3.1. A ESCRITURAÇÃO CONTÁBIL PROPRIAMENTE DITA</strong> (elaboração de Balanço Patrimonial, Demonstração do Resultado do Exercício - DRE, Livro Diário, Livro Razão e Sped Contábil/ECD) <strong>NÃO ESTÁ INCLUSA</strong> na parcela fixa mensal contratada.
                </p>
                <p>
                  <strong>3.2.</strong> Caso a CONTRATANTE solicite a elaboração de Balanço Patrimonial ou demonstrações contábeis para fins bancários, licitações ou encerramento do exercício, os serviços serão orçados e cobrados à parte em contrato aditivo específico.
                </p>
                <p>
                  <strong>3.3.</strong> Quaisquer serviços extraordinários (alterações contratuais, parcelamentos de débitos antigos, certidões específicas, regularizações de pendências fiscais anteriores) serão cobrados separadamente mediante aprovação prévia.
                </p>
              </div>

              {/* CLÁUSULA QUARTA */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-slate-900 mb-1">
                  CLÁUSULA QUARTA – DAS OBRIGAÇÕES E RESPONSABILIDADES DA CONTRATANTE
                </h3>
                <p>
                  <strong>4.1.</strong> A CONTRATANTE obriga-se a fornecer toda a documentação fiscal, financeira e trabalhista idônea e completa <strong>até o dia 5 (cinco) do mês subsequente</strong> ao da prestação dos serviços.
                </p>
                <p>
                  <strong>4.2.</strong> A não entrega dos documentos no prazo isenta a CONTRATADA de qualquer responsabilidade por multas, juros ou atrasos na entrega de obrigações acessórias, os quais serão de inteira responsabilidade da CONTRATANTE.
                </p>
                <p>
                  <strong>4.3.</strong> A CONTRATANTE responde civil e criminalmente pela veracidade e autenticidade dos dados, extratos bancários e documentos fornecidos.
                </p>
              </div>

              {/* CLÁUSULA QUINTA */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-slate-900 mb-1">
                  CLÁUSULA QUINTA – DOS HONORÁRIOS E DA INADIMPLÊNCIA
                </h3>
                <p>
                  <strong>5.1.</strong> Pelos serviços prestados da Cláusula Segunda, a CONTRATANTE pagará o valor mensal de{" "}
                  <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400">
                    R$ {Number(selectedContract?.value || 400).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({numberToExtensoBRL(Number(selectedContract?.value || 400))})
                  </span>, com vencimento todo dia{" "}
                  <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400">
                    {selectedContract?.dueDay || 10}
                  </span>{" "}
                  do mês subsequente.
                </p>
                <p>
                  <strong>5.2. Do 13º Honorário:</strong> No mês de dezembro de cada ano, será devido o valor correspondente a 01 (um) honorário mensal adicional, referente ao encerramento da carga operacional anual e obrigações trabalhistas decorrentes do exercício.
                </p>
                <p>
                  <strong>5.3. Inadimplência:</strong> O atraso no pagamento sujeitará o débito à multa moratória de 2%, acrescida de juros de 1% ao mês e atualização monetária.
                </p>
                <p>
                  <strong>5.4. Suspensão dos Serviços por Atraso:</strong> O atraso no pagamento por período superior a 30 (trinta) dias ensejará a suspensão do envio de guias e declarações, ficando a CONTRATADA isenta de qualquer prejuízo fiscal ou trabalhista gerado por esta paralisação.
                </p>
                <p>
                  <strong>5.5. Atraso Superior a 90 Dias:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1 font-medium">
                  <li><strong>A)</strong> O título/contrato será levado a protesto extrajudicial e inclusão nos órgãos de proteção ao crédito (SPC/SERASA).</li>
                  <li><strong>B)</strong> Cobrança judicial com acréscimo de custas processuais e honorários advocatícios fixados em 20% sobre o valor total da dívida.</li>
                </ul>
              </div>

              {/* CLÁUSULA SEXTA */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-slate-900 mb-1">
                  CLÁUSULA SEXTA – DA PROTEÇÃO DE DADOS (LGPD)
                </h3>
                <p>
                  <strong>6.1.</strong> As partes declaram cumprir a Lei nº 13.709/2018. A CONTRATADA tratará os dados recebidos exclusivamente para os fins deste contrato e cumprimentos de deveres legais.
                </p>
                <p>
                  <strong>6.2.</strong> A CONTRATANTE autoriza o compartilhamento de dados com órgãos governamentais (Receita Federal, eSocial, Ministério do Trabalho, Secretarias de Finanças) para cumprimento das rotinas operacionais.
                </p>
              </div>

              {/* CLÁUSULA SÉTIMA */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-slate-900 mb-1">
                  CLÁUSULA SÉTIMA – DA RESCISÃO E BLINDAGEM DE TRANSIÇÃO
                </h3>
                <p>
                  <strong>7.1.</strong> O presente contrato vigora por prazo indeterminado. Qualquer das partes poderá rescindi-lo mediante <strong>aviso prévio por escrito com antecedência mínima de 30 (trinta) dias</strong>, devendo os honorários desse período ser quitados normalmente.
                </p>
                <p>
                  <strong>7.2.</strong> A rescisão contratual ou a transferência da responsabilidade técnica fica condicionada à <strong>quitação integral de todos os débitos e honorários em aberto</strong> com a CONTRATADA.
                </p>
                <p>
                  <strong>7.3.</strong> Em caso de inadimplência superior a 60 (sessenta) dias, a CONTRATADA poderá rescindir o contrato imediatamente por justa causa, notificando o cliente e isentando-se das obrigações futuras.
                </p>
              </div>

              {/* CLÁUSULA OITAVA */}
              <div>
                <h3 className="font-bold uppercase text-slate-900 mb-1">
                  CLÁUSULA OITAVA – DO FORO
                </h3>
                <p>
                  Fica eleito o Foro da Comarca de <strong>Macapá/AP</strong> para dirimir quaisquer dúvidas ou litígios oriundos do presente contrato, com renúncia expressa de qualquer outro por mais privilegiado que seja.
                </p>
              </div>

              {/* DATA DE VIGÊNCIA FORMATADA */}
              <div className="text-right pt-6">
                <p>
                  Macapá/AP,{" "}
                  <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400">
                    {formatDateExtenso(selectedContract?.startDate)}
                  </span>.
                </p>
              </div>

              {/* BLOCOS DE ASSINATURA */}
              <div className="pt-16 grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
                <div className="space-y-1">
                  <div className="border-t-2 border-slate-800 pt-2"></div>
                  <p className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded inline-block text-xs">
                    {socioAdm?.nome?.toUpperCase() || "CAMILA MORAIS DO NASCIMENTO"}
                  </p>
                  <br />
                  <p className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded inline-block text-[11px] text-slate-700">
                    {socioAdm?.qualificacao || socioAdm?.condicaoSocio || "Sócio-Administrador"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="border-t-2 border-slate-800 pt-2"></div>
                  <p className="font-bold text-xs text-slate-900">
                    FELYPER MACIEL NAIFF
                  </p>
                  <p className="text-[11px] font-medium text-slate-700">
                    Prosperare Serviços Contábeis
                  </p>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-[#D2D7DB] hover:border-[#2563EB] transition-colors group bg-white">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl group-hover:bg-[#F7F7F7] transition-colors" style={{ color }}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest leading-none mb-1">{label}</p>
          <p className="text-xl font-black text-[#2C4156]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
