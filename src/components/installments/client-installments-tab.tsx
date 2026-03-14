
"use client"

import { useState } from "react"
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  History, 
  MoreVertical, 
  AlertTriangle,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { InstallmentFormModal } from "./installment-form-modal"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const MOCK_INSTALLMENTS = [
  { id: '1', tipo: 'Simples Nacional (e-CAC)', descricao: 'Dívida Ativa 2022', parcela: 12, total: 60, valor: 450.00, vencimento: 15, status: 'Ativo', inicio: '01/2024' },
  { id: '2', tipo: 'Prefeitura Macapá', descricao: 'ISS Retido 2023', parcela: 8, total: 24, valor: 280.00, vencimento: 10, status: 'Cancelado por não pagamento', inicio: '05/2023', canceladoEm: '15/12/2023' },
]

export function ClientInstallmentsTab({ clientId }: { clientId: string }) {
  const [installments, setInstallments] = useState(MOCK_INSTALLMENTS)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const stats = {
    ativos: installments.filter(i => i.status === 'Ativo').length,
    cancelados: installments.filter(i => i.status.includes('Cancelado')).length,
    quitados: installments.filter(i => i.status === 'Quitado').length,
  }

  const handleCancelConfirm = () => {
    setInstallments(prev => prev.map(inst => 
      inst.id === selectedId 
        ? { ...inst, status: 'Cancelado por não pagamento', canceladoEm: new Date().toLocaleDateString('pt-BR') } 
        : inst
    ))
    setIsCancelAlertOpen(false)
    toast({ 
      variant: "destructive",
      title: "Parcelamento Cancelado", 
      description: "Novos processos não serão gerados para este acordo." 
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#F7F7F7] p-4 rounded-xl border">
        <div className="flex gap-6">
          <StatItem label="Ativos" value={stats.ativos} color="text-[#1FA67A]" />
          <StatItem label="Cancelados" value={stats.cancelados} color="text-[#E74C3C]" />
          <StatItem label="Quitados" value={stats.quitados} color="text-[#2574A9]" />
        </div>
        <Button size="sm" className="bg-[#1FA67A] font-bold gap-2" onClick={() => setIsNewModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Parcelamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {installments.map((inst) => {
          const isCancelled = inst.status.includes('Cancelado')
          const progress = (inst.parcela / inst.total) * 100

          return (
            <TooltipProvider key={inst.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className={cn(
                    "border-[#D2D7DB] transition-all relative overflow-hidden group",
                    isCancelled ? "bg-slate-50/50 grayscale-[0.8] opacity-80" : "hover:shadow-md"
                  )}>
                    {isCancelled && <div className="absolute inset-0 pointer-events-none border-t border-slate-300 transform -rotate-12 translate-y-1/2 opacity-20" />}
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className={cn("h-4 w-4", isCancelled ? "text-slate-400" : "text-[#1FA67A]")} />
                            <span className={cn("text-sm font-black text-[#2C4156] uppercase tracking-tight", isCancelled && "line-through")}>
                              {inst.tipo}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase border-[#D2D7DB]">{inst.descricao}</Badge>
                        </div>
                        <Badge className={cn(
                          "text-[9px] font-black uppercase border-none",
                          inst.status === 'Ativo' ? "bg-[#7ED6B5] text-[#1FA67A]" : "bg-[#FEE2E2] text-[#E74C3C]"
                        )}>
                          {inst.status === 'Ativo' ? 'Ativo' : `Cancelado na ${inst.parcela}/${inst.total}`}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">Parcelas</p>
                          <p className="text-sm font-black text-[#2C4156]">{inst.parcela} / {inst.total}</p>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <p className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">Valor Mensal</p>
                          <p className="text-sm font-black text-[#1FA67A]">R$ {inst.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">Vencimento</p>
                          <p className="text-xs font-bold text-[#39586D]">Todo dia {inst.vencimento}</p>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <p className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">Início</p>
                          <p className="text-xs font-bold text-[#39586D]">{inst.inicio}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-[#98A7AA]">
                          <span>Progresso da Geração</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>

                      <div className="pt-2 flex gap-2 border-t border-[#F7F7F7]">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase gap-1 flex-1">
                          <FileText className="h-3.5 w-3.5" /> Ver Parcelas
                        </Button>
                        {!isCancelled && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] font-black uppercase gap-1 flex-1 text-[#E74C3C] hover:bg-[#FEE2E2]"
                            onClick={() => {
                              setSelectedId(inst.id)
                              setIsCancelAlertOpen(true)
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                {isCancelled && (
                  <TooltipContent className="bg-[#2C4156] border-none text-white text-[10px] font-bold uppercase p-2">
                    Cancelado em {inst.canceladoEm} por falta de pagamento.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>

      {installments.some(i => i.status.includes('Cancelado')) && (
        <div className="p-4 bg-[#FEF3C7]/30 border border-[#F2B705]/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#F2B705]" />
          <p className="text-xs font-bold text-[#39586D]">
            Existem parcelamentos cancelados para esta empresa. O histórico é mantido para fins de auditoria e renegociações futuras.
          </p>
        </div>
      )}

      <InstallmentFormModal open={isNewModalOpen} onOpenChange={setIsNewModalOpen} clientId={clientId} />

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#E74C3C]">
              <AlertTriangle className="h-6 w-6" />
              Confirmar Cancelamento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará o parcelamento como <strong>"Cancelado por não pagamento"</strong>. 
              O sistema parará de gerar novos processos mensais e o registro será mantido no histórico com visual riscado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedId(null)}>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-[#E74C3C] text-white hover:bg-[#E74C3C]/90" onClick={handleCancelConfirm}>
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatItem({ label, value, color }: any) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-black uppercase text-[#98A7AA] tracking-widest">{label}</span>
      <span className={cn("text-lg font-black", color)}>{value}</span>
    </div>
  )
}
