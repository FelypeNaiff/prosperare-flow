
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
import { toast } from "@/hooks/use-toast"
import { useFirestore, useUser, setDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"

export function IrpfDeclarationModal({ open, onOpenChange }: any) {
  const { selectedUser } = useUser()
  const firestore = useFirestore()
  
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    govPass: "",
    phone: "",
    email: "",
    year: "2026",
    type: "simplificada",
    value: 0,
    notes: ""
  })

  const handleSave = () => {
    if (!formData.name || !formData.cpf || !selectedUser) {
      toast({ title: "Erro", description: "Selecione um colaborador operacional e preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    const id = Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "irpf_declarations", id)
    
    // Vincula o IRPF ao ID do colaborador selecionado para individualização
    const declarationData = {
      ...formData,
      id,
      responsibleId: selectedUser.id,
      status: "not_started",
      progress: 0,
      isPaid: false,
      tags: [],
      createdAt: new Date().toISOString(),
    }

    setDocumentNonBlocking(docRef, declarationData, { merge: true })
    
    onOpenChange(false)
    setFormData({
      name: "", cpf: "", birthDate: "", govPass: "", phone: "", email: "",
      year: "2026", type: "simplificada", value: 0, notes: ""
    })
    toast({ title: "Declaração Iniciada!", description: "O registro foi vinculado ao seu perfil operacional." })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-[#2C4156]">Nova Declaração IRPF</DialogTitle>
          <DialogDescription>Cadastre o contribuinte e inicie o fluxo de declaração em seu perfil.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="col-span-2 space-y-4">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em] border-b pb-1">Dados do Contribuinte</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Nome Completo</Label>
                <Input 
                  placeholder="Ex: João da Silva" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">CPF</Label>
                <Input 
                  placeholder="000.000.000-00" 
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Data de Nascimento</Label>
                <Input 
                  type="date" 
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Senha GOV.BR</Label>
                <Input 
                  type="password" 
                  placeholder="Senha do acesso gov.br" 
                  value={formData.govPass}
                  onChange={(e) => setFormData({...formData, govPass: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Celular / WhatsApp</Label>
                <Input 
                  placeholder="(00) 00000-0000" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">E-mail</Label>
                <Input 
                  type="email" 
                  placeholder="cliente@email.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4 pt-4">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em] border-b pb-1">Dados da Declaração</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Ano de Exercício</Label>
                <Select defaultValue="2026" onValueChange={(v) => setFormData({...formData, year: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026 (Ano-base 2025)</SelectItem>
                    <SelectItem value="2025">2025 (Ano-base 2024)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Tipo de Declaração</Label>
                <Select defaultValue="simplificada" onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simplificada">Simplificada</SelectItem>
                    <SelectItem value="completa">Completa</SelectItem>
                    <SelectItem value="retificadora">Retificadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Prazo Limite</Label>
                <Input type="date" defaultValue="2026-04-30" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Honorários Estimados (R$)</Label>
                <Input 
                  type="number" 
                  placeholder="0,00" 
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-2">
            <Label className="text-xs font-bold text-[#39586D]">Observações Iniciais</Label>
            <Textarea 
              placeholder="Detalhes específicos sobre o contribuinte..." 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
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
