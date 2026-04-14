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

export function TemplateSearchSelect({ 
  templates, 
  value, 
  onValueChange, 
  placeholder = "Opcional...",
  className,
  disabled = false
}: any) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const modelosFiltrados = React.useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return templates || []
    
    const searchLower = searchTerm.toLowerCase().trim()

    return (templates || []).filter((t: any) => {
      return String(t.nome || "").toLowerCase().includes(searchLower)
    })
  }, [templates, searchTerm])

  const selectedTemplate = React.useMemo(() => {
    return (templates || []).find((t: any) => t.id === value)
  }, [templates, value])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-10 border-[#D2D7DB] hover:border-[#1FA67A] transition-colors text-xs font-normal px-3 bg-white",
            open && "border-[#1FA67A] ring-1 ring-[#1FA67A]/20",
            className
          )}
        >
          <span className="truncate uppercase">
            {selectedTemplate ? selectedTemplate.nome : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] max-w-[calc(100vw-40px)] p-0 border-[#D2D7DB] shadow-2xl z-[10000] pointer-events-auto"
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
              placeholder="PESQUISAR MODELO..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-[11px] outline-none border-none focus-visible:ring-0 shadow-none font-bold uppercase pointer-events-auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
          <ScrollArea className="h-64">
            <div className="p-1">
              <button
                type="button"
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none hover:bg-gray-100 transition-all text-left mb-1",
                  !value ? "bg-gray-100 text-[#2C4156]" : "text-[#98A7AA]"
                )}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onValueChange("")
                  setOpen(false)
                  setSearchTerm("")
                }}
              >
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="truncate">Nenhum (Livre)</span>
                </div>
                {!value && (
                  <Check className="ml-2 h-4 w-4 shrink-0" />
                )}
              </button>

              {modelosFiltrados.length === 0 ? (
                <div className="p-8 text-center text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">
                  Nenhum modelo localizado
                </div>
              ) : (
                modelosFiltrados.map((t: any) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none hover:bg-[#1FA67A] hover:text-white transition-all text-left mb-1 last:mb-0",
                      value === t.id ? "bg-[#1FA67A] text-white" : "text-[#2C4156]"
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onValueChange(t.id)
                      setOpen(false)
                      setSearchTerm("")
                    }}
                  >
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="truncate">{t.nome}</span>
                    </div>
                    {value === t.id && (
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
