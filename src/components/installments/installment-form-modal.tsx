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
import { CreditCard, Loader2, Save } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"

import React from 'react'

export function InstallmentFormModal({ open, onOpenChange, clientId: initialClientId, initialData }: any) {
  const firestore = useFirestore()
  const [loading, setLoading] = useState(false)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || initialClientId || "",
    tipo: initialData?.tipo || "",
    descricao: initialData?.descricao || "",
    totalParcels: initialData?.totalParcels || "60",
    currentParcel: initialData?.currentParcel || "1",
    value: initialData?.value || "",
    dueDay: initialData?.dueDay || "20",
    startMonth: initialData?.startMonth || "",
    notes: initialData?.notes || "",
    status: initialData?.status || "Ativo"
  })

  // Permite recarregar dados se o initialData mudar depois de aberto
  React.useEffect(() => {
    if (initialData && open) {
      setFormData({
        clientId: initialData.clientId || "",
        tipo: initialData.tipo || "",
        descricao: initialData.descricao || "",
        totalParcels: String(initialData.totalParcels || "60"),
        currentParcel: String(initialData.currentParcel || "1"),
        value: String(initialData.value || ""),
        dueDay: String(initialData.dueDay || "20"),
        startMonth: initialData.startMonth || "",
        notes: initialData.notes || "",
        status: initialData.status || "Ativo"
      })
    } else if (!initialData && open) {
      setFormData({
        clientId: initialClientId || "",
        tipo: "",
        descricao: "",
        totalParcels: "60",
        currentParcel: "1",
        value: "",
        dueDay: "20",
        startMonth: "",
        notes: "",
        status: "Ativo"
      })
    }
  }, [initialData, open, initialClientId])

  const handleSave = () => {
    if (!formData.clientId || !formData.tipo || !formData.value) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    const id = initialData?.id || Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "installments", id)
    const client = (clients || []).find(c => c.id === formData.clientId)

    const data = {
      ...formData,
      id,
      clientName: client?.corporateName || "Cliente Avulso",
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      value: Number(formData.value),
      totalParcels: Number(formData.totalParcels),
      currentParcel: Number(formData.currentParcel),
      dueDay: Number(formData.dueDay)
    }

    setDocumentNonBlocking(docRef, data, { merge: true })
    
    onOpenChange(false)
    setFormData({
      clientId: initialClientId || "",
      tipo: "",
      descricao: "",
      totalParcels: "60",
      currentParcel: "1",
      value: "",
      dueDay: "20",
      startMonth: "",
      notes: "",
      status: "Ativo"
    })
    
    toast({ 
      title: "Parcelamento Cadastrado!", 
      description: "O acordo foi salvo permanentemente na nuvem." 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 bg-white border-b shrink-0">
          <div className="flex items-center gap-2 text-[#2563EB] mb-2">
            <CreditCard className="h-6 w-6" />
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Novo Parcelamento</DialogTitle>
          </div>
          <DialogDescription>Cadastre um acordo de dívida. O sistema gerará processos recorrentes automaticamente.</DialogDescription>
        </DialogHeader>

        <div className="modal-scroll-content">
          <div className="grid grid-cols-2 gap-6 p-6">
            <div className="col-span-2 space-y-4">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em] border-b pb-1">Identificação do Acordo</h4>
              {!initialClientId && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Empresa (Cliente)</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({...formData, clientId: v})}>
                    <SelectTrigger className="border-[#D2D7DB]"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {(clients || []).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.corporateName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Tipo de Parcelamento</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione o órgão" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Simples Nacional (e-CAC)">Simples Nacional (e-CAC)</SelectItem>
                      <SelectItem value="Receita Federal (PERT/REFIS)">Receita Federal (PERT/REFIS)</SelectItem>
                      <SelectItem value="Prefeitura Municipal">Prefeitura Municipal</SelectItem>
                      <SelectItem value="SEFA-AP (Estado)">SEFA-AP (Estado)</SelectItem>
                      <SelectItem value="FGTS (Caixa)">FGTS (Caixa)</SelectItem>
                      <SelectItem value="INSS (Previdenciário)">INSS (Previdenciário)</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Descrição / Referência</Label>
                  <Input 
                    placeholder="Ex: PERT 2019-2021" 
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-4 pt-4">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em] border-b pb-1">Valores e Prazos</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Quantidade de Parcelas</Label>
                  <Input 
                    type="number" 
                    placeholder="60" 
                    value={formData.totalParcels}
                    onChange={(e) => setFormData({...formData, totalParcels: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Parcela Atual</Label>
                  <Input 
                    type="number" 
                    placeholder="1" 
                    value={formData.currentParcel}
                    onChange={(e) => setFormData({...formData, currentParcel: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Valor da Parcela (R$)</Label>
                  <Input 
                    type="number" 
                    placeholder="0,00" 
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Dia de Vencimento Mensal</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="28" 
                    placeholder="Ex: 20" 
                    value={formData.dueDay}
                    onChange={(e) => setFormData({...formData, dueDay: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-2 pt-4">
              <Label className="text-xs font-bold text-[#39586D]">Observações</Label>
              <Textarea 
                placeholder="Detalhes específicos sobre o acordo..." 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-[#2563EB] font-bold px-8 shadow-lg" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Salvar Parcelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
