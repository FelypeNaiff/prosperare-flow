
"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { User, ChevronRight, Home } from "lucide-react"
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
import { GlobalSearch } from "@/components/layout/global-search"
import { QuickAccess } from "@/components/layout/quick-access"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const pathSegments = pathname.split('/').filter(Boolean)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F7F7F7]">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-6 sticky top-0 z-40">
          <SidebarTrigger className="text-[#2C4156]" />
          
          <div className="flex-1 flex items-center gap-4 overflow-hidden">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#98A7AA]">
              <Home className="h-3.5 w-3.5" />
              {pathSegments.map((segment, index) => (
                <div key={segment} className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" />
                  <span className={index === pathSegments.length - 1 ? "text-[#2C4156] font-bold capitalize" : "capitalize"}>
                    {segment.replace(/-/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
            <QuickAccess />
          </div>

          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full border-2 border-[#D2D7DB]">
                  <User className="h-5 w-5 text-[#2C4156]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-xl border-[#D2D7DB]">
                <DropdownMenuLabel className="text-[#2C4156]">
                  <p className="font-bold">{user?.name}</p>
                  <p className="text-[10px] text-[#98A7AA] uppercase">{user?.profile}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/configuracoes/meus-dados">Meu Perfil</Link></DropdownMenuItem>
                <DropdownMenuItem>Minhas Tarefas</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-[#E74C3C] font-bold">Sair do Sistema</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="p-4 md:p-8 flex-1 overflow-x-hidden">
          {children}
        </main>

        <footer className="h-12 border-t bg-white flex items-center justify-between px-8 text-[11px] text-[#98A7AA] font-medium">
          <span>Prosperare Flow © 2026 — Sistema de Gestão Contábil</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-[#1FA67A]">Termos de Uso</Link>
            <Link href="#" className="hover:text-[#1FA67A]">Privacidade</Link>
            <Link href="#" className="hover:text-[#1FA67A]">Suporte</Link>
          </div>
        </footer>
        <ChatWidget />
      </SidebarInset>
    </SidebarProvider>
  )
}
