"use client"

import { useState, useMemo, useEffect } from "react"
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
  Shield,
  Search,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { ClientSearchSelect } from "@/components/clients/client-search-select"
import { cn, numberToExtensoBRL } from "@/lib/utils"

interface CnaeItem {
  code: string;
  description: string;
}

const parseCnaeString = (raw: string): CnaeItem => {
  if (!raw) return { code: "", description: "" };
  const trimmed = raw.trim();

  // Match "1063500 - FABRICACAO DE FARINHA..." or "1063500 – FABRICACAO..."
  const match = trimmed.match(/^([\d\.\-\/]+)\s*[\-\–\—]\s*(.+)$/);
  if (match) {
    const code = match[1].replace(/\D/g, "");
    const description = match[2].trim().toUpperCase();
    return { code, description };
  }

  // Pure digits or code format
  const cleanDigits = trimmed.replace(/\D/g, "");
  if (cleanDigits.length >= 4 && cleanDigits.length <= 7 && !trimmed.includes(" ")) {
    return { code: cleanDigits, description: "" };
  }

  return { code: "", description: trimmed.toUpperCase() };
};

const extractCnaesFromClient = (client: any, ibgeList: any[] = []): CnaeItem[] => {
  const result: CnaeItem[] = [];
  const addedKeys = new Set<string>();

  const addCnae = (code: string, description: string) => {
    let cleanCode = (code || "").replace(/\D/g, "");
    let cleanDesc = (description || "").trim().toUpperCase();

    // If description is missing, check IBGE list
    if (!cleanDesc && cleanCode && ibgeList.length > 0) {
      const found = ibgeList.find((item: any) => String(item.id).replace(/\D/g, "") === cleanCode);
      if (found) {
        cleanDesc = String(found.descricao || "").toUpperCase();
      }
    }

    const key = cleanCode || cleanDesc;
    if (key && !addedKeys.has(key)) {
      addedKeys.add(key);
      result.push({ code: cleanCode, description: cleanDesc });
    }
  };

  if (!client) return result;

  // 1. client.cnaes array
  if (Array.isArray(client.cnaes) && client.cnaes.length > 0) {
    client.cnaes.forEach((item: any) => {
      if (typeof item === "string") {
        const parsed = parseCnaeString(item);
        addCnae(parsed.code, parsed.description);
      } else if (item && typeof item === "object") {
        addCnae(item.code || item.id || "", item.description || item.descricao || "");
      }
    });
  }

  // 2. primaryCnae
  if (client.primaryCnae) {
    if (typeof client.primaryCnae === "string") {
      const parsed = parseCnaeString(client.primaryCnae);
      addCnae(parsed.code, parsed.description);
    } else if (typeof client.primaryCnae === "object") {
      addCnae(client.primaryCnae.code || client.primaryCnae.id || "", client.primaryCnae.description || client.primaryCnae.descricao || "");
    }
  }

  // 3. secondaryCnaes
  if (Array.isArray(client.secondaryCnaes)) {
    client.secondaryCnaes.forEach((sec: any) => {
      if (typeof sec === "string") {
        const parsed = parseCnaeString(sec);
        addCnae(parsed.code, parsed.description);
      } else if (sec && typeof sec === "object") {
        addCnae(sec.code || sec.id || "", sec.description || sec.descricao || "");
      }
    });
  }

  return result;
};

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
  
  // Modal State for Event Configuration & Live Preview Clauses
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("qualificacao")

  // Checklist states
  const [eventosSelecionados, setEventosSelecionados] = useState<string[]>([])

  // Save & Load process states
  const [currentAlterationId, setCurrentAlterationId] = useState<string | null>(null)
  const [processLabel, setProcessLabel] = useState<string>("")

  // Fetch all societary alterations
  const alterationsQuery = useMemoFirebase(() => collection(firestore, "societaryAlterations"), [firestore])
  const { data: allAlterations = [], isLoading: loadingAlterations } = useCollection(alterationsQuery)

  // Filter alterations for the selected client
  const clientAlterations = useMemo(() => {
    if (!selectedClientId) return []
    return (allAlterations || [])
      .filter((alt: any) => alt.clientId === selectedClientId)
      .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
  }, [allAlterations, selectedClientId])

  // Reset process states when client changes
  useEffect(() => {
    setCurrentAlterationId(null)
    setProcessLabel("")
    setEventosSelecionados([])
  }, [selectedClientId])

  const handleSaveAlteration = (status: "SALVA" | "CONCLUIDA") => {
    if (!selectedClientId || !currentClient) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione uma empresa primeiro." })
      return
    }

    if (eventosSelecionados.length === 0) {
      toast({ variant: "destructive", title: "Atenção", description: "Selecione ao menos um evento antes de salvar." })
      return
    }

    const finalLabel = processLabel.trim() || `Alteração - ${new Date().toLocaleDateString("pt-BR")}`
    const alterationId = currentAlterationId || doc(collection(firestore, "societaryAlterations")).id
    const alterationDocRef = doc(firestore, "societaryAlterations", alterationId)

    const dataToSave: any = {
      id: alterationId,
      clientId: selectedClientId,
      clientName: currentClient.corporateName || currentClient.razaoSocial || "",
      label: finalLabel,
      status: status,
      eventosSelecionados: eventosSelecionados,
      novosDados: novosDados,
      socios: socios,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const existing = (allAlterations || []).find((alt: any) => alt.id === alterationId)
    if (existing) {
      dataToSave.createdAt = existing.createdAt || dataToSave.createdAt
    }

    setDocumentNonBlocking(alterationDocRef, dataToSave, { merge: true })

    setCurrentAlterationId(alterationId)
    setProcessLabel(finalLabel)

    toast({
      title: status === "CONCLUIDA" ? "Alteração Concluída!" : "Rascunho Salvo!",
      description: status === "CONCLUIDA" 
        ? `O processo "${finalLabel}" foi marcado como Concluído.` 
        : `O progresso do processo "${finalLabel}" foi salvo.`
    })
  }

  const handleLoadAlteration = (alt: any) => {
    setCurrentAlterationId(alt.id)
    setProcessLabel(alt.label || "")
    setEventosSelecionados(alt.eventosSelecionados || [])
    
    if (alt.novosDados) {
      setNovosDados(alt.novosDados)
    }
    if (alt.socios) {
      setSocios(alt.socios)
    }

    toast({
      title: "Progresso Carregado",
      description: `O processo "${alt.label}" foi carregado com sucesso.`
    })

    setIsModalOpen(true)
  }

  const handleDeleteAlteration = (altId: string, altLabel: string) => {
    if (confirm(`Tem certeza que deseja excluir permanentemente o processo "${altLabel}"?`)) {
      const alterationDocRef = doc(firestore, "societaryAlterations", altId)
      deleteDocumentNonBlocking(alterationDocRef)
      if (currentAlterationId === altId) {
        setCurrentAlterationId(null)
        setProcessLabel("")
      }
      toast({
        title: "Processo Excluído",
        description: `O processo "${altLabel}" foi removido do sistema.`
      })
    }
  }

  const handleCompleteAlteration = (alt: any) => {
    const alterationDocRef = doc(firestore, "societaryAlterations", alt.id)
    setDocumentNonBlocking(alterationDocRef, {
      ...alt,
      status: "CONCLUIDA",
      updatedAt: new Date().toISOString()
    }, { merge: true })
    
    toast({
      title: "Processo Concluído",
      description: `O processo "${alt.label}" foi finalizado.`
    })
  }
  
  // IBGE CNAEs list state
  const [ibgeCnaes, setIbgeCnaes] = useState<any[]>([])
  const [isLoadingIbge, setIsLoadingIbge] = useState<boolean>(false)
  const [cnaeSearchQuery, setCnaeSearchQuery] = useState("")
  const [cnaeSearchResults, setCnaeSearchResults] = useState<any[]>([])

  // Manual CNAE addition inputs
  const [manualCnaeCode, setManualCnaeCode] = useState("")
  const [manualCnaeDesc, setManualCnaeDesc] = useState("")

  // Altered data states
  const [novosDados, setNovosDados] = useState<{
    corporateName: string;
    nomeFantasia: string;
    objetoSocial: string;
    capitalSocial: number;
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    cnaes: CnaeItem[];
  }>({
    corporateName: "",
    nomeFantasia: "",
    objetoSocial: "",
    capitalSocial: 0,
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    cnaes: []
  })

  // Load IBGE CNAEs subclasses list
  useEffect(() => {
    let isMounted = true
    const fetchIbge = async () => {
      setIsLoadingIbge(true)
      try {
        const res = await fetch("https://servicodados.ibge.gov.br/api/v2/cnae/subclasses")
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setIbgeCnaes(data)
        }
      } catch (err) {
        console.error("Erro ao buscar CNAEs do IBGE:", err)
      } finally {
        if (isMounted) setIsLoadingIbge(false)
      }
    }
    fetchIbge()
    return () => { isMounted = false }
  }, [])

  // Load clients
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading: loadingClients } = useCollection(clientsQuery)

  // Current client object
  const currentClient = useMemo(() => {
    return (clients || []).find(c => c.id === selectedClientId) || null
  }, [clients, selectedClientId])

  // Partner array state for current client
  const [socios, setSocios] = useState<any[]>([])

  // Sync client data and CNAEs from Ficha 360º when client or IBGE data changes
  useEffect(() => {
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
        enderecoResidencial: s.enderecoResidencial || s.endereco || "",
        emancipacao: s.emancipacao || "Não",
        condicaoSocio: s.condicaoSocio || s.qualificacao || "titular",
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

      const extractedCnaes = extractCnaesFromClient(currentClient, ibgeCnaes)

      const defaultFantasia = currentClient.nomeFantasia || (currentClient.corporateName ? currentClient.corporateName.replace(/\s+LTDA$/i, "").replace(/\s+ME$/i, "").replace(/\s+EPP$/i, "") : "") || "";

      setNovosDados({
        corporateName: currentClient.corporateName || currentClient.razaoSocial || "",
        nomeFantasia: defaultFantasia,
        objetoSocial: currentClient.objetoSocial || currentClient.naturezaJuridica || "",
        capitalSocial: currentClient.capitalSocial || 0,
        address: currentClient.address || "",
        neighborhood: currentClient.neighborhood || "",
        city: currentClient.city || "",
        state: currentClient.state || "",
        zipCode: currentClient.zipCode || "",
        cnaes: extractedCnaes
      })
    } else {
      setSocios([])
      setOpenPartnerIndex(null)
      setNovosDados({
        corporateName: "",
        nomeFantasia: "",
        objetoSocial: "",
        capitalSocial: 0,
        address: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
        cnaes: []
      })
    }
  }, [currentClient, ibgeCnaes])

  // Filter IBGE CNAE search query
  useEffect(() => {
    if (cnaeSearchQuery.length < 2) {
      setCnaeSearchResults([])
      return
    }
    const cleanDigits = cnaeSearchQuery.toLowerCase().replace(/\D/g, "")
    const textQuery = cnaeSearchQuery.toLowerCase()

    const filtered = ibgeCnaes.filter((item: any) => {
      const cleanId = String(item.id).replace(/\D/g, "")
      const desc = String(item.descricao || "").toLowerCase()
      return (cleanDigits.length > 0 && cleanId.includes(cleanDigits)) || desc.includes(textQuery)
    }).slice(0, 50)

    setCnaeSearchResults(filtered)
  }, [cnaeSearchQuery, ibgeCnaes])

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
        enderecoResidencial: "",
        emancipacao: "Não",
        condicaoSocio: "titular",
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

  // CNAE manipulation handlers
  const handleAddCnaeItem = (code: string, description: string) => {
    const cleanCode = code.replace(/\D/g, "")
    const cleanDesc = description.trim().toUpperCase()

    if (!cleanCode && !cleanDesc) return

    setNovosDados(prev => {
      const exists = prev.cnaes.some(
        c => (cleanCode && c.code === cleanCode) || (cleanDesc && c.description === cleanDesc)
      );
      if (exists) {
        toast({ variant: "destructive", title: "CNAE já adicionado", description: "Esta atividade já está na lista de alterações." });
        return prev;
      }
      toast({ title: "Atividade Adicionada", description: `${cleanCode ? cleanCode + " - " : ""}${cleanDesc}` });
      return {
        ...prev,
        cnaes: [...prev.cnaes, { code: cleanCode, description: cleanDesc }]
      };
    });

    setCnaeSearchQuery("")
    setCnaeSearchResults([])
    setManualCnaeCode("")
    setManualCnaeDesc("")
  }

  const handleRemoveCnaeItem = (index: number) => {
    setNovosDados(prev => ({
      ...prev,
      cnaes: prev.cnaes.filter((_, i) => i !== index)
    }))
  }

  const handleMoveCnaeItem = (index: number, direction: "up" | "down") => {
    setNovosDados(prev => {
      const copy = [...prev.cnaes]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= copy.length) return prev
      const temp = copy[index]
      copy[index] = copy[targetIndex]
      copy[targetIndex] = temp
      return { ...prev, cnaes: copy }
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
        enderecoResidencial: s.enderecoResidencial || s.endereco || "",
        emancipacao: s.emancipacao || "Não",
        condicaoSocio: s.condicaoSocio || s.qualificacao || "titular",
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

      const extractedCnaes = extractCnaesFromClient(currentClient, ibgeCnaes)
      setNovosDados(prev => ({
        ...prev,
        cnaes: extractedCnaes
      }))

      toast({ title: "Dados Sincronizados", description: "Os dados dos sócios e CNAEs foram atualizados a partir da Ficha 360º." })
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
            naturezaJuridica: currentClient.naturezaJuridica,
            cnaes: novosDados.cnaes
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

  // Determine available tabs dynamically based on selected events
  const availableTabs = useMemo(() => {
    const tabs = [
      { id: "qualificacao", label: "Qualificação dos Sócios", icon: Users, badge: "Ficha 360º" },
    ]

    if (eventosSelecionados.includes("220") || eventosSelecionados.includes("221") || eventosSelecionados.includes("225") || eventosSelecionados.includes("transformacao") || eventosSelecionados.includes("razao_social")) {
      tabs.push({ id: "razao_social", label: "Nome Empresarial & Fantasia", icon: Building2, badge: "Evento 220/221" })
    }

    if (eventosSelecionados.includes("244") || eventosSelecionados.includes("objeto_social")) {
      tabs.push({ id: "cnaes", label: "Atividades Econômicas & CNAEs", icon: Briefcase, badge: "Evento 244" })
    }

    if (eventosSelecionados.includes("endereco") || eventosSelecionados.includes("211") || eventosSelecionados.includes("209") || eventosSelecionados.includes("210")) {
      tabs.push({ id: "endereco", label: "Endereço da Sede", icon: MapPin, badge: "Evento 211/209" })
    }

    if (eventosSelecionados.includes("capital") || eventosSelecionados.includes("cessao_quotas") || eventosSelecionados.includes("transformacao")) {
      tabs.push({ id: "capital", label: "Capital Social & Quotas", icon: DollarSign, badge: "Capital" })
    }

    if (eventosSelecionados.includes("cessao_quotas") || eventosSelecionados.includes("saida_socio") || eventosSelecionados.includes("entrada_socio") || eventosSelecionados.includes("alteracao_socio") || eventosSelecionados.includes("transformacao")) {
      tabs.push({ id: "titularidade", label: "Cessão & Titularidade", icon: FileSignature, badge: "Quotas" })
    }

    return tabs
  }, [eventosSelecionados])

  // Ensure active tab is valid when modal opens
  useEffect(() => {
    if (isModalOpen && availableTabs.length > 0) {
      const isValid = availableTabs.some(t => t.id === activeTab)
      if (!isValid) {
        setActiveTab(availableTabs[0].id)
      }
    }
  }, [isModalOpen, availableTabs, activeTab])

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
                            onClick={(e) => e.stopPropagation()}
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

        {/* Right Side: Main Dashboard Panel & Action Trigger */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClientId ? (
            <>
              <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 shadow-md">
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base font-bold text-slate-800">
                        Empresa Selecionada para Alteração
                      </CardTitle>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-200">
                      Ficha 360º Integrada
                    </span>
                  </div>
                  <CardDescription className="text-xs text-slate-500">
                    Confira as informações base da empresa e os eventos marcados antes de avançar para a redação das cláusulas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5 space-y-6">
                  {/* Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Razão Social Atual</span>
                      <p className="text-xs font-bold text-slate-800 uppercase">{currentClient?.corporateName || "Carregando..."}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">CNPJ</span>
                      <p className="text-xs font-bold text-slate-800">{currentClient?.cnpj || "NÃO INFORMADO"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Capital Social Atual</span>
                      <p className="text-xs font-bold text-blue-700">
                        R$ {currentClient?.capitalSocial ? currentClient.capitalSocial.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Endereço da Sede</span>
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {[currentClient?.address, currentClient?.neighborhood, currentClient?.city && currentClient?.state ? `${currentClient.city}/${currentClient.state}` : ""].filter(Boolean).join(", ") || "Não informado"}
                      </p>
                    </div>
                  </div>

                  {/* Selected Events List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      Eventos Marcados para esta Alteração ({eventosSelecionados.length})
                    </h4>

                    {eventosSelecionados.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {eventosSelecionados.map((evId) => {
                          const evObj = GRUPOS_EVENTOS.flatMap(g => g.eventos).find(e => e.id === evId)
                          return (
                            <span key={evId} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs">
                              <Sparkles className="h-3 w-3 text-blue-500" />
                              {evObj ? evObj.label : evId}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                        Selecione ao menos um evento no checklist à esquerda para habilitar o botão de avançar.
                      </div>
                    )}
                  </div>

                  {/* Big AVANÇAR Button */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      disabled={eventosSelecionados.length === 0}
                      className="w-full md:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 rounded-xl transition-all"
                    >
                      <Sparkles className="h-4 w-4" />
                      AVANÇAR PARA REDAÇÃO DAS CLÁUSULAS
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

            {/* CARD DE HISTÓRICO E RASCUNHOS DE ALTERAÇÕES */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-sm font-semibold text-slate-800">
                    Histórico de Alterações (Rascunhos e Concluídos)
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-400">
                  Gerencie os rascunhos em andamento ou visualize processos finalizados.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {loadingAlterations ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-xs text-slate-500 font-semibold">Carregando histórico...</span>
                  </div>
                ) : clientAlterations.length > 0 ? (
                  <div className="space-y-3">
                    {clientAlterations.map((alt: any) => (
                      <div 
                        key={alt.id} 
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors gap-3",
                          currentAlterationId === alt.id && "border-blue-300 bg-blue-50/10"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800 uppercase">
                              {alt.label}
                            </span>
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                              alt.status === "CONCLUIDA" 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            )}>
                              {alt.status === "CONCLUIDA" ? "Concluído" : "Salva / Rascunho"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Última atualização: {new Date(alt.updatedAt || alt.createdAt).toLocaleString("pt-BR")} | {alt.eventosSelecionados?.length || 0} eventos
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          {alt.status !== "CONCLUIDA" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 uppercase gap-1"
                              onClick={() => handleCompleteAlteration(alt)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Concluir
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 uppercase gap-1"
                            onClick={() => handleLoadAlteration(alt)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteAlteration(alt.id, alt.label)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs font-semibold uppercase text-slate-400 tracking-widest border border-dashed rounded-xl bg-slate-50/50">
                    Nenhum processo de alteração registrado para esta empresa.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
              <Building2 className="h-10 w-10 text-blue-600/20 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Aguardando Seleção de Empresa</h3>
              <p className="text-xs text-slate-400">Selecione uma empresa do menu à esquerda para iniciar a alteração societária.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL COM SUB-MENU LATERAL POR ABAS PARA CADA EVENTO DE ALTERAÇÃO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-slate-200 shadow-2xl">
          <DialogHeader className="p-5 border-b bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Redação Contratual DREI em Tempo Real
                </div>
                <DialogTitle className="text-lg font-bold text-white">
                  Eventos de Alteração & Redação de Cláusulas
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300">
                  Navegue pelas abas na barra lateral para preencher os dados do evento e visualizar a redação em tempo real.
                </DialogDescription>
              </div>
              {currentClient && (
                <div className="hidden sm:block text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Empresa Ativa</span>
                  <span className="text-xs font-bold text-blue-300 uppercase block">{currentClient.corporateName}</span>
                  {currentAlterationId && (
                    <span className="inline-block mt-1 text-[9px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Rascunho Ativo
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Input to name the process */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 max-w-2xl">
              <div className="space-y-0.5 shrink-0">
                <Label className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Nome / Identificação do Processo</Label>
                <p className="text-[9px] text-slate-400 font-medium">Nomeie para salvar e retomar mais tarde.</p>
              </div>
              <Input 
                placeholder="Ex: Alteração de Sede e Sócios - Julho/26" 
                value={processLabel} 
                onChange={(e) => setProcessLabel(e.target.value)}
                className="h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-amber-400 flex-1 font-bold"
              />
            </div>
          </DialogHeader>

          {/* 2-COLUMN MODAL BODY WITH LATERAL SUBMENU */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-slate-50 font-sans">
            
            {/* LATERAL SIDEBAR NAVIGATION (ABAS) */}
            <div className="w-full md:w-72 bg-white border-r border-slate-200 p-3 space-y-1.5 overflow-y-auto shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 block">
                Abas de Alteração ({availableTabs.length})
              </span>

              {availableTabs.map((tab) => {
                const IconComponent = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition-all duration-200 border",
                      isActive 
                        ? "bg-blue-600 text-white font-bold border-blue-600 shadow-md shadow-blue-500/20 translate-x-1" 
                        : "bg-white hover:bg-slate-100 text-slate-700 font-medium border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-blue-600")} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ml-1",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      {tab.badge}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* MAIN CONTENT AREA FOR ACTIVE TAB */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              
              {/* TAB 1: QUALIFICAÇÃO DOS SÓCIOS */}
              {activeTab === "qualificacao" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        1. Dados dos Sócios & Qualificação Cadastral
                      </h3>
                      <p className="text-xs text-slate-500">Qualificação completa dos sócios para cabeçalho do contrato.</p>
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
                  </div>

                  {/* Accordion dos Sócios */}
                  <div className="space-y-3">
                    {socios.map((s, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                        <div 
                          className={cn(
                            "flex justify-between items-center cursor-pointer p-4 bg-slate-50 hover:bg-slate-100/50 transition-colors border-b",
                            openPartnerIndex !== idx && "border-b-0"
                          )}
                          onClick={() => setOpenPartnerIndex(openPartnerIndex === idx ? null : idx)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-700 h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">
                                {s.nome || "NOVO SÓCIO (SEM NOME)"}
                              </h4>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                {s.condicaoSocio || "SÓCIO"} • {s.cpfCnpj || "CPF NÃO INFORMADO"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
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

                        {openPartnerIndex === idx && (
                          <div className="p-5 space-y-4 bg-white border-t">
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
                                <Label className="text-[9px] text-slate-500 font-bold uppercase">Profissão</Label>
                                <Input 
                                  value={s.profissao || ""} 
                                  onChange={(e) => handlePartnerChange(idx, "profissao", e.target.value)} 
                                  className="bg-white border-slate-200 text-xs" 
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] text-slate-500 font-bold uppercase">Estado Civil</Label>
                                <Input 
                                  value={s.estadoCivil || ""} 
                                  onChange={(e) => handlePartnerChange(idx, "estadoCivil", e.target.value)} 
                                  className="bg-white border-slate-200 text-xs" 
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] text-slate-500 font-bold uppercase">RG e Órgão/UF</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input 
                                    placeholder="Número RG"
                                    value={s.rg || ""} 
                                    onChange={(e) => handlePartnerChange(idx, "rg", e.target.value)} 
                                    className="bg-white border-slate-200 text-xs" 
                                  />
                                  <Input 
                                    placeholder="Órgão/UF"
                                    value={s.rgOrgaoEmissor ? `${s.rgOrgaoEmissor}${s.rgUf ? "/" + s.rgUf : ""}` : ""} 
                                    onChange={(e) => {
                                      const parts = e.target.value.split("/")
                                      handlePartnerChange(idx, "rgOrgaoEmissor", parts[0] || "")
                                      if (parts[1]) handlePartnerChange(idx, "rgUf", parts[1])
                                    }} 
                                    className="bg-white border-slate-200 text-xs" 
                                  />
                                </div>
                              </div>
                              <div className="space-y-1 md:col-span-3">
                                <Label className="text-[9px] text-slate-500 font-bold uppercase">Endereço Residencial do Sócio</Label>
                                <Input 
                                  placeholder="Rua, Número, Bairro, Cidade/UF, CEP"
                                  value={s.enderecoResidencial || s.endereco || ""} 
                                  onChange={(e) => handlePartnerChange(idx, "enderecoResidencial", e.target.value)} 
                                  className="bg-white border-slate-200 text-xs" 
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* REDAÇÃO EM TEMPO REAL: QUALIFICAÇÃO CADASTRAL */}
                  <Card className="border-amber-200 bg-gradient-to-b from-amber-50/40 to-white shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wide">
                        <FileSignature className="h-4 w-4 text-amber-600" />
                        Redação da Cláusula de Qualificação Cadastral (Tempo Real)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs leading-relaxed text-slate-800 space-y-3 font-sans">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider bg-red-600 inline-block px-2 py-0.5 rounded shadow-xs">
                          MODELO DE CLAUSULA DE QUALIFICAÇÃO:
                        </p>
                        
                        {socios.length > 0 ? (
                          socios.map((s, i) => {
                            const isFemale = s.sexo === "Feminino";
                            const nac = s.nacionalidade ? (isFemale && s.nacionalidade.toLowerCase().endsWith("o") ? s.nacionalidade.slice(0, -1) + "a" : s.nacionalidade) : (isFemale ? "brasileira" : "brasileiro");
                            const estCivil = s.estadoCivil ? s.estadoCivil.toLowerCase() : (isFemale ? "solteira" : "solteiro");
                            const prof = s.profissao ? s.profissao.toLowerCase() : (isFemale ? "empresária" : "empresário");

                            let bornStr = "";
                            if (s.dataNascimento) {
                              const parts = s.dataNascimento.split("-");
                              const fmtDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : s.dataNascimento;
                              bornStr = `, nascid${isFemale ? "a" : "o"} em ${fmtDate}`;
                            }

                            let rgStr = s.rg ? `, RG nº: ${s.rg}${s.rgOrgaoEmissor ? " " + s.rgOrgaoEmissor : ""}${s.rgUf ? "/" + s.rgUf : ""}` : "";
                            let cpfStr = s.cpfCnpj ? `, CPF: ${s.cpfCnpj}` : "";

                            const companyAddr = [
                              novosDados.address || currentClient?.address,
                              (novosDados.neighborhood || currentClient?.neighborhood) ? `BAIRRO ${novosDados.neighborhood || currentClient?.neighborhood}` : "",
                              (novosDados.city || currentClient?.city) && (novosDados.state || currentClient?.state) ? `${novosDados.city || currentClient?.city}/${novosDados.state || currentClient?.state}` : "",
                              (novosDados.zipCode || currentClient?.zipCode) ? `CEP ${novosDados.zipCode || currentClient?.zipCode}` : ""
                            ].filter(Boolean).join(", ");

                            const partnerAddr = s.enderecoResidencial || s.endereco || companyAddr || "RAMAL DO ILARIO, S/N, BAIRRO ZONA RURAL, ITAUBAL/AP, CEP 68976-000";
                            const condicao = (s.condicaoSocio || "titular").toLowerCase();
                            const resolvesWord = socios.length > 1 ? "resolvem:" : "resolve:";
                            const companyName = (novosDados.corporateName || currentClient?.corporateName || "NOME DA EMPRESA").toUpperCase();

                            return (
                              <div key={i} className="leading-relaxed border-b last:border-b-0 pb-2 last:pb-0 font-sans">
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">
                                  {s.nome ? s.nome.toUpperCase() : "PRISCILA DUTRA DE MELLO"}, {nac}, {estCivil}{bornStr}, {prof}{rgStr}{cpfStr}, residente e domiciliado {partnerAddr}
                                </span>
                                <span className="text-slate-800">, na qualidade de {condicao} da empresa, </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">
                                  {companyName}
                                </span>
                                <span className="text-slate-800"> com sede na </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">
                                  {companyAddr || "RAMAL DO ILARIO, S/N, BAIRRO ZONA RURAL, ITAUBAL/AP, CEP 68976-000"}
                                </span>
                                <span className="text-slate-800">, {resolvesWord}</span>
                              </div>
                            );
                          })
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 2: RAZÃO SOCIAL & NOME FANTASIA */}
              {activeTab === "razao_social" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      2. Alteração de Razão Social e Nome Fantasia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500 font-bold uppercase">Novo Nome Empresarial / Razão Social</Label>
                        <Input 
                          value={novosDados.corporateName} 
                          onChange={(e) => setNovosDados(prev => ({ ...prev, corporateName: e.target.value }))}
                          className="bg-white border-slate-200 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500 font-bold uppercase">Novo Nome Fantasia</Label>
                        <Input 
                          value={novosDados.nomeFantasia} 
                          onChange={(e) => setNovosDados(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                          className="bg-white border-slate-200 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* REDAÇÃO EM TEMPO REAL: RAZÃO SOCIAL & FANTASIA */}
                  <Card className="border-amber-200 bg-gradient-to-b from-amber-50/40 to-white shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wide">
                        <FileSignature className="h-4 w-4 text-amber-600" />
                        Redação da Cláusula de Nome Empresarial e Fantasia (Tempo Real)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs leading-relaxed text-slate-800 space-y-3 font-sans">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider bg-red-600 inline-block px-2 py-0.5 rounded shadow-xs">
                          MODELO DE CLAUSULA DE TRANSFORMAR, MUDANÇA O NOME EMPRESARIAL E FANTASIA:
                        </p>
                        
                        <div className="leading-relaxed font-sans pt-1">
                          <span className="font-bold text-slate-900">Cláusula Primeira - </span>
                          <span className="text-slate-800">Transformar o tipo jurídico para Sociedade Empresária Limitada, adotando o nome empresarial </span>
                          <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">
                            {(novosDados.corporateName || currentClient?.corporateName || "RANCHO BONANZA LTDA").toUpperCase()}
                          </span>
                          <span className="text-slate-800">, nome fantasia </span>
                          <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">
                            {(novosDados.nomeFantasia || currentClient?.nomeFantasia || (novosDados.corporateName || currentClient?.corporateName || "RANCHO BONANZA").replace(/\s+LTDA$/i, "")).toUpperCase()}
                          </span>
                          <span className="text-slate-800"> e terá sua sede e domicílio no </span>
                          <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">
                            {[
                              novosDados.address || currentClient?.address,
                              (novosDados.neighborhood || currentClient?.neighborhood) ? `BAIRRO ${novosDados.neighborhood || currentClient?.neighborhood}` : "",
                              (novosDados.city || currentClient?.city) && (novosDados.state || currentClient?.state) ? `${novosDados.city || currentClient?.city}/${novosDados.state || currentClient?.state}` : "",
                              (novosDados.zipCode || currentClient?.zipCode) ? `CEP ${novosDados.zipCode || currentClient?.zipCode}` : ""
                            ].filter(Boolean).join(", ") || "RAMAL DO ILARIO, S/N, BAIRRO ZONA RURAL, ITAUBAL/AP, CEP 68976-000"}
                          </span>
                          <span className="text-slate-800">.</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 3: ATIVIDADES ECONÔMICAS & CNAES (EVENTO 244) */}
              {activeTab === "cnaes" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="space-y-5 p-5 border border-blue-200 rounded-xl bg-gradient-to-b from-blue-50/20 to-white shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-blue-100">
                      <div>
                        <h4 className="text-xs font-bold text-blue-900 flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-600" /> 
                          Alteração de Atividades Econômicas (CNAEs) e Objeto Social (Evento 244)
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Adicione ou modifique os CNAEs principais e secundários. Os dados são sincronizados com a Ficha 360º.
                        </p>
                      </div>
                      {currentClient && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-blue-600" />
                          Ficha 360º: {novosDados.cnaes.length} atividade(s)
                        </span>
                      )}
                    </div>

                    {/* Redação do Objeto Social */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-600 font-bold uppercase">Redação Detalhada do Objeto Social</Label>
                      <Textarea 
                        rows={3}
                        placeholder="Descreva detalhadamente as atividades da sociedade para a Cláusula de Objeto Social..."
                        value={novosDados.objetoSocial}
                        onChange={(e) => setNovosDados(prev => ({ ...prev, objetoSocial: e.target.value }))}
                        className="bg-white border-slate-200 text-xs leading-relaxed"
                      />
                    </div>

                    {/* Smart Search CNAE IBGE API */}
                    <div className="space-y-3 pt-2">
                      <Label className="text-[10px] text-slate-600 font-bold uppercase flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5 text-blue-600" />
                        Buscar e Adicionar CNAE da Tabela Oficial do IBGE
                      </Label>

                      <div className="relative">
                        <Input 
                          placeholder="Digite o código (ex: 4711301 ou 4711-3/01) ou palavra-chave (ex: restaurante, farinha, transporte)..."
                          value={cnaeSearchQuery}
                          onChange={(e) => setCnaeSearchQuery(e.target.value)}
                          className="bg-white border-slate-200 text-xs pr-8"
                        />
                        {isLoadingIbge && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600 absolute right-2.5 top-2.5" />
                        )}
                      </div>

                      {/* Dropdown de resultados da pesquisa */}
                      {cnaeSearchResults.length > 0 && (
                        <div className="max-h-48 overflow-y-auto border border-blue-200 rounded-lg bg-white shadow-lg divide-y divide-slate-100">
                          {cnaeSearchResults.map((item: any) => {
                            const cleanId = String(item.id).replace(/\D/g, "");
                            const desc = String(item.descricao || "").toUpperCase();
                            return (
                              <div 
                                key={item.id}
                                className="p-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs transition-colors"
                                onClick={() => handleAddCnaeItem(cleanId, desc)}
                              >
                                <div>
                                  <span className="font-mono font-bold text-blue-700 mr-2 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                    {cleanId}
                                  </span>
                                  <span className="text-slate-700 font-medium">{desc}</span>
                                </div>
                                <Button type="button" size="sm" className="h-7 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                                  + Adicionar
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Adição manual de CNAE */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-blue-100">
                        <Input 
                          placeholder="Código CNAE Manual"
                          value={manualCnaeCode}
                          onChange={(e) => setManualCnaeCode(e.target.value)}
                          className="bg-white border-slate-200 text-xs sm:w-40 font-mono font-bold"
                        />
                        <Input 
                          placeholder="Descrição da atividade..."
                          value={manualCnaeDesc}
                          onChange={(e) => setManualCnaeDesc(e.target.value)}
                          className="bg-white border-slate-200 text-xs flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={() => handleAddCnaeItem(manualCnaeCode, manualCnaeDesc)}
                          className="text-xs font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 shrink-0"
                        >
                          + Adicionar Manual
                        </Button>
                      </div>

                      {/* Lista de CNAEs Ativos/Selecionados */}
                      {novosDados.cnaes.length > 0 ? (
                        <div className="space-y-2 pt-3 border-t border-slate-200">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-between">
                            <span>Atividades Econômicas Selecionadas ({novosDados.cnaes.length})</span>
                            <span className="text-[9px] text-slate-400 font-normal normal-case">Use as setas para reordenar (1º item é o principal)</span>
                          </Label>
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {novosDados.cnaes.map((cnae, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-200 transition-colors shadow-2xs"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <span className="text-[10px] font-bold text-slate-400 w-4 text-center">{idx + 1}.</span>
                                  {cnae.code ? (
                                    <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0">
                                      {cnae.code}
                                    </span>
                                  ) : null}
                                  <span className="text-xs font-medium text-slate-700 truncate">{cnae.description}</span>
                                  {idx === 0 && (
                                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                                      Principal
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveCnaeItem(idx, "up")}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm"
                                    disabled={idx === novosDados.cnaes.length - 1}
                                    onClick={() => handleMoveCnaeItem(idx, "down")}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                    onClick={() => handleRemoveCnaeItem(idx)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white">
                          <Briefcase className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                          <p className="text-xs text-slate-400 font-medium">Nenhuma atividade econômica cadastrada ou selecionada.</p>
                          <p className="text-[10px] text-slate-400">Use a caixa de pesquisa do IBGE para selecionar atividades.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REDAÇÃO EM TEMPO REAL: ATIVIDADES ECONÔMICAS & OBJETO SOCIAL */}
                  <Card className="border-amber-200 bg-gradient-to-b from-amber-50/40 to-white shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wide">
                        <FileSignature className="h-4 w-4 text-amber-600" />
                        Redação da Cláusula de Atividades Econômicas e Objeto Social (Tempo Real)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs leading-relaxed text-slate-800 space-y-3 font-sans">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider bg-red-600 inline-block px-2 py-0.5 rounded shadow-xs">
                          MODELO DE CLAUSULA DE ALTERAÇÃO DE ATIVIDADES ECONÔMICAS (DREI):
                        </p>
                        
                        <div className="space-y-2 pt-1 font-sans">
                          <p className="font-bold text-slate-900">
                            Cláusula Segunda – A sociedade terá por objeto o exercício das seguintes atividades econômicas:
                          </p>
                          {novosDados.cnaes.length > 0 ? (
                            <div className="pl-3 space-y-1">
                              {novosDados.cnaes.map((c, i) => (
                                <div key={i} className="font-bold text-slate-900 bg-yellow-300 px-1.5 py-0.5 rounded border border-yellow-400/50 inline-block w-full">
                                  {c.code ? `${c.code} – ` : ""}{c.description}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic pl-3">[Nenhuma atividade selecionada no formulário acima]</p>
                          )}
                          <p className="pt-2 border-t border-slate-100">
                            <span className="font-bold text-slate-900">Parágrafo único.</span> Em estabelecimento eleito como Sede (Matriz) será(ão) exercida(s) a(s) atividade(s) de:{" "}
                            <span className="bg-yellow-300 text-slate-900 font-bold px-1.5 py-0.5 rounded border border-yellow-400/50">
                              {novosDados.cnaes.map(c => c.description).filter(Boolean).join(", ") || "OBJETO SOCIAL DA EMPRESA"}.
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 4: ENDEREÇO DA SEDE */}
              {activeTab === "endereco" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      3. Alteração do Endereço da Sede
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-[9px] text-slate-500 font-bold uppercase">Logradouro / Rua e Número</Label>
                        <Input 
                          value={novosDados.address} 
                          onChange={(e) => setNovosDados(prev => ({ ...prev, address: e.target.value }))}
                          className="bg-white border-slate-200 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500 font-bold uppercase">Bairro</Label>
                        <Input 
                          value={novosDados.neighborhood} 
                          onChange={(e) => setNovosDados(prev => ({ ...prev, neighborhood: e.target.value }))}
                          className="bg-white border-slate-200 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500 font-bold uppercase">CEP</Label>
                        <Input 
                          value={novosDados.zipCode} 
                          onChange={(e) => setNovosDados(prev => ({ ...prev, zipCode: e.target.value }))}
                          className="bg-white border-slate-200 text-xs"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-[9px] text-slate-500 font-bold uppercase">Cidade</Label>
                        <Input 
                          value={novosDados.city} 
                          onChange={(e) => setNovosDados(prev => ({ ...prev, city: e.target.value }))}
                          className="bg-white border-slate-200 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500 font-bold uppercase">Estado (UF)</Label>
                        <Input 
                          value={novosDados.state} 
                          onChange={(e) => setNovosDados(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                          className="bg-white border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* REDAÇÃO EM TEMPO REAL: ENDEREÇO DA SEDE */}
                  <Card className="border-amber-200 bg-gradient-to-b from-amber-50/40 to-white shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wide">
                        <FileSignature className="h-4 w-4 text-amber-600" />
                        Redação da Cláusula de Alteração de Endereço (Tempo Real)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs leading-relaxed text-slate-800 space-y-2 font-sans">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider bg-red-600 inline-block px-2 py-0.5 rounded shadow-xs">
                          MODELO DE CLAUSULA DE ALTERAÇÃO DE ENDEREÇO DA SEDE:
                        </p>
                        <p className="pt-1">
                          <span className="font-bold text-slate-900">Cláusula de Endereço – </span>
                          <span className="text-slate-800">A sociedade terá sua sede e domicílio alterados para o endereço </span>
                          <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">
                            {[
                              novosDados.address || currentClient?.address,
                              (novosDados.neighborhood || currentClient?.neighborhood) ? `BAIRRO ${novosDados.neighborhood || currentClient?.neighborhood}` : "",
                              (novosDados.city || currentClient?.city) && (novosDados.state || currentClient?.state) ? `${novosDados.city || currentClient?.city}/${novosDados.state || currentClient?.state}` : "",
                              (novosDados.zipCode || currentClient?.zipCode) ? `CEP ${novosDados.zipCode || currentClient?.zipCode}` : ""
                            ].filter(Boolean).join(", ") || "ENDEREÇO DA SEDE"}
                          </span>
                          <span className="text-slate-800">.</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 5: CAPITAL SOCIAL & QUOTAS */}
              {activeTab === "capital" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      4. Alteração de Capital Social & Quotas
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Capital Social Atual (Ficha 360º)</Label>
                          <Input 
                            disabled 
                            value={`R$ ${(currentClient?.capitalSocial || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} 
                            className="bg-slate-100 border-slate-200 text-xs font-bold text-slate-600" 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Novo Capital Social (R$)</Label>
                          <Input 
                            type="number"
                            value={novosDados.capitalSocial || ""} 
                            onChange={(e) => setNovosDados(prev => ({ ...prev, capitalSocial: Number(e.target.value) }))}
                            className="bg-white border-slate-200 text-xs font-bold text-blue-700" 
                          />
                        </div>
                      </div>

                      {/* Quota Distribution Table */}
                      <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-600">Distribuição de Quotas entre Sócios</span>
                        {socios.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-white p-2.5 rounded border border-slate-200">
                            <span className="text-xs font-bold text-slate-800 flex-1 truncate">{s.nome || `Sócio ${idx + 1}`}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold">R$</span>
                              <Input 
                                type="number"
                                value={s.participacao || 0}
                                onChange={(e) => handlePartnerChange(idx, "participacao", Number(e.target.value))}
                                className="w-32 h-8 text-xs font-bold text-center border-slate-300"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* REDAÇÃO EM TEMPO REAL: CAPITAL SOCIAL */}
                  <Card className="border-amber-200 bg-gradient-to-b from-amber-50/40 to-white shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wide">
                        <FileSignature className="h-4 w-4 text-amber-600" />
                        Redação da Cláusula de Alteração de Capital Social (Tempo Real)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs leading-relaxed text-slate-800 space-y-3 font-sans">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider bg-red-600 inline-block px-2 py-0.5 rounded shadow-xs">
                          MODELO DE CLAUSULA DE ALTERAÇÃO DE CAPITAL SOCIAL:
                        </p>
                        
                        <div className="leading-relaxed font-sans pt-1">
                          <span className="font-bold text-slate-900">Cláusula Terceira – </span>
                          <span className="text-slate-800">Capital Social da empresa está atualmente no valor de </span>
                          <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">
                            {currentClient?.capitalSocial ? `R$${currentClient.capitalSocial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${numberToExtensoBRL(currentClient.capitalSocial)})` : "R$20.000,00 (vinte mil reais)"}
                          </span>
                          <span className="text-slate-800">. O acervo do empresário ora transformado passa a ser no valor de </span>
                          <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">
                            {novosDados.capitalSocial ? `R$ ${novosDados.capitalSocial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${numberToExtensoBRL(novosDados.capitalSocial)})` : "R$ 425.000,00 (quatrocentos e vinte e cinco mil reais)"}
                          </span>
                          <span className="text-slate-800">, passa a constituir o capital da nova sociedade, e fica assim distribuído:</span>
                        </div>

                        <div className="pt-2">
                          <table className="w-full border-collapse border border-slate-300 text-xs text-center font-sans">
                            <thead>
                              <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                                <th className="border border-slate-300 p-2 text-left">Sócio</th>
                                <th className="border border-slate-300 p-2">Nº de Quotas</th>
                                <th className="border border-slate-300 p-2">Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {socios.length > 0 ? (
                                socios.map((s, i) => {
                                  const val = Number(s.participacao || 0);
                                  return (
                                    <tr key={i} className="border-b border-slate-200">
                                      <td className="border border-slate-300 p-2 text-left bg-yellow-100 font-bold text-slate-900">
                                        {s.nome ? s.nome.toUpperCase() : "PRISCILA DUTRA DE MELLO"}
                                      </td>
                                      <td className="border border-slate-300 p-2 bg-yellow-100 font-semibold text-slate-900">
                                        {val.toLocaleString("pt-BR")}
                                      </td>
                                      <td className="border border-slate-300 p-2 bg-yellow-100 font-semibold text-slate-900">
                                        R${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr className="border-b border-slate-200">
                                  <td className="border border-slate-300 p-2 bg-yellow-100 font-semibold text-slate-900">
                                    425.000
                                  </td>
                                  <td className="border border-slate-300 p-2 bg-yellow-100 font-semibold text-slate-900">
                                    R$425.000,00
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 6: CESSÃO & TITULARIDADE */}
              {activeTab === "titularidade" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* REDAÇÃO EM TEMPO REAL: TRANSFERÊNCIA DE TITULARIDADE */}
                  <Card className="border-amber-200 bg-gradient-to-b from-amber-50/40 to-white shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wide">
                        <FileSignature className="h-4 w-4 text-amber-600" />
                        Redação da Cláusula de Transferência de Titularidade (Tempo Real)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs leading-relaxed text-slate-800 space-y-3 font-sans">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider bg-red-600 inline-block px-2 py-0.5 rounded shadow-xs">
                          MODELO DE CLAUSULA DE TRANSFERENCIA DE TITULARIDADE:
                        </p>
                        
                        {(() => {
                          const saindoSocio = socios.find(s => s.dataSaida && s.dataSaida !== "") || socios[0] || {};
                          const entrandoSocio = socios.find(s => s.dataIngresso && s.dataIngresso !== "") || socios[1] || socios[0] || {};

                          const corpName = (novosDados.corporateName || currentClient?.corporateName || "F R SILVA TRANSPORTES LTDA").toUpperCase();
                          const cnpjStr = currentClient?.cnpj || "28.154.716/0001-62";
                          const nireStr = currentClient?.nire || "1620014713-1";

                          const g = entrandoSocio.sexo || "Masculino";
                          const isFemale = g === "Feminino";
                          const nac = entrandoSocio.nacionalidade || (isFemale ? "Brasileira" : "Brasileiro");
                          const estCivil = entrandoSocio.estadoCivil || (isFemale ? "Solteira" : "Solteiro");
                          const prof = entrandoSocio.profissao || (isFemale ? "Empresária" : "Empresário");
                          const cpfStr = entrandoSocio.cpfCnpj || "610.001.162-04";
                          const rgVal = entrandoSocio.rg || "314962";
                          const rgOrgao = entrandoSocio.rgOrgaoEmissor ? `${entrandoSocio.rgOrgaoEmissor}${entrandoSocio.rgUf ? " - " + entrandoSocio.rgUf : ""}` : "PTC - AP";

                          const partnerAddr = entrandoSocio.enderecoResidencial || entrandoSocio.endereco || "Rua da Biriba, n° 263, Infraero, Macapa/AP, CEP 68908-784";
                          
                          const companyAddrParts = [
                            novosDados.address || currentClient?.address || "Rua da Biriba, n° 263, Lote Morada das Palmeiras",
                            novosDados.neighborhood || currentClient?.neighborhood || "Infraero",
                            `Município ${novosDados.city || currentClient?.city || "Macapa"}/${novosDados.state || currentClient?.state || "AP"}`,
                            `CEP ${novosDados.zipCode || currentClient?.zipCode || "68908-784"}`
                          ].join(", ");

                          const saindoNome = (saindoSocio.nome || "FABIO RODRIGO E SILVA FILHO").toUpperCase();
                          const entrandoNome = (entrandoSocio.nome || "FABIO RODRIGO E SILVA").toUpperCase();
                          const cessaoVal = Number(saindoSocio.participacao || entrandoSocio.participacao || novosDados.capitalSocial || currentClient?.capitalSocial || 100000);
                          const cessaoStr = `R$ ${cessaoVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${numberToExtensoBRL(cessaoVal).toUpperCase()})`;

                          return (
                            <div className="space-y-3 font-sans">
                              <p className="leading-relaxed border-b pb-2">
                                <span className="font-bold text-slate-900">Cláusula Primeira – TRANSFERÊNCIA DE TITULARIDADE</span><br />
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{saindoNome}</span>
                                <span className="text-slate-800">, transfere a titularidade desta Sociedade Empresaria Limitada </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{corpName}</span>
                                <span className="text-slate-800"> para </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{entrandoNome}</span>
                                <span className="text-slate-800">, nacionalidade </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{nac}</span>
                                <span className="text-slate-800">, </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{prof}</span>
                                <span className="text-slate-800">, </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{estCivil}</span>
                                <span className="text-slate-800">, CPF: </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{cpfStr}</span>
                                <span className="text-slate-800">, documento de identidade </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{rgVal}</span>
                                <span className="text-slate-800">, </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{rgOrgao}</span>
                                <span className="text-slate-800">, com domicílio/residência à </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{partnerAddr}</span>
                                <span className="text-slate-800">, que passará a ser o sócio da </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{corpName}</span>
                                <span className="text-slate-800"> com sede e domicílio na </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{companyAddrParts}</span>
                                <span className="text-slate-800">, registrada nesta Junta Comercial do Estado do Amapá - JUCAP sob NIRE: </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{nireStr}</span>
                                <span className="text-slate-800">, CNPJ </span>
                                <span className="bg-yellow-300 text-slate-900 font-semibold px-1 py-0.5 rounded border border-yellow-400/50">{cnpjStr}</span>
                                <span className="text-slate-800">, com sub-rogação de todos os direitos e obrigações pertinentes.</span>
                              </p>

                              <p className="leading-relaxed border-b pb-2">
                                <span className="font-bold text-slate-900">Cláusula Segunda - </span>
                                <span className="text-slate-800">A administração da empresa caberá ao único sócio administrador </span>
                                <span className="font-bold text-slate-900">{entrandoNome}</span>
                                <span className="text-slate-800">, com os poderes e atribuições de representação ativa e passiva, judicial e extrajudicial, podendo praticar todos os atos compreendidos no objeto.</span>
                              </p>

                              <p className="leading-relaxed border-b pb-2">
                                <span className="font-bold text-slate-900">Cláusula Terceira - </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{saindoNome}</span>
                                <span className="text-slate-800">, declara haver recebido, neste ato, em moeda corrente, a quantia de </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{cessaoStr}</span>
                                <span className="text-slate-800">, assim como declara ter recebido todos os seus direitos e haveres, nada mais tendo sobre elas a reclamar, seja a qual título for, nem do cessionário e nem da empresa individual de responsabilidade limitada, dando-lhes plena, geral, rasa e irrevogável quitação.</span>
                              </p>

                              <p className="leading-relaxed">
                                <span className="font-bold text-slate-900">Cláusula Quarta - </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{entrandoNome}</span>
                                <span className="text-slate-800">, único Sócio Administrador da empresa declara, sob as penas da lei, de que não está impedido de exercer a administração da empresa, por lei especial, ou em virtude de condenação criminal, ou por se encontrar sob os efeitos dela, a pena que vede, ainda que temporariamente, o acesso a cargos públicos; ou por crime falimentar, de prevaricação, peita ou suborno, concussão, peculato, ou contra a economia popular, contra o sistema financeiro nacional, contra normas de defesa da concorrência, contra as relações de consumo, fé pública, ou a propriedade.</span>
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* REDAÇÃO EM TEMPO REAL: CESSÃO DE QUOTAS E SAÍDA DE SÓCIO */}
                  <Card className="border-amber-200 bg-gradient-to-b from-amber-50/40 to-white shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-2 uppercase tracking-wide">
                        <FileSignature className="h-4 w-4 text-amber-600" />
                        Redação da Cláusula de Cessão de Quotas e Saída de Sócio (Tempo Real)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs leading-relaxed text-slate-800 space-y-3 font-sans">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider bg-red-600 inline-block px-2 py-0.5 rounded shadow-xs">
                          MODELO DE CESSÃO DE QUOTAS E TRANSFERENCIA DE TITULARIDADE:
                        </p>
                        
                        {(() => {
                          const cedeSocio = socios.find(s => s.dataSaida && s.dataSaida !== "") || socios[0] || {};
                          const recebeSocio = socios.find(s => s.dataIngresso && s.dataIngresso !== "") || socios[1] || socios[0] || {};

                          const cedeNome = (cedeSocio.nome || "ORLANDO FERREIRA COUTINHO JUNIOR").toUpperCase();
                          const recebeNome = (recebeSocio.nome || "DISRAELI DOS SANTOS ANDRADE").toUpperCase();

                          const cedeVal = Number(cedeSocio.participacao || 16500);
                          const cedeValStr = `R$${cedeVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${numberToExtensoBRL(cedeVal)})`;

                          const totalVal = Number(novosDados.capitalSocial || currentClient?.capitalSocial || 50000);
                          const totalValStr = `R$${totalVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${numberToExtensoBRL(totalVal)})`;
                          const totalQuotasStr = `${totalVal.toLocaleString("pt-BR")} (${numberToExtensoBRL(totalVal).replace(" reais", "").replace(" real", "")})`;

                          const isFemaleRecebe = recebeSocio.sexo === "Feminino";

                          return (
                            <div className="space-y-3 font-sans">
                              <p className="leading-relaxed border-b pb-2">
                                <span className="font-bold text-slate-900">Cláusula Primeira – DA SAÍDA DE SÓCIO</span><br />
                                <span className="text-slate-800">O sócio </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{cedeNome}</span>
                                <span className="text-slate-800"> resolve ceder e transferir a totalidade de suas cotas do capital social </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{cedeValStr}</span>
                                <span className="text-slate-800"> à </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{recebeNome}</span>
                              </p>

                              <p className="leading-relaxed">
                                <span className="text-slate-800">Com essa transferência, </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{cedeNome}</span>
                                <span className="text-slate-800"> se retira da sociedade. As cotas cedidas totalizam </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{totalValStr}</span>
                                <span className="text-slate-800">, dividido em </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{totalQuotasStr}</span>
                                <span className="text-slate-800"> unidades, cada uma no valor de R$1,00 (um real). {isFemaleRecebe ? "A sócia" : "O sócio"}, </span>
                                <span className="bg-yellow-300 text-slate-900 font-bold px-1 py-0.5 rounded border border-yellow-400/50">{recebeNome}</span>
                                <span className="text-slate-800">, passará a integrar a sociedade na qualidade de titular dessas cotas.</span>
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            </div>
          </div>

          {/* Modal Footer with Actions */}
          <DialogFooter className="p-4 border-t bg-slate-100/90 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-bold text-slate-600 border-slate-300 w-full sm:w-auto"
            >
              Voltar e Selecionar Outros Eventos
            </Button>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                className="text-xs font-bold border-amber-300 text-amber-700 hover:bg-amber-50 uppercase h-9 px-4 gap-1.5"
                onClick={() => handleSaveAlteration("SALVA")}
              >
                <FileText className="h-4 w-4" />
                Salvar Rascunho
              </Button>

              <Button
                type="button"
                variant="outline"
                className="text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 uppercase h-9 px-4 gap-1.5"
                onClick={() => handleSaveAlteration("CONCLUIDA")}
              >
                <Check className="h-4 w-4" />
                Salvar e Concluir
              </Button>

              <Button 
                type="button"
                onClick={handleGenerateContract}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 shadow-md flex items-center gap-1.5 uppercase"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Gerar Word (.docx)
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
