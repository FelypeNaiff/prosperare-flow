"use client"

import { useState, useMemo } from "react"
import { Calendar as CalendarIcon, Loader2, Search, Filter, ShieldCheck, TicketCheck, FileSignature, ArrowUpRight, ArrowLeft, ArrowRight, Building2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser
} from "@/firebase"
import { collection, query } from "firebase/firestore"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, addMonths, subMonths, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import Link from "next/link"

export default function UnifiedCalendarPage() {
  const firestore = useFirestore()
  const { userLoaded } = useUser()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [activeFilters, setActiveFilters] = useState({
    alvara: true,
    certidao: true,
    ticket: true
  })

  // Queries
  const alvarasQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "alvaras") : null, [firestore, userLoaded])
  const { data: alvaras = [], isLoading: load1 } = useCollection(alvarasQuery)

  const certidoesQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "certidoes") : null, [firestore, userLoaded])
  const { data: certidoes = [], isLoading: load2 } = useCollection(certidoesQuery)

  const tasksQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "tasks") : null, [firestore, userLoaded])
  const { data: tasks = [], isLoading: load3 } = useCollection(tasksQuery)

  const clientsQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "clients") : null, [firestore, userLoaded])
  const { data: clients = [] } = useCollection(clientsQuery)

  const isLoading = load1 || load2 || load3

  // Format events
  const events = useMemo(() => {
    const list: any[] = []

    if (activeFilters.alvara) {
      (alvaras || []).forEach(a => {
         if (!a.validade) return
         const client = (clients || []).find(c => c.id === a.clienteId)
         list.push({
           id: `alv-${a.id}`,
           date: parseISO(a.validade),
           title: a.tipo || 'Alvará Genérico',
           type: 'Alvará',
           client: client?.corporateName || 'Empresa Indefinida',
           link: '/alvaras',
           status: a.status,
           color: 'purple'
         })
      })
    }

    if (activeFilters.certidao) {
      (certidoes || []).forEach(c => {
         if (!c.validade) return
         const client = (clients || []).find(cl => cl.id === c.clienteId)
         list.push({
           id: `cnd-${c.id}`,
           date: parseISO(c.validade),
           title: `CND ${c.tipo}`,
           type: 'Certidão',
           client: client?.corporateName || 'Empresa Indefinida',
           link: '/certidoes',
           status: c.status,
           color: 'blue'
         })
      })
    }

    if (activeFilters.ticket) {
      (tasks || []).forEach(t => {
         if (!t.dueDate || t.status === 'concluido' || t.status === 'dispensado') return
         list.push({
           id: `tsk-${t.id}`,
           date: parseISO(t.dueDate),
           title: t.title || 'Ticket Interno',
           type: 'Demanda Interna',
           client: t.clientName || 'Geral',
           link: '/atendimentos',
           status: t.status,
           color: 'orange'
         })
      })
    }

    return list.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [alvaras, certidoes, tasks, clients, activeFilters])

  // Calendar Math
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'purple': return 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF] hover:bg-[#E9D5FF]'
      case 'blue': return 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE] hover:bg-[#BFDBFE]'
      case 'orange': return 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA] hover:bg-[#FED7AA]'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getIcon = (type: string) => {
    if (type === 'Alvará') return <FileSignature className="h-3 w-3" />
    if (type === 'Certidão') return <ShieldCheck className="h-3 w-3" />
    return <TicketCheck className="h-3 w-3" />
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 min-h-screen relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Agenda de Obrigações</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Controle de vencimentos unificado.</p>
        </div>
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             onClick={() => setCurrentDate(new Date())}
             className="border-[#D2D7DB] text-[#39586D] font-bold uppercase text-xs shadow-sm h-11"
           >
             Mês Atual
           </Button>
           <div className="flex items-center bg-white border border-[#D2D7DB] rounded-xl px-2 py-1 shadow-sm h-11">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 flex flex-col items-center min-w-[140px]">
                <span className="text-sm font-black text-[#2C4156] uppercase tracking-wider">{format(currentDate, "MMMM yyyy", { locale: ptBR })}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ArrowRight className="h-4 w-4" />
              </Button>
           </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center border-b pb-4">
         <span className="text-[10px] font-black uppercase text-[#98A7AA] mr-2">Filtros:</span>
         <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveFilters({...activeFilters, alvara: !activeFilters.alvara})}
            className={cn("h-8 rounded-full text-[10px] font-black uppercase border-dashed", activeFilters.alvara ? "bg-[#F3E8FF] text-[#7E22CE] border-[#7E22CE]" : "bg-white text-[#98A7AA]")}
         >
            <FileSignature className="h-3 w-3 mr-1" /> Alvarás
         </Button>
         <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveFilters({...activeFilters, certidao: !activeFilters.certidao})}
            className={cn("h-8 rounded-full text-[10px] font-black uppercase border-dashed", activeFilters.certidao ? "bg-[#DBEAFE] text-[#1D4ED8] border-[#1D4ED8]" : "bg-white text-[#98A7AA]")}
         >
            <ShieldCheck className="h-3 w-3 mr-1" /> Certidões
         </Button>
         <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveFilters({...activeFilters, ticket: !activeFilters.ticket})}
            className={cn("h-8 rounded-full text-[10px] font-black uppercase border-dashed", activeFilters.ticket ? "bg-[#FFEDD5] text-[#C2410C] border-[#C2410C]" : "bg-white text-[#98A7AA]")}
         >
            <TicketCheck className="h-3 w-3 mr-1" /> Demandas
         </Button>
      </div>

      {isLoading ? (
         <div className="h-96 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2563EB] mb-4" />
            <span className="text-xs font-black uppercase tracking-widest text-[#98A7AA]">Montando Calendário...</span>
         </div>
      ) : (
        <Card className="border-[#D2D7DB] shadow-sm bg-white overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-[#F4F5F7]">
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-black uppercase text-[#39586D] tracking-widest border-r last:border-0 border-[#D2D7DB]">
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[120px] bg-white">
            {calendarDays.map((day, idx) => {
              const dayEvents = events.filter(e => isSameDay(e.date, day))
              const isCurrentMonth = isSameMonth(day, currentDate)
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "border-b border-r last:border-r-0 border-[#E9ECEF] p-1 md:p-2 transition-colors flex flex-col overflow-hidden relative group",
                    !isCurrentMonth && "bg-[#F9FAFB] opacity-50",
                    isToday(day) && "bg-[#E6F6F0]/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-1 h-5 shrink-0">
                     <span className={cn(
                       "text-xs font-black p-1 min-w-[24px] text-center rounded-full flex items-center justify-center transition-all",
                       isToday(day) ? "bg-[#2563EB] text-white" : "text-[#39586D]"
                     )}>
                       {format(day, 'd')}
                     </span>
                     {dayEvents.length > 0 && (
                       <Badge variant="outline" className="text-[8px] h-4 px-1 py-0 min-h-0 bg-[#F4F5F7] text-[#98A7AA] border-none font-bold">
                         {dayEvents.length}
                       </Badge>
                     )}
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                     {dayEvents.map(evt => (
                        <div 
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={cn(
                            "text-[9px] md:text-[10px] font-bold p-1 md:p-1.5 rounded truncate cursor-pointer flex items-center gap-1 border transition-all",
                            getColorClasses(evt.color)
                          )}
                          title={`${evt.title} - ${evt.client}`}
                        >
                          <span className="shrink-0">{getIcon(evt.type)}</span>
                          <span className="truncate">{evt.type === 'Alvará' || evt.type === 'Certidão' ? evt.client : evt.title}</span>
                        </div>
                     ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Detalhes do Evento */}
      <Dialog open={!!selectedEvent} onOpenChange={(v) => !v && setSelectedEvent(null)}>
         <DialogContent className="sm:max-w-[425px] border-none p-0 overflow-hidden shadow-2xl">
            {selectedEvent && (
               <>
                  <div className={cn("p-6 flex flex-col", {
                     'bg-[#7E22CE]': selectedEvent.color === 'purple',
                     'bg-[#1D4ED8]': selectedEvent.color === 'blue',
                     'bg-[#C2410C]': selectedEvent.color === 'orange'
                  })}>
                     <div className="flex items-start justify-between">
                        <Badge variant="outline" className="border-white/30 text-white bg-black/20 text-[9px] font-black uppercase">
                           {selectedEvent.type}
                        </Badge>
                     </div>
                     <h2 className="text-xl font-black text-white mt-4 uppercase tracking-tight">{selectedEvent.title}</h2>
                     <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Data: {format(selectedEvent.date, 'dd/MM/yyyy')}</p>
                  </div>
                  
                  <div className="p-6 bg-white space-y-4">
                     <div className="space-y-1 border-b border-[#D2D7DB] pb-3">
                        <span className="text-[10px] font-black uppercase text-[#98A7AA]">Empresa / Cliente</span>
                        <div className="flex items-center gap-2">
                           <Building2 className="h-4 w-4 text-[#2C4156]" />
                           <span className="text-sm font-bold text-[#2C4156]">{selectedEvent.client}</span>
                        </div>
                     </div>
                     <div className="space-y-1 border-b border-[#D2D7DB] pb-3">
                        <span className="text-[10px] font-black uppercase text-[#98A7AA]">Status no Sistema</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-[#39586D] uppercase">{selectedEvent.status?.replace('_', ' ') || 'Vigente'}</span>
                        </div>
                     </div>
                  </div>

                  <DialogFooter className="bg-[#F7F7F7] p-6 shrink-0 flex justify-between w-full">
                     <Button variant="outline" onClick={() => setSelectedEvent(null)} className="font-bold text-xs uppercase text-[#98A7AA]">
                        Fechar
                     </Button>
                     <Button asChild className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-black uppercase text-xs shadow-lg">
                        <Link href={selectedEvent.link}>
                           Acessar Módulo Original <ExternalLink className="h-3 w-3 ml-2" />
                        </Link>
                     </Button>
                  </DialogFooter>
               </>
            )}
         </DialogContent>
      </Dialog>
    </div>
  )
}
