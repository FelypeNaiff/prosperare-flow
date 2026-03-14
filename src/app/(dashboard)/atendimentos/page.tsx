
"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Clock, 
  User, 
  Filter, 
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  ChevronRight,
  Layers,
  MessageCircle,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const COLUMNS = [
  { id: 'novo', title: 'Novos', color: 'border-t-[#2C4156]' },
  { id: 'atendimento', title: 'Em Atendimento', color: 'border-t-[#2574A9]' },
  { id: 'pendente', title: 'Pendente Cliente', color: 'border-t-[#F2B705]' },
  { id: 'concluido', title: 'Concluído', color: 'border-t-[#1FA67A]' },
]

const MOCK_TICKETS = [
  { id: 'TK-001', client: 'Padaria Central', title: 'Dúvida sobre Folha de Setembro', priority: 'Alta', status: 'novo', responsible: 'Ricardo', time: 'Há 15 min', source: 'whatsapp' },
  { id: 'TK-002', client: 'Oficina do João', title: 'Solicitação de Recisão - Pedro Santos', priority: 'Urgente', status: 'atendimento', responsible: 'Ana', time: 'Há 1h', source: 'system' },
  { id: 'TK-003', client: 'Consultoria Tech', title: 'Alteração no Contrato Social', priority: 'Média', status: 'pendente', responsible: 'Ricardo', time: 'Há 3h', source: 'whatsapp' },
  { id: 'TK-004', client: 'Agro Vale', title: 'Pedido de Balancete 2º Trimestre', priority: 'Baixa', status: 'concluido', responsible: 'Fernanda', time: 'Ontem', source: 'system' },
]

export default function AtendimentosPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const handleReplyWhatsapp = (client: string) => {
    toast({
      title: "Abrindo WhatsApp...",
      description: `Iniciando conversa com ${client}.`,
    })
    window.open(`https://wa.me/5596981223344?text=Olá, sou da Prosperare Flow e estou retornando sobre o seu chamado.`, '_blank')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Central de Atendimento</h1>
          <p className="text-[#98A7AA] font-medium">Gestão de solicitações integradas (Sistema + WhatsApp).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#1FA67A] text-[#1FA67A] hover:bg-[#1FA67A]/5 gap-2 font-bold">
            <MessageCircle className="h-4 w-4" /> Configurar WhatsApp
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2">
            <Plus className="h-4 w-4" /> Novo Atendimento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiMiniCard label="Vindo do WhatsApp" value="12" icon={MessageCircle} color="success" />
        <KpiMiniCard label="Em Aberto" value="14" icon={Clock} color="info" />
        <KpiMiniCard label="Média de Resposta" value="28min" icon={CheckCircle2} color="success" />
        <KpiMiniCard label="Críticos" value="3" icon={AlertCircle} color="destructive" />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
          <Input 
            placeholder="Buscar por cliente, título ou origem..." 
            className="pl-9 bg-white border-[#D2D7DB]" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-[#D2D7DB] gap-2">
          <Filter className="h-4 w-4" /> Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[600px]">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-extrabold text-[#2C4156] flex items-center gap-2 text-xs uppercase tracking-wider">
                {col.title}
                <Badge variant="secondary" className="rounded-full px-1.5 h-5 min-w-5 flex items-center justify-center text-[10px] bg-[#D2D7DB] text-[#39586D]">
                  {MOCK_TICKETS.filter(t => t.status === col.id).length}
                </Badge>
              </h3>
            </div>
            
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="flex flex-col gap-3 pr-4 pb-4">
                {MOCK_TICKETS.filter(t => t.status === col.id).map(ticket => (
                  <Card 
                    key={ticket.id} 
                    className={cn(
                      "border-t-4 hover:shadow-lg transition-all cursor-pointer bg-white group relative",
                      col.color
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#1FA67A] uppercase tracking-widest flex items-center gap-1">
                            {ticket.source === 'whatsapp' && <MessageCircle className="h-3 w-3 fill-[#1FA67A]/20" />}
                            {ticket.client}
                          </span>
                        </div>
                        <Badge className={cn(
                          "text-[9px] px-1.5 h-4 uppercase font-extrabold",
                          ticket.priority === 'Urgente' ? 'bg-[#FEE2E2] text-[#E74C3C]' : 'bg-[#F7F7F7] text-[#98A7AA]'
                        )}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm font-bold text-[#2C4156] leading-snug group-hover:text-[#1FA67A] transition-colors">{ticket.title}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-[#F7F7F7]">
                        <span className="text-[9px] font-bold text-[#98A7AA]">{ticket.id} • {ticket.time}</span>
                        <div className="flex items-center gap-2">
                          {ticket.source === 'whatsapp' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-[#1FA67A] hover:bg-[#1FA67A]/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReplyWhatsapp(ticket.client);
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px] bg-[#2C4156] text-white">{ticket.responsible.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiMiniCard({ label, value, icon: Icon, color }: any) {
  const colors = {
    primary: "border-l-[#2C4156]",
    info: "border-l-[#2574A9]",
    warning: "border-l-[#F2B705]",
    success: "border-l-[#1FA67A]",
    destructive: "border-l-[#E74C3C]",
  }
  return (
    <Card className={cn("border-none border-l-4 shadow-sm bg-white", colors[color as keyof typeof colors])}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-[#2C4156]">{value}</p>
        </div>
        <div className="p-2 bg-[#F7F7F7] rounded-lg">
          <Icon className="h-4 w-4 text-[#39586D]" />
        </div>
      </CardContent>
    </Card>
  )
}
