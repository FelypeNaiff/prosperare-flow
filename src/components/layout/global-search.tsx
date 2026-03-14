
"use client"

import * as React from "react"
import { Search, Command, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const PAGES = [
  { title: "Dashboard", url: "/dashboard", category: "Estratégico" },
  { title: "Inteligência (BI)", url: "/inteligencia", category: "Estratégico" },
  { title: "Agenda de Reuniões", url: "/agenda", category: "Estratégico" },
  { title: "Gestão de Clientes", url: "/clientes", category: "Relacionamento" },
  { title: "Atendimentos", url: "/atendimentos", category: "Relacionamento" },
  { title: "Documentos", url: "/documentos", category: "Relacionamento" },
  { title: "Todos os Processos", url: "/processos", category: "Produção" },
  { title: "Grupos de Obrigações", url: "/processos/grupos", category: "Produção" },
  { title: "Membros da Equipe", url: "/equipe", category: "Equipe" },
  { title: "Contas a Receber", url: "/financeiro/receber", category: "Financeiro" },
  { title: "Contas a Pagar", url: "/financeiro/pagar", category: "Financeiro" },
  { title: "Meus Dados", url: "/configuracoes/meus-dados", category: "Configurações" },
]

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const filteredPages = query === "" 
    ? [] 
    : PAGES.filter((page) => 
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        page.category.toLowerCase().includes(query.toLowerCase())
      )

  const handleSelect = (url: string) => {
    router.push(url)
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
        <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden border-[#D2D7DB]">
          <DialogHeader className="p-4 border-b bg-[#F7F7F7]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
              <Input
                placeholder="Para onde vamos? Digite o nome da página ou módulo..."
                className="pl-10 h-10 bg-white border-[#D2D7DB] focus-visible:ring-[#1FA67A]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </DialogHeader>
          <div className="max-h-[300px] overflow-hidden">
            <ScrollArea className="h-full">
              {query === "" ? (
                <div className="p-8 text-center text-sm text-[#98A7AA]">
                  <Command className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p>Digite algo para começar a buscar...</p>
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#98A7AA]">
                  Nenhum resultado encontrado.
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredPages.map((page) => (
                    <button
                      key={page.url}
                      onClick={() => handleSelect(page.url)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#1FA67A]/5 group transition-colors"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-[#2C4156] group-hover:text-[#1FA67A]">{page.title}</span>
                        <span className="text-[10px] uppercase font-bold text-[#98A7AA]">{page.category}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#D2D7DB] group-hover:text-[#1FA67A] translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <div className="p-3 border-t bg-[#F7F7F7] flex items-center justify-between text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">
            <span>Prosperare Navigator</span>
            <div className="flex gap-3">
              <span>↑↓ para navegar</span>
              <span>↵ para selecionar</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
