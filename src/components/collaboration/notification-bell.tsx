
"use client"

import { Bell, AtSign, RefreshCw, FileWarning, Clock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'mention', title: 'Mencionou você', user: 'Ana Souza', context: 'DCTFWeb Setembro', time: 'Há 2 min', read: false },
  { id: 2, type: 'handoff', title: 'Bastão recebido', user: 'Ricardo Santos', context: 'Folha de Pagamento', time: 'Há 15 min', read: false },
  { id: 3, type: 'deadline', title: 'Prazo próximo', context: 'CND Federal - Padaria Central', time: 'Há 1h', read: false },
  { id: 4, type: 'direct', title: 'Mensagem direta', user: 'Fernanda Oliveira', context: 'Urgente: Certificado digital', time: 'Há 2h', read: true },
]

const iconMap = {
  mention: AtSign,
  handoff: RefreshCw,
  deadline: FileWarning,
  direct: Mail,
}

const colorMap = {
  mention: 'text-[#1FA67A]',
  handoff: 'text-[#2574A9]',
  deadline: 'text-[#E74C3C]',
  direct: 'text-[#F2B705]',
}

export function NotificationBell() {
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative text-[#2C4156] hover:bg-[#F7F7F7]">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-[#E74C3C] border-2 border-white shadow-sm">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] p-0 shadow-2xl border-[#D2D7DB]">
        <DropdownMenuLabel className="p-4 flex items-center justify-between bg-[#F7F7F7]">
          <span className="text-sm font-bold text-[#2C4156] uppercase tracking-tight">Notificações Flow</span>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-[#1FA67A] uppercase">Limpar tudo</Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-[400px]">
          <div className="flex flex-col">
            {MOCK_NOTIFICATIONS.map((notif) => {
              const Icon = iconMap[notif.type as keyof typeof iconMap] || Bell
              return (
                <DropdownMenuItem key={notif.id} className={cn(
                  "p-4 flex gap-4 cursor-pointer focus:bg-[#F7F7F7] border-b last:border-0",
                  !notif.read && "bg-[#1FA67A]/5"
                )}>
                  <div className={cn("p-2 rounded-full bg-white border shadow-sm shrink-0", colorMap[notif.type as keyof typeof colorMap])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-[#2C4156] truncate">
                        {notif.user ? `${notif.user} ${notif.title}` : notif.title}
                      </p>
                      <span className="text-[10px] text-[#98A7AA] whitespace-nowrap">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-[#39586D] leading-tight font-medium italic">"{notif.context}"</p>
                    {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-[#1FA67A]" />}
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        </ScrollArea>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 text-center bg-[#F7F7F7]">
          <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold text-[#2C4156] uppercase">Ver todas as notificações</Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
