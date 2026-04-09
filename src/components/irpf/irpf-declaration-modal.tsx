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
import { useFirestore, useUser, setDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, query, orderBy } from "firebase/firestore"

export function IrpfDeclarationModal({ open, onOpenChange }: any) {
  const { selectedUser } = useUser()
  const firestore = useFirestore()
  
  const stagesQuery = useMemoFirebase(() => query(collection(firestore, "irpf_stages"), orderBy("order", "asc")), [firestore])
  const { data: dbStages } = useCollection(stagesQuery)

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
    if (!formData.name || !formData.cpf) {
      toast({ title: "Erro", description: "Preencha o nome e o CPF do contribuinte.", variant: "destructive" })
      return
    }

    if (!selectedUser) {
      toast({ title: "Erro", description: "Nenhuma identidade operacional identificada.", variant: "destructive" })
      return
    }

    const id = Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "irpf_declarations", id)
    
    const defaultStatus = (dbStages && dbStages.length > 0) ? dbStages[0].id : "not_started"

    const declarationData = {
      ...formData,
      id,
      responsibleId: selectedUser.id,
      status: defaultStatus,
      progress: 0,
      isPaid: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setDocumentNonBlocking(docRef, declarationData, { merge: true })
    
    onOpenChange(false)
    setFormData({
      name: "", cpf: "", birthDate: "", govPass: "", phone: "", email: "",
      year: "2026", type: "simplificada", value: 0, notes: ""
    })
    
    toast({ 
      title: "Fluxo Iniciado!", 
      description: `A declaração de ${formData.name} foi adicionada ao seu painel como "NÃO INICIADA".` 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
        <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">Nova Declaração IRPF</DialogTitle>
          <DialogDescription className="font-bold text-white/60 uppercase text-[10px] tracking-widest">
            Cadastre o contribuinte. O registro será vinculado exclusivamente ao seu perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="modal-scroll-content">
          <div className="grid grid-cols-2 gap-6 p-6">
            <div className="col-span-2 space-y-4">
              <h4 className="text-[10px] font-black text-[#1FA67A] uppercase tracking-[0.2em] border-b border-[#1FA67A]/20 pb-1">Dados do Contribuinte</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Nome Completo</Label>
                  <Input 
                    placeholder="Ex: JOÃO DA SILVA" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                    className="border-[#D2D7DB] font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">CPF</Label>
                  <Input 
                    placeholder="000.000.000-00" 
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    className="border-[#D2D7DB] font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Data de Nascimento</Label>
                  <Input 
                    type="date" 
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="border-[#D2D7DB]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Senha GOV.BR</Label>
                  <Input 
                    type="password" 
                    placeholder="Senha do acesso gov.br" 
                    value={formData.govPass}
                    onChange={(e) => setFormData({...formData, govPass: e.target.value})}
                    className="border-[#D2D7DB]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Celular / WhatsApp</Label>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="border-[#D2D7DB]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">E-mail</Label>
                  <Input 
                    type="email" 
                    placeholder="cliente@email.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="border-[#D2D7DB]"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-4 pt-4">
              <h4 className="text-[10px] font-black text-[#2574A9] uppercase tracking-[0.2em] border-b border-[#2574A9]/20 pb-1">Parâmetros da Declaração</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Ano de Exercício</Label>
                  <Select defaultValue="2026" onValueChange={(v) => setFormData({...formData, year: v})}>
                    <SelectTrigger className="border-[#D2D7DB] font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026" className="font-bold">2026 (Ano-base 2025)</SelectItem>
                      <SelectItem value="2025" className="font-bold">2025 (Ano-base 2024)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Tipo de Declaração</Label>
                  <Select defaultValue="simplificada" onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger className="border-[#D2D7DB] font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simplificada" className="font-bold">SIMPLIFICADA</SelectItem>
                      <SelectItem value="completa" className="font-bold">COMPLETA</SelectItem>
                      <SelectItem value="retificadora" className="font-bold">RETIFICADORA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Honorários Sugeridos (R$)</Label>
                  <Input 
                    type="number" 
                    placeholder="0,00" 
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                    className="border-[#D2D7DB] font-black text-[#1FA67A]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Prazo Limite Padrão</Label>
                  <Input type="date" defaultValue="2026-04-30" className="border-[#D2D7DB] bg-[#F7F7F7]" readOnly />
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Observações do Operador</Label>
              <Textarea 
                placeholder="Notas internas sobre pendências ou documentos..." 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="border-[#D2D7DB] min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold uppercase text-xs">Cancelar</Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-10 shadow-lg shadow-emerald-500/20" onClick={handleSave}>
            Confirmar e Iniciar Fluxo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
