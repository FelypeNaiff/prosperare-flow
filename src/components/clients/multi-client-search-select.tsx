
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

/**
 * Componente de seleção múltipla resiliente a modais.
 */
export function MultiClientSearchSelect({ 
  clients, 
  value = [], 
  onValueChange, 
  placeholder = "SELECIONAR EMPRESAS..." 
}: any) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const clientesFiltrados = React.useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return clients || []

    const searchLower = searchTerm.toLowerCase().trim()
    const searchDigits = searchTerm.replace(/\D/g, '')
    
    return (clients || []).filter((c: any) => {
      const nomeMatch = String(c.corporateName || "").toLowerCase().includes(searchLower) || 
                        String(c.nomeFantasia || "").toLowerCase().includes(searchLower)
      const cnpjMatch = searchDigits !== '' && String(c.cnpj || "").replace(/\D/g, '').includes(searchDigits)
      
      return nomeMatch || cnpjMatch
    })
  }, [clients, searchTerm])

  const toggleClient = (id: string) => {
    const newValue = value.includes(id)
      ? value.filter((v: string) => v !== id)
      : [...value, id]
    onValueChange(newValue)
  }

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 border-[#D2D7DB] hover:border-[#2563EB] transition-colors font-bold uppercase text-[11px] px-4 bg-white"
          >
            <span className="truncate">
              {value.length > 0 ? `${value.length} EMPRESAS SELECIONADAS` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[500px] p-0 border-[#D2D7DB] shadow-2xl z-[9999]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col">
            <div className="flex items-center border-b px-3 bg-[#F7F7F7]">
              <Search className="mr-2 h-4 w-4 shrink-0 text-[#98A7AA]" />
              <Input
                ref={inputRef}
                placeholder="PESQUISAR POR NOME OU CNPJ..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-xs outline-none border-none focus-visible:ring-0 shadow-none font-bold uppercase"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <ScrollArea className="h-72">
              <div className="p-1">
                {clientesFiltrados.map((client: any) => (
                  <button
                    key={client.id}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none hover:bg-[#F7F7F7] transition-all text-left mb-1",
                      value.includes(client.id) && "bg-[#2563EB]/5 text-[#2563EB]"
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleClient(client.id)
                    }}
                  >
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="truncate">{client.corporateName}</span>
                      {client.nomeFantasia && client.nomeFantasia !== client.corporateName && (
                        <span className="text-[8px] font-bold italic opacity-60">{client.nomeFantasia}</span>
                      )}
                      <span className="text-[8px] font-mono opacity-60">{client.cnpj}</span>
                    </div>
                    {value.includes(client.id) && (
                      <Check className="ml-2 h-4 w-4 shrink-0 text-[#2563EB]" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-[#F7F7F7] rounded-xl border border-dashed border-[#D2D7DB]">
          {value.map((id: string) => {
            const client = clients.find((c: any) => c.id === id)
            return (
              <Badge key={id} variant="secondary" className="bg-white border-[#D2D7DB] text-[#2C4156] font-bold text-[9px] uppercase px-2 h-6 gap-1">
                {client?.corporateName?.split(' ')[0]}
                <X className="h-3 w-3 cursor-pointer hover:text-[#E74C3C]" 
                   onClick={(e) => {
                     e.preventDefault()
                     e.stopPropagation()
                     toggleClient(id)
                   }} 
                />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
