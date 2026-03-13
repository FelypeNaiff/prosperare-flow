
"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth-mock"
import { ChatWidget } from "@/components/collaboration/chat-widget"
import { NotificationBell } from "@/components/collaboration/notification-bell"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F7F7F7]">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-6 sticky top-0 z-40">
          <SidebarTrigger className="text-[#2C4156]" />
          <div className="flex items-center gap-2 md:hidden">
            <span className="font-bold text-sm tracking-tight">
              <span className="text-[#2C4156]">PROSPERARE</span>
              <span className="text-[#1FA67A] ml-1">FLOW</span>
            </span>
          </div>
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input
                type="search"
                placeholder="Buscar cliente, tarefa ou documento..."
                className="pl-9 bg-[#F7F7F7] border-none shadow-none focus-visible:ring-1 focus-visible:ring-[#1FA67A]"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full border-2 border-[#D2D7DB]">
                  <User className="h-5 w-5 text-[#2C4156]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-xl border-[#D2D7DB]">
                <DropdownMenuLabel className="text-[#2C4156]">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuItem>Minhas Tarefas</DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-[#E74C3C]">Sair do Sistema</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="p-4 md:p-8 flex-1">
          {children}
        </main>
        <footer className="h-12 border-t bg-white flex items-center justify-center px-6 text-[11px] text-[#98A7AA] font-medium">
          Prosperare Flow © 2026 — Sistema de Gestão Contábil
        </footer>
        <ChatWidget />
      </SidebarInset>
    </SidebarProvider>
  )
}
