'use client';

import * as React from "react"
import { 
  Calendar,
  FileSignature,
  CalendarClock,
  Users,
  FileText,
  FolderOpen,
  TrendingUp,
  LogOut,
  UsersRound,
  Building,
  ChevronDown
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { initiateLogout } from "@/firebase/non-blocking-login"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { doc } from "firebase/firestore"

const clientMenuItems = [
  {
    title: "Férias",
    url: "/portal/ferias",
    icon: Calendar,
  },
  {
    title: "Rescisão",
    url: "/portal/rescisao",
    icon: FileSignature,
  },
  {
    title: "Eventos",
    url: "/portal/eventos",
    icon: CalendarClock,
  },
  {
    title: "Alteração de Função",
    url: "/portal/alteracao-funcao",
    icon: Users,
  },
  {
    title: "Solicitação de NFSe",
    url: "/portal/nfse",
    icon: FileText,
  },
  {
    title: "Outros",
    url: "/portal/outros",
    icon: FolderOpen,
  },
]

export function ClientSidebar() {
  const { selectedUser } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const pathname = usePathname()
  const router = useRouter()

  // Busca o nome do escritório das configurações reais
  const officeRef = useMemoFirebase(() => doc(firestore, "officeSettings", "main"), [firestore])
  const { data: officeData } = useDoc(officeRef)

  const officeName = officeData?.nomeFantasia || officeData?.razaoSocial || "PROSPERARE"

  return (
    <Sidebar className="border-r border-slate-200 bg-[#2C4156] text-white">
      <SidebarHeader className="h-24 flex flex-col items-start px-6 justify-center border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-xl shadow-md shadow-blue-500/10 relative w-10 h-10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-white font-extrabold text-lg leading-none tracking-tight uppercase">{officeName.split(' ')[0]}</span>
              <span className="text-blue-400 font-extrabold text-lg leading-none tracking-tight">PORTAL</span>
            </div>
            <span className="text-slate-300 text-[9px] uppercase font-bold tracking-[0.2em] mt-1.5">Área do Cliente</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 mt-4 scrollbar-hide">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {clientMenuItems.map((item) => {
                const isActive = pathname === item.url
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className={cn(
                        "transition-all py-6 rounded-lg font-medium",
                        isActive 
                          ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white shadow-lg shadow-blue-600/15" 
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-[#233547] border-t border-white/10">
        {selectedUser && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9">
                <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                    {selectedUser.fullName?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#233547] rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">{selectedUser.fullName?.split(' ')[0]}</span>
                <span className="text-[8px] text-slate-300 font-black uppercase tracking-wider truncate">
                  {selectedUser.cnpj ? `CNPJ: ${selectedUser.cnpj}` : 'Cliente'}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-400 hover:bg-white/5" onClick={() => router.push("/escolha-usuario")}>
                <UsersRound className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-400 hover:bg-red-950/20" onClick={() => initiateLogout(auth)}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
