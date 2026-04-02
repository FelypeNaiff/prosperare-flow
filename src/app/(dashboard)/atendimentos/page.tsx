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
  Save,
  Building2,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { ClientSearchSelect } from "@/components/clients/client-search-select"
import { TicketDetailsDrawer } from "@/components/atendimentos/ticket-details-drawer"

const COLUMNS = [
  { id: 'novo', title: 'Novos', color: 'border-t-[#2C4156]', bg: 'bg-[#2C4156]/5' },
  { id: 'atendimento', title: 'Em Atendimento', color: 'border-t-[#2574A9]', bg: 'bg-[#2574A9]/5' },
  { id: 'pendente', title: 'Pendente Cliente', color: 'border-t-[#F2B705]', bg: 'bg-[#F2B705]/5' },
  { id: 'concluido', title: 'Concluído', color: 'border-t-[#1FA67A]', bg: 'bg-[#1FA67A]/5' },
]

export default function AtendimentosPage() {
  const firestore = useFirestore()
  const { userLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  const [filtroResponsavel, setFiltroResponsavel] = useState("todas")
  const [isHistoryView, setIsHistoryView] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)

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
    dueDate: ""
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setDocumentNonBlocking(doc(firestore, "tasks", id), ticketData, { merge: true })
    
    // Notificar o responsável
    const notifId = Math.random().toString(36).substr(2, 9)
    setDocumentNonBlocking(doc(firestore, "notifications", notifId), {
      id: notifId,
      userId: newTicket.responsibleId,
      title: "Nova Demanda",
      message: `Você foi designado para a demanda: ${ticketData.title}`,
      read: false,
      createdAt: new Date().toISOString(),
      link: "/atendimentos"
    })

    setIsNewTicketOpen(false)
    setNewTicket({ clientId: "", templateId: "", responsibleId: "", notes: "", title: "", dueDate: "" })
    toast({ title: "Demanda Enviada!", description: "O colaborador foi notificado." })
  }

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
  }

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    if (ticketId) {
      updateStatus(ticketId, statusId);
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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

  const filteredTickets = (tickets || []).filter(t => {
    const matchesSearch = t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.responsibleName?.toLowerCase().includes(searchTerm.toLowerCase())
      
    const matchesResponsible = filtroResponsavel === "todas" ? true : t.responsibleId === filtroResponsavel
    
    if (isHistoryView) {
      return t.status === 'concluido' && matchesSearch && matchesResponsible
    } else {
      return t.status !== 'concluido' && matchesSearch && matchesResponsible
    }
  })

  const uniqueAssignees = Array.from(new Set((tickets || []).map(t => t.responsibleId)))
    .map(id => {
      const ticket = (tickets || []).find(t => t.responsibleId === id)
      return { id, name: ticket?.responsibleName }
    })
    .filter(a => a.id && a.name)
    .sort((a, b) => a.name!.localeCompare(b.name!))

  const stats = {
    open: (tickets || []).filter(t => t.status !== 'concluido').length,
    critical: (tickets || []).filter(t => t.status === 'pendente').length,
    completed: (tickets || []).filter(t => t.status === 'concluido').length,
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Demandas Internas</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Gestão de solicitações entre departamentos.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isHistoryView ? "default" : "outline"}
            className={cn("gap-2 font-black uppercase text-xs", isHistoryView ? "bg-[#2C4156] text-white" : "border-[#D2D7DB] text-[#5E6C84]")}
            onClick={() => setIsHistoryView(!isHistoryView)}
          >
            <Clock className="h-4 w-4" /> {isHistoryView ? "Ver Kanban Ativo" : "Histórico/Arquivados"}
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg" onClick={() => setIsNewTicketOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Atendimento
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[#D2D7DB] pb-4">
        <span className="text-[10px] font-black uppercase text-[#98A7AA]">Filtrar por Responsável:</span>
        <Button 
          variant={filtroResponsavel === "todas" ? "default" : "outline"} 
          onClick={() => setFiltroResponsavel("todas")}
          className={cn(
            "h-8 text-xs font-bold rounded-full transition-all",
            filtroResponsavel === "todas" ? "bg-[#2C4156] text-white hover:bg-[#2C4156]/90 shadow-md" : "text-[#39586D] border-[#D2D7DB] hover:bg-[#F7F7F7]"
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
              "h-8 text-xs font-bold rounded-full transition-all",
              filtroResponsavel === assignee.id ? "bg-[#2C4156] text-white hover:bg-[#2C4156]/90 shadow-md" : "text-[#39586D] border-[#D2D7DB] hover:bg-[#F7F7F7]"
            )}
          >
            {assignee.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiMiniCard label="Em Aberto" value={stats.open} icon={Clock} color="info" />
        <KpiMiniCard label="Críticos" value={stats.critical} icon={AlertCircle} color="warning" />
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

      {!isHistoryView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[600px]">
          {COLUMNS.filter(c => c.id !== 'concluido').map(col => (
            <div 
              key={col.id} 
              className={cn("flex flex-col gap-4 p-2 rounded-xl border-t-4 transition-all duration-300", col.color, col.bg)}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between px-2 pt-1">
                <h3 className="font-black text-[#2C4156] text-[11px] uppercase tracking-widest flex items-center gap-2">
                  {col.title}
                  <Badge variant="secondary" className="rounded-full px-1.5 h-5 min-w-5 text-[10px] bg-white border">
                    {filteredTickets.filter(t => t.status === col.id).length}
                  </Badge>
                </h3>
              </div>
              
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="flex flex-col gap-3 pr-2 pb-4">
                  {loadingTickets ? (
                    <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1FA67A]" /></div>
                  ) : filteredTickets.filter(t => t.status === col.id).length > 0 ? (
                    filteredTickets.filter(t => t.status === col.id).map((ticket) => (
                      <Card 
                        key={ticket.id} 
                        className="bg-white border-[#D2D7DB] shadow-sm hover:shadow-md transition-all group cursor-pointer active:cursor-grabbing hover:border-[#1FA67A]/40"
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-[#1FA67A] uppercase truncate">{ticket.clientName}</p>
                            <h4 className="text-xs font-black text-[#2C4156] leading-tight uppercase">{ticket.title}</h4>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-[#98A7AA]"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {COLUMNS.filter(c => c.id !== ticket.status).map(c => (
                                <DropdownMenuItem key={c.id} onClick={() => updateStatus(ticket.id, c.id)} className="text-xs font-bold uppercase">
                                  Mover para {c.title}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem onClick={() => handleDelete(ticket.id)} className="text-xs font-bold uppercase text-[#E74C3C]">
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                          <div className="flex items-center gap-2 pt-2 border-t justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border">
                                <AvatarFallback className="text-[8px] font-black bg-[#2C4156] text-white">
                                  {ticket.responsibleName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-[#39586D] uppercase">{ticket.responsibleName}</span>
                                <span className="text-[8px] text-[#98A7AA] font-bold">{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                            {ticket.dueDate && (
                               <div className="bg-[#FFF4E5] text-[#F2B705] text-[9px] font-black px-2 py-0.5 rounded uppercase border border-[#FADF98]">
                                 Prazo: {new Date(ticket.dueDate).toLocaleDateString('pt-BR')}
                               </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-[10px] font-black text-[#98A7AA] uppercase border-2 border-dashed rounded-xl">
                      Solte as tarefas aqui
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#D2D7DB] shadow-sm overflow-hidden min-h-[500px]">
          <div className="p-4 border-b bg-[#F4F5F7] flex justify-between items-center">
             <h3 className="font-black text-[#2C4156] text-[11px] uppercase tracking-widest flex items-center gap-2">
                Tarefas Concluídas
                <Badge variant="secondary" className="rounded-full px-1.5 h-5 min-w-5 text-[10px] bg-white border">
                  {filteredTickets.length}
                </Badge>
              </h3>
          </div>
          <ScrollArea className="h-[500px]">
             {filteredTickets.length === 0 ? (
                <div className="py-12 flex justify-center text-[10px] font-black uppercase text-[#98A7AA]">Nenhum histórico encontrado.</div>
             ) : (
                <div className="divide-y">
                   {filteredTickets.map(ticket => (
                      <div key={ticket.id} className="p-4 hover:bg-[#F9FAFB] cursor-pointer flex justify-between items-center transition-colors" onClick={() => setSelectedTicket(ticket)}>
                         <div className="flex flex-col gap-1">
                            <p className="text-[9px] font-black text-[#1FA67A] uppercase">{ticket.clientName}</p>
                            <h4 className="text-xs font-black text-[#2C4156] leading-tight uppercase">{ticket.title}</h4>
                            <div className="flex gap-4 mt-1 text-[10px] font-bold text-[#98A7AA]">
                               <span>Concluído em: {new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}</span>
                               <span>Responsável: {ticket.responsibleName}</span>
                            </div>
                         </div>
                         <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase" onClick={(e) => { e.stopPropagation(); updateStatus(ticket.id, 'novo') }}>Reabrir</Button>
                      </div>
                   ))}
                </div>
             )}
          </ScrollArea>
        </div>
      )}

      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle>Nova Demanda Interna</DialogTitle>
            <DialogDescription className="text-white/60">Inicie um fluxo de atendimento para a equipe.</DialogDescription>
          </DialogHeader>
          <div className="modal-scroll-content">
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Empresa</Label>
                <ClientSearchSelect 
                  clients={clients} 
                  value={newTicket.clientId} 
                  onValueChange={(v: string) => setNewTicket({...newTicket, clientId: v})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Modelo</Label>
                  <Select value={newTicket.templateId} onValueChange={(v) => setNewTicket({...newTicket, templateId: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-11">
                      <SelectValue placeholder="Opcional..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(templates || []).map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            <Button className="bg-[#1FA67A]" onClick={handleCreateTicket}>Enviar Demanda</Button>
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
    warning: "border-l-[#F2B705] bg-[#F2B705]/5",
    success: "border-l-[#1FA67A] bg-[#1FA67A]/5",
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
