"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Users, 
  Files, 
  ShieldCheck, 
  DollarSign, 
  FolderOpen, 
  UserCircle, 
  Settings,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  PieChart,
  LineChart,
  TrendingUp
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAuth } from "@/hooks/use-auth-mock"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Painel Principal",
    url: "/dashboard",
    icon: LayoutDashboard,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR", "ASSISTENTE"],
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR", "ASSISTENTE"],
  },
  {
    title: "Processos",
    url: "/processos",
    icon: Files,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR", "ASSISTENTE"],
    badge: 5
  },
  {
    title: "Certidões",
    url: "/certidoes",
    icon: ShieldCheck,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR"],
    badge: 2
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR"],
    isCollapsible: true,
    subItems: [
      { title: "Contas a Receber", url: "/financeiro/receber", icon: ArrowUpRight },
      { title: "Contas a Pagar", url: "/financeiro/pagar", icon: ArrowDownRight },
      { title: "Contratos", url: "/financeiro/contratos", icon: FileText },
      { title: "DRE Gerencial", url: "/financeiro/dre", icon: PieChart },
      { title: "Fluxo de Caixa", url: "/financeiro/fluxo", icon: LineChart },
    ]
  },
  {
    title: "Documentos",
    url: "/documentos",
    icon: FolderOpen,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR", "ASSISTENTE"],
  },
  {
    title: "Equipe",
    url: "/equipe",
    icon: UserCircle,
    profiles: ["ADMINISTRADOR"],
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    profiles: ["ADMINISTRADOR"],
  },
]

export function AppSidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  
  const filteredItems = items.filter(item => 
    user && item.profiles.includes(user.profile)
  )

  return (
    <Sidebar className="border-r-0 bg-[#2C4156] text-white">
      <SidebarHeader className="h-24 flex flex-col items-start px-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-xl leading-none tracking-tight">PROSPERARE</span>
              <span className="text-[#1FA67A] font-bold text-xl leading-none tracking-tight">FLOW</span>
            </div>
            <span className="text-[#98A7AA] text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Sistema Contábil</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                item.isCollapsible ? (
                  <Collapsible key={item.title} className="group/collapsible" defaultOpen={pathname.startsWith(item.url)}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={cn(
                          "hover:bg-[#39586D] transition-all py-6 text-white",
                          pathname.startsWith(item.url) && "bg-[#39586D] border-l-[3px] border-[#1FA67A]"
                        )}>
                          <item.icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="border-l border-white/10 ml-4">
                          {item.subItems?.map((sub) => (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === sub.url} className="text-white/80 hover:text-white">
                                <Link href={sub.url} className="flex items-center gap-2 py-2">
                                  <sub.icon className={cn("h-4 w-4 opacity-70", pathname === sub.url && "text-[#1FA67A] opacity-100")} />
                                  <span className={cn(pathname === sub.url && "text-[#1FA67A] font-semibold")}>{sub.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.url}
                      className={cn(
                        "hover:bg-[#39586D] transition-all py-6 text-white",
                        pathname === item.url && "bg-[#39586D] border-l-[3px] border-[#1FA67A]"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className={cn("h-5 w-5", pathname === item.url && "text-[#1FA67A]")} />
                        <span className={cn("text-sm font-medium", pathname === item.url && "font-bold")}>{item.title}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="ml-auto px-1.5 h-5 min-w-5 flex items-center justify-center text-[10px] bg-[#E74C3C]">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 bg-[#39586D]/30 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-[#1FA67A]/50">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-white text-[#2C4156] font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">{user.name}</span>
              <span className="text-[10px] text-[#98A7AA] font-medium uppercase tracking-wider truncate">
                {user.profile}
              </span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
