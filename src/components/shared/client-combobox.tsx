"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"

interface ClientComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

export function ClientCombobox({ 
  value, 
  onChange, 
  placeholder = "SELECIONE O CLIENTE...",
  className,
  disabled = false,
  error = false
}: ClientComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const firestore = useFirestore()
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

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

  const selectedClient = React.useMemo(() => {
    return (clients || []).find((c: any) => c.id === value)
  }, [clients, value])

  // Força o foco no input quando o popover abre, resolvendo bugs do Radix em modais
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-11 border-[#D2D7DB] hover:border-[#2563EB] transition-colors font-bold uppercase text-[11px] px-4 bg-white",
            open && "border-[#2563EB] ring-1 ring-[#2563EB]/20",
            error && "border-red-500 ring-1 ring-red-500/20",
            className
          )}
        >
          <span className="truncate">
            {selectedClient ? selectedClient.corporateName : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[500px] max-w-[calc(100vw-40px)] p-0 border-[#D2D7DB] shadow-2xl z-[10000] pointer-events-auto"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3 bg-[#F7F7F7]">
            <Search className="mr-2 h-4 w-4 shrink-0 text-[#98A7AA]" />
            <Input
              ref={inputRef}
              autoFocus
              placeholder="PESQUISAR POR NOME OU CNPJ..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-[11px] outline-none border-none focus-visible:ring-0 shadow-none font-bold uppercase pointer-events-auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
          <ScrollArea className="h-72">
            <div className="p-1">
              {clientesFiltrados.length === 0 ? (
                <div className="p-8 text-center text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">
                  Nenhum cliente localizado
                </div>
              ) : (
                clientesFiltrados.map((client: any) => (
                  <button
                    key={client.id}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none hover:bg-[#2563EB] hover:text-white transition-all text-left mb-1 last:mb-0",
                      value === client.id ? "bg-[#2563EB] text-white" : "text-[#2C4156]"
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onChange(client.id)
                      setOpen(false)
                      setSearchTerm("")
                    }}
                  >
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="truncate">{client.corporateName}</span>
                      {client.nomeFantasia && client.nomeFantasia !== client.corporateName && (
                        <span className={cn(
                          "text-[8px] font-bold italic opacity-60",
                          value === client.id ? "text-white" : "text-[#98A7AA]"
                        )}>{client.nomeFantasia}</span>
                      )}
                      <span className={cn(
                        "text-[8px] font-mono opacity-60",
                        value === client.id ? "text-white" : "text-[#98A7AA]"
                      )}>{client.cnpj}</span>
                    </div>
                    {value === client.id && (
                      <Check className="ml-2 h-4 w-4 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
