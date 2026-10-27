
"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Calendar as CalendarIcon,
  Circle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser
} from "@/firebase"
import { collection } from "firebase/firestore"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isBefore,
  parseISO
} from "date-fns"
import { ptBR } from "date-fns/locale"

export default function FinanceiroCalendarioPage() {
  const firestore = useFirestore()
  const { userLoaded } = useUser()
  const [currentDate, setCurrentDate] = useState<Date | null>(null)

  // Evita erros de hidratação inicializando a data apenas no cliente
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  const payablesQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "payables") : null, 
    [firestore, userLoaded]
  )
  const { data: payables = [], isLoading: loadingPayables } = useCollection(payablesQuery)

  const receivablesQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "receivables") : null, 
    [firestore, userLoaded]
  )
  const { data: receivables = [], isLoading: loadingReceivables } = useCollection(receivablesQuery)

  const calendarDays = useMemo(() => {
    if (!currentDate) return []
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const nextMonth = () => currentDate && setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => currentDate && setCurrentDate(subMonths(currentDate, 1))

  const allEvents = useMemo(() => {
    const combined = [
      ...(payables || []).map(p => ({ ...p, source: 'payable' })),
      ...(receivables || []).map(r => ({ ...r, source: 'receivable' }))
    ]
    return combined
  }, [payables, receivables])

  const getEventsForDay = (day: Date) => {
    return allEvents.filter(event => {
      if (!event.data) return false
      try {
        return isSameDay(parseISO(event.data), day)
      } catch {
        return false
      }
    })
  }

  const getStatusColor = (event: any) => {
    const isPaid = event.situacao === 'Pago' || event.situacao === 'Confirmado'
    const eventDate = event.data ? parseISO(event.data) : new Date()
    const today = new Date()
    const isOverdue = !isPaid && isBefore(eventDate, today)

    if (isPaid) return "bg-[#7ED6B5] text-[#2563EB]"
    if (isOverdue) return "bg-[#FEE2E2] text-[#E74C3C]"
    return "bg-[#FEF3C7] text-[#F2B705]"
  }

  const getStatusIndicator = (event: any) => {
    const isPaid = event.situacao === 'Pago' || event.situacao === 'Confirmado'
    const eventDate = event.data ? parseISO(event.data) : new Date()
    const today = new Date()
    const isOverdue = !isPaid && isBefore(eventDate, today)

    if (isPaid) return "bg-[#2563EB]"
    if (isOverdue) return "bg-[#E74C3C]"
    return "bg-[#F2B705]"
  }

  if (!currentDate || loadingPayables || loadingReceivables) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#2563EB]" />
        <p className="text-xs font-black uppercase text-[#98A7AA] tracking-widest">Sincronizando Agenda Financeira...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Calendário</h1>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">
            <span className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-[#2563EB] text-[#2563EB]" /> Pago</span>
            <span className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-[#F2B705] text-[#F2B705]" /> Pendente</span>
            <span className="flex items-center gap-1.5"><Circle className="h-2 w-2 fill-[#E74C3C] text-[#E74C3C]" /> Vencido</span>
          </div>

          <div className="flex items-center gap-2 bg-white border border-[#D2D7DB] rounded-xl px-2 py-1.5 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-black text-[#2C4156] uppercase">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border border-[#D2D7DB] rounded-3xl overflow-hidden shadow-xl bg-white">
        <div className="grid grid-cols-7 bg-[#F7F7F7] border-b border-[#D2D7DB]">
          {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day) => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-[#98A7AA] tracking-[0.2em]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 grid-rows-5 h-[calc(100vh-280px)] min-h-[600px]">
          {calendarDays.map((day, idx) => {
            const events = getEventsForDay(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)

            return (
              <div 
                key={idx} 
                className={cn(
                  "border-r border-b border-[#D2D7DB] p-2 space-y-2 flex flex-col overflow-hidden",
                  !isCurrentMonth && "bg-[#F7F7F7]/50",
                  idx % 7 === 6 && "border-r-0"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all",
                    isToday ? "bg-[#2563EB] text-white shadow-lg shadow-emerald-500/30" : "text-[#2C4156]",
                    !isCurrentMonth && "opacity-20"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5">
                      {Array.from(new Set(events.map(e => getStatusIndicator(e)))).map((color, i) => (
                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", color)} />
                      ))}
                    </div>
                  )}
                </div>

                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-1.5 pr-1">
                    {events.map((event: any) => (
                      <div 
                        key={event.id}
                        className={cn(
                          "px-2 py-1 rounded-md text-[9px] font-black uppercase truncate border border-transparent hover:border-current/20 transition-all cursor-pointer",
                          getStatusColor(event)
                        )}
                        title={`${event.entidade || event.cliente}: ${event.descricao}`}
                      >
                        {event.entidade || event.cliente || event.descricao}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {events.length > 3 && (
                  <p className="text-[8px] font-bold text-[#98A7AA] pl-1">+{events.length - 3}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
