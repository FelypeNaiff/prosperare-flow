
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
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { IrpfDetailsDrawer } from "./irpf-details-drawer"
import { cn } from "@/lib/utils"

const COLUMNS = [
  { id: 'awaiting_docs', title: '📥 Aguardando Documentos', count: 12, total: 3500 },
  { id: 'docs_received', title: '📂 Documentos Recebidos', count: 8, total: 2400 },
  { id: 'analyzing', title: '🔄 Em Análise', count: 5, total: 1500 },
  { id: 'filling', title: '⚙️ Em Preenchimento', count: 15, total: 4500 },
  { id: 'approval', title: '✅ Aguardando Aprovação', count: 4, total: 1200 },
  { id: 'sent', title: '📤 Enviada RFB', count: 22, total: 6600 },
  { id: 'completed', title: '🏆 Concluída', count: 10, total: 3000 },
]

const MOCK_CARDS = [
  { id: 'ir1', name: 'João da Silva', cpf: '***.***.123-00', year: '2026', status: 'awaiting_docs', progress: 30, tags: ['Prioritário', 'Restituição'], due: '15/04', responsible: 'Ricardo', attachments: 2, comments: 1 },
  { id: 'ir2', name: 'Maria Santos', cpf: '***.***.456-11', year: '2026', status: 'filling', progress: 65, tags: ['Em dia'], due: '20/04', responsible: 'Fernanda', attachments: 5, comments: 3 },
  { id: 'ir3', name: 'Carlos Oliveira', cpf: '***.***.789-22', year: '2026', status: 'analyzing', progress: 10, tags: ['Novo cliente', 'A pagar'], due: '10/04', responsible: 'Ana', attachments: 0, comments: 0 },
  { id: 'ir4', name: 'Beatriz Lima', cpf: '***.***.321-33', year: '2026', status: 'sent', progress: 100, tags: ['Concluído'], due: '05/04', responsible: 'Ricardo', attachments: 8, comments: 2 },
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
            <div key={col.id} className="w-[300px] flex flex-col gap-4 bg-[#F7F7F7]/50 p-2 rounded-lg min-h-[600px] border border-dashed border-[#D2D7DB]">
              <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-[#2C4156] uppercase tracking-tighter flex items-center gap-2">
                    {col.title}
                  </h3>
                  <p className="text-[10px] font-bold text-[#98A7AA]">
                    {col.count} DECLARAÇÕES • R$ {col.total.toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#98A7AA] hover:text-[#1FA67A]">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {filteredCards.filter(c => c.status === col.id).map(card => (
                  <Card 
                    key={card.id} 
                    className="bg-white border-[#D2D7DB] hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleOpenDetails(card)}
                  >
                    <CardContent className="p-3 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-[#2C4156] text-white text-[10px] font-bold">
                              {card.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#2C4156] group-hover:text-[#1FA67A] transition-colors">{card.name}</span>
                            <span className="text-[9px] font-bold text-[#98A7AA] font-mono">{card.cpf}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {card.tags.map(tag => (
                          <Badge key={tag} className={cn(
                            "text-[8px] px-1 h-3.5 uppercase font-black border-none",
                            tag === 'Prioritário' ? 'bg-[#FEE2E2] text-[#E74C3C]' : 
                            tag === 'Restituição' ? 'bg-[#7ED6B5] text-[#1FA67A]' :
                            tag === 'A pagar' ? 'bg-[#FEE2E2] text-[#E74C3C]' :
                            'bg-[#F7F7F7] text-[#98A7AA]'
                          )}>
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase text-[#98A7AA]">
                          <span>Progresso Checklist</span>
                          <span>{card.progress}%</span>
                        </div>
                        <Progress value={card.progress} className="h-1 bg-[#F7F7F7]" />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#F7F7F7]">
                        <div className="flex items-center gap-2 text-[#98A7AA]">
                          <div className="flex items-center gap-0.5">
                            <Paperclip className="h-2.5 w-2.5" />
                            <span className="text-[9px] font-bold">{card.attachments}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <MessageSquare className="h-2.5 w-2.5" />
                            <span className="text-[9px] font-bold">{card.comments}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#FEF3C7] rounded text-[#F2B705]">
                            <Clock className="h-2.5 w-2.5" />
                            <span className="text-[9px] font-black">{card.due}</span>
                          </div>
                          <Avatar className="h-5 w-5 border border-white">
                            <AvatarFallback className="bg-[#39586D] text-white text-[8px]">{card.responsible.charAt(0)}</AvatarFallback>
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
