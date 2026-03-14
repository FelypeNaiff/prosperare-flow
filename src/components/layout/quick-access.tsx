
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, ListTodo, MessageCircle, Building2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const SHORTCUTS = [
  { title: "Processos", url: "/processos", icon: ListTodo, color: "text-blue-500" },
  { title: "Tickets", url: "/atendimentos", icon: MessageCircle, color: "text-yellow-500" },
  { title: "Novo Cliente", url: "/clientes", icon: Building2, color: "text-emerald-500", action: true },
  { title: "Novo Membro", url: "/equipe", icon: UserPlus, color: "text-purple-500" },
]

export function QuickAccess() {
  const pathname = usePathname()

  return (
    <div className="hidden xl:flex items-center gap-1 border-l pl-4 ml-2 border-[#D2D7DB]">
      <TooltipProvider>
        {SHORTCUTS.map((item) => (
          <Tooltip key={item.url}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "h-8 px-2 gap-2 text-[#39586D] hover:bg-[#F7F7F7] hover:text-[#1FA67A]",
                  pathname === item.url && "bg-[#1FA67A]/10 text-[#1FA67A]"
                )}
              >
                <Link href={item.url}>
                  <item.icon className={cn("h-4 w-4", item.color)} />
                  <span className="text-[10px] font-black uppercase tracking-tight">{item.title}</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-bold">
              Ir para {item.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  )
}
