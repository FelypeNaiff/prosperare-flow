"use client"

import { useState, useMemo, useRef } from "react"
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
import { TAX_REGIMES, buildContract, buildContractData, normalizeRegime } from "@/lib/contract-templates"
import { useLetterhead, letterheadToDataUrl } from "@/hooks/use-letterhead"
import { BlocksRenderer, LetterheadSheet, printWithLetterhead } from "@/components/shared/official-document"

function findSocioAdm(client: any) {
  const qsa = client?.qsa || []
  if (qsa.length === 0) return {}
  return qsa.find((s: any) =>
    s.condicaoAdministrador?.toLowerCase().includes("administrador") ||
    s.qualificacao?.toLowerCase().includes("administrador") ||
    s.condicaoSocio?.toLowerCase().includes("administrador")
  ) || qsa[0]
}

export default function ContatosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false)
  const { letterhead } = useLetterhead()
  const sheetRef = useRef<HTMLDivElement>(null)

  const contractsQuery = useMemoFirebase(() => collection(firestore, "contracts"), [firestore])
  const { data: contracts = [], isLoading } = useCollection(contractsQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    clientId: "",
    employeeCount: 0,
    taxRegime: "Simples Nacional" as string,
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
      taxRegime: "Simples Nacional",
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
      taxRegime: normalizeRegime(contract.taxRegime || contract.clientRegime),
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

    if (!formData.taxRegime) {
      toast({ title: "Selecione o Regime", description: "Escolha o tipo de tributação para continuar.", variant: "destructive" })
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
      clientRegime: formData.taxRegime,
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

      const servicosResumo = formData.taxRegime
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
      const socio = findSocioAdm(client)
      const imageDataUrl = await letterheadToDataUrl(letterhead.imageDataUrl)

      const res = await fetch("/api/financeiro/gerar-contrato-servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contrato: contract, cliente: client, socio, letterhead: { ...letterhead, imageDataUrl } })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Falha na geração do documento Word.")
      }

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

  const contractBlocks = useMemo(() => {
    if (!selectedContract) return null
    const data = buildContractData(selectedContract, selectedClient, findSocioAdm(selectedClient), numberToExtensoBRL)
    return buildContract(selectedContract.taxRegime || selectedContract.clientRegime, data)
  }, [selectedContract, selectedClient])

  const handlePrint = () => {
    if (!sheetRef.current) return
    printWithLetterhead(sheetRef.current.innerHTML, letterhead, `Contrato - ${selectedContract?.clientName || ""}`)
  }

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

            {/* TIPO DE TRIBUTAÇÃO (cada regime possui seu modelo de contrato) */}
            <div className="col-span-2 space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider block">
                TIPO DE TRIBUTAÇÃO
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {TAX_REGIMES.map((r) => {
                  const isSelected = formData.taxRegime === r.id
                  return (
                    <label 
                      key={r.id} 
                      id={`regime-${r.id.replace(/\s+/g, "-").toLowerCase()}`}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                        isSelected 
                          ? "bg-blue-50/80 border-blue-600 text-blue-900 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50"
                      )}
                    >
                      <input 
                        type="radio"
                        name="taxRegime"
                        checked={isSelected}
                        onChange={() => setFormData(prev => ({ ...prev, taxRegime: r.id }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <span className="flex flex-col">
                        <span className="uppercase text-[11px] font-extrabold tracking-tight">{r.label}</span>
                        <span className="text-[9px] font-medium text-slate-400">{r.description}</span>
                      </span>
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
                onClick={handlePrint}
                disabled={!contractBlocks}
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
              </Button>
            </div>
          </DialogHeader>
          
          {contractBlocks ? (
            <div className="overflow-x-auto">
              <LetterheadSheet ref={sheetRef} letterhead={letterhead}>
                <BlocksRenderer blocks={contractBlocks} />
              </LetterheadSheet>
            </div>
          ) : (
            <div className="m-6 p-10 bg-white rounded-xl border border-dashed border-amber-300 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <p className="font-bold text-[#2C4156]">Modelo de contrato para {normalizeRegime(selectedContract?.taxRegime || selectedContract?.clientRegime)} ainda não cadastrado.</p>
              <p className="text-xs text-slate-500 mt-1">Envie o texto do modelo para que ele seja incluído no sistema.</p>
            </div>
          )}
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
