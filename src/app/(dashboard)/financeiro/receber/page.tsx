
"use client"

import { useState, useMemo, useRef } from "react"
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MoreVertical,
  Repeat,
  ArrowUpRight,
  FileSpreadsheet,
  Loader2,
  Save,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Mail,
  Filter,
  Download,
  TrendingUp,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ClientCombobox } from "@/components/shared/client-combobox"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ContasAReceberPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false)
  const [selectedCompetence, setSelectedCompetence] = useState<Date>(startOfMonth(new Date()))
  const [activeFilter, setActiveFilter] = useState("Todos")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' })
  const [lastGenerationSummary, setLastGenerationSummary] = useState<{
    competence: string
    generated: number
    skipped: number
    invalid: number
    totalValue: number
    invalidReasons: string[]
  } | null>(null)

  const receivablesQuery = useMemoFirebase(() => {
    const firstDay = format(startOfMonth(selectedCompetence), "yyyy-MM-dd")
    const lastDay = format(endOfMonth(selectedCompetence), "yyyy-MM-dd")
    return query(
      collection(firestore, "receivables"),
      where("data", ">=", firstDay),
      where("data", "<=", lastDay)
    )
  }, [firestore, selectedCompetence])
  const { data: items = [], isLoading } = useCollection(receivablesQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const contractsQuery = useMemoFirebase(() => collection(firestore, "contracts"), [firestore])
  const { data: contracts = [] } = useCollection(contractsQuery)

  const [newAccount, setNewAccount] = useState({
    descricao: "",
    clientId: "",
    pagamento: "PIX",
    data: "",
    valor: 0,
    situacao: "Pendente",
    recorrente: false,
    tipoValor: "Fixo"
  })

  const baseFilteredItems = useMemo(() => {
    let baseItems = [...(items || [])]

    if (activeFilter === "Sem Contrato") {
      const monthPrefix = format(selectedCompetence, "yyyy-MM")
      const monthItems = baseItems.filter(item => item.data && item.data.startsWith(monthPrefix))
      const clientsWithRecords = new Set(monthItems.map(i => (i.cliente || "").toUpperCase()))

      const missingClients = (clients || [])
        .filter(c => c.corporateName && !clientsWithRecords.has(c.corporateName.toUpperCase()))
        .map(c => ({
          id: `missing-${c.id}`,
          descricao: "SEM LANÇAMENTO NO MÊS",
          cliente: c.corporateName,
          pagamento: "--",
          data: "",
          valor: 0,
          situacao: "Sem Contrato",
          recorrente: false,
          semContrato: true
        }))
        
      baseItems = [...baseItems, ...missingClients]
    }

    return baseItems.filter(item => {
      const matchSearch = item.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchStatus = false
      if (activeFilter === "Todos") {
        matchStatus = true
      } else if (activeFilter === "Sem Contrato") {
        matchStatus = Number(item.valor) === 0 || !item.valor || item.semContrato === true
      } else {
        matchStatus = item.situacao === activeFilter
      }
      
      let matchMonth = true
      if (activeFilter === "Sem Contrato") {
        const monthPrefix = format(selectedCompetence, "yyyy-MM")
        matchMonth = !item.data || item.data.startsWith(monthPrefix)
      }

      return matchSearch && matchStatus && matchMonth
    })
  }, [items, searchTerm, activeFilter, clients, selectedCompetence])

  const filteredItems = useMemo(() => {
    if (!sortConfig.key) return baseFilteredItems;
    
    return [...baseFilteredItems].sort((a: any, b: any) => {
      let aValue = a[sortConfig.key as string];
      let bValue = b[sortConfig.key as string];

      if (sortConfig.key === 'valor') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortConfig.key === 'data') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [baseFilteredItems, sortConfig]);

  const totalValue = filteredItems.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const writeFinanceAuditLog = (action: string, payload: Record<string, any>) => {
    const auditId = Math.random().toString(36).substr(2, 9)

    setDocumentNonBlocking(doc(firestore, "financeAuditLogs", auditId), {
      id: auditId,
      module: "receivables",
      action,
      actorName: user?.displayName || user?.email || "Operador",
      actorEmail: user?.email || null,
      createdAt: new Date().toISOString(),
      ...payload
    }, { merge: true })
  }

  const handleCreateAccount = () => {
    if (!newAccount.descricao || !newAccount.clientId || !newAccount.valor) {
      toast({ title: "Erro", description: "Preencha os dados da conta.", variant: "destructive" })
      return
    }

    const selectedClient = clients?.find(c => c.id === newAccount.clientId)
    const id = Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "receivables", id)
    
    const accountData = {
      ...newAccount,
      id,
      cliente: selectedClient?.corporateName || "Cliente Avulso",
      createdAt: new Date().toISOString()
    }

    setDocumentNonBlocking(docRef, accountData, { merge: true })
    writeFinanceAuditLog("receivable_created", {
      receivableId: id,
      clientId: newAccount.clientId,
      clientName: selectedClient?.corporateName || "Cliente Avulso",
      value: Number(newAccount.valor) || 0,
      dueDate: newAccount.data,
      source: "manual"
    })
    
    setIsNewAccountOpen(false)
    setNewAccount({ descricao: "", clientId: "", pagamento: "PIX", data: "", valor: 0, situacao: "Pendente", recorrente: false, tipoValor: "Fixo" })
    toast({ title: "Honorário Lançado!", description: "O registro de entrada foi criado na nuvem." })
  }

  const handleUpdateStatus = (id: string, newStatus: string, cliente: string) => {
    const updateData: any = { situacao: newStatus }
    if (newStatus === "Confirmado" || newStatus === "Pago") {
      updateData.responsavelBaixa = user?.displayName || user?.email || "Operador"
      updateData.dataRecebimento = new Date().toISOString()
    }
    
    updateDocumentNonBlocking(doc(firestore, "receivables", id), updateData)
    writeFinanceAuditLog("receivable_status_updated", {
      receivableId: id,
      clientName: cliente,
      newStatus,
      paidAt: updateData.dataRecebimento || null
    })
    
    if (newStatus === "Confirmado") {
      toast({ 
        title: "Recebimento Confirmado!", 
        description: `Enviando recibo por e-mail para ${cliente}...`,
        className: "bg-[#2563EB] text-white border-none"
      })
      setTimeout(() => {
        toast({ title: "Recibo Enviado!", description: "O cliente recebeu o comprovante de quitação." })
      }, 2000)
    } else {
      toast({ title: "Status Atualizado" })
    }
  }

  const handleCancelReceipt = async (contaId: string) => {
    await updateDocumentNonBlocking(doc(firestore, "receivables", contaId), { 
      situacao: "Pendente",
      responsavelBaixa: null,
      dataRecebimento: null
    })
    writeFinanceAuditLog("receivable_payment_cancelled", {
      receivableId: contaId
    })
    toast({ 
      title: "Recebimento Cancelado", 
      description: "A situação da conta foi revertida para pendente.",
    })
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "receivables", id))
    writeFinanceAuditLog("receivable_deleted", {
      receivableId: id
    })
    toast({ title: "Honorário removido", variant: "destructive" })
  }

  const handleBatchDelete = () => {
    if (confirm(`Deseja excluir permanentemente ${selectedIds.length} honorários?`)) {
      selectedIds.forEach(id => deleteDocumentNonBlocking(doc(firestore, "receivables", id)))
      writeFinanceAuditLog("receivable_batch_deleted", {
        receivableIds: selectedIds,
        count: selectedIds.length
      })
      toast({ title: "Itens excluídos", variant: "destructive" })
      setSelectedIds([])
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const changeMonth = (direction: 'next' | 'prev') => {
    setSelectedCompetence(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
    setSearchTerm("")
    setSortConfig({ key: null, direction: 'asc' })
  }

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r?\n/)
      let count = 0

      lines.forEach((line, index) => {
        if (index === 0 || !line.trim()) return
        const parts = line.split(/[;,]/)
        if (parts.length >= 2) {
          const id = Math.random().toString(36).substr(2, 9)
          const docRef = doc(firestore, "receivables", id)
          const data = {
            id,
            descricao: parts[0]?.trim().toUpperCase() || "HONORÁRIO IMPORTADO",
            cliente: parts[1]?.trim().toUpperCase() || "CLIENTE AVULSO",
            pagamento: parts[2]?.trim() || "PIX",
            data: parts[3]?.trim() || new Date().toISOString().split('T')[0],
            valor: parseFloat(parts[4]?.replace(',', '.') || "0"),
            situacao: "Pendente",
            recorrente: false,
            createdAt: new Date().toISOString()
          }
          setDocumentNonBlocking(docRef, data, { merge: true })
          count++
        }
      })

      toast({ title: "Honorários Importados", description: `${count} registros processados com sucesso.` })
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleGenerateMonth = () => {
    const monthPrefix = format(selectedCompetence, "yyyy-MM")
    const competenceEnd = format(endOfMonth(selectedCompetence), "yyyy-MM-dd")
    const generationId = Math.random().toString(36).substr(2, 9)
    const invalidContracts: string[] = []
    const activeContracts = (contracts || []).filter((contract: any) => {
      const contractName = contract.clientName || contract.clientCnpj || contract.id || "Contrato sem identificacao"

      if (contract.status !== "Ativo") return false

      if (!contract.clientId) {
        invalidContracts.push(`${contractName}: sem cliente vinculado`)
        return false
      }

      if (!Number(contract.value)) {
        invalidContracts.push(`${contractName}: sem valor de honorario`)
        return false
      }

      if (!contract.startDate) return true

      if (contract.startDate > competenceEnd) {
        invalidContracts.push(`${contractName}: inicio posterior a competencia`)
        return false
      }

      return contract.startDate <= competenceEnd
    })

    if (activeContracts.length === 0) {
      setLastGenerationSummary({
        competence: monthPrefix,
        generated: 0,
        skipped: 0,
        invalid: invalidContracts.length,
        totalValue: 0,
        invalidReasons: invalidContracts.slice(0, 5)
      })
      writeFinanceAuditLog("monthly_generation_without_eligible_contracts", {
        generationId,
        competence: monthPrefix,
        invalidContractsCount: invalidContracts.length,
        invalidReasons: invalidContracts.slice(0, 20)
      })
      toast({
        title: "Nenhum contrato ativo encontrado",
        description: invalidContracts.length > 0
          ? `${invalidContracts.length} contrato(s) precisam de ajuste antes da geracao.`
          : "Nao ha contratos aptos para gerar honorarios nesta competencia.",
        variant: "destructive"
      })
      return
    }

    let generatedCount = 0
    let skippedCount = 0
    let generatedTotal = 0
    const generatedReceivableIds: string[] = []
    const skippedContracts: string[] = []

    activeContracts.forEach((contract: any) => {
      const dueDay = Math.min(Math.max(Number(contract.dueDay) || 10, 1), 28)
      const dueDate = `${monthPrefix}-${String(dueDay).padStart(2, "0")}`

      const alreadyExists = (items || []).some((item: any) => {
        if (!item?.data?.startsWith(monthPrefix)) return false
        if (contract.id && item.contractId === contract.id) return true
        if (contract.clientId && item.clientId === contract.clientId && item.recorrente) return true
        return false
      })

      if (alreadyExists) {
        skippedCount++
        skippedContracts.push(contract.clientName || contract.clientId || contract.id)
        return
      }

      const receivableId = Math.random().toString(36).substr(2, 9)
      const receivableRef = doc(firestore, "receivables", receivableId)
      const servicesLabel = Array.isArray(contract.services) && contract.services.length > 0
        ? contract.services.join(", ")
        : "HONORARIOS MENSAIS"

      const receivableValue = Number(contract.value) || 0
      const receivableData = {
        id: receivableId,
        generationId,
        contractId: contract.id,
        clientId: contract.clientId,
        cliente: contract.clientName || "CLIENTE AVULSO",
        descricao: `HONORARIO - ${servicesLabel}`.toUpperCase(),
        pagamento: "PIX",
        data: dueDate,
        valor: receivableValue,
        situacao: "Pendente",
        recorrente: true,
        tipoValor: "Fixo",
        competencia: monthPrefix,
        generatedFromContract: true,
        createdAt: new Date().toISOString()
      }

      setDocumentNonBlocking(receivableRef, receivableData, { merge: true })

      generatedCount++
      generatedTotal += receivableValue
      generatedReceivableIds.push(receivableId)
    })

    setLastGenerationSummary({
      competence: monthPrefix,
      generated: generatedCount,
      skipped: skippedCount,
      invalid: invalidContracts.length,
      totalValue: generatedTotal,
      invalidReasons: invalidContracts.slice(0, 5)
    })

    writeFinanceAuditLog("monthly_receivables_generated", {
      generationId,
      competence: monthPrefix,
      generatedCount,
      skippedCount,
      invalidContractsCount: invalidContracts.length,
      generatedTotal,
      generatedReceivableIds,
      skippedContracts: skippedContracts.slice(0, 50),
      invalidReasons: invalidContracts.slice(0, 50)
    })

    if (generatedCount === 0) {
      toast({
        title: "Competencia ja gerada",
        description: skippedCount > 0
          ? `Nenhum novo honorario foi criado. ${skippedCount} contrato(s) ja tinham lancamento neste mes.`
          : "Nenhum novo honorario foi criado para esta competencia."
      })
      return
    }

    toast({
      title: "Mes gerado com sucesso",
      description: `${generatedCount} honorario(s) criado(s) para ${format(selectedCompetence, "MMMM yyyy", { locale: ptBR })}${skippedCount > 0 ? ` e ${skippedCount} ja existente(s) foram ignorado(s)` : ""}.`
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".csv,.txt" 
        onChange={handleImportCSV} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-[#2C4156] tracking-tight">Contas a Receber</h1>
        
        <div className="flex items-center gap-3 bg-white border border-[#D2D7DB] rounded-xl px-2 py-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => changeMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 min-w-[140px] text-center">
            <span className="text-sm font-black text-[#2C4156] uppercase">
              {format(selectedCompetence, "MMMM yyyy", { locale: ptBR })}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => changeMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-black uppercase text-xs h-11 px-6 shadow-lg shadow-emerald-500/10" 
          onClick={() => setIsNewAccountOpen(true)}
        >
          <Plus className="h-4 w-4" /> Nova Conta
        </Button>
        
        <Button 
          variant="outline" 
          className="h-11 border-[#D2D7DB] gap-2 font-bold text-[#39586D] text-xs uppercase px-5"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" /> Importar Honorários
        </Button>
        
        <Button variant="outline" className="h-11 border-[#D2D7DB] gap-2 font-bold text-[#39586D] text-xs uppercase px-5" onClick={handleGenerateMonth}>
          <RefreshCw className="h-4 w-4" /> Gerar Mês
        </Button>

        {selectedIds.length > 0 && (
          <Button 
            variant="outline" 
            className="h-11 border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C]/5 gap-2 font-bold text-xs uppercase px-5 animate-in slide-in-from-left-2"
            onClick={handleBatchDelete}
          >
            <Trash2 className="h-4 w-4" /> Excluir em Lote
          </Button>
        )}
      </div>

      {lastGenerationSummary && (
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-[#2563EB]" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">
                    Resumo da ultima geracao
                  </h2>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Competencia {lastGenerationSummary.competence} com rastreio salvo em financeAuditLogs.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gerados</p>
                  <p className="text-xl font-black text-slate-800">{lastGenerationSummary.generated}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ignorados</p>
                  <p className="text-xl font-black text-slate-800">{lastGenerationSummary.skipped}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ajustes</p>
                  <p className="text-xl font-black text-amber-600">{lastGenerationSummary.invalid}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor novo</p>
                  <p className="text-xl font-black text-[#2563EB]">
                    {lastGenerationSummary.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </div>

            {lastGenerationSummary.invalidReasons.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Contratos para revisar</span>
                </div>
                <ul className="space-y-1">
                  {lastGenerationSummary.invalidReasons.map((reason) => (
                    <li key={reason} className="text-xs font-semibold text-amber-800">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#98A7AA]" />
          <Input 
            placeholder="Buscar por cliente ou descrição..." 
            className="pl-10 h-12 bg-[#F7F7F7] border-[#D2D7DB] focus-visible:ring-[#2563EB]" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 p-1 bg-[#EBEDF0] rounded-lg w-fit">
            {["Todos", "Pendente", "Confirmado", "Atrasado", "Sem Contrato"].map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-4 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                  activeFilter === filter 
                    ? "bg-[#2563EB] text-white shadow-md" 
                    : "text-[#98A7AA] hover:bg-white/50"
                )}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>

          <div className="bg-white border border-[#D2D7DB] rounded-lg px-6 py-2 shadow-sm">
            <span className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest mr-2">Total Filtrado:</span>
            <span className="text-sm font-black text-[#2563EB]">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center pl-4">
                  <Checkbox 
                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedIds(filteredItems.map(i => i.id))
                      else setSelectedIds([])
                    }}
                    className="border-white/30 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                  />
                </TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Descrição</TableHead>
                <TableHead 
                  className="text-white font-black uppercase text-[10px] cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('cliente')}
                >
                  <div className="flex items-center gap-1">
                    Cliente {sortConfig.key === 'cliente' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Pagamento</TableHead>
                <TableHead 
                  className="text-white font-black uppercase text-[10px] cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('data')}
                >
                  <div className="flex items-center gap-1">
                    Vencimento {sortConfig.key === 'data' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-white font-black uppercase text-[10px] cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('situacao')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Situação {sortConfig.key === 'situacao' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-white font-black uppercase text-[10px] cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('responsavelBaixa')}
                >
                  <div className="flex items-center gap-1">
                    Responsável {sortConfig.key === 'responsavelBaixa' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-white font-black uppercase text-[10px] cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('valor')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Valor {sortConfig.key === 'valor' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right pr-4">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className={cn(
                    "hover:bg-[#F7F7F7] transition-colors",
                    selectedIds.includes(item.id) && "bg-emerald-50/50"
                  )}>
                    <TableCell className="text-center pl-4">
                      <Checkbox 
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                        className="data-[state=checked]:bg-[#2563EB]"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#2C4156]">{item.descricao}</span>
                        {item.recorrente && <Repeat className="h-3 w-3 text-[#2563EB]" aria-label={`Recorrencia ${item.tipoValor || "Fixo"}`} />}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#39586D] font-medium uppercase text-xs">{item.cliente}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase border-[#D2D7DB] text-[#98A7AA]">
                        {item.pagamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-[#39586D]">
                      {item.data ? format(new Date(item.data), "dd/MM/yyyy") : '--'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase border-none px-3 py-1",
                        (item.situacao === 'Confirmado' || item.situacao === 'Pago') ? "bg-[#7ED6B5] text-[#2563EB]" :
                        item.situacao === 'Atrasado' ? "bg-[#FEE2E2] text-[#E74C3C]" :
                        "bg-[#FEF3C7] text-[#F2B705]"
                      )}>
                        {(item.situacao === 'Confirmado' || item.situacao === 'Pago') && item.dataRecebimento 
                          ? format(new Date(item.dataRecebimento), "dd/MM/yyyy") 
                          : item.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#98A7AA] text-[10px] font-medium uppercase truncate max-w-[120px]">
                      {item.responsavelBaixa || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-black",
                      item.situacao === 'Confirmado' ? "text-[#2563EB]" : "text-[#2C4156]"
                    )}>
                      {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {item.situacao !== 'Confirmado' && (
                            <DropdownMenuItem 
                              className="gap-2 text-xs font-bold text-[#2563EB] uppercase"
                              onClick={() => handleUpdateStatus(item.id, "Confirmado", item.cliente)}
                            >
                              <CheckCircle2 className="h-4 w-4" /> Confirmar Recebimento
                            </DropdownMenuItem>
                          )}
                          {(item.situacao === 'Confirmado' || item.situacao === 'Pago') && (
                            <DropdownMenuItem 
                              className="gap-2 text-xs font-bold text-[#E74C3C] uppercase"
                              onClick={() => handleCancelReceipt(item.id)}
                            >
                              <XCircle className="h-4 w-4" /> Cancelar Recebimento
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2 text-xs font-bold uppercase">
                            <Download className="h-4 w-4" /> Gerar Recibo PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-xs font-bold uppercase">
                            <Mail className="h-4 w-4" /> Reenviar Recibo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-xs font-bold text-[#E74C3C] uppercase"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhum honorário localizado para este filtro.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
        <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle className="text-2xl font-black text-[#2C4156] uppercase tracking-tight">Lançar Honorário</DialogTitle>
            <DialogDescription className="font-bold text-white/60 uppercase text-[10px] tracking-widest">
              Cadastre uma nova entrada de honorários ou serviço avulso.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Descrição do Recebimento</Label>
                <Input placeholder="Ex: Honorários Outubro/24" value={newAccount.descricao} onChange={(e) => setNewAccount({...newAccount, descricao: e.target.value.toUpperCase()})} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Empresa / Cliente</Label>
                <ClientCombobox 
                  value={newAccount.clientId} 
                  onChange={(v: string) => setNewAccount({...newAccount, clientId: v})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Valor (R$)</Label>
                  <Input type="number" placeholder="0,00" value={newAccount.valor} onChange={(e) => setNewAccount({...newAccount, valor: Number(e.target.value)})} className="border-[#D2D7DB] font-black text-[#2563EB]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Data de Vencimento</Label>
                  <Input type="date" value={newAccount.data} onChange={(e) => setNewAccount({...newAccount, data: e.target.value})} className="border-[#D2D7DB]" />
                </div>
              </div>

              <div className="p-4 bg-[#F7F7F7] rounded-xl border border-[#D2D7DB] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-black uppercase text-[#2C4156]">Receita Recorrente</Label>
                    <p className="text-[9px] text-[#98A7AA] font-bold uppercase">Repetir todo mês</p>
                  </div>
                  <Switch 
                    checked={newAccount.recorrente} 
                    onCheckedChange={(checked) => setNewAccount({...newAccount, recorrente: checked})} 
                  />
                </div>

                {newAccount.recorrente && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA] mb-2 block">Tipo de Recorrência</Label>
                    <Select value={newAccount.tipoValor} onValueChange={(v) => setNewAccount({...newAccount, tipoValor: v})}>
                      <SelectTrigger className="bg-white border-[#D2D7DB]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixo" className="text-xs font-bold uppercase">Valor Fixo</SelectItem>
                        <SelectItem value="Variavel" className="text-xs font-bold uppercase">Valor Variável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Forma de Pagamento</Label>
                <Select value={newAccount.pagamento} onValueChange={(v) => setNewAccount({...newAccount, pagamento: v})}>
                  <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                    <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                    <SelectItem value="TED/DOC">Transferência / TED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsNewAccountOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
            <Button className="bg-[#2563EB] text-white font-black uppercase text-xs px-8 shadow-lg" onClick={handleCreateAccount}>
              <Save className="h-4 w-4 mr-2" /> Salvar Honorário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
