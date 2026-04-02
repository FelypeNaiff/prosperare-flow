'use client';

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { ChevronRight, Home, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useUser, useAuth } from "@/firebase"
import { initiateLogout } from "@/firebase/non-blocking-login"
import { ChatWidget } from "@/components/collaboration/chat-widget"
import { NotificationBell } from "@/components/collaboration/notification-bell"
import { GlobalSearch } from "@/components/layout/global-search"
import { QuickAccess } from "@/components/layout/quick-access"
import { usePathname, useRouter } from "next/navigation"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, selectedUser, isUserLoading, isAuthChecking, userLoaded } = useUser()
  const auth = useAuth()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && userLoaded) {
      if (!user) {
        router.push("/login")
      } else if (!selectedUser && pathname !== "/escolha-usuario") {
        router.push("/escolha-usuario")
      }
    }
  }, [mounted, user, selectedUser, userLoaded, router, pathname])

  if (!mounted || !userLoaded || isUserLoading || isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#1FA67A]" />
          <p className="text-xs font-black uppercase text-[#98A7AA] tracking-widest animate-pulse">Sincronizando Sessão...</p>
        </div>
      </div>
    )
  }

  if (!user || (!selectedUser && pathname !== "/escolha-usuario")) return null

  const pathSegments = pathname.split('/').filter(Boolean)

  return (
    <SidebarProvider>
      <div className="print:hidden">
        <AppSidebar />
      </div>
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-6 sticky top-0 z-40 print:hidden">
          <SidebarTrigger className="text-[#2C4156]" />
          
          <div className="flex-1 flex items-center gap-4 overflow-hidden">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-400">
              <Home className="h-3.5 w-3.5" />
              {pathSegments.map((segment, index) => (
                <div key={segment} className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" />
                  <span className={index === pathSegments.length - 1 ? "text-gray-900 font-bold capitalize" : "capitalize"}>
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
                <Button variant="ghost" size="icon" className="rounded-full border border-gray-200 overflow-hidden p-0 h-10 w-10">
                  <Avatar className="h-full w-full rounded-none">
                     <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-bold">
                      {selectedUser?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-sm border-gray-100 rounded-xl">
                <DropdownMenuLabel className="text-gray-900">
                  <p className="font-semibold truncate">{selectedUser?.fullName || 'Usuário'}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">{selectedUser?.profile || 'OPERADOR'}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/escolha-usuario")} className="font-semibold text-blue-600 cursor-pointer">
                  Trocar de Usuário
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => initiateLogout(auth)} className="text-red-600 font-semibold cursor-pointer">
                  Encerrar Sessão Mestre
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="p-6 md:p-8 flex-1 overflow-x-hidden print:p-0 print:m-0 print:bg-white">
          {children}
        </main>

        <footer className="h-12 border-t border-gray-100 bg-transparent flex items-center justify-between px-8 text-[11px] text-gray-400 font-medium print:hidden">
          <span>Prosperare Flow © 2026 — Gestão Digital Integrada</span>
          <div className="flex gap-4">
            <span className="text-[9px] font-bold uppercase text-gray-600">Operador: {selectedUser?.fullName}</span>
          </div>
        </footer>
        <div className="print:hidden">
          <ChatWidget />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}