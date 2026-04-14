"use client"

import { useState, useMemo } from "react"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser,
  setDocumentNonBlocking
} from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Plus, AlertTriangle, MessageCircle, Clock, ChevronRight, Building, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ClientSearchSelect } from "@/components/clients/client-search-select"
import { TemplateSearchSelect } from "@/components/atendimentos/template-search-select"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { TicketDetailsDrawer } from "@/components/atendimentos/ticket-details-drawer"

export default function MobileDemandasPage() {
  const firestore = useFirestore()
  const { userLoaded, selectedUser } = useUser()
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [filtroResponsavel, setFiltroResponsavel] = useState("Todas")
  const [filtroPrazo, setFiltroPrazo] = useState("Todos")

  const tasksQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "tasks") : null, [firestore, userLoaded])
  const { data: rawTasks } = useCollection(tasksQuery)

  const clientsQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "clients") : null, [firestore, userLoaded])
  const { data: clients = [] } = useCollection(clientsQuery)

  const usersQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "users") : null, [firestore, userLoaded])
  const { data: team = [] } = useCollection(usersQuery)

  const templatesQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "processoModelos") : null, [firestore, userLoaded])
  const { data: templates = [] } = useCollection(templatesQuery)

  // Responsáveis únicos (apenas tickets visíveis)
  const uniqueAssignees = useMemo(() => {
     const rawMemos = (rawTasks || []).filter((t:any) => ['novo', 'atendimento', 'pendente'].includes(t.status) && (!t.restrita || t.criadorId === selectedUser?.id))
     const uniqueIds = Array.from(new Set(rawMemos.map((t: any) => t.responsibleId)))
     return uniqueIds.map(id => {
       const user = (team||[]).find(u=>u.id === id) || rawMemos.find((t:any)=>t.responsibleId === id)
       return { id, name: user?.fullName || user?.responsibleName || "Indefinido" }
     })
  }, [rawTasks, selectedUser, team])

  const tickets = useMemo(() => {
    return (rawTasks || []).filter(t => {
      // Exclusividade
      if (!['novo', 'atendimento', 'pendente'].includes(t.status)) return false
      // FILTRO 4: Regra estrita OR
      if (t.restrita && t.criadorId !== selectedUser?.id) return false
      
      // Filtros de UI
      if (filtroResponsavel !== "Todas" && t.responsibleId !== filtroResponsavel) return false

      const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')
      if (filtroPrazo === 'Vencidos') {
         if (!t.dueDate || t.dueDate >= todayStr) return false
      } else if (filtroPrazo === 'Vence Hoje') {
         if (!t.dueDate || t.dueDate !== todayStr) return false
      } else if (filtroPrazo === 'No Prazo') {
         if (!t.dueDate || t.dueDate <= todayStr) return false
      }

      return true
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [rawTasks, selectedUser, filtroResponsavel, filtroPrazo])

  // Formulário Nova Demanda
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
    
    // Notificar
    const notifId = Math.random().toString(36).substr(2, 9)
    setDocumentNonBlocking(doc(firestore, "notifications", notifId), {
      id: notifId,
      userId: newTicket.responsibleId,
      title: "Nova Demanda",
      message: `Você foi designado para a demanda: ${ticketData.title}`,
      read: false,
      createdAt: new Date().toISOString(),
      link: "/mobile/demandas"
    })

    setIsNewOpen(false)
    setNewTicket({ clientId: "", templateId: "", responsibleId: "", notes: "", title: "", dueDate: "", isRestricted: false })
    toast({ title: "Demanda Enviada!", description: "O colaborador foi notificado." })
  }

  return (
    <div className="w-full h-[100dvh] bg-[#F4F5F7] flex flex-col relative overflow-hidden font-body">
      {/* Header Mobile Otimizado */}
      <div className="bg-[#2C4156] text-white px-5 pt-8 pb-5 shadow-lg flex justify-between items-center shrink-0 z-10 w-full relative">
        <div className="flex flex-col">
           <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#1FA67A]" />  
              Minhas Demandas
           </h1>
           <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-0.5">
             {tickets.length} {tickets.length === 1 ? 'demanda aberta' : 'demandas abertas'}
           </span>
        </div>
      </div>
      
      {/* FILTROS MOBILE HORIZONTAL SCROLL */}
      <div className="flex gap-2 overflow-x-auto whitespace-nowrap px-4 py-3 shrink-0 scrollbar-hide border-b border-[#E9ECEF] bg-white sticky top-0 z-10 w-full shadow-sm">
        {['Todos', 'Vencidos', 'Vence Hoje', 'No Prazo'].map(p => (
          <button 
            key={p}
            onClick={() => setFiltroPrazo(p)}
            className={cn(
              "rounded-full text-[10px] px-3 py-1.5 font-black uppercase transition-all border shrink-0 outline-none",
              filtroPrazo === p ? "bg-[#1FA67A] text-white border-[#1FA67A] shadow-md" : "bg-gray-100 text-[#5E6C84] border-transparent"
            )}
          >
            {p}
          </button>
        ))}
        
        {/* SELECT MINIMALISTA PARA RESPONSÁVEL (Abre menu nativo do celular) */}
        <select 
          className="ml-auto rounded-full text-[10px] px-3 py-1.5 font-black uppercase transition-all bg-[#2C4156] text-white border-transparent outline-none shadow-md shrink-0 focus:ring-0 max-w-[140px] truncate"
          value={filtroResponsavel}
          onChange={(e) => setFiltroResponsavel(e.target.value)}
        >
          <option value="Todas">TODOS (RESP.)</option>
          {(uniqueAssignees || []).map((u: any) => (
             <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>
          ))}
        </select>
      </div>

      {/* Lista Mobile Vertical 100vw */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-24 space-y-3 scrollbar-hide flex flex-col">
         {tickets.length === 0 && (
           <div className="flex flex-col items-center justify-center flex-1 text-[#98A7AA] space-y-2 opacity-50 py-12">
             <MessageCircle className="h-12 w-12" />
             <p className="text-xs font-black uppercase tracking-widest text-center mt-2">Nenhuma demanda pendente</p>
           </div>
         )}
         {tickets.map(ticket => {
            const isLate = ticket.dueDate && ticket.dueDate < (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'))
            return (
               <div 
                 key={ticket.id} 
                 onClick={() => setSelectedTicket(ticket)}
                 className={cn(
                   "bg-white rounded-2xl p-4 shadow-sm border transition-shadow active:scale-[0.98] flex items-center justify-between cursor-pointer",
                   isLate ? "border-red-300 bg-red-50/20" : "border-[#E9ECEF] border-b-2"
                 )}
               >
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-4">
                     <p className="text-[9px] font-black text-[#1FA67A] uppercase truncate leading-none">
                       {ticket.clientName}
                     </p>
                     <h3 className="text-sm font-black text-[#2C4156] leading-tight line-clamp-2">
                       {ticket.title}
                     </h3>
                     <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="bg-[#F4F5F7] text-[#5E6C84] px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 border border-[#D2D7DB]/50">
                           <User className="h-3 w-3" />
                           {ticket.responsibleName?.split(' ')[0]}
                        </span>
                        {ticket.dueDate && (
                           <span className={cn(
                             "px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 border",
                             isLate ? "bg-red-100 text-red-700 border-red-200" : "bg-white text-gray-500 border-gray-200 shadow-sm"
                           )}>
                              {isLate && <AlertTriangle className="h-3 w-3 shrink-0" />}
                              <Clock className="h-3 w-3 shrink-0" />
                              {new Date(ticket.dueDate + 'T12:00:00Z').toLocaleDateString('pt-BR').slice(0, 5)}
                           </span>
                        )}
                     </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#98A7AA] shrink-0 opacity-50" />
               </div>
            )
         })}
      </div>

      {/* Botão FAB Flutuante Mobile */}
      <button 
        onClick={() => setIsNewOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#1FA67A] rounded-full shadow-xl shadow-[#1FA67A]/40 flex items-center justify-center text-white active:scale-90 transition-transform z-20 focus:outline-none"
      >
         <Plus className="h-6 w-6 stroke-[3px]" />
      </button>

      {/* Modal 100vw/100vh usando Dialog do Radix (modal={false} ignora focus trap) */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen} modal={false}>
        <DialogContent className="max-w-[100vw] w-screen h-[100dvh] max-h-[100dvh] m-0 p-0 rounded-none border-none flex flex-col pt-0 top-0 translate-y-0 translate-x-[-50%]">
          <DialogHeader className="p-5 pt-8 bg-[#2C4156] text-white shrink-0 shadow-md">
            <DialogTitle className="text-lg font-black uppercase flex items-center gap-2">Nova Demanda</DialogTitle>
            <DialogDescription className="text-white/60 text-xs">Crie e delegue via mobile.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto w-full pb-20">
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Cliente</Label>
                <div className="w-full relative [&>*]:w-full">
                  <ClientSearchSelect 
                    clients={clients} 
                    value={newTicket.clientId} 
                    onValueChange={(v: string) => setNewTicket({...newTicket, clientId: v})} 
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Modelo Opcional</Label>
                  <TemplateSearchSelect 
                    templates={templates}
                    value={newTicket.templateId}
                    onValueChange={(v: string) => setNewTicket({...newTicket, templateId: v})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Responsável</Label>
                  <Select value={newTicket.responsibleId} onValueChange={(v) => setNewTicket({...newTicket, responsibleId: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-12 w-full text-xs">
                      <SelectValue placeholder="Delegar para..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {(team || []).map(u => (
                        <SelectItem key={u.id} value={u.id} className="text-xs py-3">{u.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {!newTicket.templateId && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Título Manual</Label>
                  <Input 
                    value={newTicket.title} 
                    onChange={(e) => setNewTicket({...newTicket, title: e.target.value.toUpperCase()})} 
                    className="h-12 w-full text-sm placeholder:text-sm"
                    placeholder="Ex: ALTERAÇÃO CONTRATUAL"
                  />
                </div>
              )}
              
              <div className="space-y-2 pt-2 border-t mt-4 border-[#E9ECEF]">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Prazo Limite</Label>
                <Input 
                  type="date"
                  className="border-[#D2D7DB] h-12 w-full text-sm block" 
                  value={newTicket.dueDate} 
                  onChange={(e) => setNewTicket({...newTicket, dueDate: e.target.value})} 
                />
              </div>

              <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#D2D7DB] space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-restricted-mode" className="text-xs font-black uppercase text-[#39586D] cursor-pointer flex-1">
                    Demanda Privada
                  </Label>
                  <Switch 
                    id="mobile-restricted-mode"
                    checked={newTicket.isRestricted}
                    onCheckedChange={(v) => setNewTicket({...newTicket, isRestricted: v})}
                  />
                </div>
                <p className="text-[9px] text-[#98A7AA] uppercase font-bold pr-8">
                  Deixe ativo se quiser que apenas você e o responsável tenham visão dessa task.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Observações (Instruções)</Label>
                <Textarea 
                  value={newTicket.notes} 
                  onChange={(e) => setNewTicket({...newTicket, notes: e.target.value})} 
                  className="min-h-[100px] text-sm" 
                  placeholder="Se necessário, digite instruções pro responsável..."
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t shrink-0 flex gap-3 pb-8 w-full">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setIsNewOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] flex-[2] h-12 text-sm uppercase font-black" onClick={handleCreateTicket}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Componente existente sendo ancorado na raiz */}
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
