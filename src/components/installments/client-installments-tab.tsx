
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
  FileText,
  ShieldAlert
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

export function ClientInstallmentsTab({ clientId }: { clientId: string }) {
  const firestore = useFirestore()
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Query real baseada no clientId
  const installmentsQuery = useMemoFirebase(() => 
    query(collection(firestore, "installments"), where("clientId", "==", clientId)),
    [firestore, clientId]
  )
  const { data: installments = [], isLoading } = useCollection(installmentsQuery)

  const stats = {
    ativos: (installments || []).filter(i => i.status === 'Ativo').length,
    cancelados: (installments || []).filter(i => i.status?.includes('Cancelado')).length,
    quitados: (installments || []).filter(i => i.status === 'Quitado').length,
  }

  const hasSimplesCanceled = (installments || []).some(i => 
    i.tipo?.includes('Simples Nacional') && i.status?.includes('Cancelado')
  )

  const handleCancelConfirm = () => {
    // Lógica de cancelamento real aqui (updateDoc)
    setIsCancelAlertOpen(false)
    toast({ 
      variant: "destructive",
      title: "Parcelamento Cancelado", 
      description: "Novos processos não serão gerados para este acordo." 
    })
  }

  return (
    <div className="space-y-6">
      {hasSimplesCanceled && (
        <Alert className="bg-[#FEE2E2] border-[#E74C3C]/20 text-[#E74C3C] shadow-sm animate-in slide-in-from-top duration-500">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-black uppercase text-xs tracking-widest">Risco Crítico de Exclusão</AlertTitle>
          <AlertDescription className="text-xs font-medium mt-1">
            Esta empresa possui um parcelamento de <strong>Simples Nacional</strong> cancelado. A inadimplência nestes acordos é o principal motivo de desenquadramento automático pela Receita Federal.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center bg-[#F7F7F7] p-4 rounded-xl border">
        <div className="flex gap-6">
          <StatItem label="Ativos" value={stats.ativos} color="text-[#2563EB]" />
          <StatItem label="Cancelados" value={stats.cancelados} color="text-[#E74C3C]" />
          <StatItem label="Quitados" value={stats.quitados} color="text-[#2574A9]" />
        </div>
        <Button size="sm" className="bg-[#2563EB] font-bold gap-2" onClick={() => setIsNewModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Parcelamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {installments && installments.length > 0 ? (
          installments.map((inst) => {
            const isCancelled = inst.status?.includes('Cancelado')
            const progress = (inst.parcela / inst.total) * 100

            return (
              <TooltipProvider key={inst.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className={cn(
                      "border-[#D2D7DB] transition-all relative overflow-hidden group",
                      isCancelled ? "bg-slate-50/50 grayscale-[0.8] opacity-80" : "hover:shadow-md"
                    )}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className={cn("h-4 w-4", isCancelled ? "text-slate-400" : "text-[#2563EB]")} />
                              <span className={cn("text-sm font-black text-[#2C4156] uppercase tracking-tight", isCancelled && "line-through")}>
                                {inst.tipo}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase border-[#D2D7DB]">{inst.descricao}</Badge>
                          </div>
                          <Badge className={cn(
                            "text-[9px] font-black uppercase border-none",
                            inst.status === 'Ativo' ? "bg-[#7ED6B5] text-[#2563EB]" : "bg-[#FEE2E2] text-[#E74C3C]"
                          )}>
                            {inst.status === 'Ativo' ? 'Ativo' : `Cancelado`}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">Parcelas</p>
                            <p className="text-sm font-black text-[#2C4156]">{inst.parcela} / {inst.total}</p>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <p className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">Valor Mensal</p>
                            <p className="text-sm font-black text-[#2563EB]">R$ {(inst.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        <Progress value={progress} className="h-1.5" />

                        <div className="pt-2 flex gap-2 border-t border-[#F7F7F7]">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase gap-1 flex-1">
                            <FileText className="h-3.5 w-3.5" /> Ver Parcelas
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
            )
          })
        ) : !isLoading ? (
          <div className="col-span-2 py-12 text-center text-[#98A7AA] font-bold italic border-2 border-dashed rounded-xl">
            Nenhum parcelamento cadastrado para este cliente.
          </div>
        ) : null}
      </div>

      <InstallmentFormModal open={isNewModalOpen} onOpenChange={setIsNewModalOpen} clientId={clientId} />

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#E74C3C]">
              <AlertTriangle className="h-6 w-6" />
              Confirmar Cancelamento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará o parcelamento como "Cancelado por não pagamento".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedId(null)}>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-[#E74C3C] text-white" onClick={handleCancelConfirm}>
              Confirmar
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
