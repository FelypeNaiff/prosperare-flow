
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
  MessageCircle,
  Loader2,
  Save,
  Building2,
  FileText,
  ChevronRight
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

const COLUMNS = [
  { id: 'novo', title: 'Novos', color: 'border-t-[#2C4156]', bg: 'bg-[#2C4156]/5' },
  { id: 'atendimento', title: 'Em Atendimento', color: 'border-t-[#2574A9]', bg: 'bg-[#2574A9]/5' },
  { id: 'pendente', title: 'Pendente Cliente', color: 'border-t-[#F2B705]', bg: 'bg-[#F2B705]/5' },
  { id: 'concluido', title: 'Concluído', color: 'border-t-[#1FA67A]', bg: 'bg-[#1FA67A]/5' },
]

export default function AtendimentosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)

  // Queries Reais
  const ticketsQuery = useMemoFirebase(() => collection(firestore, "tickets"), [firestore])
  const { data: tickets = [], isLoading: loadingTickets } = useCollection(ticketsQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: team = [] } = useCollection(usersQuery)

  const templatesQuery = useMemoFirebase(() => collection(firestore, "process_templates"), [firestore])
  const { data: templates = [] } = useCollection(templatesQuery)

  const [newTicket, setNewTicket] = useState({
    clientId: "",
    templateId: "",
    responsibleId: "",
    notes: "",
    title: ""
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
      title: template?.title || newTicket.title,
      responsibleId: newTicket.responsibleId,
      responsibleName: responsible?.fullName || "Responsável",
      notes: newTicket.notes,
      status: 'novo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setDocumentNonBlocking(doc(firestore, "tickets", id), ticketData, { merge: true })
    setIsNewTicketOpen(false)
    setNewTicket({ clientId: "", templateId: "", responsibleId: "", notes: "", title: "" })
    toast({ title: "Demanda Enviada!", description: "O colaborador foi notificado sobre o novo ticket." })
  }

  const updateStatus = (id: string, newStatus: string) => {
    updateDocumentNonBlocking(doc(firestore, "tickets", id), { status: newStatus, updatedAt: new Date().toISOString() })
    toast({ title: "Status Atualizado" })
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "tickets", id))
    toast({ title: "Ticket Removido", variant: "destructive" })
  }

  const filteredTickets = (tickets || []).filter(t => 
    t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.responsibleName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    open: filteredTickets.filter(t => t.status !== 'concluido').length,
    critical: filteredTickets.filter(t => t.status === 'pendente').length,
    completed: filteredTickets.filter(t => t.status === 'concluido').length,
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Demandas Internas</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Gestão de solicitações e tickets entre departamentos.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg" onClick={() => setIsNewTicketOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Atendimento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiMiniCard label="Em Aberto" value={stats.open} icon={Clock} color="info" />
        <KpiMiniCard label="Críticos (Pendente Cliente)" value={stats.critical} icon={AlertCircle} color="warning" />
        <KpiMiniCard label="Concluídos" value={stats.completed} icon={CheckCircle2} color="success" />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
          <Input 
            placeholder="Buscar por cliente, demanda ou colaborador..." 
            className="pl-10 bg-white border-[#D2D7DB] font-medium" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[600px]">
        {COLUMNS.map(col => (
          <div key={col.id} className={cn("flex flex-col gap-4 p-2 rounded-xl border-t-4", col.color, col.bg)}>
            <div className="flex items-center justify-between px-2 pt-1">
              <h3 className="font-black text-[#2C4156] text-[11px] uppercase tracking-widest flex items-center gap-2">
                {col.title}
                <Badge variant="secondary" className="rounded-full px-1.5 h-5 min-w-5 flex items-center justify-center text-[10px] bg-white text-[#2C4156] border">
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
                    <Card key={ticket.id} className="bg-white border-[#D2D7DB] shadow-sm hover:shadow-md transition-all group">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-[#1FA67A] uppercase tracking-tighter truncate">{ticket.clientName}</p>
                            <h4 className="text-xs font-black text-[#2C4156] leading-tight line-clamp-2 uppercase">{ticket.title}</h4>
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
                                Excluir Ticket
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Avatar className="h-6 w-6 border">
                            <AvatarFallback className="text-[8px] font-black bg-[#2C4156] text-white">
                              {ticket.responsibleName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#39586D] uppercase">{ticket.responsibleName}</span>
                            <span className="text-[8px] text-[#98A7AA] font-bold">Solicitado em {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-[10px] font-black text-[#98A7AA] uppercase tracking-widest border-2 border-dashed rounded-xl border-[#D2D7DB]/50">
                    Sem chamados
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>

      {/* Modal de Novo Atendimento / Demanda */}
      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1FA67A] rounded-lg">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Nova Demanda Interna</DialogTitle>
                <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
                  Vincule um cliente, processo e responsável para iniciar o fluxo.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Empresa (Cliente)
              </Label>
              <Select value={newTicket.clientId} onValueChange={(v) => setNewTicket({...newTicket, clientId: v})}>
                <SelectTrigger className="border-[#D2D7DB] h-11">
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {(clients || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.corporateName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <FileText className="h-3 w-3" /> Modelo de Processo
                </Label>
                <Select value={newTicket.templateId} onValueChange={(v) => setNewTicket({...newTicket, templateId: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11">
                    <SelectValue placeholder="Opcional: usar modelo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(templates || []).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3" /> Direcionar para (Equipe)
                </Label>
                <Select value={newTicket.responsibleId} onValueChange={(v) => setNewTicket({...newTicket, responsibleId: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11">
                    <SelectValue placeholder="Selecione o colaborador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(team || []).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!newTicket.templateId && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Título da Demanda (Manual)</Label>
                <Input 
                  placeholder="Ex: Resolver pendência de alvará" 
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Informações Adicionais / Notas</Label>
              <Textarea 
                placeholder="Descreva aqui os detalhes da solicitação..." 
                className="border-[#D2D7DB] text-xs h-32 focus:ring-[#1FA67A]"
                value={newTicket.notes}
                onChange={(e) => setNewTicket({...newTicket, notes: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsNewTicketOpen(false)} className="font-black uppercase text-xs border-[#D2D7DB]">Cancelar</Button>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-10 shadow-lg shadow-emerald-500/20" onClick={handleCreateTicket}>
              <Save className="h-4 w-4 mr-2" /> Enviar Demanda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        <div className="flex flex-col justify-center">
          <p className="text-[9px] font-black text-[#98A7AA] uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-xl font-black text-[#2C4156] leading-none">{value}</p>
        </div>
        <div className="p-2 bg-white rounded-lg border shadow-sm">
          <Icon className="h-4 w-4 text-[#39586D]" />
        </div>
      </CardContent>
    </Card>
  )
}
