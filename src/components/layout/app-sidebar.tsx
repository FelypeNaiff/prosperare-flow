
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
  CreditCard,
  PlusCircle
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
      { title: "Boletos Bancários", url: "/financeiro/boletos", icon: CreditCard },
      { title: "Opções Auxiliares", url: "/financeiro/auxiliar", icon: Settings },
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
    <Sidebar className="border-r-0">
      <SidebarHeader className="h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-primary font-bold text-xl">C</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">ContaHub</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                item.isCollapsible ? (
                  <Collapsible key={item.title} className="group/collapsible" defaultOpen={pathname.startsWith(item.url)}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="hover:bg-sidebar-accent transition-all py-6">
                          <item.icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems?.map((sub) => (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === sub.url}>
                                <Link href={sub.url} className="flex items-center gap-2 py-2">
                                  <sub.icon className="h-4 w-4 opacity-70" />
                                  <span>{sub.title}</span>
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
                      className="hover:bg-sidebar-accent transition-all py-6"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="ml-auto px-1.5 h-5 min-w-5 flex items-center justify-center text-[10px]">
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
      <SidebarFooter className="p-4 bg-sidebar-accent/50 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-white/20">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-primary-foreground text-primary font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">{user.name}</span>
              <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider truncate">
                {user.profile}
              </span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
