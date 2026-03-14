
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
  Building,
  Key,
  CalendarClock,
  Mail,
  MessageSquare,
  Lock,
  CreditCard,
  History,
  Building2,
  Calendar,
  Palette,
  Link as LinkIcon,
  LogOut,
  TrendingUp,
  ClipboardList,
  Layers
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
import { Button } from "@/components/ui/button"

const items = [
  {
    title: "Dashboard",
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
    badge: 5,
    isCollapsible: true,
    subItems: [
      { title: "Todos os Processos", url: "/processos", icon: Files },
      { title: "Calendário de Prazos", url: "/processos/calendario", icon: Calendar },
      { title: "Modelos", url: "/processos/modelos", icon: FileText },
      { title: "IRPF", url: "/processos/irpf", icon: ClipboardList },
      { title: "Grupos de Obrigações", url: "/processos/grupos", icon: Layers },
    ]
  },
  {
    title: "Certidões",
    url: "/certidões",
    icon: ShieldCheck,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR"],
    badge: 2,
    isCollapsible: true,
    subItems: [
      { title: "Painel Geral", url: "/certidoes", icon: PieChart },
      { title: "Por Empresa", url: "/certidoes", icon: Building },
    ]
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
    isCollapsible: true,
    subItems: [
      { title: "Membros", url: "/equipe", icon: Users },
      { title: "Departamentos", url: "/equipe/departamentos", icon: Building2 },
      { title: "Permissões", url: "/equipe/permissoes", icon: Lock },
      { title: "Histórico de Ações", url: "/equipe/historico", icon: History },
    ]
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    profiles: ["ADMINISTRADOR"],
    isCollapsible: true,
    subItems: [
      { title: "Meus Dados", url: "/configuracoes/meus-dados", icon: Building },
      { title: "Certificado Digital", url: "/configuracoes/certificado", icon: Key },
      { title: "Agendamento Automático", url: "/configuracoes/agendamento", icon: CalendarClock },
      { title: "E-mail de Disparo", url: "/configuracoes/email", icon: Mail },
      { title: "WhatsApp", url: "/configuracoes/whatsapp", icon: MessageSquare },
      { title: "Segurança", url: "/configuracoes/seguranca", icon: Lock },
      { title: "Aparência", url: "/configuracoes/aparencia", icon: Palette },
      { title: "Integrações", url: "/configuracoes/integracoes", icon: LinkIcon },
      { title: "IRPF", url: "/configuracoes/irpf", icon: ClipboardList },
      { title: "Plano e Assinatura", url: "/configuracoes/plano", icon: CreditCard },
    ]
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  
  const filteredItems = items.filter(item => 
    user && item.profiles.includes(user.profile)
  )

  return (
    <Sidebar className="border-r-0 bg-[#2C4156] text-white">
      <SidebarHeader className="h-24 flex flex-col items-start px-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#1FA67A] rounded-lg shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-xl leading-none tracking-tight">PROSPERARE</span>
              <span className="text-[#1FA67A] font-bold text-xl leading-none tracking-tight">FLOW</span>
            </div>
            <span className="text-[#98A7AA] text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Sistema Contábil</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 mt-4 scrollbar-hide">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                item.isCollapsible ? (
                  <Collapsible 
                    key={item.title} 
                    className="group/collapsible" 
                    defaultOpen={pathname.startsWith(item.url)}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={cn(
                          "hover:bg-[#39586D] transition-all py-6 text-white group-data-[state=open]/collapsible:bg-[#39586D]/50",
                          pathname.startsWith(item.url) && "bg-[#39586D] border-l-[3px] border-[#1FA67A]"
                        )}>
                          <item.icon className={cn("h-5 w-5", pathname.startsWith(item.url) && "text-[#1FA67A]")} />
                          <span className={cn("text-sm font-medium", pathname.startsWith(item.url) && "font-bold")}>{item.title}</span>
                          <div className="ml-auto flex items-center gap-2">
                            {item.badge && (
                              <Badge variant="destructive" className="px-1.5 h-4 min-w-4 flex items-center justify-center text-[9px] bg-[#E74C3C] border-none">
                                {item.badge}
                              </Badge>
                            )}
                            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
                        <SidebarMenuSub className="border-l border-white/10 ml-4 space-y-1 py-1">
                          {item.subItems?.map((sub) => (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === sub.url} className="text-white/70 hover:text-white h-9">
                                <Link href={sub.url} className="flex items-center gap-2">
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-[#1FA67A]/50">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="bg-white text-[#2C4156] font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#1FA67A] border-2 border-[#39586D] rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate">{user.name}</span>
                <span className="text-[10px] text-[#98A7AA] font-medium uppercase tracking-wider truncate">
                  {user.profile}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-[#E74C3C] hover:bg-transparent" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
