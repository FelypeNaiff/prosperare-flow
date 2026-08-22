"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  Clock, 
  User, 
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  AlertTriangle,
  Lock,
  Eye,
  Trash2,
  FolderOpen,
  ArrowUpDown,
  SortAsc,
  SortDesc
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser,
  setDocumentNonBlocking, 
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase"
import { collection, doc } from "firebase/firestore"
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
import { Textarea } from "@/components/ui/textarea"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ClientCombobox } from "@/components/shared/client-combobox"
import { TemplateSearchSelect } from "@/components/atendimentos/template-search-select"
import { TicketDetailsDrawer } from "@/components/atendimentos/ticket-details-drawer"
import { buildTaskAssignmentNotificationKey, createAppNotification } from "@/lib/notifications"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

export default function AtendimentosPage() {
  const firestore = useFirestore()
  const { userLoaded, selectedUser } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  const [filtroResponsavel, setFiltroResponsavel] = useState("todas")
  const [filtroPrazo, setFiltroPrazo] = useState("Todos")
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "aberto" | "concluido">("aberto")
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [sortField, setSortField] = useState<'clientName' | 'title' | 'responsibleName' | 'createdAt' | 'dueDate' | 'status'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const tasksQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "tasks") : null, 
    [firestore, userLoaded]
  )
  const { data: rawTickets, isLoading: loadingTickets } = useCollection(tasksQuery)
  const tickets = (rawTickets || []).filter((t: any) => ['novo', 'atendimento', 'pendente', 'concluido'].includes(t.status))

  const clientsQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "clients") : null, 
    [firestore, userLoaded]
  )
  const { data: clients = [] } = useCollection(clientsQuery)

  const usersQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "users") : null, 
    [firestore, userLoaded]
  )
  const { data: team = [] } = useCollection(usersQuery)

  const templatesQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "processoModelos") : null, 
    [firestore, userLoaded]
  )
  const { data: templates = [] } = useCollection(templatesQuery)

  const [newTicket, setNewTicket] = useState({
    clientId: "",
    templateId: "",
    responsibleId: "",
    notes: "",
    title: "",
    dueDate: "",
    isRestricted: false
  })

  const handleCreateTicket = () => {
    if (!newTicket.clientId || !newTicket.responsibleId || (!newTicket.templateId && !newTicket.title)) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    const id = Math.random().toString(36).substr(2, 9)
    const client = (clients || []).find(c => c.id === newTicket.clientId)
    const template = (templates || []).find(t => t.id === newTicket.templateId)
    const responsible = (team || []).find(u => u.id === newTicket.responsibleId)

    const ticketData = {
      id,
      clientId: newTicket.clientId,
      clientName: client?.corporateName || "Empresa Avulsa",
      templateId: newTicket.templateId || null,
      title: template?.nome || newTicket.title,
      responsibleId: newTicket.responsibleId,
      responsibleName: responsible?.fullName || "Responsável",
      notes: newTicket.notes,
      dueDate: newTicket.dueDate || null,
      status: 'novo',
      restrita: newTicket.isRestricted,
      criadorId: selectedUser?.id || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setDocumentNonBlocking(doc(firestore, "tasks", id), ticketData, { merge: true })
    
    createAppNotification(firestore, {
      userId: newTicket.responsibleId,
      title: "Nova Demanda Interna",
      message: `Você foi designado para a demanda: ${ticketData.title}`,
      type: "task_new",
      link: "/atendimentos",
      taskId: id,
      remetente: selectedUser?.fullName || "Sistema",
      metaKey: buildTaskAssignmentNotificationKey(id, newTicket.responsibleId),
    })

    setIsNewTicketOpen(false)
    setNewTicket({ clientId: "", templateId: "", responsibleId: "", notes: "", title: "", dueDate: "", isRestricted: false })
    toast({ title: "Demanda Enviada!", description: "O colaborador foi notificado." })
  }

  const updateStatus = (id: string, newStatus: string) => {
    updateDocumentNonBlocking(doc(firestore, "tasks", id), { status: newStatus, updatedAt: new Date().toISOString() })
    toast({ title: "Status Atualizado" })
  }

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    deleteDocumentNonBlocking(doc(firestore, "tasks", id))
    toast({ title: "Ticket Removido", variant: "destructive" })
  }

  const visibleTickets = (tickets || []).filter((t: any) => {
    if (!t.restrita) return true;
    return t.restrita && t.criadorId === selectedUser?.id;
  });

  const baseFilteredTickets = visibleTickets.filter((t: any) => {
    const matchesSearch = t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.responsibleName?.toLowerCase().includes(searchTerm.toLowerCase())
      
    const matchesResponsible = filtroResponsavel === "todas" ? true : t.responsibleId === filtroResponsavel
    
    const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')
    let matchesPrazo = true
    if (filtroPrazo === 'Vencidos') {
      matchesPrazo = !!t.dueDate && t.dueDate < todayStr
    } else if (filtroPrazo === 'Vence Hoje') {
      matchesPrazo = !!t.dueDate && t.dueDate === todayStr
    } else if (filtroPrazo === 'No Prazo') {
      matchesPrazo = !!t.dueDate && t.dueDate > todayStr
    }

    return matchesSearch && matchesResponsible && matchesPrazo
  })

  const filteredTickets = baseFilteredTickets.filter((t: any) => {
    const isCompleted = t.status === 'concluido'
    if (filtroStatus === 'aberto') return !isCompleted
    if (filtroStatus === 'concluido') return isCompleted
    return true
  })

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let valA = a[sortField] || ""
    let valB = b[sortField] || ""
    
    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const uniqueAssignees = Array.from(new Set(visibleTickets.map((t: any) => t.responsibleId)))
    .map(id => {
      const ticket = visibleTickets.find((t: any) => t.responsibleId === id)
      return { id, name: ticket?.responsibleName }
    })
    .filter(a => a.id && a.name)
    .sort((a, b) => a.name!.localeCompare(b.name!))

  const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')
  const stats = {
    open: baseFilteredTickets.filter((t: any) => t.status !== 'concluido').length,
    critical: baseFilteredTickets.filter((t: any) => t.status !== 'concluido' && t.dueDate && t.dueDate < todayStr).length,
    completed: baseFilteredTickets.filter((t: any) => t.status === 'concluido').length,
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Demandas Internas</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Gestão de solicitações entre departamentos.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-semibold text-xs shadow-lg" onClick={() => setIsNewTicketOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Atendimento
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-[#D2D7DB] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-[#98A7AA]">Filtrar por Responsável:</span>
          <Button 
            variant={filtroResponsavel === "todas" ? "default" : "outline"} 
            onClick={() => setFiltroResponsavel("todas")}
            className={cn(
              "h-8 text-xs font-medium rounded-full transition-all border shadow-none",
              filtroResponsavel === "todas" ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-none" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-none"
            )}
          >
            Todas as Demandas
          </Button>
          {uniqueAssignees.map(assignee => (
            <Button 
              key={assignee.id}
              variant={filtroResponsavel === assignee.id ? "default" : "outline"}
              onClick={() => setFiltroResponsavel(assignee.id)}
              className={cn(
                "h-8 text-xs font-medium rounded-full transition-all border shadow-none",
                filtroResponsavel === assignee.id ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-none" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-none"
              )}
            >
              {assignee.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-[#98A7AA]">Filtrar por Prazo:</span>
          {['Todos', 'Vencidos', 'Vence Hoje', 'No Prazo'].map(p => (
            <Button 
              key={p}
              variant={filtroPrazo === p ? "default" : "outline"} 
              onClick={() => setFiltroPrazo(p)}
              className={cn(
                "h-8 text-xs font-medium rounded-full transition-all border shadow-none",
                filtroPrazo === p ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-none" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-none"
              )}
            >
              {p}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-[#98A7AA]">Filtrar por Status:</span>
          {[
            { id: 'aberto', label: 'Em Aberto' },
            { id: 'concluido', label: 'Concluídos' },
            { id: 'todos', label: 'Todos' }
          ].map(s => (
            <Button 
              key={s.id}
              variant={filtroStatus === s.id ? "default" : "outline"} 
              onClick={() => setFiltroStatus(s.id as any)}
              className={cn(
                "h-8 text-xs font-medium rounded-full transition-all border shadow-none",
                filtroStatus === s.id ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-none" : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-none"
              )}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiMiniCard label="Em Aberto" value={stats.open} icon={Clock} color="info" />
        <KpiMiniCard label="Críticos (Vencidos)" value={stats.critical} icon={AlertCircle} color="warning" />
        <KpiMiniCard label="Concluídos" value={stats.completed} icon={CheckCircle2} color="success" />
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
        <Input 
          placeholder="Buscar chamados..." 
          className="pl-10 bg-white border-[#D2D7DB]" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-slate-500 font-semibold text-xs"></TableHead>
                <TableHead 
                  className="text-slate-500 font-semibold text-xs cursor-pointer group select-none" 
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center gap-2">
                    Empresa
                    {sortField === 'clientName' ? (
                      sortOrder === 'asc' ? <SortAsc className="h-3.5 w-3.5 text-blue-600" /> : <SortDesc className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-500 font-semibold text-xs cursor-pointer group select-none" 
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    Demanda
                    {sortField === 'title' ? (
                      sortOrder === 'asc' ? <SortAsc className="h-3.5 w-3.5 text-blue-600" /> : <SortDesc className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-500 font-semibold text-xs cursor-pointer group select-none" 
                  onClick={() => handleSort('responsibleName')}
                >
                  <div className="flex items-center gap-2">
                    Responsável
                    {sortField === 'responsibleName' ? (
                      sortOrder === 'asc' ? <SortAsc className="h-3.5 w-3.5 text-blue-600" /> : <SortDesc className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-500 font-semibold text-xs cursor-pointer group select-none" 
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Criação
                    {sortField === 'createdAt' ? (
                      sortOrder === 'asc' ? <SortAsc className="h-3.5 w-3.5 text-blue-600" /> : <SortDesc className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-500 font-semibold text-xs cursor-pointer group select-none" 
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-2">
                    Prazo
                    {sortField === 'dueDate' ? (
                      sortOrder === 'asc' ? <SortAsc className="h-3.5 w-3.5 text-blue-600" /> : <SortDesc className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="text-slate-500 font-semibold text-xs cursor-pointer group select-none" 
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortField === 'status' ? (
                      sortOrder === 'asc' ? <SortAsc className="h-3.5 w-3.5 text-blue-600" /> : <SortDesc className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTickets ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase mt-2">Carregando Demandas...</p>
                  </TableCell>
                </TableRow>
              ) : sortedTickets.length > 0 ? (
                sortedTickets.map((ticket: any) => {
                  const isCompleted = ticket.status === 'concluido'
                  const isOverdue = ticket.dueDate && ticket.dueDate < todayStr && !isCompleted
                  return (
                    <TableRow 
                      key={ticket.id}
                      className={cn(
                        "transition-colors hover:bg-slate-50/50 cursor-pointer",
                        isOverdue && "bg-red-50/30 hover:bg-red-50/50"
                      )}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      {/* Checkbox de Ação Rápida */}
                      <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateStatus(ticket.id, isCompleted ? 'novo' : 'concluido')}
                          className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center transition-all duration-200",
                            isCompleted 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600"
                          )}
                          title={isCompleted ? "Reabrir Demanda" : "Concluir Demanda"}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </TableCell>

                      {/* Empresa */}
                      <TableCell>
                        <span className="font-semibold text-blue-600 text-xs tracking-tight">
                          {ticket.clientName}
                        </span>
                      </TableCell>

                      {/* Título / Demanda */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-medium text-slate-800", isCompleted && "line-through text-slate-400")}>
                            {ticket.title}
                          </span>
                          {ticket.restrita && (
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0.5 font-semibold gap-1">
                              <Lock className="h-2.5 w-2.5" /> Restrita
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Responsável */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border">
                            <AvatarFallback className="text-[8px] font-semibold bg-slate-200 text-slate-700">
                              {ticket.responsibleName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-700 font-medium">{ticket.responsibleName}</span>
                        </div>
                      </TableCell>

                      {/* Criação */}
                      <TableCell className="text-xs text-slate-500">
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>

                      {/* Prazo */}
                      <TableCell>
                        {ticket.dueDate ? (
                          <div className="flex items-center gap-1.5">
                            {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />}
                            <span className={cn(
                              "text-xs font-semibold px-2 py-0.5 rounded border",
                              isOverdue 
                                ? "bg-red-50 text-red-700 border-red-200 animate-pulse" 
                                : isCompleted
                                  ? "bg-slate-50 text-slate-400 border-slate-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                            )}>
                              {new Date(ticket.dueDate + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-normal">-</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge className={cn(
                          "text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 border shadow-none",
                          isCompleted 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          {isCompleted ? "Concluído" : "Aberto"}
                        </Badge>
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedTicket(ticket)} className="text-xs font-medium">
                              <Eye className="h-3.5 w-3.5 mr-2 text-slate-500" /> Visualizar / Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateStatus(ticket.id, isCompleted ? 'novo' : 'concluido')} 
                              className="text-xs font-medium"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-slate-500" />
                              {isCompleted ? "Reabrir Demanda" : "Concluir Demanda"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => handleDelete(ticket.id, e)} 
                              className="text-xs font-medium text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2 text-red-500" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <FolderOpen className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nenhuma demanda encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen} modal={false}>
        <DialogContent 
          className="max-w-xl p-0 overflow-hidden border-none shadow-2xl flex flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle>Nova Demanda Interna</DialogTitle>
            <DialogDescription className="text-white/60">Inicie um fluxo de atendimento para a equipe.</DialogDescription>
          </DialogHeader>
          <div className="modal-scroll-content">
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Empresa</Label>
                <ClientCombobox 
                  value={newTicket.clientId} 
                  onChange={(v: string) => setNewTicket({...newTicket, clientId: v})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Modelo</Label>
                  <TemplateSearchSelect 
                    templates={templates}
                    value={newTicket.templateId}
                    onValueChange={(v: string) => setNewTicket({...newTicket, templateId: v})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Responsável</Label>
                  <Select value={newTicket.responsibleId} onValueChange={(v) => setNewTicket({...newTicket, responsibleId: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-11">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(team || []).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Prazo de Conclusão</Label>
                  <Input 
                    type="date"
                    className="border-[#D2D7DB]" 
                    value={newTicket.dueDate} 
                    onChange={(e) => setNewTicket({...newTicket, dueDate: e.target.value})} 
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <div className="flex items-center space-x-2 pt-4">
                    <Switch 
                      id="restricted-mode"
                      checked={newTicket.isRestricted}
                      onCheckedChange={(v) => setNewTicket({...newTicket, isRestricted: v})}
                    />
                    <Label htmlFor="restricted-mode" className="text-[10px] font-black uppercase text-[#98A7AA] cursor-pointer">
                      Demanda Restrita (Visível apenas para mim)
                    </Label>
                  </div>
                </div>
              </div>
              {!newTicket.templateId && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Título Manual</Label>
                  <Input value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title: e.target.value.toUpperCase()})} />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Notas</Label>
                <Textarea value={newTicket.notes} onChange={(e) => setNewTicket({...newTicket, notes: e.target.value})} className="h-24" />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-[#F7F7F7] border-t shrink-0">
            <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>Cancelar</Button>
            <Button className="bg-[#2563EB]" onClick={handleCreateTicket}>Enviar Demanda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <TicketDetailsDrawer 
        open={!!selectedTicket} 
        onOpenChange={(v: boolean) => !v && setSelectedTicket(null)} 
        ticket={selectedTicket}
        clients={clients}
        team={team}
        templates={templates}
      />
    </div>
  )
}

function KpiMiniCard({ label, value, icon: Icon, color }: any) {
  const colors = {
    info: "border-l-[#2574A9] bg-[#2574A9]/5",
    warning: "border-l-[#E74C3C] bg-[#E74C3C]/5", // Red for warning/late critical demands
    success: "border-l-[#2563EB] bg-[#2563EB]/5",
  }
  return (
    <Card className={cn("border-none border-l-4 shadow-sm bg-white h-20", colors[color as keyof typeof colors])}>
      <CardContent className="p-4 flex items-center justify-between h-full">
        <div>
          <p className="text-[9px] font-black text-[#98A7AA] uppercase leading-none mb-1">{label}</p>
          <p className="text-xl font-black text-[#2C4156] leading-none">{value}</p>
        </div>
        <Icon className="h-4 w-4 text-[#39586D]" />
      </CardContent>
    </Card>
  )
}
