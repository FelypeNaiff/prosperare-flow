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

const MOCK_NOTIFICATIONS: any[] = []

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
            {MOCK_NOTIFICATIONS.length > 0 ? (
              MOCK_NOTIFICATIONS.map((notif) => (
                <DropdownMenuItem key={notif.id} className={cn(
                  "p-4 flex gap-4 cursor-pointer focus:bg-[#F7F7F7] border-b last:border-0",
                  !notif.read && "bg-[#1FA67A]/5"
                )}>
                  {/* ... conteúdo da notificação ... */}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="py-20 text-center space-y-2 opacity-40">
                <Bell className="h-8 w-8 mx-auto text-[#98A7AA]" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#98A7AA]">Tudo em dia por aqui</p>
              </div>
            )}
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
