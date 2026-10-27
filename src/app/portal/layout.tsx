'use client';

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ClientSidebar } from "@/components/layout/client-sidebar"
import { ChevronRight, Home, Loader2, Building, Building2 } from "lucide-react"
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
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { initiateLogout } from "@/firebase/non-blocking-login"
import { usePathname, useRouter } from "next/navigation"
import { collection } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, selectedUser, isUserLoading, isAuthChecking, userLoaded } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Lista de empresas para os administradores selecionarem
  const clientsQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "clients") : null, 
    [firestore, userLoaded]
  )
  const { data: clients = [] } = useCollection(clientsQuery)

  // Estado para armazenar o CNPJ ativo de operação
  const [activeCompanyCnpj, setActiveCompanyCnpj] = useState<string>("")
  const [activeCompanyName, setActiveCompanyName] = useState<string>("")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Verifica sessão
  useEffect(() => {
    if (mounted && userLoaded) {
      if (!user) {
        router.push("/login")
      } else if (!selectedUser && pathname !== "/escolha-usuario") {
        router.push("/escolha-usuario")
      }
    }
  }, [mounted, user, selectedUser, userLoaded, router, pathname])

  // Define empresa ativa com base no selectedUser ou na primeira empresa da lista (para admin)
  useEffect(() => {
    if (selectedUser) {
      if (selectedUser.cnpj) {
        const savedClientCnpj = localStorage.getItem("portal_client_active_cnpj")
        const savedClientCompany = localStorage.getItem("portal_client_active_company")
        
        if (selectedUser.empresasVinculadas && selectedUser.empresasVinculadas.length > 1 && savedClientCnpj) {
          setActiveCompanyCnpj(savedClientCnpj)
          setActiveCompanyName(savedClientCompany || "Sua Empresa")
        } else {
          setActiveCompanyCnpj(selectedUser.cnpj)
          setActiveCompanyName(selectedUser.companyName || selectedUser.razaoSocial || "Sua Empresa")
        }
      } else if (clients && clients.length > 0) {
        // Se for admin, tenta carregar o CNPJ do localStorage ou pega a primeira empresa do banco
        const savedCnpj = localStorage.getItem("portal_admin_active_cnpj")
        const activeClient = clients.find(c => c.cnpj === savedCnpj) || clients[0]
        setActiveCompanyCnpj(activeClient.cnpj || "")
        setActiveCompanyName(activeClient.nomeFantasia || activeClient.razaoSocial || "Empresa Demo")
      } else {
        // Fallback absoluto caso não existam clientes cadastrados
        setActiveCompanyCnpj("12.345.678/0001-90")
        setActiveCompanyName("Padaria Central Ltda")
      }
    }
  }, [selectedUser, clients])

  const handleCompanyChange = (cnpj: string) => {
    const client = (clients || []).find(c => c.cnpj === cnpj)
    if (client) {
      setActiveCompanyCnpj(cnpj)
      setActiveCompanyName(client.nomeFantasia || client.razaoSocial || "Empresa Selecionada")
      localStorage.setItem("portal_admin_active_cnpj", cnpj)
      
      // Despacha um evento personalizado para atualizar as páginas filhas em tempo real
      window.dispatchEvent(new CustomEvent("portalCompanyChanged", { detail: { cnpj, client } }))
    }
  }

  if (!mounted || !userLoaded || isUserLoading || isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">Carregando Portal...</p>
        </div>
      </div>
    )
  }

  if (pathname === "/portal/selecionar-empresa") {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        {children}
      </div>
    )
  }

  if (!user || (!selectedUser && pathname !== "/escolha-usuario")) return null

  const pathSegments = pathname.split('/').filter(Boolean)
  const isClientUser = !!selectedUser?.cnpj

  return (
    <SidebarProvider>
      <div className="print:hidden">
        <ClientSidebar />
      </div>
      
      <SidebarInset className="bg-slate-50">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 sticky top-0 z-40 print:hidden">
          <SidebarTrigger className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" />
          
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

            {/* Seletor de Empresa para Administradores / Contadores */}
            {!isClientUser && clients && clients.length > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                <Select value={activeCompanyCnpj} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="h-9 min-w-[200px] border-slate-200 text-xs font-bold text-slate-700">
                    <SelectValue placeholder="Selecione a empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.cnpj} className="text-xs font-semibold">
                        {c.nomeFantasia || c.razaoSocial} ({c.cnpj})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Indicador Fixo para Usuários do tipo Cliente */}
            {isClientUser && (
              <div className="flex items-center gap-2 ml-4 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-xs font-bold">
                <Building className="h-4 w-4 text-blue-600" />
                <span>{activeCompanyName}</span>
                <span className="text-[10px] text-blue-500/70">({activeCompanyCnpj})</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full border border-gray-200 overflow-hidden p-0 h-10 w-10">
                  <Avatar className="h-full w-full rounded-none">
                     <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-bold">
                      {selectedUser?.fullName?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-sm border-gray-100 rounded-xl">
                <DropdownMenuLabel className="text-gray-900">
                  <p className="font-semibold truncate">{selectedUser?.fullName || 'Usuário'}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Portal Cliente</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/escolha-usuario")} className="font-semibold text-blue-600 cursor-pointer">
                  Trocar de Usuário
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => initiateLogout(auth)} className="text-red-600 font-semibold cursor-pointer">
                  Encerrar Sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="p-6 md:p-8 flex-1 overflow-x-hidden bg-slate-50 print:p-0 print:m-0 print:bg-white">
          {/* Disponibiliza o CNPJ ativo e dados extras via context/dataset ou atributo data */}
          <div data-active-cnpj={activeCompanyCnpj} data-active-company={activeCompanyName} id="portal-context-container" className="h-full w-full">
            {children}
          </div>
        </main>

        <footer className="h-12 border-t border-gray-200 bg-transparent flex items-center justify-between px-8 text-[11px] text-gray-400 font-medium print:hidden">
          <span>Prosperare Flow © 2026 — Portal do Cliente</span>
          <div className="flex gap-4">
            <span className="text-[9px] font-bold uppercase text-gray-600">Empresa: {activeCompanyName}</span>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
