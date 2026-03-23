"use client"

import { useState, useEffect } from "react"
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
import { useFirestore, updateDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Save, Loader2, RefreshCw, User } from "lucide-react"
import { formatCNPJ, validateCNPJ } from "@/lib/utils"
import { lookupCnpjAction } from "@/app/actions/cnpj-lookup"

export function EditClientModal({ open, onOpenChange, client }: any) {
  const firestore = useFirestore()
  const [isSyncing, setIsSyncing] = useState(false)
  const [formData, setFormData] = useState({
    corporateName: "",
    nomeFantasia: "",
    cnpj: "",
    taxRegime: "",
    email: "",
    phone: "",
    companyContactPerson: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    openingDate: "",
    primaryCnae: "",
    stateRegistration: "",
    cityRegistration: "",
    honorariumValue: 0,
    honorariumDueDateDay: 10
  })

  useEffect(() => {
    if (client) {
      setFormData({
        corporateName: client.corporateName || "",
        nomeFantasia: client.nomeFantasia || client.corporateName || "",
        cnpj: client.cnpj || "",
        taxRegime: client.taxRegime || "",
        email: client.email || "",
        phone: client.phone || "",
        companyContactPerson: client.companyContactPerson || "Responsável",
        address: client.address || "",
        neighborhood: client.neighborhood || "",
        city: client.city || "",
        state: client.state || "",
        zipCode: client.zipCode || "",
        openingDate: client.openingDate || "",
        primaryCnae: client.primaryCnae || "",
        stateRegistration: client.stateRegistration || "",
        cityRegistration: client.cityRegistration || "",
        honorariumValue: client.honorariumValue || 0,
        honorariumDueDateDay: client.honorariumDueDateDay || 10
      })
    }
  }, [client, open])

  const syncWithReceita = async () => {
    const cleanCnpj = formData.cnpj.replace(/\D/g, "")
    if (cleanCnpj.length !== 14) {
      toast({ variant: "destructive", title: "CNPJ Inválido", description: "Verifique o número informado." })
      return
    }

    setIsSyncing(true)
    try {
      const data = await lookupCnpjAction(cleanCnpj);

      setFormData(prev => ({
        ...prev,
        ...data,
        taxRegime: data.taxRegime !== "Consultar no Portal" ? data.taxRegime : prev.taxRegime
      }))

      toast({ title: "Dados Sincronizados!", description: "Informações corporativas e sócios atualizados." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Falha na Sincronização", description: error.message || "Não foi possível obter os dados automaticamente." })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSave = () => {
    if (!client?.id) return
    const docRef = doc(firestore, "clients", client.id)
    
    updateDocumentNonBlocking(docRef, {
      ...formData,
      updatedAt: new Date().toISOString()
    })

    onOpenChange(false)
    toast({ title: "Dados Atualizados!", description: "As informações da empresa foram salvas com sucesso." })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 border-none shadow-2xl flex flex-col">
        <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">Editar Ficha Cadastral</DialogTitle>
          <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
            Atualize as informações corporativas e de contato do cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="modal-scroll-content">
          <div className="p-6 grid grid-cols-2 gap-5 bg-white">
            <div className="col-span-2 flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">CNPJ</Label>
                <Input 
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                  className="border-[#D2D7DB] font-mono font-bold"
                />
              </div>
              <Button 
                variant="outline" 
                className="h-10 border-[#1FA67A] text-[#1FA67A] font-bold gap-2"
                onClick={syncWithReceita}
                disabled={isSyncing}
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Sincronizar API
              </Button>
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Razão Social</Label>
              <Input 
                value={formData.corporateName}
                onChange={(e) => setFormData({...formData, corporateName: e.target.value.toUpperCase()})}
                className="border-[#D2D7DB] font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Nome Fantasia</Label>
              <Input 
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({...formData, nomeFantasia: e.target.value.toUpperCase()})}
                className="border-[#D2D7DB]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Sócio Administrador / Contato</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                <Input 
                  placeholder="Nome do Sócio" 
                  className="pl-10 border-[#D2D7DB] font-bold uppercase"
                  value={formData.companyContactPerson}
                  onChange={(e) => setFormData({...formData, companyContactPerson: e.target.value.toUpperCase()})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Regime Tributário</Label>
              <Select value={formData.taxRegime} onValueChange={(v) => setFormData({...formData, taxRegime: v})}>
                <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Data de Abertura</Label>
              <Input 
                type="date"
                value={formData.openingDate}
                onChange={(e) => setFormData({...formData, openingDate: e.target.value})}
                className="border-[#D2D7DB]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">CNAE Principal</Label>
              <Input 
                value={formData.primaryCnae}
                onChange={(e) => setFormData({...formData, primaryCnae: e.target.value})}
                className="border-[#D2D7DB] font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">E-mail de Contato</Label>
              <Input 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="border-[#D2D7DB]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Telefone / WhatsApp</Label>
              <Input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="border-[#D2D7DB]"
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <h4 className="text-[10px] font-black text-[#1FA67A] uppercase tracking-widest mb-4">Endereço e Sede</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Logradouro / Rua</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Bairro</Label>
                  <Input value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">CEP</Label>
                  <Input value={formData.zipCode} onChange={(e) => setFormData({...formData, zipCode: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Cidade</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Estado (UF)</Label>
                  <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})} maxLength={2} />
                </div>
              </div>
            </div>

            <div className="col-span-2 border-t pt-4">
              <h4 className="text-[10px] font-black text-[#2574A9] uppercase tracking-widest mb-4">Parâmetros Financeiros</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Valor Honorário (R$)</Label>
                  <Input 
                    type="number" 
                    value={formData.honorariumValue} 
                    onChange={(e) => setFormData({...formData, honorariumValue: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Dia Vencimento</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={28} 
                    value={formData.honorariumDueDateDay} 
                    onChange={(e) => setFormData({...formData, honorariumDueDateDay: Number(e.target.value)})} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-[#1FA67A] font-black uppercase text-xs px-10 shadow-lg" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
