"use client"

import { useState, useMemo } from "react"
import { Calendar as CalendarIcon, Loader2, Search, ArrowLeft, ArrowRight, Clock, AlertCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser
} from "@/firebase"
import { collection } from "firebase/firestore"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, addMonths, subMonths, isSameDay, isBefore, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { TicketDetailsDrawer } from "@/components/atendimentos/ticket-details-drawer"

export default function AgendaDemandasPage() {
  const firestore = useFirestore()
  const { userLoaded, selectedUser } = useUser()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroResponsavel, setFiltroResponsavel] = useState("todas")
  const [filtroPrazo, setFiltroPrazo] = useState("todas") // todas, atrasadas, hoje, no_prazo

  // Queries
  const tasksQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "tasks") : null, [firestore, userLoaded])
  const { data: rawTasks = [], isLoading } = useCollection(tasksQuery)

  const clientsQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "clients") : null, [firestore, userLoaded])
  const { data: clients = [] } = useCollection(clientsQuery)

  const usersQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "users") : null, [firestore, userLoaded])
  const { data: team = [] } = useCollection(usersQuery)

  const templatesQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "processoModelos") : null, [firestore, userLoaded])
  const { data: templates = [] } = useCollection(templatesQuery)

  // Filter Tasks (Privacy + Explicit Filters)
  const filteredEvents = useMemo(() => {
    const list: any[] = []
    const today = startOfDay(new Date())

    ;(rawTasks || []).forEach(t => {
      // Regra de privacidade: 'Demanda Restrita'
      if (t.restrita && t.criadorId !== selectedUser?.id) return

      // FILTRO EXCLUSIVO: Apenas collection fields mapeados como Demandas Internas
      if (t.status === 'concluido') return
      if (!t.dueDate) return

      const matchesSearch = t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.responsibleName?.toLowerCase().includes(searchTerm.toLowerCase())

      if (searchTerm && !matchesSearch) return
      
      if (filtroResponsavel !== "todas" && t.responsibleId !== filtroResponsavel) return

      const dDate = startOfDay(parseISO(t.dueDate))
      const isLate = isBefore(dDate, today)
      const isTodayEvent = isSameDay(dDate, today)
      
      if (filtroPrazo === 'atrasadas' && !isLate) return
      if (filtroPrazo === 'hoje' && !isTodayEvent) return
      if (filtroPrazo === 'no_prazo' && (isLate || isTodayEvent)) return

      let color = 'neutral'
      if (isLate) color = 'red'
      else if (isTodayEvent) color = 'yellow'

      list.push({
        ...t,
        parsedDate: parseISO(t.dueDate),
        color
      })
    })

    return list.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
  }, [rawTasks, selectedUser, searchTerm, filtroResponsavel, filtroPrazo])

  const uniqueAssignees = Array.from(new Set((rawTasks || []).filter((t:any) => t.status !== 'concluido' && (!t.restrita || t.criadorId === selectedUser?.id) && !!t.dueDate).map((t: any) => t.responsibleId)))
    .map(id => {
      const ticket = (rawTasks || []).find((t: any) => t.responsibleId === id)
      return { id, name: ticket?.responsibleName }
    })
    .filter(a => a.id && a.name)
    .sort((a, b) => a.name!.localeCompare(b.name!))

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
      case 'red': return 'animate-pulse border-2 border-red-600 bg-red-50 shadow-md shadow-red-200 text-red-700 hover:bg-red-100'
      case 'yellow': return 'border-2 border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100'
      default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 min-h-screen relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Agenda de Demandas</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Controle de prazos em calendário mensal.</p>
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

      <div className="flex flex-wrap gap-4 items-center border-b pb-4">
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input 
              placeholder="Buscar título / etiqueta..." 
              className="pl-10 bg-white border-[#D2D7DB]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>

         <div className="flex flex-wrap items-center gap-2">
           <span className="text-[10px] font-black uppercase text-[#98A7AA] mr-1">Prazo:</span>
           {['todas', 'atrasadas', 'hoje', 'no_prazo'].map(st => (
             <Button 
               key={st}
               variant="outline" 
               size="sm" 
               onClick={() => setFiltroPrazo(st)}
               className={cn(
                 "h-8 rounded-full text-[10px] font-black uppercase transition-all", 
                 filtroPrazo === st ? "bg-[#2C4156] text-white border-[#2C4156]" : "bg-white text-[#98A7AA] border-dashed hover:bg-gray-50"
               )}
             >
               {st === 'todas' && <Clock className="h-3 w-3 mr-1" />}
               {st === 'atrasadas' && <AlertCircle className="h-3 w-3 mr-1 text-red-500" />}
               {st === 'hoje' && <AlertCircle className="h-3 w-3 mr-1 text-orange-500" />}
               {st.replace('_', ' ')}
             </Button>
           ))}
         </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[10px] font-black uppercase text-[#98A7AA] mr-1">Responsável:</span>
        <Button 
          variant={filtroResponsavel === "todas" ? "default" : "outline"} 
          onClick={() => setFiltroResponsavel("todas")}
          size="sm"
          className={cn(
            "h-7 text-[10px] font-bold rounded-full transition-all border-dashed",
            filtroResponsavel === "todas" ? "bg-[#2574A9] text-white hover:bg-[#2574A9]/90 border-[#2574A9]" : "bg-white text-[#98A7AA] hover:bg-gray-50"
          )}
        >
          Todos
        </Button>
        {uniqueAssignees.map(assignee => (
          <Button 
            key={assignee.id}
            variant={filtroResponsavel === assignee.id ? "default" : "outline"}
            onClick={() => setFiltroResponsavel(assignee.id)}
            size="sm"
            className={cn(
              "h-7 text-[10px] font-bold rounded-full transition-all border-dashed",
              filtroResponsavel === assignee.id ? "bg-[#2574A9] text-white hover:bg-[#2574A9]/90 border-[#2574A9]" : "bg-white text-[#98A7AA] hover:bg-gray-50"
            )}
          >
            {assignee.name?.split(' ')[0]}
          </Button>
        ))}
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
              const dayEvents = filteredEvents.filter(e => isSameDay(e.parsedDate, day))
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
                          onClick={() => setSelectedTicket(evt)}
                          className={cn(
                            "text-[9px] md:text-[10px] font-bold p-1 md:p-1.5 rounded truncate cursor-pointer flex items-center gap-1 border transition-all",
                            getColorClasses(evt.color)
                          )}
                          title={`${evt.title} - ${evt.clientName}`}
                        >
                          {evt.color === 'red' && <AlertTriangle className="h-3 w-3 text-red-700 shrink-0" />}
                          <span className="truncate">{evt.title}</span>
                        </div>
                     ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

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
