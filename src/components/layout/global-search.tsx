
"use client"

import * as React from "react"
import { Search, Command, ArrowRight, History, Zap, PlusCircle, AlertCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const PAGES = [
  { title: "Dashboard Geral", url: "/dashboard", category: "Estratégico", keywords: "inicio home principal" },
  { title: "Inteligência (BI)", url: "/inteligencia", category: "Estratégico", keywords: "graficos analise dados" },
  { title: "Agenda de Reuniões", url: "/agenda", category: "Estratégico", keywords: "compromissos calendario google" },
  { title: "Gestão de Clientes", url: "/clientes", category: "Relacionamento", keywords: "empresas base cadsatro" },
  { title: "Central de Atendimentos", url: "/atendimentos", category: "Relacionamento", keywords: "tickets suporte chamados whatsapp", alert: "3 novos" },
  { title: "Repositório de Documentos", url: "/documentos", category: "Relacionamento", keywords: "arquivos cloud cloud drive" },
  { title: "Todos os Processos", url: "/processos", category: "Produção", keywords: "tarefas obrigações entregas", status: "8 atrasados" },
  { title: "IRPF 2026", url: "/processos/irpf", category: "Produção", keywords: "imposto renda cpf", alert: "14 pendentes" },
  { title: "Contas a Receber", url: "/financeiro/receber", category: "Financeiro", keywords: "ganhos faturamento honorarios" },
  { title: "Contas a Pagar", url: "/financeiro/pagar", category: "Financeiro", keywords: "custos despesas boletos" },
  { title: "DRE Gerencial", url: "/financeiro/dre", category: "Financeiro", keywords: "lucro prejuizo resultado" },
  { title: "Meus Dados", url: "/configuracoes/meus-dados", category: "Configurações", keywords: "perfil escritorio endereço" },
]

const ACTIONS = [
  { title: "Novo Cliente", url: "/clientes", icon: PlusCircle, category: "Ação Rápida" },
  { title: "Nova Declaração IRPF", url: "/processos/irpf", icon: PlusCircle, category: "Ação Rápida" },
  { title: "Agendar Reunião", url: "/agenda", icon: Zap, category: "Ação Rápida" },
  { title: "Abrir Ticket", url: "/atendimentos", icon: Zap, category: "Ação Rápida" },
]

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [recent, setRecent] = React.useState<{title: string, url: string}[]>([])
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    
    const saved = localStorage.getItem("prosperare_recent_pages")
    if (saved) setRecent(JSON.parse(saved))

    return () => document.removeEventListener("keydown", down)
  }, [])

  const filteredPages = query === "" 
    ? [] 
    : PAGES.filter((page) => 
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        page.category.toLowerCase().includes(query.toLowerCase()) ||
        page.keywords.toLowerCase().includes(query.toLowerCase())
      )

  const filteredActions = query === ""
    ? []
    : ACTIONS.filter((action) => 
        action.title.toLowerCase().includes(query.toLowerCase())
      )

  const handleSelect = (page: {title: string, url: string}) => {
    const newRecent = [page, ...recent.filter(r => r.url !== page.url)].slice(0, 3)
    setRecent(newRecent)
    localStorage.setItem("prosperare_recent_pages", JSON.stringify(newRecent))
    
    router.push(page.url)
    setOpen(false)
    setQuery("")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#98A7AA] bg-[#F7F7F7] border border-[#D2D7DB] rounded-lg hover:border-[#1FA67A] transition-all w-64 text-left group"
      >
        <Search className="h-3.5 w-3.5 group-hover:text-[#1FA67A]" />
        <span>Busca rápida...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-[#D2D7DB] bg-white px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden border-[#D2D7DB] shadow-2xl">
          <DialogHeader className="p-4 border-b bg-[#F7F7F7]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
              <Input
                placeholder="Busque por páginas, ações ou pendências..."
                className="pl-10 h-10 bg-white border-[#D2D7DB] focus-visible:ring-[#1FA67A] font-medium"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </DialogHeader>
          <div className="max-h-[400px] overflow-hidden">
            <ScrollArea className="h-full">
              {query === "" ? (
                <div className="p-4 space-y-6">
                  {recent.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="px-2 text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                        <History className="h-3 w-3" /> Visitados Recentemente
                      </h4>
                      <div className="space-y-1">
                        {recent.map((page) => (
                          <button
                            key={page.url}
                            onClick={() => handleSelect(page)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F7F7F7] group transition-colors"
                          >
                            <span className="text-sm font-bold text-[#39586D]">{page.title}</span>
                            <ArrowRight className="h-3 w-3 text-[#D2D7DB] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <h4 className="px-2 text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                      <Zap className="h-3 w-3" /> Atalhos Úteis
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {ACTIONS.slice(0, 2).map((act) => (
                        <button
                          key={act.title}
                          onClick={() => handleSelect(act)}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[#D2D7DB] hover:border-[#1FA67A] hover:bg-[#1FA67A]/5 transition-all text-left"
                        >
                          <act.icon className="h-4 w-4 text-[#1FA67A]" />
                          <span className="text-xs font-black text-[#2C4156] uppercase">{act.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2 space-y-4">
                  <div className="space-y-1">
                    <h4 className="px-2 text-[9px] font-black uppercase text-[#98A7AA] tracking-[0.2em]">Páginas e Módulos</h4>
                    {filteredPages.length === 0 && filteredActions.length === 0 ? (
                      <div className="p-8 text-center text-sm text-[#98A7AA]">
                        Nenhum resultado para "{query}"
                      </div>
                    ) : (
                      filteredPages.map((page) => (
                        <button
                          key={page.url}
                          onClick={() => handleSelect(page)}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#1FA67A]/5 group transition-all"
                        >
                          <div className="flex flex-col text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#2C4156] group-hover:text-[#1FA67A]">{page.title}</span>
                              {page.status && (
                                <Badge className="bg-[#FEE2E2] text-[#E74C3C] border-none text-[8px] h-4 px-1.5 font-black uppercase">
                                  {page.status}
                                </Badge>
                              )}
                              {page.alert && (
                                <Badge className="bg-[#FEF3C7] text-[#F2B705] border-none text-[8px] h-4 px-1.5 font-black uppercase">
                                  {page.alert}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[9px] uppercase font-bold text-[#98A7AA] tracking-tighter">{page.category}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-[#D2D7DB] group-hover:text-[#1FA67A] translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
          <div className="p-3 border-t bg-[#F7F7F7] flex items-center justify-between text-[9px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">
            <span>Prosperare Navigator v3.0</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><kbd className="bg-white px-1 rounded border">ESC</kbd> fechar</span>
              <span className="flex items-center gap-1"><kbd className="bg-white px-1 rounded border">↵</kbd> selecionar</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
