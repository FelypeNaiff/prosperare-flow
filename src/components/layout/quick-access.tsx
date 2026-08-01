
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, ListTodo, MessageCircle, Building2, UserPlus, FileSearch, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const SHORTCUTS = [
  { title: "Processos", url: "/processos", icon: ClipboardCheck, color: "text-blue-600" },
  { title: "Demandas Internas", url: "/atendimentos", icon: MessageCircle, color: "text-amber-500" },
  { title: "IRPF", url: "/processos/irpf", icon: FileSearch, color: "text-blue-500" },
  { title: "Novo Cliente", url: "/clientes", icon: Plus, color: "text-blue-600", isAction: true },
]

export function QuickAccess() {
  const pathname = usePathname()

  return (
    <div className="hidden xl:flex items-center gap-1 border-l pl-4 ml-2 border-slate-200">
      <TooltipProvider delayDuration={200}>
        {SHORTCUTS.map((item) => (
          <Tooltip key={item.url}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "h-9 px-3 gap-2 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all rounded-full",
                  pathname === item.url && "bg-blue-50 text-blue-600 font-bold",
                  item.isAction && "hover:bg-blue-600 hover:text-white border border-transparent hover:border-blue-600/20"
                )}
              >
                <Link href={item.url}>
                  <item.icon className={cn("h-4 w-4", pathname !== item.url && item.color)} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.title}</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-black uppercase bg-slate-900 text-white border-none">
              Acesso rápido: {item.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  )
}
