"use client"

import { useState, useMemo } from "react"
import { 
  Building2, 
  FileText, 
  MapPin, 
  DollarSign, 
  FileSignature, 
  Loader2, 
  Download, 
  RefreshCw,
  Plus,
  Trash2,
  Users,
  User,
  Mail,
  Calendar,
  Briefcase,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { ClientSearchSelect } from "@/components/clients/client-search-select"
import { cn } from "@/lib/utils"

const GRUPOS_EVENTOS = [
  {
    titulo: "Eventos Junta Comercial (DREI)",
    eventos: [
      { id: "220", code: "220", label: "Alteração do nome empresarial (firma ou denominação)", sub: "Evento 220" },
      { id: "244", code: "244", label: "Alteração de atividades econômicas (principal e secundárias)", sub: "Evento 244" },
      { id: "211", code: "211", label: "Alteração de endereço dentro do mesmo município", sub: "Evento 211" },
      { id: "209", code: "209", label: "Alteração de endereço entre municípios dentro do mesmo estado", sub: "Evento 209" },
      { id: "210", code: "210", label: "Alteração de endereço entre estados", sub: "Evento 210" },
      { id: "225", code: "225", label: "Alteração da natureza jurídica", sub: "Evento 225" },
      { id: "249", code: "249", label: "Alteração da forma de atuação", sub: "Evento 249" },
      { id: "248", code: "248", label: "Alteração do tipo de unidade", sub: "Evento 248" },
      { id: "052", code: "052", label: "Reativação - Artigo 60 Lei 8.934/94", sub: "Evento 052" },
      { id: "999", code: "999", label: "Licenciamento de Estabelecimento anteriormente registrado (Legado)", sub: "Evento 999" },
      { id: "221", code: "221", label: "Alteração do título do estabelecimento (nome de fantasia)", sub: "Evento 221" },
    ]
  },
  {
    titulo: "Operações Gerais",
    eventos: [
      { id: "capital", label: "ALTERAÇÃO DE CAPITAL SOCIAL", sub: "Geral" },
      { id: "objeto_social", label: "ALTERAÇÃO DO OBJETO SOCIAL", sub: "Geral" },
      { id: "alteracao_socio", label: "ALTERAÇÃO DE SÓCIO/ADMINISTRADOR", sub: "Geral" },
      { id: "entrada_socio", label: "ENTRADA SÓCIO/ADMINISTRADOR", sub: "Geral" },
      { id: "saida_socio", label: "SAÍDA SÓCIO/ADMINISTRADOR", sub: "Geral" },
      { id: "transformacao", label: "TRANSFORMAÇÃO", sub: "Geral" },
      { id: "cessao_quotas", label: "CESSÃO DE QUOTAS", sub: "Geral" },
      { id: "consolidacao", label: "CONSOLIDAÇÃO DE CONTRATO/ESTATUTO", sub: "Geral" }
    ]
  }
]

export default function AlteracaoSocietariaPage() {
  const firestore = useFirestore()
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [openPartnerIndex, setOpenPartnerIndex] = useState<number | null>(0)
  
  // Checklist states
  const [eventosSelecionados, setEventosSelecionados] = useState<string[]>([])
  
  // Altered data states
  const [novosDados, setNovosDados] = useState({
    corporateName: "",
    objetoSocial: "",
    capitalSocial: 0,
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: ""
  })

  // Load clients
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading: loadingClients } = useCollection(clientsQuery)

  // Current client object
  const currentClient = useMemo(() => {
    return (clients || []).find(c => c.id === selectedClientId) || null
  }, [clients, selectedClientId])

  // Partner array state for current client
  const [socios, setSocios] = useState<any[]>([])

  // Load partners when client changes
  useMemo(() => {
    if (currentClient) {
      const qsa = currentClient.qsa || []
      const initialized = qsa.map((s: any) => ({
        nome: s.nome || "",
        cpfCnpj: s.cpfCnpj || "",
        dataNascimento: s.dataNascimento || "",
        rg: s.rg || "",
        rgOrgaoEmissor: s.rgOrgaoEmissor || "",
        rgUf: s.rgUf || "",
        validadeIdentidade: s.validadeIdentidade || "",
        sexo: s.sexo || "Masculino",
        estadoCivil: s.estadoCivil || "Solteiro(a)",
        regimeBens: s.regimeBens || "",
        uniaoEstavel: s.uniaoEstavel || "Não",
        regimeBensUniaoEstavel: s.regimeBensUniaoEstavel || "",
        profissao: s.profissao || "",
        nacionalidade: s.nacionalidade || "Brasileira",
        email: s.email || "",
        emancipacao: s.emancipacao || "Não",
        condicaoSocio: s.condicaoSocio || s.qualificacao || "Sócio",
        dataIngresso: s.dataIngresso || "",
        dataSaida: s.dataSaida || "",
        participacao: s.participacao || 0,
        condicaoAdministrador: s.condicaoAdministrador || (s.qualificacao?.toLowerCase().includes("administrador") ? "Administrador" : "Não Administrador"),
        dataInicioMandato: s.dataInicioMandato || "",
        dataFimMandato: s.dataFimMandato || "",
        cargoDirecao: s.cargoDirecao || "",
        dataSaidaAdmin: s.dataSaidaAdmin || ""
      }))
      setSocios(initialized)
      setOpenPartnerIndex(initialized.length > 0 ? 0 : null)
      
      setNovosDados({
        corporateName: currentClient.corporateName || "",
        objetoSocial: currentClient.objetoSocial || currentClient.naturezaJuridica || "",
        capitalSocial: currentClient.capitalSocial || 0,
        address: currentClient.address || "",
        neighborhood: currentClient.neighborhood || "",
        city: currentClient.city || "",
        state: currentClient.state || "",
        zipCode: currentClient.zipCode || ""
      })
    } else {
      setSocios([])
      setOpenPartnerIndex(null)
    }
  }, [currentClient])

  // Toggle events
  const handleToggleEvent = (eventKey: string) => {
    setEventosSelecionados(prev => 
      prev.includes(eventKey) 
        ? prev.filter(k => k !== eventKey) 
        : [...prev, eventKey]
    )
  }

  // Handle partner additions/removals local
  const handleAddPartner = () => {
    setSocios(prev => [
      ...prev,
      {
        nome: "",
        cpfCnpj: "",
        dataNascimento: "",
        rg: "",
        rgOrgaoEmissor: "",
        rgUf: "",
        validadeIdentidade: "",
        sexo: "Masculino",
        estadoCivil: "Solteiro(a)",
        regimeBens: "",
        uniaoEstavel: "Não",
        regimeBensUniaoEstavel: "",
        profissao: "",
        nacionalidade: "Brasileira",
        email: "",
        emancipacao: "Não",
        condicaoSocio: "Sócio",
        dataIngresso: "",
        dataSaida: "",
        participacao: 0,
        condicaoAdministrador: "Não Administrador",
        dataInicioMandato: "",
        dataFimMandato: "",
        cargoDirecao: "",
        dataSaidaAdmin: ""
      }
    ])
    setOpenPartnerIndex(socios.length)
  }

  const handleRemovePartner = (index: number) => {
    setSocios(prev => prev.filter((_, idx) => idx !== index))
    setOpenPartnerIndex(prev => prev === index ? null : prev !== null && prev > index ? prev - 1 : prev)
  }

  const handlePartnerChange = (index: number, field: string, value: any) => {
    setSocios(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleSyncWithFicha360 = () => {
    if (currentClient) {
      const qsa = currentClient.qsa || []
      const initialized = qsa.map((s: any) => ({
        nome: s.nome || "",
        cpfCnpj: s.cpfCnpj || "",
        dataNascimento: s.dataNascimento || "",
        rg: s.rg || "",
        rgOrgaoEmissor: s.rgOrgaoEmissor || "",
        rgUf: s.rgUf || "",
        validadeIdentidade: s.validadeIdentidade || "",
        sexo: s.sexo || "Masculino",
        estadoCivil: s.estadoCivil || "Solteiro(a)",
        regimeBens: s.regimeBens || "",
        uniaoEstavel: s.uniaoEstavel || "Não",
        regimeBensUniaoEstavel: s.regimeBensUniaoEstavel || "",
        profissao: s.profissao || "",
        nacionalidade: s.nacionalidade || "Brasileira",
        email: s.email || "",
        emancipacao: s.emancipacao || "Não",
        condicaoSocio: s.condicaoSocio || s.qualificacao || "Sócio",
        dataIngresso: s.dataIngresso || "",
        dataSaida: s.dataSaida || "",
        participacao: s.participacao || 0,
        condicaoAdministrador: s.condicaoAdministrador || (s.qualificacao?.toLowerCase().includes("administrador") ? "Administrador" : "Não Administrador"),
        dataInicioMandato: s.dataInicioMandato || "",
        dataFimMandato: s.dataFimMandato || "",
        cargoDirecao: s.cargoDirecao || "",
        dataSaidaAdmin: s.dataSaidaAdmin || ""
      }))
      setSocios(initialized)
      setOpenPartnerIndex(initialized.length > 0 ? 0 : null)
      toast({ title: "Dados Sincronizados", description: "Os dados dos sócios foram atualizados a partir da Ficha 360º." })
    }
  }

  // Action to call API and force download
  const handleGenerateContract = async () => {
    if (!selectedClientId || !currentClient) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione uma empresa primeiro." })
      return
    }

    if (eventosSelecionados.length === 0) {
      toast({ variant: "destructive", title: "Atenção", description: "Selecione ao menos um evento para alteração." })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/societario/gerar-contrato", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresa: {
            corporateName: currentClient.corporateName,
            cnpj: currentClient.cnpj,
            address: currentClient.address,
            neighborhood: currentClient.neighborhood,
            city: currentClient.city,
            state: currentClient.state,
            zipCode: currentClient.zipCode,
            capitalSocial: currentClient.capitalSocial || 0,
            nire: currentClient.nire || "NÃO INFORMADO",
            naturezaJuridica: currentClient.naturezaJuridica
          },
          socios: socios,
          novosDados: novosDados,
          eventosSelecionados: eventosSelecionados
        })
      })

      if (!response.ok) {
        throw new Error("Falha na geração do arquivo do contrato")
      }

      // Convert buffer response to blob
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `alteracao_e_consolidacao_${currentClient.corporateName?.replace(/\s+/g, "_")}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      window.URL.revokeObjectURL(downloadUrl)

      toast({ title: "Contrato Gerado!", description: "O arquivo .docx foi baixado com sucesso." })
    } catch (err: any) {
      console.error(err)
      toast({ variant: "destructive", title: "Erro ao Gerar", description: err.message || "Houve uma falha na geração do contrato." })
    } finally {
      setIsGenerating(false)
    }
  }

  // Determine if address form should be shown
  const showAddressForm = eventosSelecionados.includes("endereco") || 
                           eventosSelecionados.includes("211") || 
                           eventosSelecionados.includes("209") || 
                           eventosSelecionados.includes("210")

  // Determine if capital form should be shown
  const showCapitalForm = eventosSelecionados.includes("capital") || 
                           eventosSelecionados.includes("cessao_quotas")

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alteração Societária</h1>
          <p className="text-xs text-slate-500 font-medium">Gere minutas de alteração contratual e consolidação com padrões DREI de forma modular.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Client selection & Event Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-800">1. Selecionar Empresa</CardTitle>
              <CardDescription className="text-xs text-slate-400">Escolha a empresa cadastrada no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-xs text-slate-500 font-semibold">Buscando empresas...</span>
                </div>
              ) : (
                <ClientSearchSelect
                  clients={clients || []}
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                  placeholder="SELECIONE UMA EMPRESA..."
                />
              )}
            </CardContent>
          </Card>

          {selectedClientId && (
            <Card className="border-slate-200 shadow-sm max-h-[75vh] flex flex-col">
              <CardHeader className="shrink-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-800">2. Eventos da Alteração</CardTitle>
                <CardDescription className="text-xs text-slate-400">Marque quais itens serão alterados no contrato.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto space-y-4 flex-1 pr-2">
                {GRUPOS_EVENTOS.map((grupo) => (
                  <div key={grupo.titulo} className="space-y-2 pt-1 first:pt-0">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">
                      {grupo.titulo}
                    </h4>
                    <div className="space-y-2">
                      {grupo.eventos.map((ev) => (
                        <div 
                          key={ev.id} 
                          className={cn(
                            "flex items-start space-x-3 p-3 rounded-lg border bg-white hover:bg-slate-50/50 cursor-pointer transition-colors",
                            eventosSelecionados.includes(ev.id) && "border-blue-300 bg-blue-50/10"
                          )}
                          onClick={() => handleToggleEvent(ev.id)}
                        >
                          <Checkbox 
                            id={`ev-${ev.id}`} 
                            checked={eventosSelecionados.includes(ev.id)} 
                            onCheckedChange={() => handleToggleEvent(ev.id)}
                            onClick={(e) => e.stopPropagation()} // Evita duplo clique devido ao onClick da div
                          />
                          <div className="flex flex-col select-none">
                            <Label htmlFor={`ev-${ev.id}`} className="text-xs font-semibold text-slate-800 cursor-pointer leading-tight">
                              {ev.label}
                            </Label>
                            <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{ev.sub}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Conditional Input Fields and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClientId ? (
            <>
              {/* Quadro de Sócios (QSA) - IMAGEM 3 */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-800">3. Dados dos Sócios e Administradores</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Preencha as informações obrigatórias dos sócios para qualificação no contrato.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs font-bold border-slate-200 flex items-center gap-1.5"
                      onClick={handleSyncWithFicha360}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reimportar Ficha 360º
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50/50 flex items-center gap-1"
                      onClick={handleAddPartner}
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Sócio
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {socios.length > 0 ? (
                    <div className="space-y-3">
                      {socios.map((s, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          {/* Header Accordion */}
                          <div 
                            className={cn(
                              "flex justify-between items-center cursor-pointer p-4 bg-slate-50 hover:bg-slate-100/50 transition-colors border-b",
                              openPartnerIndex !== idx && "border-b-0"
                            )}
                            onClick={() => setOpenPartnerIndex(openPartnerIndex === idx ? null : idx)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 text-blue-700 h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 truncate pr-4">
                                  {s.nome || "NOVO SÓCIO (SEM NOME)"}
                                </h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                                  {s.condicaoSocio || "SÓCIO"} • {s.cpfCnpj || "CPF NÃO INFORMADO"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {s.participacao > 0 && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                                  R$ {Number(s.participacao).toLocaleString("pt-BR")}
                                </span>
                              )}
                              <Button 
                                type="button" 
                                variant="ghost" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemovePartner(idx)
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Accordion Content */}
                          {openPartnerIndex === idx && (
                            <div className="p-5 space-y-6 bg-white">
                              {/* 1. DADOS PESSOAIS */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">
                                  1. Identificação e Dados Pessoais
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Nome Completo</Label>
                                    <Input 
                                      value={s.nome || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "nome", e.target.value.toUpperCase())} 
                                      className="bg-white border-slate-200 text-xs font-bold" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">CPF</Label>
                                    <Input 
                                      value={s.cpfCnpj || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "cpfCnpj", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Data de Nascimento</Label>
                                    <Input 
                                      type="date"
                                      value={s.dataNascimento || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "dataNascimento", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Sexo</Label>
                                    <Select 
                                      value={s.sexo || "Masculino"} 
                                      onValueChange={(v) => handlePartnerChange(idx, "sexo", v)}
                                    >
                                      <SelectTrigger className="bg-white border-slate-200 text-xs h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                        <SelectItem value="Feminino">Feminino</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Profissão</Label>
                                    <Input 
                                      value={s.profissao || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "profissao", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Nacionalidade</Label>
                                    <Input 
                                      value={s.nacionalidade || "Brasileira"} 
                                      onChange={(e) => handlePartnerChange(idx, "nacionalidade", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                  <div className="col-span-1 md:col-span-3 space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">E-mail</Label>
                                    <Input 
                                      type="email"
                                      value={s.email || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "email", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* 2. DOCUMENTO DE IDENTIDADE */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">
                                  2. Documento de Identidade
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                  <div className="col-span-2 space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Nº Identidade (RG)</Label>
                                    <Input 
                                      value={s.rg || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "rg", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs font-semibold" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Órgão Emissor</Label>
                                    <Input 
                                      value={s.rgOrgaoEmissor || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "rgOrgaoEmissor", e.target.value.toUpperCase())} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">UF RG</Label>
                                    <Input 
                                      value={s.rgUf || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "rgUf", e.target.value.toUpperCase())} 
                                      className="bg-white border-slate-200 text-xs" 
                                      maxLength={2}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Validade Identidade</Label>
                                    <Input 
                                      type="date"
                                      value={s.validadeIdentidade || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "validadeIdentidade", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                  <div className="col-span-1 md:col-span-5 space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Emancipação</Label>
                                    <Select 
                                      value={s.emancipacao || "Não"} 
                                      onValueChange={(v) => handlePartnerChange(idx, "emancipacao", v)}
                                    >
                                      <SelectTrigger className="bg-white border-slate-200 text-xs h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Sim">Sim (Emancipado)</SelectItem>
                                        <SelectItem value="Não">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              {/* 3. ESTADO CIVIL */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">
                                  3. Estado Civil e União Estável
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Estado Civil</Label>
                                    <Select 
                                      value={s.estadoCivil || "Solteiro(a)"} 
                                      onValueChange={(v) => handlePartnerChange(idx, "estadoCivil", v)}
                                    >
                                      <SelectTrigger className="bg-white border-slate-200 text-xs h-9">
                                        <SelectValue />
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
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Regime de Bens (se casado)</Label>
                                    <Input 
                                      value={s.regimeBens || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "regimeBens", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                      placeholder="Ex: Comunhão Parcial"
                                      disabled={s.estadoCivil !== "Casado(a)"}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">União Estável</Label>
                                    <Select 
                                      value={s.uniaoEstavel || "Não"} 
                                      onValueChange={(v) => handlePartnerChange(idx, "uniaoEstavel", v)}
                                    >
                                      <SelectTrigger className="bg-white border-slate-200 text-xs h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Sim">Sim</SelectItem>
                                        <SelectItem value="Não">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Regime (União Estável)</Label>
                                    <Input 
                                      value={s.regimeBensUniaoEstavel || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "regimeBensUniaoEstavel", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                      placeholder="Ex: Comunhão Parcial"
                                      disabled={s.uniaoEstavel !== "Sim" && s.estadoCivil !== "União Estável"}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* 4. VÍNCULO SOCIETÁRIO */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">
                                  4. Vínculo Societário e Quotas
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Condição do Sócio</Label>
                                    <Select 
                                      value={s.condicaoSocio || "Sócio"} 
                                      onValueChange={(v) => handlePartnerChange(idx, "condicaoSocio", v)}
                                    >
                                      <SelectTrigger className="bg-white border-slate-200 text-xs h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Sócio">Sócio</SelectItem>
                                        <SelectItem value="Sócio-Administrador">Sócio-Administrador</SelectItem>
                                        <SelectItem value="Sócio-Representante">Sócio-Representante</SelectItem>
                                        <SelectItem value="Não Sócio">Não Sócio</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Data de Ingresso</Label>
                                    <Input 
                                      type="date"
                                      value={s.dataIngresso || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "dataIngresso", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Data de Saída</Label>
                                    <Input 
                                      type="date"
                                      value={s.dataSaida || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "dataSaida", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Valor Participação (R$)</Label>
                                    <Input 
                                      type="number"
                                      value={s.participacao || 0} 
                                      onChange={(e) => handlePartnerChange(idx, "participacao", Number(e.target.value))} 
                                      className="bg-white border-slate-200 text-xs font-bold" 
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* 5. VÍNCULO ADMINISTRATIVO */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">
                                  5. Vínculo Administrativo
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Condição Administrador</Label>
                                    <Select 
                                      value={s.condicaoAdministrador || "Não Administrador"} 
                                      onValueChange={(v) => handlePartnerChange(idx, "condicaoAdministrador", v)}
                                    >
                                      <SelectTrigger className="bg-white border-slate-200 text-xs h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Administrador">Administrador</SelectItem>
                                        <SelectItem value="Não Administrador">Não Administrador</SelectItem>
                                        <SelectItem value="Diretor">Diretor</SelectItem>
                                        <SelectItem value="Conselheiro">Conselheiro</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Cargo Direção</Label>
                                    <Input 
                                      value={s.cargoDirecao || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "cargoDirecao", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                      placeholder="Ex: Diretor Administrativo"
                                      disabled={s.condicaoAdministrador === "Não Administrador"}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Início Mandato</Label>
                                    <Input 
                                      type="date"
                                      value={s.dataInicioMandato || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "dataInicioMandato", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                      disabled={s.condicaoAdministrador === "Não Administrador"}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Fim Mandato</Label>
                                    <Input 
                                      type="date"
                                      value={s.dataFimMandato || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "dataFimMandato", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                      disabled={s.condicaoAdministrador === "Não Administrador"}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 font-bold uppercase">Data Saída Admin</Label>
                                    <Input 
                                      type="date"
                                      value={s.dataSaidaAdmin || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "dataSaidaAdmin", e.target.value)} 
                                      className="bg-white border-slate-200 text-xs" 
                                      disabled={s.condicaoAdministrador === "Não Administrador"}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed rounded-xl bg-slate-50">
                      Nenhum sócio cadastrado localmente. Clique em "Adicionar Sócio" ou "Reimportar Ficha 360º".
                    </p>
                  )}
                </CardContent>
              </Card>

              {eventosSelecionados.length > 0 ? (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-800">4. Novos Dados Contratuais</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Preencha as informações que serão alteradas e consolidadas.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Denominação social */}
                    {eventosSelecionados.includes("220") && (
                      <div className="space-y-3 p-4 border border-blue-100 rounded-lg bg-blue-50/10">
                        <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Alteração de Denominação Social
                        </h4>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase">Nova Razão Social</Label>
                          <Input 
                            value={novosDados.corporateName}
                            onChange={(e) => setNovosDados({ ...novosDados, corporateName: e.target.value.toUpperCase() })}
                            className="bg-white border-slate-200 font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Objeto social */}
                    {(eventosSelecionados.includes("244") || eventosSelecionados.includes("objeto_social")) && (
                      <div className="space-y-3 p-4 border border-blue-100 rounded-lg bg-blue-50/10">
                        <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Alteração de Objeto Social
                        </h4>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase">Novo Objeto Social</Label>
                          <Textarea 
                            rows={3}
                            value={novosDados.objetoSocial}
                            onChange={(e) => setNovosDados({ ...novosDados, objetoSocial: e.target.value })}
                            className="bg-white border-slate-200 text-xs"
                            placeholder="Descreva detalhadamente o novo objeto social da empresa..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Endereço */}
                    {showAddressForm && (
                      <div className="space-y-3 p-4 border border-blue-100 rounded-lg bg-blue-50/10">
                        <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Mudança de Endereço
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Logradouro / Rua</Label>
                            <Input 
                              value={novosDados.address}
                              onChange={(e) => setNovosDados({ ...novosDados, address: e.target.value })}
                              className="bg-white border-slate-200 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Bairro</Label>
                            <Input 
                              value={novosDados.neighborhood}
                              onChange={(e) => setNovosDados({ ...novosDados, neighborhood: e.target.value })}
                              className="bg-white border-slate-200 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">CEP</Label>
                            <Input 
                              value={novosDados.zipCode}
                              onChange={(e) => setNovosDados({ ...novosDados, zipCode: e.target.value })}
                              className="bg-white border-slate-200 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Cidade</Label>
                            <Input 
                              value={novosDados.city}
                              onChange={(e) => setNovosDados({ ...novosDados, city: e.target.value })}
                              className="bg-white border-slate-200 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Estado (UF)</Label>
                            <Input 
                              value={novosDados.state}
                              onChange={(e) => setNovosDados({ ...novosDados, state: e.target.value.toUpperCase() })}
                              className="bg-white border-slate-200 text-xs"
                              maxLength={2}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Capital Social */}
                    {showCapitalForm && (
                      <div className="space-y-4 p-4 border border-blue-100 rounded-lg bg-blue-50/10">
                        <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" /> Alteração de Capital Social & Quotas
                        </h4>
                        
                        <div className="space-y-1 max-w-xs">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase">Novo Capital Social (R$)</Label>
                          <Input 
                            type="number"
                            value={novosDados.capitalSocial}
                            onChange={(e) => setNovosDados({ ...novosDados, capitalSocial: Number(e.target.value) })}
                            className="bg-white border-slate-200 font-bold"
                          />
                        </div>

                        <div className="space-y-2 border-t pt-3">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase">Distribuição de Quotas por Sócio</Label>
                          {socios.length > 0 ? (
                            <div className="space-y-2.5">
                              {socios.map((s, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border rounded-lg shadow-sm">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{s.nome || "Sócio sem nome"}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{s.cpfCnpj || "Sem CPF"}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-[9px] text-slate-400 font-bold uppercase">R$</Label>
                                    <Input 
                                      type="number"
                                      value={s.participacao || 0}
                                      onChange={(e) => handlePartnerChange(idx, "participacao", Number(e.target.value))}
                                      className="w-32 h-8 border-slate-200 text-xs text-right font-semibold"
                                    />
                                    {novosDados.capitalSocial > 0 && (
                                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        {(((s.participacao || 0) / novosDados.capitalSocial) * 100).toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Validation helper */}
                              {novosDados.capitalSocial !== socios.reduce((acc, curr) => acc + (curr.participacao || 0), 0) && (
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider animate-pulse mt-2">
                                  * Atenção: A soma das participações (R$ {socios.reduce((acc, curr) => acc + (curr.participacao || 0), 0).toLocaleString("pt-BR")}) difere do Novo Capital Social (R$ {novosDados.capitalSocial.toLocaleString("pt-BR")})
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">Esta empresa não possui sócios vinculados para distribuição de quotas.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-10 text-center">
                  <FileSignature className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Nenhum evento selecionado</p>
                  <p className="text-[10px] text-slate-400">Escolha os eventos societários no checklist à esquerda para iniciar o preenchimento.</p>
                </div>
              )}

              {/* Action trigger */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleGenerateContract}
                  disabled={isGenerating || eventosSelecionados.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-500/10 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando documento...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Gerar Contrato (Word)
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
              <Building2 className="h-10 w-10 text-blue-600/20 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Aguardando Seleção de Empresa</h3>
              <p className="text-xs text-slate-400">Selecione uma empresa do menu à esquerda para iniciar a emissão contratual.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
