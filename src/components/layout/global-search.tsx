"use client"

import * as React from "react"
import { ArrowRight, History, PlusCircle, Search, Zap, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type SearchPage = {
  title: string
  url: string
  category: string
  keywords: string
  status?: string
  alert?: string
}

type SearchAction = {
  title: string
  url: string
  icon: LucideIcon
  category: string
}

const PAGES: SearchPage[] = [
  { title: "Dashboard Geral", url: "/dashboard", category: "Estrategico", keywords: "inicio home principal painel indicadores kpi" },
  { title: "Inteligencia BI", url: "/inteligencia", category: "Estrategico", keywords: "graficos analise dados relatorios" },
  { title: "Agenda de Reunioes", url: "/agenda", category: "Estrategico", keywords: "compromissos calendario google reuniao" },
  { title: "Agenda de Demandas", url: "/agenda-demandas", category: "Producao", keywords: "tarefas vencimentos demandas prazos" },
  { title: "Gestao de Clientes", url: "/clientes", category: "Relacionamento", keywords: "empresas base cadastro cnpj cliente carteira" },
  { title: "Central de Atendimentos", url: "/atendimentos", category: "Relacionamento", keywords: "tickets suporte chamados whatsapp atendimento" },
  { title: "Certidoes CNDs", url: "/certidoes", category: "Conformidade", keywords: "regularidade fiscal cnd vencimento negativa positiva" },
  { title: "Alvaras", url: "/alvaras", category: "Conformidade", keywords: "licencas validade vencimento vigilancia bombeiro prefeitura" },
  { title: "Todos os Processos", url: "/processos", category: "Producao", keywords: "tarefas obrigacoes entregas processos fiscal contabil dp" },
  { title: "Demandas Internas", url: "/atendimentos?status=interno", category: "Producao", keywords: "internas equipe pendencias tarefas" },
  { title: "IRPF 2026", url: "/processos/irpf", category: "Producao", keywords: "imposto renda cpf declaracao irpf" },
  { title: "Contratos", url: "/financeiro/contratos", category: "Financeiro", keywords: "honorarios contrato mensalidade recorrencia" },
  { title: "Contas a Receber", url: "/financeiro/receber", category: "Financeiro", keywords: "ganhos faturamento honorarios receita receber cobranca" },
  { title: "Contas a Pagar", url: "/financeiro/pagar", category: "Financeiro", keywords: "custos despesas boletos pagar fornecedor" },
  { title: "Fluxo de Caixa", url: "/financeiro/fluxo", category: "Financeiro", keywords: "caixa entradas saidas saldo previsao" },
  { title: "DRE Gerencial", url: "/financeiro/dre", category: "Financeiro", keywords: "lucro prejuizo resultado demonstrativo" },
  { title: "Equipe", url: "/equipe", category: "Gestao", keywords: "colaboradores usuarios email pin permissao time" },
  { title: "Meus Dados", url: "/configuracoes/meus-dados", category: "Configuracoes", keywords: "perfil escritorio endereco dados empresa" },
]

const ACTIONS: SearchAction[] = [
  { title: "Novo Cliente", url: "/clientes", icon: PlusCircle, category: "Acao Rapida" },
  { title: "Nova Declaracao IRPF", url: "/processos/irpf", icon: PlusCircle, category: "Acao Rapida" },
  { title: "Agendar Reuniao", url: "/agenda", icon: Zap, category: "Acao Rapida" },
  { title: "Abrir Ticket", url: "/atendimentos", icon: Zap, category: "Acao Rapida" },
  { title: "Gerar Mes Financeiro", url: "/financeiro/receber", icon: Zap, category: "Acao Rapida" },
]

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [recent, setRecent] = React.useState<{ title: string; url: string }[]>([])
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((current) => !current)
      }
    }

    document.addEventListener("keydown", down)

    try {
      const saved = localStorage.getItem("prosperare_recent_pages")
      if (saved) setRecent(JSON.parse(saved))
    } catch {
      localStorage.removeItem("prosperare_recent_pages")
    }

    return () => document.removeEventListener("keydown", down)
  }, [])

  const normalizedQuery = normalizeSearch(query)

  const filteredPages =
    normalizedQuery === ""
      ? []
      : PAGES.filter((page) => {
          const searchable = normalizeSearch(`${page.title} ${page.category} ${page.keywords}`)
          return searchable.includes(normalizedQuery)
        })

  const filteredActions =
    normalizedQuery === ""
      ? []
      : ACTIONS.filter((action) => normalizeSearch(action.title).includes(normalizedQuery))

  const handleSelect = (page: { title: string; url: string }) => {
    const newRecent = [page, ...recent.filter((item) => item.url !== page.url)].slice(0, 3)
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
        className="group flex w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs font-semibold text-slate-500 transition-all hover:border-[#1FA67A] hover:bg-white hover:shadow-sm"
      >
        <Search className="h-3.5 w-3.5 group-hover:text-[#1FA67A]" />
        <span>Busca rapida...</span>
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500">
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden border-slate-100 p-0 shadow-2xl sm:max-w-[580px]">
          <DialogHeader className="border-b bg-slate-50 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Busque por paginas, acoes ou pendencias..."
                className="h-11 border-slate-200 bg-white pl-10 font-medium focus-visible:ring-[#1FA67A]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </DialogHeader>

          <div className="max-h-[420px] overflow-hidden">
            <ScrollArea className="h-full">
              {query === "" ? (
                <div className="space-y-6 p-4">
                  {recent.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <History className="h-3 w-3" /> Visitados recentemente
                      </h4>
                      <div className="space-y-1">
                        {recent.map((page) => (
                          <button
                            key={page.url}
                            onClick={() => handleSelect(page)}
                            className="group flex w-full items-center justify-between rounded-lg p-2 transition-colors hover:bg-slate-50"
                          >
                            <span className="text-sm font-bold text-slate-700">{page.title}</span>
                            <ArrowRight className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Zap className="h-3 w-3" /> Atalhos uteis
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {ACTIONS.slice(0, 4).map((action) => (
                        <button
                          key={action.title}
                          onClick={() => handleSelect(action)}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#1FA67A] hover:bg-[#1FA67A]/5"
                        >
                          <action.icon className="h-4 w-4 text-[#1FA67A]" />
                          <span className="text-xs font-black uppercase text-slate-700">{action.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-2">
                  <div className="space-y-1">
                    <h4 className="px-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Paginas e modulos
                    </h4>

                    {filteredPages.length === 0 && filteredActions.length === 0 ? (
                      <div className="p-8 text-center text-sm font-semibold text-slate-400">
                        Nenhum resultado para "{query}"
                      </div>
                    ) : (
                      <>
                        {filteredActions.map((action) => (
                          <button
                            key={action.title}
                            onClick={() => handleSelect(action)}
                            className="group flex w-full items-center justify-between rounded-lg p-3 transition-all hover:bg-[#1FA67A]/5"
                          >
                            <div className="flex items-center gap-3 text-left">
                              <action.icon className="h-4 w-4 text-[#1FA67A]" />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 group-hover:text-[#1FA67A]">{action.title}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{action.category}</span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 -translate-x-2 text-slate-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-[#1FA67A] group-hover:opacity-100" />
                          </button>
                        ))}

                        {filteredPages.map((page) => (
                          <button
                            key={page.url}
                            onClick={() => handleSelect(page)}
                            className="group flex w-full items-center justify-between rounded-lg p-3 transition-all hover:bg-[#1FA67A]/5"
                          >
                            <div className="flex flex-col text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-700 group-hover:text-[#1FA67A]">{page.title}</span>
                                {page.status && (
                                  <Badge className="h-4 border-none bg-red-50 px-1.5 text-[8px] font-black uppercase text-red-600">
                                    {page.status}
                                  </Badge>
                                )}
                                {page.alert && (
                                  <Badge className="h-4 border-none bg-amber-50 px-1.5 text-[8px] font-black uppercase text-amber-600">
                                    {page.alert}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{page.category}</span>
                            </div>
                            <ArrowRight className="h-4 w-4 -translate-x-2 text-slate-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-[#1FA67A] group-hover:opacity-100" />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex items-center justify-between border-t bg-slate-50 p-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>Prosperare Navigator v3.1</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><kbd className="rounded border bg-white px-1">ESC</kbd> fechar</span>
              <span className="flex items-center gap-1"><kbd className="rounded border bg-white px-1">Enter</kbd> selecionar</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
