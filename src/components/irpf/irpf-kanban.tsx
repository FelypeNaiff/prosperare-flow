
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
  { id: 'not_started', title: '⚪ NÃO INICIADO', count: 5, total: 1250 },
  { id: 'filling', title: '⚙️ EM PREENCHIMENTO', count: 12, total: 3600 },
  { id: 'awaiting_production', title: '⏳ AGUARDANDO PRODUÇÃO', count: 8, total: 2400 },
  { id: 'sent', title: '📤 ENVIADO RFB', count: 15, total: 4500 },
  { id: 'completed', title: '✅ CONCLUIDA', count: 22, total: 6600 },
]

const MOCK_CARDS = [
  { id: 'ir1', name: 'RUI VALDO', cpf: '123.456.789-00', govPass: 'SenhaGov123!', year: '2026', status: 'filling', progress: 30, tags: ['EM PROCESSAMENTO', 'GOV'], due: '15/04', responsible: 'Ricardo', attachments: 2, comments: 1, value: 250, isPaid: false },
  { id: 'ir2', name: 'MARIA SANTOS', cpf: '456.789.123-11', govPass: 'MariaGov@2026', year: '2026', status: 'awaiting_production', progress: 65, tags: ['PAGO', 'FINALIZADO!'], due: '20/04', responsible: 'Fernanda', attachments: 5, comments: 3, value: 350, isPaid: true },
  { id: 'ir3', name: 'CARLOS OLIVEIRA', cpf: '789.123.456-22', govPass: 'Carlos#Pass', year: '2026', status: 'not_started', progress: 0, tags: ['AGUARDANDO RETORNO...'], due: '10/04', responsible: 'Ana', attachments: 0, comments: 0, value: 200, isPaid: false },
  { id: 'ir4', name: 'BEATRIZ LIMA', cpf: '321.654.987-33', govPass: 'Beatriz@Gov', year: '2026', status: 'sent', progress: 100, tags: ['PAGO'], due: '05/04', responsible: 'Ricardo', attachments: 8, comments: 2, value: 400, isPaid: true },
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`
    })
  }

  const getTagColor = (tagName: string) => {
    switch (tagName) {
      case 'AGUARDANDO RETORNO...': return 'bg-[#F2B705] text-white';
      case 'MALHA FISCAL': return 'bg-[#E74C3C] text-white';
      case 'NÃO PAGO': return 'bg-[#A569BD] text-white';
      case 'FINALIZADO!': return 'bg-[#3498DB] text-white';
      case 'PAGO': return 'bg-[#2E86C1] text-white';
      case '2 FATORES': return 'bg-[#5DADE2] text-white';
      case 'EM PROCESSAMENTO': return 'bg-[#1FA67A] text-white';
      case 'GOV': return 'bg-[#566573] text-white';
      default: return 'bg-slate-400 text-white';
    }
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
                    className="bg-white border-none shadow-sm hover:bg-[#F4F5F7] transition-all cursor-pointer group"
                    onClick={() => handleOpenDetails(card)}
                  >
                    <CardContent className="p-3 space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {card.tags.map(tag => (
                          <div key={tag} className={cn(
                            "h-2 w-10 rounded-full",
                            getTagColor(tag).split(' ')[0]
                          )} />
                        ))}
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#172B4D]">{card.name}</span>
                          <span className="text-[10px] text-[#5E6C84] font-mono">{card.cpf}</span>
                        </div>
                        {card.isPaid ? (
                          <CheckCircle2 className="h-4 w-4 text-[#1FA67A]" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-[#E74C3C]" />
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-[#5E6C84]">
                          {card.attachments > 0 && (
                            <div className="flex items-center gap-0.5">
                              <Paperclip className="h-3 w-3" />
                              <span className="text-[10px] font-bold">{card.attachments}</span>
                            </div>
                          )}
                          {card.comments > 0 && (
                            <div className="flex items-center gap-0.5">
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-[10px] font-bold">{card.comments}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                            card.status === 'sent' ? "bg-[#1FA67A] text-white" : "bg-[#F4F5F7] text-[#5E6C84]"
                          )}>
                            <Clock className="h-3 w-3" />
                            <span>{card.due}</span>
                          </div>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-[#2C4156] text-white text-[10px] font-bold">
                              {card.responsible.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
