"use client"

import React, { useState, useMemo } from "react"
import { 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  MoreVertical,
  Loader2,
  CalendarDays,
  Trash2,
  UserPlus,
  X,
  Layers,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  ShieldCheck,
  ArrowUpRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { ProcessDetailsDrawer } from "@/components/processes/process-details-drawer"
import { CreateProcessModal } from "@/components/processes/create-process-modal"
import { format, parseISO, addMonths, subMonths, startOfMonth, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"

const safeFormatDate = (dateVal: any, fmt: string, options?: any) => {
  if (!dateVal) return '';
  try {
    let d: Date;
    if (dateVal instanceof Date) d = dateVal;
    else if (typeof dateVal === 'string') d = parseISO(dateVal);
    else if (dateVal && typeof dateVal.toDate === 'function') d = dateVal.toDate();
    else d = new Date(dateVal);

    if (isValid(d)) {
      return format(d, fmt, options);
    }
  } catch (err) {
    console.error("Invalid date obj:", dateVal);
  }
  return '';
}

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, (m) => m.toUpperCase());
}

const getDeptBadgeClass = (dept: string) => {
  const d = String(dept).toUpperCase().trim();
  switch (d) {
    case "PESSOAL":
      return "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-50";
    case "ADMINISTRATIVO":
      return "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50";
    case "FISCAL":
      return "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-50";
    case "COMERCIAL":
      return "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50";
    case "FINANCEIRO":
      return "bg-emerald-50 text-blue-600 border-emerald-100 hover:bg-emerald-50";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50";
  }
}

const getStatusBadgeClass = (status: string) => {
  const s = String(status).toLowerCase().trim();
  switch (s) {
    case 'concluido':
      return 'bg-emerald-50 text-blue-600 border-emerald-100 hover:bg-emerald-50';
    case 'em_multa':
      return 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-50';
    case 'em_progresso':
      return 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50';
    case 'a_fazer':
      return 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-50';
    case 'dispensado':
      return 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-50';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-50';
  }
}

import { toast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProcessosPage() {
  const firestore = useFirestore()
  const { userData, userLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompetence, setSelectedCompetence] = useState<Date>(startOfMonth(new Date()))
  const [selectedProcess, setSelectedProcess] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [filtroResponsavel, setFiltroResponsavel] = useState("todas")
  const [filtroDepartamento, setFiltroDepartamento] = useState("todos")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [activeStatusCard, setActiveStatusCard] = useState("Total")
  const [localSubStatus, setLocalSubStatus] = useState("todos")
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })

  const [isBatchAssignOpen, setIsBatchAssignOpen] = useState(false)
  const [batchAssignee, setBatchAssignee] = useState("")
  
  const [isBatchStatusOpen, setIsBatchStatusOpen] = useState(false)
  const [batchStatusValue, setBatchStatusValue] = useState("")

  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false)

  const [isBatchUpdating, setIsBatchUpdating] = useState(false)

  const processesQuery = useMemoFirebase(() => 
    userLoaded ? query(collection(firestore, "processes"), orderBy("prazo", "asc")) : null, 
    [firestore, userLoaded]
  )
  const { data: rawProcesses = [], isLoading } = useCollection(processesQuery)

  const clientsQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "clients") : null, 
    [firestore, userLoaded]
  )
  const { data: clients = [] } = useCollection(clientsQuery)

  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: team = [] } = useCollection(usersQuery)

  const handleBatchAssign = async () => {
    if (!batchAssignee || selectedIds.length === 0) return;
    setIsBatchUpdating(true);
    try {
      for (const id of selectedIds) {
        const docRef = doc(firestore, "processes", id);
        updateDocumentNonBlocking(docRef, { responsavelId: batchAssignee });
      }
      toast({ title: "Responsáveis atualizados", description: `${selectedIds.length} processos foram alterados com sucesso.` });
      setIsBatchAssignOpen(false);
      setSelectedIds([]);
      setBatchAssignee("");
    } catch (e) {
      toast({ title: "Erro ao atualizar", variant: "destructive", description: "Ocorreu um erro ao realizar a alteração em lote." });
    } finally {
      setIsBatchUpdating(false);
    }
  }

  const handleBatchStatusChange = async () => {
    if (!batchStatusValue || selectedIds.length === 0) return;
    setIsBatchUpdating(true);
    try {
      for (const id of selectedIds) {
        const docRef = doc(firestore, "processes", id);
        updateDocumentNonBlocking(docRef, { situacao: batchStatusValue });
      }
      toast({ title: "Status atualizado", description: `${selectedIds.length} processos foram alterados com sucesso.` });
      setIsBatchStatusOpen(false);
      setSelectedIds([]);
      setBatchStatusValue("");
    } catch (e) {
      toast({ title: "Erro ao atualizar", variant: "destructive", description: "Ocorreu um erro ao realizar a alteração em lote." });
    } finally {
      setIsBatchUpdating(false);
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchUpdating(true);
    try {
      for (const id of selectedIds) {
        const docRef = doc(firestore, "processes", id);
        deleteDocumentNonBlocking(docRef);
      }
      toast({ title: "Processos excluídos", description: `${selectedIds.length} processos foram removidos permanentemente.` });
      setIsBatchDeleteOpen(false);
      setSelectedIds([]);
    } catch (e) {
      toast({ title: "Erro ao excluir", variant: "destructive", description: "Ocorreu um erro ao excluir os processos." });
    } finally {
      setIsBatchUpdating(false);
    }
  }

  const filteredProcesses = useMemo(() => {
    if (!rawProcesses || !userData) return []
    
    const competenceKey = format(selectedCompetence, "yyyy-MM")

    return rawProcesses.filter(p => {
      const pComp = p.competencia ? safeFormatDate(p.competencia, "yyyy-MM") : ""
      if (pComp && pComp !== competenceKey) return false;
      else if (!pComp && competenceKey !== "") return false;

      const searchLower = searchTerm.toLowerCase()
      const client = (clients || []).find(c => c.id === p.clienteId)
      const matchesSearch = !searchTerm || 
        client?.corporateName?.toLowerCase().includes(searchLower) ||
        client?.nomeFantasia?.toLowerCase().includes(searchLower) ||
        client?.cnpj?.includes(searchTerm) ||
        p.nomeProcesso?.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false

      if (userData.profile !== 'ADMINISTRADOR' && userData.profile !== 'SÓCIO') {
        const hasAccess = p.responsavelId === userData.fullName || p.responsavelId === userData.id || p.auxiliarId === userData.fullName || p.auxiliarId === userData.id || p.responsavelId === "Geral"
        if (!hasAccess) return false
      }

      const matchesAssignee = filtroResponsavel === "todas" ? true : (p.responsavelId === filtroResponsavel || p.auxiliarId === filtroResponsavel)
      const matchesDept = filtroDepartamento === "todos" || 
        (p.departamento && String(p.departamento).toLowerCase().trim().includes(filtroDepartamento.toLowerCase().trim()))
      const matchesStatus = filtroStatus === "todos" ? true : p.situacao === filtroStatus

      const matchesCardStatus = activeStatusCard === 'Total' 
        || (activeStatusCard === 'Em Multa' && p.situacao === 'em_multa')
        || (activeStatusCard === 'A Fazer' && p.situacao === 'a_fazer')
        || (activeStatusCard === 'Progresso' && p.situacao === 'em_progresso')
        || (activeStatusCard === 'Concluído' && p.situacao === 'concluido')
        || (activeStatusCard === 'Dispensado' && p.situacao === 'dispensado')

      return matchesAssignee && matchesDept && matchesStatus && matchesCardStatus
    })
  }, [rawProcesses, userData, selectedCompetence, searchTerm, clients, filtroResponsavel, filtroDepartamento, filtroStatus, activeStatusCard])

  const uniqueAssignees = useMemo(() => {
    const list = new Set<string>()
    ;(rawProcesses || []).forEach(p => {
      if (p.responsavelId && p.responsavelId !== "Geral") list.add(p.responsavelId)
      if (p.auxiliarId && p.auxiliarId !== "Nenhum") list.add(p.auxiliarId)
    })
    return Array.from(list)
      .map(id => ({ id: String(id), name: String(id) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [rawProcesses])

  const uniqueDepartments = [
    "PESSOAL",
    "ADMINISTRATIVO",
    "FISCAL",
    "COMERCIAL",
    "FINANCEIRO"
  ]

  const groupedProcesses = useMemo(() => {
    const groups: Record<string, any> = {}
    
    filteredProcesses.forEach(p => {
      const key = p.nomeProcesso || "Processo Avulso"
      if (!groups[key]) {
        groups[key] = {
          name: key,
          clientsCount: 0,
          processesCount: 0,
          departments: new Set(),
          responsibles: new Set(),
          items: []
        }
      }
      groups[key].items.push(p)
      groups[key].clientsCount++
      groups[key].processesCount++
      if (p.departamento) groups[key].departments.add(p.departamento)
      if (p.responsavelId && p.responsavelId !== "Geral") groups[key].responsibles.add(p.responsavelId)
      if (p.auxiliarId && p.auxiliarId !== "Nenhum") groups[key].responsibles.add(p.auxiliarId)
    })

    return Object.values(groups).sort((a: any, b: any) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      } else {
        return sortConfig.direction === 'asc' ? (valA - valB) : (valB - valA);
      }
    })
  }, [filteredProcesses, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig(prev => prev.key === key 
      ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' }
    )
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpRight className="h-3 w-3 ml-1 opacity-20" />
    return sortConfig.direction === 'asc' ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronUp className="h-3 w-3 ml-1" />
  }

  const stats = useMemo(() => {
    const list = filteredProcesses || []
    return {
      total: list.length,
      late: list.filter(p => p.situacao === 'em_multa').length,
      todo: list.filter(p => p.situacao === 'a_fazer').length,
      progress: list.filter(p => p.situacao === 'em_progresso').length,
      done: list.filter(p => p.situacao === 'concluido').length,
      waived: list.filter(p => p.situacao === 'dispensado').length,
    }
  }, [filteredProcesses])

  const handleOpenProcess = (process: any) => {
    const client = (clients || []).find(c => c.id === process.clienteId)
    setSelectedProcess({ ...process, client })
    setIsDrawerOpen(true)
  }

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const changeMonth = (direction: 'next' | 'prev') => {
    setSelectedCompetence(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 order-2 md:order-1">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] font-medium text-slate-400 leading-none">Competência</span>
              <span className="text-xs font-semibold text-[#2C4156] mt-0.5">{format(selectedCompetence, "MMMM yyyy", { locale: ptBR })}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium text-xs shadow-md h-11 px-6 rounded-xl"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Criar Processo
          </Button>
        </div>
        <div className="order-1 md:order-2 md:text-right">
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Situação dos Processos</h1>
          <p className="text-slate-400 font-medium text-sm">Controle consolidado de produtividade e entregas.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-4">
        <span className="text-xs font-medium text-slate-400">Filtrar por Responsável:</span>
        <Button 
          variant="outline" 
          onClick={() => setFiltroResponsavel("todas")}
          className={cn(
            "h-8 text-xs font-medium rounded-full transition-all border shadow-none",
            filtroResponsavel === "todas" 
              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-700" 
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
          )}
        >
          Todos
        </Button>
        {uniqueAssignees.map(assignee => (
          <Button 
            key={assignee.id}
            variant="outline"
            onClick={() => setFiltroResponsavel(assignee.id)}
            className={cn(
              "h-8 text-xs font-medium rounded-full transition-all border shadow-none",
              filtroResponsavel === assignee.id 
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-700" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            {assignee.name}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 mb-4">
        <span className="text-xs font-medium text-slate-400">Filtrar por Departamento:</span>
        <Button 
          variant="outline" 
          onClick={() => setFiltroDepartamento("todos")}
          className={cn(
            "h-8 text-xs font-medium rounded-full transition-all px-4 border shadow-none",
            filtroDepartamento === "todos" 
              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-700" 
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
          )}
        >
          Todos
        </Button>
        {uniqueDepartments.map((dept: any) => (
          <Button 
            key={dept}
            variant="outline"
            onClick={() => setFiltroDepartamento(dept)}
            className={cn(
              "h-8 text-xs font-medium rounded-full transition-all px-4 border shadow-none",
              filtroDepartamento === dept 
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-700" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            {dept}
          </Button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por cliente ou processo..." 
            className="pl-10 h-11 bg-white border-slate-200 text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 font-medium h-11 px-4 gap-2 relative bg-white hover:bg-slate-50 shadow-none">
                <Filter className="h-4 w-4" /> Filtros Avançados
                {(filtroDepartamento !== "todos" || filtroStatus !== "todos") && (
                   <span className="absolute -top-1.5 -right-1.5 h-3 w-3 bg-rose-500 rounded-full border border-white"></span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[400px] bg-white border-l-slate-200">
               <SheetHeader className="mb-6 pt-4">
                  <SheetTitle className="text-[#2C4156] font-semibold tracking-tight text-xl">Filtros Avançados</SheetTitle>
               </SheetHeader>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-400">Departamento</Label>
                    <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
                      <SelectTrigger className="bg-white border-slate-200 font-medium text-xs text-slate-600 h-11">
                        <SelectValue placeholder="Todos os Departamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos" className="text-xs font-medium text-slate-600">Todos</SelectItem>
                        {uniqueDepartments.map((dept: any) => (
                          <SelectItem key={dept} value={dept} className="text-xs font-medium text-slate-600">{toTitleCase(dept)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-400">Status do Processo</Label>
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger className="bg-white border-slate-200 font-medium text-xs text-slate-600 h-11">
                        <SelectValue placeholder="Todos os Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos" className="text-xs font-medium text-slate-600">Todos</SelectItem>
                        <SelectItem value="a_fazer" className="text-xs font-medium text-slate-500">A Fazer</SelectItem>
                        <SelectItem value="em_progresso" className="text-xs font-medium text-blue-600">Em Progresso</SelectItem>
                        <SelectItem value="concluido" className="text-xs font-medium text-blue-600">Concluído</SelectItem>
                        <SelectItem value="em_multa" className="text-xs font-medium text-rose-600">Em Multa</SelectItem>
                        <SelectItem value="dispensado" className="text-xs font-medium text-slate-500">Dispensado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-slate-200 text-rose-600 font-medium text-xs h-11 hover:bg-slate-50"
                    onClick={() => {
                       setFiltroDepartamento("todos")
                       setFiltroStatus("todos")
                    }}
                  >
                    Limpar Filtros
                  </Button>
               </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" className="border-slate-200 text-slate-600 font-medium h-11 px-4 gap-2 bg-white hover:bg-slate-50 shadow-none">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 font-medium text-xs h-11 bg-white hover:bg-slate-50 shadow-none">
                Ações em Lote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => {
                  if (selectedIds.length === 0) {
                    toast({ title: "Atenção", description: "Selecione pelo menos um processo.", variant: "destructive" })
                    return
                  }
                  setIsBatchAssignOpen(true)
                }} 
                className="font-medium text-xs gap-2 text-slate-600"
              >
                <UserPlus className="h-3.5 w-3.5" /> Alterar Responsável
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  if (selectedIds.length === 0) {
                    toast({ title: "Atenção", description: "Selecione pelo menos um processo.", variant: "destructive" })
                    return
                  }
                  setIsBatchStatusOpen(true)
                }} 
                className="font-medium text-xs gap-2 text-slate-600"
              >
                <Layers className="h-3.5 w-3.5" /> Alterar Status em Lote
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  if (selectedIds.length === 0) {
                    toast({ title: "Atenção", description: "Selecione pelo menos um processo.", variant: "destructive" })
                    return
                  }
                  setIsBatchDeleteOpen(true)
                }} 
                className="font-medium text-xs gap-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" /> Apagar Processos Selecionados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent border-b border-slate-200">
                <TableHead className="w-12 text-center pl-4 py-3">
                  <Checkbox 
                    checked={selectedIds.length === filteredProcesses.length && filteredProcesses.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedIds(filteredProcesses.map(i => i.id))
                      else setSelectedIds([])
                    }}
                    className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </TableHead>
                <TableHead className="text-slate-500 font-medium text-sm cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Processos <SortIcon columnKey="name" /></div>
                </TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-center cursor-pointer" onClick={() => handleSort('clientsCount')}>
                  <div className="flex items-center justify-center">Nº de Clientes <SortIcon columnKey="clientsCount" /></div>
                </TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-center cursor-pointer" onClick={() => handleSort('processesCount')}>
                  <div className="flex items-center justify-center">Nº de Processos <SortIcon columnKey="processesCount" /></div>
                </TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Departamentos</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Responsáveis</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                  </TableCell>
                </TableRow>
              ) : groupedProcesses.length > 0 ? (
                groupedProcesses.map((group) => (
                  <React.Fragment key={group.name}>
                    <TableRow 
                      className="bg-white hover:bg-slate-50/40 cursor-pointer group transition-colors border-b border-slate-100"
                      onClick={() => toggleGroup(group.name)}
                    >
                      <TableCell className="w-12 text-center pl-4 py-5">
                        <Checkbox 
                          checked={group.items.every((i: any) => selectedIds.includes(i.id))}
                          onCheckedChange={(checked) => {
                            const ids = group.items.map((i: any) => i.id)
                            if (checked) setSelectedIds(prev => [...new Set([...prev, ...ids])])
                            else setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
                          }}
                          className="h-5 w-5 border-slate-300 data-[state=checked]:bg-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700 text-sm">{toTitleCase(group.name)}</span>
                          <ChevronRight className={cn(
                            "h-4 w-4 text-slate-400 transition-transform",
                            openGroups.includes(group.name) && "rotate-90"
                          )} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-sm text-slate-500 py-5">{group.clientsCount}</TableCell>
                      <TableCell className="text-center font-medium text-sm text-slate-500 py-5">{group.processesCount}</TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-wrap gap-1">
                          {Array.from(group.departments).map((dept: any) => (
                            <Badge key={dept} variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5 rounded shadow-none border", getDeptBadgeClass(String(dept)))}>
                              {toTitleCase(String(dept))}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex -space-x-2">
                          {Array.from(group.responsibles).slice(0, 3).map((resp: any) => (
                            <Avatar key={resp} className="h-6 w-6 border-2 border-white">
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-[9px] font-medium uppercase">
                                {String(resp).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {group.responsibles.size > 3 && (
                            <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                              +{group.responsibles.size - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4 py-5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {openGroups.includes(group.name) && (
                      <TableRow className="bg-slate-50/20 hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0 border-b border-slate-100">
                          <div className="px-12 py-3 bg-white">
                            <Table>
                              <TableHeader className="bg-transparent border-b border-slate-100">
                                <TableRow className="border-none hover:bg-transparent">
                                  <TableHead className="w-10 text-center pl-4 py-2">
                                    <Checkbox 
                                      checked={group.items.length > 0 && group.items.every((i: any) => selectedIds.includes(i.id))}
                                      onCheckedChange={(checked) => {
                                        const ids = group.items.map((i: any) => i.id)
                                        if (checked) setSelectedIds(prev => [...new Set([...prev, ...ids])])
                                        else setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
                                      }}
                                      className="h-4 w-4 border-slate-200 data-[state=checked]:bg-blue-600"
                                    />
                                  </TableHead>
                                  <TableHead className="text-sm font-medium text-slate-400 h-8 py-2">Cliente / CNPJ</TableHead>
                                  <TableHead className="text-sm font-medium text-slate-400 h-8 text-center p-0 py-2">
                                    <div className="flex justify-center">
                                      <Select value={localSubStatus} onValueChange={setLocalSubStatus}>
                                        <SelectTrigger className="h-6 border-none bg-transparent text-sm font-medium shadow-none ring-0 w-max mx-auto text-slate-400">
                                          <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="todos" className="text-xs font-medium">Todos os Status</SelectItem>
                                          <SelectItem value="a_fazer" className="text-xs font-medium">A Fazer</SelectItem>
                                          <SelectItem value="em_progresso" className="text-xs font-medium">Em Progresso</SelectItem>
                                          <SelectItem value="concluido" className="text-xs font-medium">Concluído</SelectItem>
                                          <SelectItem value="em_multa" className="text-xs font-medium">Em Multa</SelectItem>
                                          <SelectItem value="dispensado" className="text-xs font-medium">Dispensado</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </TableHead>
                                  <TableHead className="text-sm font-medium text-slate-400 h-8 text-center py-2">Vencimento</TableHead>
                                  <TableHead className="text-sm font-medium text-slate-400 h-8 py-2">Responsável</TableHead>
                                  <TableHead className="w-12 py-2"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.items
                                  .filter((p: any) => localSubStatus === "todos" || p.situacao === localSubStatus)
                                  .map((p: any) => {
                                  const client = (clients || []).find(c => c.id === p.clienteId)
                                  return (
                                    <TableRow 
                                      key={p.id} 
                                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group/item cursor-pointer"
                                      onClick={() => handleOpenProcess(p)}
                                    >
                                      <TableCell className="w-10 text-center pl-4 py-3">
                                        <Checkbox 
                                          checked={selectedIds.includes(p.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) setSelectedIds(prev => [...prev, p.id])
                                            else setSelectedIds(prev => prev.filter(id => id !== p.id))
                                          }}
                                          className="h-4 w-4 border-slate-200 data-[state=checked]:bg-blue-600"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-700">{toTitleCase(client?.corporateName || '---')}</span>
                                            {p.origemCriacao && (
                                              <Badge className={cn(
                                                "text-[10px] font-medium px-2 py-0.5 rounded border shadow-none",
                                                p.origemCriacao === 'GRUPO' 
                                                  ? "bg-blue-50/50 text-blue-600 border-blue-100 hover:bg-blue-50/50" 
                                                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-50"
                                              )}>
                                                {p.origemCriacao === 'GRUPO' ? 'Grupo' : 'Avulso'}
                                              </Badge>
                                            )}
                                          </div>
                                          <span className="text-xs font-mono text-slate-400 mt-0.5">{client?.cnpj || '---'}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center py-3">
                                        <Badge className={cn(
                                          "text-xs font-medium px-2.5 py-1 rounded border shadow-none",
                                          getStatusBadgeClass(p.situacao)
                                        )}>
                                          {typeof p.situacao === 'string' ? toTitleCase(p.situacao.replace('_', ' ')) : p.situacao || ''}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center py-3">
                                        <span className="text-xs font-medium text-slate-500">
                                          {p.prazo ? safeFormatDate(p.prazo, 'dd/MM/yyyy') || '--' : '--'}
                                        </span>
                                      </TableCell>
                                      <TableCell className="py-3">
                                        <div className="flex items-center -space-x-2">
                                          {p.responsavelId && p.responsavelId !== "Geral" && (
                                            <Avatar className="h-6 w-6 border-2 border-white relative z-10" title={`Responsável: ${p.responsavelId}`}>
                                              <AvatarFallback className="bg-slate-100 text-slate-600 text-[9px] font-medium uppercase">
                                                {String(p.responsavelId).charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                          )}
                                          {p.auxiliarId && p.auxiliarId !== "Nenhum" && (
                                            <Avatar className="h-5 w-5 border-2 border-white relative z-0 opacity-90 grayscale-[20%]" title={`Auxiliar: ${p.auxiliarId}`}>
                                              <AvatarFallback className="bg-slate-50 text-slate-500 text-[8px] font-medium uppercase">
                                                {String(p.auxiliarId).charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                          )}
                                          {(!p.responsavelId || p.responsavelId === "Geral") && (!p.auxiliarId || p.auxiliarId === "Nenhum") && (
                                            <span className="text-xs font-medium text-slate-500 uppercase">Geral</span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right py-3">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7 text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenProcess(p);
                                          }}
                                        >
                                          <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-medium text-sm">
                    Nenhum processo localizado para os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProcessDetailsDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
        process={selectedProcess} 
      />

      <CreateProcessModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />

      <Dialog open={isBatchAssignOpen} onOpenChange={setIsBatchAssignOpen}>
        <DialogContent className="sm:max-w-[425px] border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#2C4156] font-semibold text-xl">Atribuir Responsável</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Selecione o novo responsável para os {selectedIds.length} processos selecionados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-xs font-medium text-slate-400">Novo Responsável</Label>
            <Select value={batchAssignee} onValueChange={setBatchAssignee}>
              <SelectTrigger className="bg-white border-slate-200 font-medium text-xs text-slate-600 h-11 mt-2">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Geral" className="text-xs font-medium">Geral</SelectItem>
                {team?.map((u: any) => (
                  <SelectItem key={u.id} value={u.fullName} className="text-xs font-medium">{u.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchAssignOpen(false)} className="border-slate-200 font-medium text-xs" disabled={isBatchUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleBatchAssign} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-6 shadow-md" disabled={isBatchUpdating || !batchAssignee}>
              {isBatchUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isBatchStatusOpen} onOpenChange={setIsBatchStatusOpen}>
        <DialogContent className="sm:max-w-[425px] border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#2C4156] font-semibold text-xl">Alterar Status em Lote</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Selecione o novo status para os {selectedIds.length} processos selecionados:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-xs font-medium text-slate-400">Novo Status</Label>
            <Select value={batchStatusValue} onValueChange={setBatchStatusValue}>
              <SelectTrigger className="bg-white border-slate-200 font-medium text-xs text-slate-600 h-11 mt-2">
                <SelectValue placeholder="Selecione o Status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a_fazer" className="text-xs font-medium text-slate-500">A Fazer</SelectItem>
                <SelectItem value="em_progresso" className="text-xs font-medium text-blue-600">Em Progresso</SelectItem>
                <SelectItem value="concluido" className="text-xs font-medium text-blue-600">Concluído</SelectItem>
                <SelectItem value="em_multa" className="text-xs font-medium text-rose-600">Em Multa</SelectItem>
                <SelectItem value="dispensado" className="text-xs font-medium text-slate-500">Dispensado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchStatusOpen(false)} className="border-slate-200 font-medium text-xs" disabled={isBatchUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleBatchStatusChange} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-6 shadow-md" disabled={isBatchUpdating || !batchStatusValue}>
              {isBatchUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-rose-600 font-semibold text-xl">Excluir Processos</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">
              Atenção: Tem certeza que deseja excluir os {selectedIds.length} processos selecionados? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsBatchDeleteOpen(false)} className="border-slate-200 font-medium text-xs" disabled={isBatchUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleBatchDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-6 shadow-md" disabled={isBatchUpdating}>
              {isBatchUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



function Avatar({ className, children }: any) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>
      {children}
    </div>
  )
}

function AvatarFallback({ className, children }: any) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}>
      {children}
    </div>
  )
}
