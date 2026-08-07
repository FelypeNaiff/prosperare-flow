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
import { 
  Save, 
  Loader2, 
  RefreshCw, 
  User, 
  Plus, 
  Trash2, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Lock, 
  ShieldCheck, 
  Briefcase,
  Search,
  Check
} from "lucide-react"
import { formatCNPJ, cn } from "@/lib/utils"
import { lookupCnpjAction } from "@/app/actions/cnpj-lookup"

interface Socio {
  nome: string;
  cpfCnpj: string;
  qualificacao: string;
  dataIngresso: string;
  participacao: number;
  rg: string;
  rgOrgaoEmissor: string;
  rgUf: string;
  dataNascimento: string;
  estadoCivil: string;
  regimeBens: string;
  profissao: string;
  nacionalidade: string;
  email: string;
}

export function EditClientModal({ open, onOpenChange, client }: any) {
  const firestore = useFirestore()
  const [activeTab, setActiveTab] = useState<"basico" | "contato" | "societario" | "atividades">("basico")
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  
  // CNAE Combobox State
  const [cnaeSearchQuery, setCnaeSearchQuery] = useState("")
  const [cnaeOptions, setCnaeOptions] = useState<any[]>([])
  const [cachedCnaes, setCachedCnaes] = useState<any[]>([])
  const [isLoadingCnaes, setIsLoadingCnaes] = useState(false)
  const [selectedCnae, setSelectedCnae] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    corporateName: "",
    nomeFantasia: "",
    cnpj: "",
    taxRegime: "",
    email: "",
    emailFinanceiro: "",
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
    secondaryCnaes: [] as string[],
    stateRegistration: "",
    cityRegistration: "",
    honorariumValue: 0,
    honorariumDueDateDay: 10,
    capitalSocial: 0,
    dataInicioAtividade: "",
    nire: "",
    naturezaJuridica: "",
    porte: "",
    numero: "",
    complemento: "",
    qsa: [] as Socio[]
  })

  useEffect(() => {
    if (client) {
      setFormData({
        corporateName: client.corporateName || "",
        nomeFantasia: client.nomeFantasia || client.corporateName || "",
        cnpj: client.cnpj || "",
        taxRegime: client.taxRegime || "",
        email: client.email || "",
        emailFinanceiro: client.emailFinanceiro || "",
        phone: client.phone || "",
        companyContactPerson: client.companyContactPerson || "Responsável",
        address: client.address || "",
        neighborhood: client.neighborhood || "",
        city: client.city || "",
        state: client.state || "",
        zipCode: client.zipCode || "",
        openingDate: client.openingDate || "",
        primaryCnae: client.primaryCnae || "",
        secondaryCnaes: client.secondaryCnaes || [],
        stateRegistration: client.stateRegistration || "",
        cityRegistration: client.cityRegistration || "",
        honorariumValue: client.honorariumValue || 0,
        honorariumDueDateDay: client.honorariumDueDateDay || 10,
        companyStatus: client.companyStatus || "",
        capitalSocial: client.capitalSocial || 0,
        dataInicioAtividade: client.dataInicioAtividade || "",
        nire: client.nire || "",
        naturezaJuridica: client.naturezaJuridica || "",
        porte: client.porte || "",
        numero: client.numero || "",
        complemento: client.complemento || "",
        qsa: client.qsa || []
      })
      setActiveTab("basico")
    }
  }, [client, open])

  // ViaCEP integration
  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")
    setFormData(prev => ({ ...prev, zipCode: cep }))

    if (cleanCep.length === 8) {
      setIsLoadingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        if (response.ok) {
          const data = await response.json()
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              address: data.logradouro || prev.address,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.localidade || prev.city,
              state: data.uf || prev.state
            }))
            toast({ 
              title: "CEP Localizado!", 
              description: `${data.logradouro}, ${data.bairro}` 
            })
          } else {
            toast({ 
              variant: "destructive", 
              title: "CEP não encontrado", 
              description: "Verifique o número informado." 
            })
          }
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err)
        toast({ 
          variant: "destructive", 
          title: "Erro de conexão", 
          description: "Não foi possível consultar o ViaCEP." 
        })
      } finally {
        setIsLoadingCep(false)
      }
    }
  }

  // CNAE Search - Debounce with cached data
  useEffect(() => {
    if (cnaeSearchQuery.length < 3) {
      setCnaeOptions([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoadingCnaes(true)
      try {
        let list = cachedCnaes
        if (list.length === 0) {
          const res = await fetch("https://servicodados.ibge.gov.br/api/v2/cnae/subclasses")
          if (res.ok) {
            list = await res.json()
            setCachedCnaes(list)
          }
        }
        
        const query = cnaeSearchQuery.toLowerCase()
        const filtered = list.filter((item: any) => 
          item.id.includes(query) || 
          item.descricao.toLowerCase().includes(query)
        ).slice(0, 100)
        
        setCnaeOptions(filtered)
      } catch (err) {
        console.error("Erro ao buscar CNAEs:", err)
      } finally {
        setIsLoadingCnaes(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [cnaeSearchQuery, cachedCnaes])

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
        
        let porteSugerido = "DEMAIS"
        if (bapiData.porte === 1 || bapiData.porte_descricao?.includes("MICRO EM")) {
          porteSugerido = "ME"
        } else if (bapiData.porte === 3 || bapiData.porte_descricao?.includes("PEQUENO PORTE")) {
          porteSugerido = "EPP"
        }

        sociologicalData = {
          capitalSocial: bapiData.capital_social || 0,
          dataInicioAtividade: bapiData.data_inicio_atividade || "",
          naturezaJuridica: bapiData.natureza_juridica || "",
          porte: porteSugerido,
          address: bapiData.logradouro || "",
          numero: bapiData.numero || "",
          complemento: bapiData.complemento || "",
          neighborhood: bapiData.bairro || "",
          city: bapiData.municipio || "",
          state: bapiData.uf || "",
          zipCode: bapiData.cep || "",
          secondaryCnaes: bapiData.cnaes_secundarios?.map((c: any) => `${c.codigo} - ${c.descricao.toUpperCase()}`) || [],
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
          return { ...newPartner, ...existing }
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
        porte: sociologicalData.porte ?? prev.porte,
        address: sociologicalData.address ?? coreData.address ?? prev.address,
        numero: sociologicalData.numero ?? prev.numero,
        complemento: sociologicalData.complemento ?? prev.complemento,
        neighborhood: sociologicalData.neighborhood ?? coreData.neighborhood ?? prev.neighborhood,
        city: sociologicalData.city ?? coreData.city ?? prev.city,
        state: sociologicalData.state ?? coreData.state ?? prev.state,
        zipCode: sociologicalData.zipCode ?? coreData.zipCode ?? prev.zipCode,
        secondaryCnaes: sociologicalData.secondaryCnaes ?? prev.secondaryCnaes,
        qsa: mergedQsa
      }))

      toast({ title: "Dados Sincronizados!", description: "Informações corporativas, endereço, CNAEs e sócios atualizados." })
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
      <DialogContent className="max-w-4xl p-0 border-none shadow-2xl flex flex-col max-h-[92vh] rounded-2xl overflow-hidden bg-white">
        <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" />
            Editar Ficha Cadastral: {formData.corporateName || "Cliente"}
          </DialogTitle>
          <DialogDescription className="text-white/60 font-bold uppercase text-[9px] tracking-widest mt-1">
            Atualize as informações corporativas através das abas e sincronizadores inteligentes.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("basico")}
            className={cn(
              "flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-r border-slate-200 text-center outline-none",
              activeTab === "basico"
                ? "text-blue-700 bg-blue-50/70 border-b-2 border-blue-600 font-extrabold"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            Básico
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contato")}
            className={cn(
              "flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-r border-slate-200 text-center outline-none",
              activeTab === "contato"
                ? "text-blue-700 bg-blue-50/70 border-b-2 border-blue-600 font-extrabold"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            Contato & Endereço
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("societario")}
            className={cn(
              "flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-r border-slate-200 text-center outline-none",
              activeTab === "societario"
                ? "text-blue-700 bg-blue-50/70 border-b-2 border-blue-600 font-extrabold"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            Societário
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("atividades")}
            className={cn(
              "flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all text-center outline-none",
              activeTab === "atividades"
                ? "text-blue-700 bg-blue-50/70 border-b-2 border-blue-600 font-extrabold"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            Atividades (CNAE)
          </button>
        </div>

        {/* Tab Contents - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
          
          {/* TAB 1: BÁSICO */}
          {activeTab === "basico" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-end gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">CNPJ do Cliente</Label>
                  <Input 
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                    placeholder="00.000.000/0000-00"
                    className="border-[#D2D7DB] font-mono font-bold bg-white text-slate-800"
                  />
                </div>
                <div className="min-w-[180px] space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Status Receita</Label>
                  <div className="h-10 flex items-center px-3 rounded-lg border border-[#D2D7DB] bg-white text-xs font-bold uppercase text-[#39586D]">
                    {formData.companyStatus || "Não consultado"}
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  className="h-10 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold gap-2 rounded-lg"
                  onClick={syncWithReceita}
                  disabled={isSyncing}
                >
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Sincronizar API
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
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
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Natureza Jurídica</Label>
                  <Input 
                    value={formData.naturezaJuridica}
                    onChange={(e) => setFormData({...formData, naturezaJuridica: e.target.value})}
                    placeholder="Ex: 206-2 - Sociedade Empresária Limitada"
                    className="border-[#D2D7DB]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Porte</Label>
                  <Select value={formData.porte} onValueChange={(v) => setFormData({...formData, porte: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-10">
                      <SelectValue placeholder="Selecione o porte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ME">ME (Microempresa)</SelectItem>
                      <SelectItem value="EPP">EPP (Empresa de Pequeno Porte)</SelectItem>
                      <SelectItem value="DEMAIS">DEMAIS (Média/Grande Porte)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Regime Tributário</Label>
                  <Select value={formData.taxRegime} onValueChange={(v) => setFormData({...formData, taxRegime: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-10"><SelectValue /></SelectTrigger>
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
              </div>
            </div>
          )}

          {/* TAB 2: CONTATO & ENDEREÇO */}
          {activeTab === "contato" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">E-mail Principal</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
                    <Input 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-10 border-[#D2D7DB]"
                      placeholder="email@cliente.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">E-mail Financeiro</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
                    <Input 
                      value={formData.emailFinanceiro}
                      onChange={(e) => setFormData({...formData, emailFinanceiro: e.target.value})}
                      className="pl-10 border-[#D2D7DB]"
                      placeholder="financeiro@cliente.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="pl-10 border-[#D2D7DB]"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Responsável (Pessoa de Contato)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
                    <Input 
                      value={formData.companyContactPerson}
                      onChange={(e) => setFormData({...formData, companyContactPerson: e.target.value.toUpperCase()})}
                      className="pl-10 border-[#D2D7DB] font-bold uppercase"
                      placeholder="Nome do Responsável"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Endereço e Sede</h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2 relative">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">CEP</Label>
                    <Input 
                      value={formData.zipCode} 
                      onChange={(e) => handleCepChange(e.target.value)} 
                      placeholder="00000-000"
                      className="border-[#D2D7DB] font-mono font-bold"
                    />
                    {isLoadingCep && (
                      <div className="absolute right-3 top-8">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Logradouro / Rua</Label>
                    <Input 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})} 
                      className="border-[#D2D7DB]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Número</Label>
                    <Input 
                      value={formData.numero} 
                      onChange={(e) => setFormData({...formData, numero: e.target.value})} 
                      className="border-[#D2D7DB]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Complemento</Label>
                    <Input 
                      value={formData.complemento} 
                      onChange={(e) => setFormData({...formData, complemento: e.target.value})} 
                      className="border-[#D2D7DB]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Bairro</Label>
                    <Input 
                      value={formData.neighborhood} 
                      onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} 
                      className="border-[#D2D7DB]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Cidade</Label>
                    <Input 
                      value={formData.city} 
                      onChange={(e) => setFormData({...formData, city: e.target.value})} 
                      className="border-[#D2D7DB]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Estado (UF)</Label>
                    <Input 
                      value={formData.state} 
                      onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})} 
                      maxLength={2} 
                      className="border-[#D2D7DB] font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIETÁRIO */}
          {activeTab === "societario" && (
            <div className="space-y-6 animate-in fade-in duration-300">
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
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Inscrição Estadual</Label>
                  <Input 
                    value={formData.stateRegistration}
                    onChange={(e) => setFormData({...formData, stateRegistration: e.target.value})}
                    className="border-[#D2D7DB]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Inscrição Municipal</Label>
                  <Input 
                    value={formData.cityRegistration}
                    onChange={(e) => setFormData({...formData, cityRegistration: e.target.value})}
                    className="border-[#D2D7DB]"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-3">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Parâmetros Financeiros (Honorário)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input 
                        type="number" 
                        placeholder="Valor Honorário (R$)"
                        value={formData.honorariumValue} 
                        onChange={(e) => setFormData({...formData, honorariumValue: Number(e.target.value)})} 
                        className="border-[#D2D7DB]"
                      />
                    </div>
                    <div>
                      <Input 
                        type="number" 
                        placeholder="Dia de Vencimento"
                        min={1} 
                        max={28} 
                        value={formData.honorariumDueDateDay} 
                        onChange={(e) => setFormData({...formData, honorariumDueDateDay: Number(e.target.value)})} 
                        className="border-[#D2D7DB]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* QSA */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Quadro de Sócios e Administradores (QSA)
                  </h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-8 border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold gap-1 rounded-lg"
                    onClick={handleAddPartner}
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Sócio
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.qsa && formData.qsa.length > 0 ? (
                    formData.qsa.map((partner: any, index: number) => (
                      <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4 relative">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
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
                              className="bg-white border-slate-200 text-xs font-bold" 
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
                    <p className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-[#98A7AA] uppercase italic bg-slate-50/50">
                      Nenhum sócio cadastrado. Sincronize com a API ou adicione manualmente.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATIVIDADES (CNAE) */}
          {activeTab === "atividades" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">CNAE Principal</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
                  <Input 
                    value={formData.primaryCnae}
                    onChange={(e) => setFormData({...formData, primaryCnae: e.target.value})}
                    placeholder="Código do CNAE Principal"
                    className="pl-10 border-[#D2D7DB] font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* CNAE Intelligent Combobox Search */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Buscador Inteligente de CNAEs (IBGE)</h4>
                
                <div className="space-y-2 relative">
                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Pesquisar por Código ou Palavra-chave</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
                    <Input
                      placeholder="Pesquise ex: 4633801 ou 'padaria'..."
                      value={cnaeSearchQuery}
                      onChange={(e) => setCnaeSearchQuery(e.target.value)}
                      className="pl-10 border-[#D2D7DB] bg-white text-xs"
                    />
                    {isLoadingCnaes && (
                      <div className="absolute right-3 top-3">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  
                  {cnaeOptions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                      {cnaeOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedCnae(opt)
                            setCnaeOptions([])
                            setCnaeSearchQuery("")
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-bold text-blue-600">{opt.id}</span> - {opt.descricao.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected CNAE Assignment Menu */}
                {selectedCnae && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="text-xs">
                      <p className="font-bold text-blue-800">CNAE Selecionado:</p>
                      <p className="text-slate-700 mt-0.5"><span className="font-bold">{selectedCnae.id}</span> - {selectedCnae.descricao.toUpperCase()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, primaryCnae: selectedCnae.id }))
                          setSelectedCnae(null)
                          toast({ title: "CNAE Principal Definido", description: `Código: ${selectedCnae.id}` })
                        }}
                      >
                        Definir como Principal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-lg"
                        onClick={() => {
                          const item = `${selectedCnae.id} - ${selectedCnae.descricao.toUpperCase()}`
                          if (!formData.secondaryCnaes.includes(item)) {
                            setFormData(prev => ({
                              ...prev,
                              secondaryCnaes: [...prev.secondaryCnaes, item]
                            }))
                            toast({ title: "CNAE Secundário Adicionado" })
                          } else {
                            toast({ variant: "destructive", title: "CNAE já adicionado", description: "Este código já está na lista secundária." })
                          }
                          setSelectedCnae(null)
                        }}
                      >
                        Adicionar Secundário
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* CNAEs Secundários List */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Lista de CNAEs Secundários</Label>
                {formData.secondaryCnaes && formData.secondaryCnaes.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white">
                    {formData.secondaryCnaes.map((cnae, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 text-xs text-slate-700 hover:bg-slate-50/50">
                        <span className="font-semibold truncate pr-4">{cnae}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 shrink-0 rounded-md"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              secondaryCnaes: prev.secondaryCnaes.filter((_, i) => i !== idx)
                            }))
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed rounded-xl bg-slate-50">
                    Nenhum CNAE secundário adicionado.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0 flex items-center justify-end gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/95 font-black uppercase text-xs px-10 shadow-lg shadow-blue-500/10 rounded-xl h-10 gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" /> Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
