
"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { CreditCard, Calendar } from "lucide-react"

export function InstallmentFormModal({ open, onOpenChange, clientId }: any) {
  const [hasEntry, setHasEntry] = useState(false)

  const handleSave = () => {
    onOpenChange(false)
    toast({ 
      title: "Parcelamento Cadastrado!", 
      description: "Todas as parcelas foram geradas como processos mensais." 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#1FA67A] mb-2">
            <CreditCard className="h-6 w-6" />
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Novo Parcelamento</DialogTitle>
          </div>
          <DialogDescription>Cadastre um acordo de dívida. O sistema gerará processos recorrentes automaticamente.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="col-span-2 space-y-4">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em] border-b pb-1">Identificação do Acordo</h4>
            {!clientId && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Empresa (Cliente)</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Padaria Central</SelectItem>
                    <SelectItem value="2">Oficina do João</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Tipo de Parcelamento</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione o órgão" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples Nacional (e-CAC)</SelectItem>
                    <SelectItem value="receita">Receita Federal (PERT/REFIS)</SelectItem>
                    <SelectItem value="municipal">Prefeitura Municipal</SelectItem>
                    <SelectItem value="estadual">SEFA-AP (Estado)</SelectItem>
                    <SelectItem value="fgts">FGTS (Caixa)</SelectItem>
                    <SelectItem value="inss">INSS (Previdenciário)</SelectItem>
                    <SelectItem value="outro">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Descrição / Referência</Label>
                <Input placeholder="Ex: PERT 2019-2021" />
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4 pt-4">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em] border-b pb-1">Valores e Prazos</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Quantidade de Parcelas</Label>
                <Input type="number" placeholder="60" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Valor da Parcela (R$)</Label>
                <Input type="number" placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Dia de Vencimento Mensal</Label>
                <Input type="number" min="1" max="28" placeholder="Ex: 20" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Mês/Ano de Início</Label>
                <Input type="month" />
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4 pt-4">
            <div className="flex items-center justify-between p-4 bg-[#F7F7F7] rounded-xl border">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-[#2C4156]">Houve pagamento de entrada?</Label>
                <p className="text-[10px] text-[#98A7AA]">Será gerado um processo extra para o pagamento inicial.</p>
              </div>
              <Switch checked={hasEntry} onCheckedChange={setHasEntry} />
            </div>

            {hasEntry && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Valor da Entrada (R$)</Label>
                  <Input type="number" placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Data da Entrada</Label>
                  <Input type="date" />
                </div>
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-2 pt-4">
            <Label className="text-xs font-bold text-[#39586D]">Responsável Interno</Label>
            <Select defaultValue="ricardo">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ricardo">Ricardo Santos</SelectItem>
                <SelectItem value="fernanda">Fernanda Oliveira</SelectItem>
                <SelectItem value="ana">Ana Souza</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label className="text-xs font-bold text-[#39586D]">Observações</Label>
            <Textarea placeholder="Detalhes específicos sobre o acordo..." />
          </div>
        </div>

        <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-[#1FA67A] font-bold px-8 shadow-lg" onClick={handleSave}>Salvar e Gerar Recorrência</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
