"use client"

import { Bell, AtSign, RefreshCw, Clock } from "lucide-react"
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
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore"

export function NotificationBell() {
  const { user } = useUser()
  const firestore = useFirestore()

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(
      collection(firestore, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    )
  }, [firestore, user])

  const { data: notifications, isLoading } = useCollection(notificationsQuery)
  const unreadCount = (notifications || []).filter(n => !n.read).length

  const markAsRead = (id: string) => {
    updateDocumentNonBlocking(doc(firestore, "notifications", id), { read: true })
  }

  const markAllAsRead = () => {
    if (!notifications) return
    notifications.filter(n => !n.read).forEach(n => {
      updateDocumentNonBlocking(doc(firestore, "notifications", n.id), { read: true })
    })
  }

  if (!user) return null

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
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-[10px] font-bold text-[#1FA67A] uppercase"
            onClick={markAllAsRead}
          >
            Limpar tudo
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-[400px]">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="py-20 text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#98A7AA]" /></div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notif) => (
                <DropdownMenuItem 
                  key={notif.id} 
                  className={cn(
                    "p-4 flex gap-4 cursor-pointer focus:bg-[#F7F7F7] border-b last:border-0 items-start",
                    !notif.read && "bg-[#1FA67A]/5"
                  )}
                  onSelect={() => markAsRead(notif.id)}
                >
                  <div className={cn(
                    "mt-1 p-1.5 rounded-full shrink-0",
                    notif.type === 'mention' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {notif.type === 'mention' ? <AtSign className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-[#2C4156] leading-tight">{notif.title}</p>
                    <p className="text-[10px] text-[#39586D] leading-relaxed">{notif.message}</p>
                    <p className="text-[9px] text-[#98A7AA] font-medium">{new Date(notif.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-[#1FA67A] mt-2" />}
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