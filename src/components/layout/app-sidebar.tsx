
'use client';

import * as React from "react"
import { 
  LayoutDashboard, 
  Users, 
  Files, 
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
  MessageSquare,
  Lock,
  History,
  Building2,
  Calendar,
  Palette,
  Link as LinkIcon,
  LogOut,
  TrendingUp,
  ClipboardList,
  Layers,
  TicketCheck,
  BrainCircuit,
  CreditCard as InstallmentIcon,
  FileSignature,
  FileStack,
  UsersRound,
  ShieldCheck
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
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { initiateLogout } from "@/firebase/non-blocking-login"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { doc } from "firebase/firestore"

const menuItems = [
  {
    title: "Painel Estratégico",
    url: "/dashboard",
    icon: LayoutDashboard,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR", "ASSISTENTE"],
    subItems: [
      { title: "Dashboard Geral", url: "/dashboard", icon: LayoutDashboard },
      { title: "Inteligência (BI)", url: "/inteligencia", icon: BrainCircuit },
      { title: "Agenda de Reuniões", url: "/agenda", icon: Calendar },
    ]
  },
  {
    title: "Relacionamento",
    url: "/clientes",
    icon: Users,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR", "ASSISTENTE"],
    subItems: [
      { title: "Gestão de Clientes", url: "/clientes", icon: Users },
      { title: "Central de Atendimentos", url: "/atendimentos", icon: TicketCheck },
      { title: "Agenda de Demandas", url: "/agenda-demandas", icon: CalendarClock },
    ]
  },
  {
    title: "Fluxo de Produção",
    url: "/processos",
    icon: Files,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR", "ASSISTENTE"],
    subItems: [
      { title: "Todos os Processos", url: "/processos", icon: Files },
      { title: "Grupos de Obrigações", url: "/processos/grupos", icon: Layers },
      { title: "Modelos de Checklist", url: "/processos/modelos", icon: FileText },
      { title: "Agenda de Obrigações", url: "/processos/calendario", icon: Calendar },
      { title: "IRPF 2026", url: "/processos/irpf", icon: ClipboardList },
      { title: "Parcelamentos", url: "/processos/parcelamentos", icon: InstallmentIcon },
      { title: "Alvarás e Licenças", url: "/alvaras", icon: FileSignature },
      { title: "Certidões Negativas", url: "/certidoes", icon: ShieldCheck },
    ]
  },
  {
    title: "Docs Flow",
    url: "/docs-flow",
    icon: FileStack,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR", "ASSISTENTE"],
    subItems: [
      { title: "Gerar Documentos", url: "/docs-flow", icon: FileSignature },
      { title: "Histórico de Docs", url: "/docs-flow/historico", icon: History },
    ]
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR"],
    subItems: [
      { title: "Contas a Receber", url: "/financeiro/receber", icon: ArrowUpRight },
      { title: "Contas a Pagar", url: "/financeiro/pagar", icon: ArrowDownRight },
      { title: "Calendário Financeiro", url: "/financeiro/calendario", icon: Calendar },
      { title: "Gestão de Contratos", url: "/financeiro/contratos", icon: FileText },
      { title: "DRE Gerencial", url: "/financeiro/dre", icon: PieChart },
      { title: "Fluxo de Caixa", url: "/financeiro/fluxo", icon: LineChart },
    ]
  },
  {
    title: "Gestão de Equipe",
    url: "/equipe",
    icon: UserCircle,
    profiles: ["ADMINISTRADOR", "SÓCIO"],
    subItems: [
      { title: "Colaboradores", url: "/equipe", icon: Users },
      { title: "Departamentos", url: "/equipe/departamentos", icon: Building2 },
      { title: "Permissões", url: "/equipe/permissoes", icon: Lock },
    ]
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    profiles: ["ADMINISTRADOR"],
    subItems: [
      { title: "Meus Dados", url: "/configuracoes/meus-dados", icon: Building },
      { title: "Configurações IRPF", url: "/configuracoes/irpf", icon: ClipboardList },
      { title: "Certificado Digital", url: "/configuracoes/certificado", icon: Key },
      { title: "Agendamento Automático", url: "/configuracoes/agendamento", icon: CalendarClock },
      { title: "WhatsApp", url: "/configuracoes/whatsapp", icon: MessageSquare },
      { title: "Aparência", url: "/configuracoes/aparencia", icon: Palette },
      { title: "Integrações", url: "/configuracoes/integracoes", icon: LinkIcon },
    ]
  },
]

export function AppSidebar() {
  const { selectedUser } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const pathname = usePathname()
  const router = useRouter()

  // Busca o nome do escritório das configurações reais
  const officeRef = useMemoFirebase(() => doc(firestore, "officeSettings", "main"), [firestore])
  const { data: officeData } = useDoc(officeRef)
  
  const filteredItems = React.useMemo(() => {
    if (!selectedUser) return []
    return menuItems.filter(item => item.profiles.includes(selectedUser.profile))
  }, [selectedUser?.profile])

  const officeName = officeData?.nomeFantasia || officeData?.razaoSocial || "PROSPERARE"

  return (
    <Sidebar className="border-r-0 bg-[#2C4156] text-white">
      <SidebarHeader className="h-24 flex flex-col items-start px-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#1FA67A] rounded-lg shadow-lg relative w-10 h-10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white z-10" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-lg leading-none tracking-tight uppercase">{officeName.split(' ')[0]}</span>
              <span className="text-[#1FA67A] font-bold text-lg leading-none tracking-tight">FLOW</span>
            </div>
            <span className="text-[#98A7AA] text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Gestão Team</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 mt-4 scrollbar-hide">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = pathname.startsWith(item.url) || item.subItems?.some(si => pathname === si.url)
                
                return (
                  <Collapsible 
                    key={item.title} 
                    defaultOpen={isActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={cn(
                          "hover:bg-[#39586D] transition-all py-6 text-white group-data-[state=open]/collapsible:bg-[#39586D]/50",
                          isActive && "bg-[#39586D] border-l-[3px] border-[#1FA67A]"
                        )}>
                          <item.icon className={cn("h-5 w-5", isActive && "text-[#1FA67A]")} />
                          <span className={cn("text-sm font-medium", isActive && "font-bold")}>{item.title}</span>
                          <div className="ml-auto flex items-center gap-2">
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
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-[#39586D]/30 border-t border-white/10">
        {selectedUser && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9">
                <Avatar className="h-9 w-9 border-2 border-[#1FA67A]/50">
                  <AvatarFallback className="bg-white text-[#2C4156] font-black text-xs">
                    {selectedUser.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#1FA67A] border-2 border-[#39586D] rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">{selectedUser.fullName?.split(' ')[0]}</span>
                <span className="text-[8px] text-[#98A7AA] font-black uppercase tracking-wider truncate">
                  {selectedUser.profile}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-[#2574A9]" onClick={() => router.push("/escolha-usuario")}>
                <UsersRound className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-[#E74C3C]" onClick={() => initiateLogout(auth)}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
