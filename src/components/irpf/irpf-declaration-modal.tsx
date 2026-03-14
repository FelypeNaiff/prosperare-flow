
"use client"

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
import { toast } from "@/hooks/use-toast"

export function IrpfDeclarationModal({ open, onOpenChange }: any) {
  const handleSave = () => {
    onOpenChange(false)
    toast({ title: "Declaração Iniciada!", description: "Checklist padrão copiado com sucesso." })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-[#2C4156]">Nova Declaração IRPF</DialogTitle>
          <DialogDescription>Cadastre o contribuinte e inicie o fluxo de declaração.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="col-span-2 space-y-4">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em] border-b pb-1">Dados do Contribuinte</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Nome Completo</Label>
                <Input placeholder="Ex: João da Silva" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">CPF</Label>
                <Input placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Data de Nascimento</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Celular / WhatsApp</Label>
                <Input placeholder="(00) 00000-0000" />
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4 pt-4">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em] border-b pb-1">Dados da Declaração</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Ano de Exercício</Label>
                <Select defaultValue="2026">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026 (Ano-base 2025)</SelectItem>
                    <SelectItem value="2025">2025 (Ano-base 2024)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Tipo de Declaração</Label>
                <Select defaultValue="simplificada">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simplificada">Simplificada</SelectItem>
                    <SelectItem value="completa">Completa</SelectItem>
                    <SelectItem value="retificadora">Retificadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Prazo Limite</Label>
                <Input type="date" defaultValue="2026-04-30" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Honorários Estimados (R$)</Label>
                <Input type="number" placeholder="0,00" />
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-2">
            <Label className="text-xs font-bold text-[#39586D]">Observações Iniciais</Label>
            <Textarea placeholder="Detalhes específicos sobre o contribuinte..." />
          </div>
        </div>

        <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-[#1FA67A] font-bold px-8" onClick={handleSave}>Criar e Iniciar Fluxo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
