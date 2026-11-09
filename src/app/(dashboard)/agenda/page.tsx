
"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Video, 
  MapPin, 
  Clock, 
  User, 
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  MoreVertical,
  CheckCircle2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
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
import { toast } from "@/hooks/use-toast"

const MOCK_EVENTS = [
  { id: 1, title: 'Reunião de Consultoria', client: 'Padaria Central', date: new Date(), time: '10:00', type: 'Online', category: 'Fiscal' },
  { id: 2, title: 'Entrega de Balancete', client: 'Oficina do João', date: new Date(), time: '14:30', type: 'Presencial', category: 'Contábil' },
  { id: 3, title: 'Planejamento Tributário', client: 'Consultoria Tech', date: new Date(new Date().setDate(new Date().getDate() + 1)), time: '09:00', type: 'Online', category: 'Consultoria' },
]

export default function AgendaPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSchedule = () => {
    setIsModalOpen(false)
    toast({ title: "Reunião Agendada!", description: "O cliente receberá o convite por e-mail." })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Agenda de Reuniões</h1>
          <p className="text-[#98A7AA] font-medium">Gestão de consultorias e compromissos com clientes.</p>
        </div>
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-lg">Calendário</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-none"
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          <Card className="border-[#D2D7DB]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Compromissos do Dia</CardTitle>
                <CardDescription>{date?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
                <Input placeholder="Buscar na agenda..." className="pl-9 h-9" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_EVENTS.filter(e => e.date.toDateString() === date?.toDateString()).length > 0 ? (
                MOCK_EVENTS.filter(e => e.date.toDateString() === date?.toDateString()).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-[#F7F7F7] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold border",
                        event.type === 'Online' ? "bg-[#E3F0F9] text-[#2574A9] border-[#2574A9]/20" : "bg-[#7ED6B5]/20 text-[#2563EB] border-[#2563EB]/20"
                      )}>
                        <span className="text-xs leading-none">{event.time.split(':')[0]}</span>
                        <span className="text-[10px] opacity-70 uppercase">{event.time.split(':')[1]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#2C4156]">{event.title}</h4>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold">{event.category}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#98A7AA] font-medium">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {event.client}</span>
                          <span className="flex items-center gap-1">
                            {event.type === 'Online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-[#98A7AA] opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-[#98A7AA]">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="bg-[#F7F7F7] w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <CalendarIcon className="h-6 w-6 text-[#98A7AA]" />
                  </div>
                  <p className="text-sm font-bold text-[#98A7AA]">Nenhum compromisso agendado para este dia.</p>
                  <Button variant="outline" size="sm" className="font-bold" onClick={() => setIsModalOpen(true)}>Agendar agora</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#D2D7DB] bg-[#2C4156] text-white">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Video className="h-6 w-6 text-[#2563EB]" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Integração Google Meet</h4>
                  <p className="text-sm text-white/70">Conecte sua agenda do Google para gerar links automáticos.</p>
                </div>
              </div>
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-bold border-none">Conectar Agenda</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Agendar Reunião</DialogTitle>
            <DialogDescription>Preencha os detalhes para notificar o cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Cliente</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Padaria Central</SelectItem>
                  <SelectItem value="2">Oficina do João</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Título da Reunião</Label>
              <Input placeholder="Ex: Planejamento Tributário" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">Data</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">Hora</Label>
                <Input type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Tipo</Label>
              <Select defaultValue="online">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online (Google Meet)</SelectItem>
                  <SelectItem value="presencial">Presencial no Escritório</SelectItem>
                  <SelectItem value="cliente">Presencial no Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#2563EB] font-bold" onClick={handleSchedule}>Confirmar Agendamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
