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

export function MultiClientSearchSelect({ 
  clients, 
  value = [], 
  onValueChange, 
  placeholder = "Selecionar empresas..." 
}: any) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredClients = React.useMemo(() => {
    return (clients || []).filter((c: any) => 
      c.corporateName?.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj?.replace(/\D/g, '').includes(search.replace(/\D/g, ''))
    )
  }, [clients, search])

  const toggleClient = (id: string) => {
    const newValue = value.includes(id)
      ? value.filter((v: string) => v !== id)
      : [...value, id]
    onValueChange(newValue)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 border-[#D2D7DB] hover:border-[#1FA67A] transition-colors font-bold uppercase text-[11px] px-4"
          >
            <span className="truncate">
              {value.length > 0 ? `${value.length} empresas selecionadas` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 border-[#D2D7DB] shadow-2xl z-[100]">
          <div className="flex flex-col">
            <div className="flex items-center border-b px-3 bg-[#F7F7F7]">
              <Search className="mr-2 h-4 w-4 shrink-0 text-[#98A7AA]" />
              <Input
                placeholder="Pesquisar por nome ou CNPJ..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-xs outline-none border-none focus-visible:ring-0 shadow-none font-bold uppercase"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="h-72">
              <div className="p-1">
                {filteredClients.map((client: any) => (
                  <button
                    key={client.id}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none hover:bg-[#F7F7F7] transition-all text-left mb-1",
                      value.includes(client.id) && "bg-[#1FA67A]/5 text-[#1FA67A]"
                    )}
                    onClick={() => toggleClient(client.id)}
                  >
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="truncate">{client.corporateName}</span>
                      <span className="text-[8px] font-mono opacity-60">{client.cnpj}</span>
                    </div>
                    {value.includes(client.id) && (
                      <Check className="ml-2 h-4 w-4 shrink-0 text-[#1FA67A]" />
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
                <X className="h-3 w-3 cursor-pointer hover:text-[#E74C3C]" onClick={() => toggleClient(id)} />
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
