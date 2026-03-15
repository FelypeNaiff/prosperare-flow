"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { User as UserIcon, ChevronRight, Home, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import Link from "next/link"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, isUserLoading, isAuthChecking, userLoaded } = useUser()
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
      } else if (!userData) {
        // Logged in via Google but email not in collaborators base
        router.push("/unauthorized")
      }
    }
  }, [mounted, user, userData, userLoaded, router])

  if (!mounted || !userLoaded || isUserLoading || isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#1FA67A]" />
          <p className="text-xs font-black uppercase text-[#98A7AA] tracking-widest animate-pulse">Validando Credenciais...</p>
        </div>
      </div>
    )
  }

  if (!user || !userData) return null

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
                <Button variant="ghost" size="icon" className="rounded-full border-2 border-[#D2D7DB] overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-[#2C4156]" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-xl border-[#D2D7DB]">
                <DropdownMenuLabel className="text-[#2C4156]">
                  <p className="font-bold truncate">{userData.fullName || user.displayName || user.email}</p>
                  <p className="text-[10px] text-[#98A7AA] uppercase font-black">{userData.profile || 'Colaborador'}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/configuracoes/meus-dados">Meu Perfil</Link></DropdownMenuItem>
                <DropdownMenuItem>Minhas Tarefas</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => initiateLogout(auth)} className="text-[#E74C3C] font-bold">
                  Sair do Sistema
                </DropdownMenuItem>
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