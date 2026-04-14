
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, ListTodo, MessageCircle, Building2, UserPlus, FileSearch, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const SHORTCUTS = [
  { title: "Processos", url: "/processos", icon: ClipboardCheck, color: "text-[#2574A9]" },
  { title: "Demandas Internas", url: "/atendimentos", icon: MessageCircle, color: "text-[#F2B705]" },
  { title: "IRPF", url: "/processos/irpf", icon: FileSearch, color: "text-[#1FA67A]" },
  { title: "Novo Cliente", url: "/clientes", icon: Plus, color: "text-[#1FA67A]", isAction: true },
]

export function QuickAccess() {
  const pathname = usePathname()

  return (
    <div className="hidden xl:flex items-center gap-1 border-l pl-4 ml-2 border-[#D2D7DB]">
      <TooltipProvider delayDuration={200}>
        {SHORTCUTS.map((item) => (
          <Tooltip key={item.url}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "h-9 px-3 gap-2 text-[#39586D] hover:bg-[#F7F7F7] hover:text-[#1FA67A] transition-all rounded-full",
                  pathname === item.url && "bg-[#1FA67A]/10 text-[#1FA67A] font-black",
                  item.isAction && "hover:bg-[#1FA67A] hover:text-white border border-transparent hover:border-[#1FA67A]/20"
                )}
              >
                <Link href={item.url}>
                  <item.icon className={cn("h-4 w-4", pathname !== item.url && item.color)} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.title}</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-black uppercase bg-[#2C4156] text-white border-none">
              Acesso rápido: {item.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  )
}
