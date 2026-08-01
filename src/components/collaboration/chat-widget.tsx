"use client"

import { useState, useEffect } from "react"
import { 
  MessageSquare, 
  X, 
  Send, 
  Users, 
  User as UserIcon, 
  Activity, 
  Minus,
  AtSign,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const MOCK_TEAM_MESSAGES: any[] = []
const MOCK_DIRECT_MESSAGES: any[] = []
const MOCK_ACTIVITIES: any[] = []

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState("equipe")

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-[#2563EB] hover:bg-[#2563EB]/90 z-50 group"
      >
        <MessageSquare className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-6 min-w-6 flex items-center justify-center p-1 bg-[#E74C3C] border-2 border-white animate-bounce">
            {unreadCount}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <Card className={cn(
      "fixed right-6 bottom-6 w-[380px] shadow-2xl z-50 border-[#D2D7DB] transition-all duration-300 flex flex-col",
      isMinimized ? "h-14" : "h-[550px]"
    )}>
      <CardHeader className="p-3 bg-[#2C4156] text-white rounded-t-lg flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
          <CardTitle className="text-sm font-bold tracking-tight">COMUNICAÇÃO FLOW</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/10" onClick={() => setIsMinimized(!isMinimized)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-[#E74C3C]" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <Tabs defaultValue="equipe" className="flex-1 flex flex-col overflow-hidden" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 bg-[#F7F7F7] h-10 p-1 gap-1 rounded-none border-b">
              <TabsTrigger value="equipe" className="text-[10px] uppercase font-bold gap-1.5 data-[state=active]:bg-white">
                <Users className="h-3 w-3" /> Equipe
              </TabsTrigger>
              <TabsTrigger value="direto" className="text-[10px] uppercase font-bold gap-1.5 data-[state=active]:bg-white">
                <UserIcon className="h-3 w-3" /> Direto
              </TabsTrigger>
              <TabsTrigger value="tarefas" className="text-[10px] uppercase font-bold gap-1.5 data-[state=active]:bg-white">
                <Activity className="h-3 w-3" /> Tarefas
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden relative bg-white">
              <TabsContent value="equipe" className="m-0 h-full flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {MOCK_TEAM_MESSAGES.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-[10px] text-center text-[#98A7AA] font-bold uppercase tracking-widest py-2">Conversa de Equipe</p>
                      {MOCK_TEAM_MESSAGES.map((msg) => (
                        <div key={msg.id} className={cn(
                          "flex gap-3 items-start",
                          msg.mention && "bg-[#FEF3C7]/30 p-2 rounded-lg border border-[#F2B705]/20"
                        )}>
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage src={msg.avatar} />
                            <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#2C4156]">{msg.sender}</span>
                              <span className="text-[10px] text-[#98A7AA]">{msg.time}</span>
                            </div>
                            <p className="text-sm text-[#39586D] mt-0.5 leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 opacity-40">
                      <MessageSquare className="h-8 w-8 text-[#98A7AA]" />
                      <p className="text-xs font-bold uppercase tracking-widest text-[#98A7AA]">Nenhuma mensagem ainda</p>
                    </div>
                  )}
                </ScrollArea>
                <div className="p-3 border-t bg-[#F7F7F7]">
                  <div className="relative">
                    <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
                    <Input placeholder="Escreva uma mensagem... (@mencionar)" className="pl-9 h-10 bg-white text-sm" />
                    <Button size="icon" className="absolute right-1 top-1 h-8 w-8 bg-[#2563EB]">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="direto" className="m-0 h-full">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 text-[#98A7AA]" />
                    <Input placeholder="Buscar colega..." className="pl-7 h-8 text-xs" />
                  </div>
                </div>
                <ScrollArea className="h-[380px]">
                  {MOCK_DIRECT_MESSAGES.length > 0 ? (
                    <div className="divide-y">
                      {MOCK_DIRECT_MESSAGES.map((user) => (
                        <button key={user.id} className="w-full p-3 flex items-center gap-3 hover:bg-[#F7F7F7] transition-colors">
                          <div className="relative">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                              user.status === 'online' ? 'bg-[#2563EB]' : user.status === 'away' ? 'bg-[#F2B705]' : 'bg-[#D2D7DB]'
                            )} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-[#2C4156]">{user.name}</p>
                            <p className="text-[10px] text-[#98A7AA] uppercase font-medium">{user.status}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-[#98A7AA] text-[10px] font-bold uppercase tracking-widest">
                      Nenhum contato ativo
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tarefas" className="m-0 h-full">
                <ScrollArea className="h-full p-4">
                  {MOCK_ACTIVITIES.length > 0 ? (
                    <div className="space-y-4">
                      {MOCK_ACTIVITIES.map((act) => (
                        <div key={act.id} className="flex gap-3 items-start border-b pb-3 last:border-0">
                          <div className={cn(
                            "mt-1 w-2 h-2 rounded-full shrink-0",
                            act.type === 'system' ? 'bg-[#2C4156]' : 'bg-[#2563EB]'
                          )} />
                          <div className="flex-1">
                            <p className="text-xs text-[#39586D] leading-tight font-medium">{act.text}</p>
                            <span className="text-[10px] text-[#98A7AA]">{act.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-[#98A7AA] text-[10px] font-bold uppercase tracking-widest">
                      Sem atividades recentes
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}
    </Card>
  )
}
