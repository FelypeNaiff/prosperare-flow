
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { 
  Paperclip, 
  MessageSquare, 
  Clock, 
  Plus, 
  MoreVertical,
  ChevronRight,
  Copy,
  DollarSign,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { IrpfDetailsDrawer } from "./irpf-details-drawer"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const COLUMNS = [
  { id: 'not_started', title: '⚪ NÃO INICIADO', count: 0, total: 0 },
  { id: 'filling', title: '⚙️ EM PREENCHIMENTO', count: 0, total: 0 },
  { id: 'awaiting_production', title: '⏳ AGUARDANDO PRODUÇÃO', count: 0, total: 0 },
  { id: 'sent', title: '📤 ENVIADO RFB', count: 0, total: 0 },
  { id: 'completed', title: '✅ CONCLUIDA', count: 0, total: 0 },
]

const MOCK_CARDS: any[] = []

const AVAILABLE_TAGS = [
  { name: 'AGUARDANDO RETORNO...', color: 'bg-[#F2B705] text-white' },
  { name: 'MALHA FISCAL', color: 'bg-[#E74C3C] text-white' },
  { name: 'NÃO PAGO', color: 'bg-[#A569BD] text-white' },
  { name: 'FINALIZADO!', color: 'bg-[#3498DB] text-white' },
  { name: 'PAGO', color: 'bg-[#2E86C1] text-white' },
  { name: '2 FATORES', color: 'bg-[#5DADE2] text-white' },
  { name: 'EM PROCESSAMENTO', color: 'bg-[#1FA67A] text-white' },
  { name: 'GOV', color: 'bg-[#566573] text-white' },
]

export function IrpfKanban({ searchTerm }: { searchTerm: string }) {
  const [selectedDeclaration, setSelectedDeclaration] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const filteredCards = MOCK_CARDS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cpf.includes(searchTerm)
  )

  const handleOpenDetails = (card: any) => {
    setSelectedDeclaration(card)
    setIsDrawerOpen(true)
  }

  return (
    <div className="relative">
      <ScrollArea className="w-full whitespace-nowrap rounded-md border-none">
        <div className="flex gap-4 p-1">
          {COLUMNS.map(col => (
            <div key={col.id} className="w-[300px] flex flex-col gap-4 bg-[#EBEDF0] p-2 rounded-lg min-h-[600px] border border-[#D2D7DB]">
              <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                  <h3 className="text-[11px] font-black text-[#172B4D] uppercase tracking-wider flex items-center gap-2">
                    {col.title}
                  </h3>
                  <p className="text-[10px] font-bold text-[#5E6C84]">
                    {col.count} CARDS • R$ {col.total.toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#5E6C84] hover:bg-[#D2D7DB]">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {filteredCards.filter(c => c.status === col.id).map(card => (
                  <Card 
                    key={card.id} 
                    className="bg-white border-[#D2D7DB] shadow-sm cursor-pointer hover:bg-[#F4F5F7] transition-all group"
                    onClick={() => handleOpenDetails(card)}
                  >
                    <CardContent className="p-3 space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {card.tags.map((tagName: string) => {
                          const tag = AVAILABLE_TAGS.find(t => t.name === tagName)
                          return (
                            <div key={tagName} className={cn("h-2 w-8 rounded-full", tag?.color || "bg-slate-400")} />
                          )
                        })}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#172B4D] leading-tight">{card.name}</p>
                        <p className="text-[10px] font-mono text-[#5E6C84]">{card.cpf}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-[#5E6C84]">
                          <span className="flex items-center gap-1 text-[10px] font-bold">
                            <Clock className="h-3 w-3" /> {card.due}
                          </span>
                        </div>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-[#172B4D] text-white text-[8px] font-black">
                            {card.responsible.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredCards.filter(c => c.status === col.id).length === 0 && (
                  <div className="text-center py-12 text-[10px] font-black text-[#98A7AA] uppercase tracking-widest border-2 border-dashed rounded-lg">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <IrpfDetailsDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
        declaration={selectedDeclaration} 
      />
    </div>
  )
}
