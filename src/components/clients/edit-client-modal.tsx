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
import { Save, Loader2, RefreshCw, User, Plus, Trash2 } from "lucide-react"
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
    companyStatus: "",
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
    honorariumDueDateDay: 10,
    capitalSocial: 0,
    dataInicioAtividade: "",
    nire: "",
    naturezaJuridica: "",
    qsa: [] as any[]
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
        honorariumDueDateDay: client.honorariumDueDateDay || 10,
        companyStatus: client.companyStatus || "",
        capitalSocial: client.capitalSocial || 0,
        dataInicioAtividade: client.dataInicioAtividade || "",
        nire: client.nire || "",
        naturezaJuridica: client.naturezaJuridica || "",
        qsa: client.qsa || []
      })
    }
  }, [client, open])

  const fetchCnpjData = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/\D/g, "")
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
    if (!response.ok) {
      throw new Error("Erro ao consultar a BrasilAPI")
    }
    return response.json()
  }

  const handleAddPartner = () => {
    setFormData(prev => ({
      ...prev,
      qsa: [
        ...(prev.qsa || []),
        {
          nome: "",
          cpfCnpj: "",
          qualificacao: "",
          dataIngresso: "",
          participacao: 0,
          rg: "",
          rgOrgaoEmissor: "",
          rgUf: "",
          dataNascimento: "",
          estadoCivil: "Solteiro(a)",
          regimeBens: "",
          profissao: "",
          nacionalidade: "Brasileira",
          email: ""
        }
      ]
    }))
  }

  const handleRemovePartner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qsa: (prev.qsa || []).filter((_: any, idx: number) => idx !== index)
    }))
  }

  const handlePartnerChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newQsa = [...(prev.qsa || [])]
      newQsa[index] = {
        ...newQsa[index],
        [field]: value
      }
      return {
        ...prev,
        qsa: newQsa
      }
    })
  }

  const syncWithReceita = async () => {
    const cleanCnpj = formData.cnpj.replace(/\D/g, "")
    if (cleanCnpj.length !== 14) {
      toast({ variant: "destructive", title: "CNPJ Inválido", description: "Verifique o número informado." })
      return
    }

    setIsSyncing(true)
    try {
      // 1. Core data from ReceitaWS/BrasilAPI lookup action
      const coreData = await lookupCnpjAction(cleanCnpj)

      // 2. Additional sociological data from BrasilAPI
      let sociologicalData: any = {}
      try {
        const bapiData = await fetchCnpjData(cleanCnpj)
        sociologicalData = {
          capitalSocial: bapiData.capital_social || 0,
          dataInicioAtividade: bapiData.data_inicio_atividade || "",
          naturezaJuridica: bapiData.natureza_juridica || "",
          qsa: bapiData.qsa?.map((socio: any) => ({
            nome: socio.nome_socio?.toUpperCase() || "",
            cpfCnpj: socio.cnpj_cpf_do_socio || "",
            qualificacao: socio.qualificacao_socio || "",
            dataIngresso: socio.data_entrada_sociedade || "",
            participacao: 0,
            rg: "",
            rgOrgaoEmissor: "",
            rgUf: "",
            dataNascimento: "",
            estadoCivil: "Solteiro(a)",
            regimeBens: "",
            profissao: "",
            nacionalidade: "Brasileira",
            email: ""
          })) || []
        }
      } catch (err) {
        console.warn("BrasilAPI fetch failed or returned error, using fallback logic", err)
      }

      // Merge current QSA fields if they exist to avoid losing manually entered data
      const mergedQsa = sociologicalData.qsa ? sociologicalData.qsa.map((newPartner: any) => {
        const existing = (formData.qsa || []).find(
          (p: any) => p.cpfCnpj === newPartner.cpfCnpj || p.nome === newPartner.nome
        )
        if (existing) {
          return { ...newPartner, ...existing } // Keep manual fields
        }
        return newPartner
      }) : (formData.qsa || [])

      setFormData(prev => ({
        ...prev,
        ...coreData,
        taxRegime: coreData.taxRegime !== "Consultar no Portal" ? coreData.taxRegime : prev.taxRegime,
        companyStatus: coreData.companyStatus || prev.companyStatus,
        capitalSocial: sociologicalData.capitalSocial ?? prev.capitalSocial,
        dataInicioAtividade: sociologicalData.dataInicioAtividade ?? prev.dataInicioAtividade,
        naturezaJuridica: sociologicalData.naturezaJuridica ?? prev.naturezaJuridica,
        qsa: mergedQsa
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
            <div className="col-span-2 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px] space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">CNPJ</Label>
                <Input 
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                  className="border-[#D2D7DB] font-mono font-bold"
                />
              </div>
              <div className="min-w-[190px] space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Status Receita</Label>
                <div className="h-10 flex items-center px-3 rounded border border-[#D2D7DB] bg-[#F7F7F7] text-sm font-bold uppercase text-[#39586D]">
                  {formData.companyStatus || "Não consultado"}
                </div>
              </div>
              <Button 
                variant="outline" 
                className="h-10 border-[#2563EB] text-[#2563EB] font-bold gap-2"
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
              <h4 className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest mb-4">Endereço e Sede</h4>
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

            {/* Seção Dados Societários */}
            <div className="col-span-2 border-t pt-4">
              <h4 className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest mb-4">Informações Societárias</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Capital Social (R$)</Label>
                  <Input 
                    type="number"
                    value={formData.capitalSocial || 0}
                    onChange={(e) => setFormData({...formData, capitalSocial: Number(e.target.value)})}
                    className="border-[#D2D7DB] font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Início de Atividades</Label>
                  <Input 
                    type="date"
                    value={formData.dataInicioAtividade || ""}
                    onChange={(e) => setFormData({...formData, dataInicioAtividade: e.target.value})}
                    className="border-[#D2D7DB]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">NIRE</Label>
                  <Input 
                    value={formData.nire || ""}
                    onChange={(e) => setFormData({...formData, nire: e.target.value})}
                    className="border-[#D2D7DB] font-mono text-xs font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Natureza Jurídica</Label>
                  <Input 
                    value={formData.naturezaJuridica || ""}
                    onChange={(e) => setFormData({...formData, naturezaJuridica: e.target.value})}
                    className="border-[#D2D7DB]"
                  />
                </div>
              </div>
            </div>

            {/* Seção Quadro de Sócios (QSA) */}
            <div className="col-span-2 border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest">
                  Quadro de Sócios e Administradores (QSA)
                </h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-8 border-[#2563EB] text-[#2563EB] hover:bg-blue-50 text-xs font-bold gap-1"
                  onClick={handleAddPartner}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Sócio
                </Button>
              </div>

              <div className="space-y-4">
                {formData.qsa && formData.qsa.length > 0 ? (
                  formData.qsa.map((partner: any, index: number) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-4 relative">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <h5 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                          Sócio #{index + 1}: {partner.nome || "Novo Sócio"}
                        </h5>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs"
                          onClick={() => handleRemovePartner(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Nome do Sócio</Label>
                          <Input 
                            value={partner.nome || ""} 
                            onChange={(e) => handlePartnerChange(index, "nome", e.target.value.toUpperCase())} 
                            className="bg-white border-slate-200 text-xs font-bold" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">CPF / CNPJ</Label>
                          <Input 
                            value={partner.cpfCnpj || ""} 
                            onChange={(e) => handlePartnerChange(index, "cpfCnpj", e.target.value)} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Qualificação</Label>
                          <Input 
                            value={partner.qualificacao || ""} 
                            onChange={(e) => handlePartnerChange(index, "qualificacao", e.target.value)} 
                            className="bg-white border-slate-200 text-xs" 
                            placeholder="Ex: Sócio-Administrador"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Data de Ingresso</Label>
                          <Input 
                            type="date"
                            value={partner.dataIngresso || ""} 
                            onChange={(e) => handlePartnerChange(index, "dataIngresso", e.target.value)} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Valor Participação (R$)</Label>
                          <Input 
                            type="number"
                            value={partner.participacao || 0} 
                            onChange={(e) => handlePartnerChange(index, "participacao", Number(e.target.value))} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">E-mail</Label>
                          <Input 
                            type="email"
                            value={partner.email || ""} 
                            onChange={(e) => handlePartnerChange(index, "email", e.target.value)} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">RG</Label>
                          <Input 
                            value={partner.rg || ""} 
                            onChange={(e) => handlePartnerChange(index, "rg", e.target.value)} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Órgão Emissor</Label>
                          <Input 
                            value={partner.rgOrgaoEmissor || ""} 
                            onChange={(e) => handlePartnerChange(index, "rgOrgaoEmissor", e.target.value.toUpperCase())} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Estado do RG (UF)</Label>
                          <Input 
                            value={partner.rgUf || ""} 
                            onChange={(e) => handlePartnerChange(index, "rgUf", e.target.value.toUpperCase())} 
                            className="bg-white border-slate-200 text-xs" 
                            maxLength={2}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Data Nascimento</Label>
                          <Input 
                            type="date"
                            value={partner.dataNascimento || ""} 
                            onChange={(e) => handlePartnerChange(index, "dataNascimento", e.target.value)} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Estado Civil</Label>
                          <Select 
                            value={partner.estadoCivil || "Solteiro(a)"} 
                            onValueChange={(v) => handlePartnerChange(index, "estadoCivil", v)}
                          >
                            <SelectTrigger className="bg-white border-slate-200 text-xs h-9">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                              <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                              <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                              <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                              <SelectItem value="União Estável">União Estável</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Regime de Bens</Label>
                          <Input 
                            value={partner.regimeBens || ""} 
                            onChange={(e) => handlePartnerChange(index, "regimeBens", e.target.value)} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Profissão</Label>
                          <Input 
                            value={partner.profissao || ""} 
                            onChange={(e) => handlePartnerChange(index, "profissao", e.target.value)} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-[#98A7AA] font-black uppercase">Nacionalidade</Label>
                          <Input 
                            value={partner.nacionalidade || "Brasileira"} 
                            onChange={(e) => handlePartnerChange(index, "nacionalidade", e.target.value)} 
                            className="bg-white border-slate-200 text-xs" 
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-[10px] font-bold text-[#98A7AA] uppercase italic">
                    Nenhum sócio vinculado. Use a sincronização ou adicione um sócio manualmente.
                  </p>
                )}
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
          <Button className="bg-[#2563EB] font-black uppercase text-xs px-10 shadow-lg" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
