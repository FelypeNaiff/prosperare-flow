
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
  ShieldCheck,
  Landmark
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
    title: "Relacionamento",
    url: "/clientes",
    icon: Users,
    profiles: ["SÓCIO", "ADMINISTRADOR", "CONTADOR/GESTOR", "ASSISTENTE"],
    subItems: [
      { title: "Gestão de Clientes", url: "/clientes", icon: Users },
      { title: "Demandas Internas", url: "/atendimentos", icon: TicketCheck },
      { title: "Cofre de Senhas", url: "/cofre-senhas", icon: Lock },
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
      { title: "Legalizações (CNPJ)", url: "/legalizacoes", icon: Landmark },
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
    return menuItems.filter(item => {
      if (!item.profiles.includes(selectedUser.profile)) return false;
      
      if (item.title === "Financeiro") {
        const isMaster = selectedUser.profile === "SÓCIO" || selectedUser.profile === "ADMINISTRADOR";
        const hasFinanceiro = (selectedUser.departmentIds || []).some((d: string) => d.toUpperCase() === "FINANCEIRO");
        
        if (!isMaster && !hasFinanceiro) {
          return false;
        }
      }
      return true;
    })
  }, [selectedUser])

  const officeName = officeData?.nomeFantasia || officeData?.razaoSocial || "PROSPERARE"

  return (
    <Sidebar className="border-r border-slate-200 bg-white text-slate-800">
      <SidebarHeader className="h-24 flex flex-col items-start px-6 justify-center border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-xl shadow-md shadow-blue-500/10 relative w-10 h-10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-slate-900 font-extrabold text-lg leading-none tracking-tight uppercase">{officeName.split(' ')[0]}</span>
              <span className="text-blue-600 font-extrabold text-lg leading-none tracking-tight">FLOW</span>
            </div>
            <span className="text-slate-400 text-[9px] uppercase font-bold tracking-[0.2em] mt-1.5">Gestão Team</span>
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
                          "transition-all py-6 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg",
                          isActive && "bg-blue-50/30 text-blue-700 font-semibold"
                        )}>
                          <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                          <span className="text-sm font-medium">{item.title}</span>
                          <div className="ml-auto flex items-center gap-2">
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180", isActive ? "text-blue-600" : "text-slate-400")} />
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
                        <SidebarMenuSub className="border-l border-slate-200 ml-4 space-y-1 py-1">
                          {item.subItems?.map((sub) => {
                            const isSubActive = pathname === sub.url;
                            return (
                              <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton 
                                  asChild 
                                  isActive={isSubActive} 
                                  className={cn(
                                    "h-9 transition-all duration-200 flex items-center px-4",
                                    isSubActive 
                                      ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 rounded-r-xl rounded-l-none" 
                                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/60 rounded-lg"
                                  )}
                                >
                                  <Link href={sub.url}>
                                    <sub.icon className={cn("h-4 w-4 shrink-0 transition-colors", isSubActive ? "text-blue-600 opacity-100" : "text-slate-400 opacity-70")} />
                                    <span>{sub.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
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

      <SidebarFooter className="p-4 bg-slate-50/50 border-t border-slate-100">
        {selectedUser && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9">
                <Avatar className="h-9 w-9 border border-slate-200">
                  <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-xs">
                    {selectedUser.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-700 truncate">{selectedUser.fullName?.split(' ')[0]}</span>
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider truncate">
                  {selectedUser.profile}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-slate-100" onClick={() => router.push("/escolha-usuario")}>
                <UsersRound className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => initiateLogout(auth)}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
