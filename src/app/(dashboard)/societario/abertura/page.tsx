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
  Sparkles,
  Activity,
  Layers,
  Power,
  Award,
  Globe,
  PlusCircle,
  HelpCircle,
  AlertCircle,
  Save,
  CheckSquare
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
import { cn, numberToExtensoBRL } from "@/lib/utils"

interface CnaeItem {
  code: string;
  description: string;
}

export default function AberturaSocietariaPage() {
  const firestore = useFirestore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [openPartnerIndex, setOpenPartnerIndex] = useState<number | null>(0)
  
  // PDF download states
  const [printData, setPrintData] = useState<any>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("dados_gerais")

  // Save & Load process states
  const [currentOpeningId, setCurrentOpeningId] = useState<string | null>(null)
  const [processLabel, setProcessLabel] = useState<string>("")
  const [protocoloJunta, setProtocoloJunta] = useState<string>("")
  const [statusProtocolo, setStatusProtocolo] = useState<string>("Aguardando Protocolo")
  const [obsProtocolo, setObsProtocolo] = useState<string>("")
  const [isObjetoSocialEdited, setIsObjetoSocialEdited] = useState(false)

  // Fetch all company openings
  const openingsQuery = useMemoFirebase(() => collection(firestore, "societaryOpenings"), [firestore])
  const { data: allOpenings = [], isLoading: loadingOpenings } = useCollection(openingsQuery)

  // Filter openings (all drafts)
  const openingsList = useMemo(() => {
    return (allOpenings || [])
      .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
  }, [allOpenings])

  // Form State
  const [dadosGerais, setDadosGerais] = useState({
    compostaPorSocio: "individual", // individual vs socios
    naturezaJuridica: "Sociedade LTDA (Unipessoal)",
    faturamentoAnual: "ME",
    startup: "Não",
    dataInicioAtividades: ""
  })

  const [nomeFantasia, setNomeFantasia] = useState({
    temNomeFantasia: "Não",
    nomeFantasia: "",
    opcaoNome1: "",
    opcaoNome2: "",
    opcaoNome3: ""
  })

  const [endereco, setEndereco] = useState({
    municipioSearch: "",
    naturezaImovel: "Urbano",
    cep: "",
    tipoLogradouro: "RUA",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    iptu: "",
    uf: "AP",
    municipio: "MACAPA",
    referencia: "",
    areaTotalEdificada: 0,
    areaEmpreendimento: 0,
    emailEmpresa: "",
    telefoneEmpresa: ""
  })

  const [atividades, setAtividades] = useState<{
    capitalSocial: number;
    atividadePrincipal: CnaeItem | null;
    atividadesSecundarias: CnaeItem[];
    objetoSocial: string;
  }>({
    capitalSocial: 10000,
    atividadePrincipal: null,
    atividadesSecundarias: [],
    objetoSocial: ""
  })

  // Partners array state
  const [socios, setSocios] = useState<any[]>([])

  // IBGE CNAEs subclasses list
  const [ibgeCnaes, setIbgeCnaes] = useState<any[]>([])
  const [isLoadingIbge, setIsLoadingIbge] = useState<boolean>(false)
  const [cnaeSearchQuery, setCnaeSearchQuery] = useState("")
  const [cnaeSearchResults, setCnaeSearchResults] = useState<any[]>([])
  const [cnaeSearchTarget, setCnaeSearchTarget] = useState<"principal" | "secundaria">("principal")

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
    }).slice(0, 30)

    setCnaeSearchResults(filtered)
  }, [cnaeSearchQuery, ibgeCnaes])

  // ViaCEP integration
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const handleCepSearch = async () => {
    const cleanCep = endereco.cep.replace(/\D/g, "")
    if (cleanCep.length !== 8) {
      toast({ variant: "destructive", title: "CEP inválido", description: "O CEP precisa conter 8 números." })
      return
    }
    setIsLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      if (res.ok) {
        const data = await res.json()
        if (data.erro) {
          toast({ variant: "destructive", title: "CEP não encontrado", description: "Verifique o CEP e tente novamente." })
        } else {
          setEndereco(prev => ({
            ...prev,
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            municipio: data.localidade || "",
            uf: data.uf || ""
          }))
          toast({ title: "CEP Encontrado", description: "Endereço preenchido com sucesso." })
        }
      }
    } catch (err) {
      console.error(err)
      toast({ variant: "destructive", title: "Erro na busca", description: "Não foi possível consultar o CEP." })
    } finally {
      setIsLoadingCep(false)
    }
  }

  // Calculate sum of shares distributed
  const totalDistributedShares = useMemo(() => {
    return socios.reduce((sum, s) => sum + Number(s.participacao || 0), 0)
  }, [socios])

  // Verification if share distribution matches capital social
  const isSharesDistributionBalanced = useMemo(() => {
    return Math.abs(totalDistributedShares - (atividades.capitalSocial || 0)) < 0.01
  }, [totalDistributedShares, atividades.capitalSocial])

  // Smart share distribution tool
  const distributeSharesEqually = () => {
    if (socios.length === 0) {
      toast({ variant: "destructive", title: "Nenhum sócio", description: "Adicione sócios antes de distribuir as cotas." })
      return
    }
    const cap = Number(atividades.capitalSocial) || 0
    if (cap <= 0) {
      toast({ variant: "destructive", title: "Capital Social inválido", description: "Defina o Capital Social na Aba 'Atividades & Capital' antes de distribuir." })
      return
    }

    const equalAmount = Number((cap / socios.length).toFixed(2))
    const updated = socios.map((s, idx) => {
      // Adjust the last partner to prevent rounding issues
      if (idx === socios.length - 1) {
        const cumulative = equalAmount * (socios.length - 1)
        return {
          ...s,
          participacao: Number((cap - cumulative).toFixed(2)),
          participacaoPercentual: Number(((cap - cumulative) / cap * 100).toFixed(4))
        }
      }
      return {
        ...s,
        participacao: equalAmount,
        participacaoPercentual: Number((equalAmount / cap * 100).toFixed(4))
      }
    })
    setSocios(updated)
    toast({ title: "Cotas Distribuídas", description: "As cotas foram divididas igualmente entre os sócios." })
  }

  // Partner handlers
  const handleAddPartner = () => {
    setSocios(prev => [
      ...prev,
      {
        nome: "",
        cpfCnpj: "",
        dataNascimento: "",
        rg: "",
        rgOrgaoEmissor: "",
        rgUf: "AP",
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
        condicaoSocio: "Sócio",
        dataIngresso: dadosGerais.dataInicioAtividades || "", // incluir data de inicio na empresa
        dataSaida: "",
        participacao: 0,
        participacaoPercentual: 0,
        condicaoAdministrador: "Administrador",
        dataInicioMandato: "",
        dataFimMandato: "",
        cargoDirecao: ""
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
      const target = { ...copy[index], [field]: value }

      // Auto-calculate percentages/values if shares/capital is modified
      const cap = Number(atividades.capitalSocial) || 0
      if (cap > 0) {
        if (field === "participacao") {
          target.participacaoPercentual = Number(((Number(value) / cap) * 100).toFixed(4))
        } else if (field === "participacaoPercentual") {
          target.participacao = Number(((Number(value) / 100) * cap).toFixed(2))
        }
      }

      copy[index] = target
      return copy
    })
  }

  // Auto-generate Objeto Social based on selected CNAEs
  useEffect(() => {
    const principal = atividades.atividadePrincipal ? [atividades.atividadePrincipal.description] : []
    const secundarias = atividades.atividadesSecundarias.map(c => c.description)
    const combined = [...principal, ...secundarias].filter(Boolean)
    
    if (combined.length > 0) {
      const generated = "A empresa terá por objeto social a exploração das seguintes atividades econômicas: " + combined.join("; ").toUpperCase() + "."
      if (!isObjetoSocialEdited) {
        setAtividades(prev => ({
          ...prev,
          objetoSocial: generated
        }))
      }
    } else {
      if (!isObjetoSocialEdited) {
        setAtividades(prev => ({
          ...prev,
          objetoSocial: ""
        }))
      }
    }
  }, [atividades.atividadePrincipal, atividades.atividadesSecundarias, isObjetoSocialEdited])

  const handleSaveOpening = (status: "SALVO" | "CONCLUIDO") => {
    let finalLabel = processLabel.trim()
    if (!finalLabel || finalLabel.startsWith("Nova Abertura -")) {
      finalLabel = `Nova Abertura - ${nomeFantasia.nomeFantasia || nomeFantasia.opcaoNome1 || "Sem Nome"}`
    }
    
    const openingId = currentOpeningId || doc(collection(firestore, "societaryOpenings")).id
    const openingDocRef = doc(firestore, "societaryOpenings", openingId)

    const dataToSave: any = {
      id: openingId,
      label: finalLabel,
      status: status,
      dadosGerais: dadosGerais,
      nomeFantasia: nomeFantasia,
      endereco: endereco,
      atividades: atividades,
      socios: socios,
      protocoloJunta: protocoloJunta,
      statusProtocolo: statusProtocolo,
      obsProtocolo: obsProtocolo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const existing = (allOpenings || []).find((alt: any) => alt.id === openingId)
    if (existing) {
      dataToSave.createdAt = existing.createdAt || dataToSave.createdAt
    }

    setDocumentNonBlocking(openingDocRef, dataToSave, { merge: true })

    setCurrentOpeningId(openingId)
    setProcessLabel(finalLabel)

    toast({
      title: status === "CONCLUIDO" ? "Abertura Concluída!" : "Rascunho de Abertura Salvo!",
      description: status === "CONCLUIDO" 
        ? `O processo "${finalLabel}" foi marcado como Concluído.` 
        : `O progresso do processo "${finalLabel}" foi salvo com sucesso.`
    })
  }

  const handleLoadOpening = (open: any) => {
    setCurrentOpeningId(open.id)
    setProcessLabel(open.label || "")
    setProtocoloJunta(open.protocoloJunta || "")
    setStatusProtocolo(open.statusProtocolo || "Aguardando Protocolo")
    setObsProtocolo(open.obsProtocolo || "")

    if (open.dadosGerais) setDadosGerais(open.dadosGerais)
    if (open.nomeFantasia) setNomeFantasia(open.nomeFantasia)
    if (open.endereco) setEndereco(open.endereco)
    if (open.atividades) {
      setAtividades(open.atividades)
      setIsObjetoSocialEdited(!!open.atividades.objetoSocial)
    }
    if (open.socios) setSocios(open.socios)

    toast({
      title: "Rascunho Carregado",
      description: `O processo "${open.label}" foi carregado com sucesso.`
    })

    setIsModalOpen(true)
  }

  const handleDeleteOpening = (openId: string, label: string) => {
    if (confirm(`Tem certeza que deseja excluir permanentemente o rascunho de abertura "${label}"?`)) {
      const openingDocRef = doc(firestore, "societaryOpenings", openId)
      deleteDocumentNonBlocking(openingDocRef)
      if (currentOpeningId === openId) {
        setCurrentOpeningId(null)
        setProcessLabel("")
      }
      toast({
        title: "Processo Excluído",
        description: `O processo de abertura "${label}" foi removido.`
      })
    }
  }

  const handleDownloadPDF = async (open: any) => {
    setIsGeneratingPdf(true)
    setPrintData(open)
    
    toast({ title: "Gerando PDF...", description: "Aguarde um momento enquanto preparamos a ficha cadastral." })

    // Aguarda o React renderizar o template invisível no DOM
    setTimeout(async () => {
      try {
        const element = document.getElementById("print-pdf-template")
        if (!element) {
          throw new Error("Template de impressão não encontrado")
        }

        const html2canvas = (await import('html2canvas')).default
        const { jsPDF } = await import('jspdf')

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/png')
        
        // Formato Retrato A4: 210mm x 297mm
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        
        const pageHeight = 295; // A4 útil
        let heightLeft = pdfHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
          heightLeft -= pageHeight
        }

        const cleanLabel = (open.label || "Ficha_Abertura").replace(/\s+/g, "_")
        pdf.save(`Ficha_${cleanLabel}.pdf`)
        toast({ title: "Sucesso!", description: "Ficha cadastral em PDF baixada com sucesso." })
      } catch (err: any) {
        console.error(err)
        toast({ variant: "destructive", title: "Erro ao gerar PDF", description: err.message || "Não foi possível gerar a ficha em PDF." })
      } finally {
        setPrintData(null)
        setIsGeneratingPdf(false)
      }
    }, 600)
  }

  const handleCreateNewOpening = () => {
    setCurrentOpeningId(null)
    setProcessLabel("")
    setProtocoloJunta("")
    setStatusProtocolo("Aguardando Protocolo")
    setObsProtocolo("")
    setIsObjetoSocialEdited(false)
    setDadosGerais({
      compostaPorSocio: "individual",
      naturezaJuridica: "Sociedade LTDA (Unipessoal)",
      faturamentoAnual: "ME",
      startup: "Não",
      dataInicioAtividades: ""
    })
    setNomeFantasia({
      temNomeFantasia: "Não",
      nomeFantasia: "",
      opcaoNome1: "",
      opcaoNome2: "",
      opcaoNome3: ""
    })
    setEndereco({
      municipioSearch: "",
      naturezaImovel: "Urbano",
      cep: "",
      tipoLogradouro: "RUA",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      iptu: "",
      uf: "AP",
      municipio: "MACAPA",
      referencia: "",
      areaTotalEdificada: 0,
      areaEmpreendimento: 0,
      emailEmpresa: "",
      telefoneEmpresa: ""
    })
    setAtividades({
      capitalSocial: 10000,
      atividadePrincipal: null,
      atividadesSecundarias: [],
      objetoSocial: ""
    })
    setSocios([])
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Abertura de Empresas</h1>
          <p className="text-xs text-slate-500 font-medium">Inicie formulários de novas constituições de CNPJ, controle rascunhos e acompanhe protocolos da Junta Comercial.</p>
        </div>
        <Button 
          onClick={handleCreateNewOpening}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 shadow-md flex items-center gap-1.5 uppercase rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Nova Abertura
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main Panel - Saved Drafts */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-semibold text-slate-800">
                Histórico de Processos de Abertura (Rascunhos e Protocolos)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Gerencie e edite os processos de constituição de novas empresas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingOpenings ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-xs text-slate-500 font-semibold">Carregando processos...</span>
              </div>
            ) : openingsList.length > 0 ? (
              <div className="space-y-3">
                {openingsList.map((open: any) => (
                  <div 
                    key={open.id} 
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors gap-3",
                      currentOpeningId === open.id && "border-blue-300 bg-blue-50/10"
                    )}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          {open.label}
                        </span>
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                          open.status === "CONCLUIDO" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        )}>
                          {open.status === "CONCLUIDO" ? "Concluído" : "Salva / Rascunho"}
                        </span>
                        {open.protocoloJunta && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            Junta: {open.protocoloJunta} ({open.statusProtocolo || "Deferido"})
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 text-[10px] text-slate-400 font-medium">
                        <p>Capital: R$ {(open.atividades?.capitalSocial || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        <p>Sócios: {open.socios?.length || 0} cadastrado(s)</p>
                        <p>Atualizado em: {new Date(open.updatedAt || open.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 uppercase gap-1 rounded-lg"
                        onClick={() => handleDownloadPDF(open)}
                        disabled={isGeneratingPdf}
                      >
                        {isGeneratingPdf && printData?.id === open.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        PDF Ficha
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 uppercase gap-1 rounded-lg"
                        onClick={() => handleLoadOpening(open)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        onClick={() => handleDeleteOpening(open.id, open.label)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-semibold uppercase text-slate-400 tracking-widest border border-dashed rounded-xl bg-slate-50/50">
                Nenhum processo de abertura registrado. Clique em "Nova Abertura" acima para começar.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL PRINCIPAL DE PREENCHIMENTO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-slate-200 shadow-2xl">
          <DialogHeader className="p-5 border-b bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Preenchimento de Nova Abertura de CNPJ
                </div>
                <DialogTitle className="text-lg font-bold text-white">
                  Formulário de Constituição Empresarial
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300">
                  Preencha os dados organizados em abas. O progresso pode ser salvo para edição futura.
                </DialogDescription>
              </div>
            </div>

            {/* Input to name the process */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 max-w-2xl">
              <div className="space-y-0.5 shrink-0">
                <Label className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Identificação do Rascunho / Processo</Label>
                <p className="text-[9px] text-slate-400 font-medium">Dê um nome para identificar este processo na lista principal.</p>
              </div>
              <Input 
                placeholder="Ex: Abertura Rancho Bonanza - ME" 
                value={processLabel} 
                onChange={(e) => setProcessLabel(e.target.value)}
                className="h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-amber-400 flex-1 font-bold"
              />
            </div>
          </DialogHeader>

          {/* Body with Sidebar Layout */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-slate-50 font-sans">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-72 bg-white border-r border-slate-200 p-3 space-y-1.5 overflow-y-auto shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1 block">
                Abas de Preenchimento
              </span>

              {[
                { id: "dados_gerais", label: "1. Dados do Negócio", icon: Building2, badge: "Geral" },
                { id: "socios", label: "2. Sócios & Cotas", icon: Users, badge: "QSA" },
                { id: "nome_empresarial", label: "3. Nome Empresarial", icon: FileSignature, badge: "Nomes" },
                { id: "endereco", label: "4. Endereço Sede", icon: MapPin, badge: "Sede" },
                { id: "atividades", label: "5. Atividades & Capital", icon: Briefcase, badge: "CNAEs" },
                { id: "protocolo", label: "6. Protocolo Junta", icon: Award, badge: "Jucap" }
              ].map((tab) => {
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

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              
              {/* TAB 1: DADOS GERAIS */}
              {activeTab === "dados_gerais" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="bg-white border-b pb-4">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="h-4.5 w-4.5 text-blue-600" />
                        Informações Iniciais do Negócio
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Selecione as diretrizes de composição jurídica e tributária da nova empresa.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-6">
                      
                      {/* Individual or Partners */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">A empresa será composta por um empresário individual ou ela terá sócios?</Label>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setDadosGerais(prev => ({ ...prev, compostaPorSocio: "individual" }))}
                            className={cn(
                              "flex-1 p-3.5 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2",
                              dadosGerais.compostaPorSocio === "individual" 
                                ? "border-blue-500 bg-blue-50/50 text-blue-700" 
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                          >
                            <User className="h-4 w-4" />
                            Somente eu
                          </button>
                          <button
                            type="button"
                            onClick={() => setDadosGerais(prev => ({ ...prev, compostaPorSocio: "socios" }))}
                            className={cn(
                              "flex-1 p-3.5 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2",
                              dadosGerais.compostaPorSocio === "socios" 
                                ? "border-blue-500 bg-blue-50/50 text-blue-700" 
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                          >
                            <Users className="h-4 w-4" />
                            Terei sócios
                          </button>
                        </div>
                      </div>

                      {/* Natureza Jurídica */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Qual a sua natureza jurídica?</Label>
                        <div className="flex gap-4 flex-wrap">
                          {["Empresário Individual", "Sociedade LTDA (Unipessoal)", "Sociedade Limitada (LTDA)"].map((nat) => (
                            <button
                              key={nat}
                              type="button"
                              onClick={() => setDadosGerais(prev => ({ ...prev, naturezaJuridica: nat }))}
                              className={cn(
                                "flex-1 min-w-[200px] p-3.5 rounded-xl border text-center font-bold text-xs transition-all",
                                dadosGerais.naturezaJuridica === nat 
                                  ? "border-blue-500 bg-blue-50/50 text-blue-700" 
                                  : "border-slate-200 bg-white hover:bg-slate-50"
                              )}
                            >
                              {nat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Faturamento Anual */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">Qual o faturamento anual previsto para sua empresa?</Label>
                        <div className="flex flex-col gap-2">
                          {[
                            { id: "ME", label: "Até R$ 360 mil (ME) - Microempresa" },
                            { id: "EPP", label: "Entre R$ 360 mil e R$ 4,8 milhões (EPP) - Empresa de Pequeno Porte" },
                            { id: "OUTROS", label: "Acima de R$ 4,8 Milhões (OUTROS / Lucro Presumido ou Real)" }
                          ].map((fat) => (
                            <button
                              key={fat.id}
                              type="button"
                              onClick={() => setDadosGerais(prev => ({ ...prev, faturamentoAnual: fat.id }))}
                              className={cn(
                                "p-3 rounded-xl border text-left font-bold text-xs transition-all flex items-center justify-between",
                                dadosGerais.faturamentoAnual === fat.id 
                                  ? "border-blue-500 bg-blue-50/10 text-blue-700" 
                                  : "border-slate-200 bg-white hover:bg-slate-50/50"
                              )}
                            >
                              <span>{fat.label}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full font-black uppercase">
                                {fat.id}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Startup & Data Início */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700">A empresa será uma startup?</Label>
                          <div className="flex gap-4">
                            {["Não", "Sim"].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setDadosGerais(prev => ({ ...prev, startup: opt }))}
                                className={cn(
                                  "flex-1 p-3 rounded-xl border text-center font-bold text-xs transition-all",
                                  dadosGerais.startup === opt 
                                    ? "border-blue-500 bg-blue-50/50 text-blue-700" 
                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Data de Início das Atividades
                          </Label>
                          <Input
                            type="date"
                            value={dadosGerais.dataInicioAtividades}
                            onChange={(e) => setDadosGerais(prev => ({ ...prev, dataInicioAtividades: e.target.value }))}
                            className="bg-white border-slate-200 text-xs h-10 font-medium"
                          />
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 2: SÓCIOS & COTAS */}
              {activeTab === "socios" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-blue-600" />
                        Qualificação do Quadro de Sócios e Administradores
                      </h3>
                      <p className="text-xs text-slate-500">Cadastre os sócios e gerencie suas participações societárias.</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="h-9 text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 rounded-lg"
                      onClick={handleAddPartner}
                    >
                      <Plus className="h-4 w-4" /> Adicionar Sócio
                    </Button>
                  </div>

                  {/* Share Distribution Dashboard Block */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                      <div>
                        <Label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                          Divisão Societária & Capital Social
                        </Label>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Distribua o capital entre os sócios cadastrados de forma igualitária ou individual.
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={distributeSharesEqually}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs h-8 px-4 font-bold rounded-lg uppercase"
                      >
                        Distribuir Cotas Igualmente
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Capital Social Declarado</span>
                        <span className="text-xs font-black text-blue-700">
                          R$ {Number(atividades.capitalSocial).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Distribuído</span>
                        <span className="text-xs font-black text-slate-800">
                          R$ {totalDistributedShares.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status da Balança</span>
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold mt-0.5 px-2 py-0.5 rounded border",
                          isSharesDistributionBalanced 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {isSharesDistributionBalanced ? (
                            <>
                              <Check className="h-3 w-3" /> Distribuição Completa (100%)
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3" /> Incompleto ({((totalDistributedShares / (atividades.capitalSocial || 1)) * 100).toFixed(1)}%)
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Partners Accordion */}
                  {socios.length > 0 ? (
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
                                <h4 className="text-xs font-bold text-slate-800 uppercase">
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
                                  R$ {Number(s.participacao).toLocaleString("pt-BR")} ({Number(s.participacaoPercentual).toFixed(2)}%)
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
                              
                              {/* 1. Share Calculator */}
                              <div className="border border-blue-100 bg-blue-50/10 p-3 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-blue-700 font-black uppercase">Participação de Capital (R$)</Label>
                                  <Input
                                    type="number"
                                    placeholder="Ex: 50000"
                                    value={s.participacao || ""}
                                    onChange={(e) => handlePartnerChange(idx, "participacao", e.target.value)}
                                    className="bg-white border-blue-200 text-xs font-bold text-blue-700"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-blue-700 font-black uppercase">Participação Societária (%)</Label>
                                  <Input
                                    type="number"
                                    placeholder="Ex: 50"
                                    value={s.participacaoPercentual || ""}
                                    onChange={(e) => handlePartnerChange(idx, "participacaoPercentual", e.target.value)}
                                    className="bg-white border-blue-200 text-xs font-bold text-blue-700"
                                  />
                                </div>
                              </div>

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
                                    onChange={(e) => handlePartnerChange(idx, "profissao", e.target.value.toUpperCase())} 
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
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Nacionalidade</Label>
                                  <Input 
                                    value={s.nacionalidade || ""} 
                                    onChange={(e) => handlePartnerChange(idx, "nacionalidade", e.target.value)} 
                                    className="bg-white border-slate-200 text-xs" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">E-mail</Label>
                                  <Input 
                                    type="email"
                                    value={s.email || ""} 
                                    onChange={(e) => handlePartnerChange(idx, "email", e.target.value)} 
                                    className="bg-white border-slate-200 text-xs" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">RG / Número Identidade</Label>
                                  <Input 
                                    value={s.rg || ""} 
                                    onChange={(e) => handlePartnerChange(idx, "rg", e.target.value)} 
                                    className="bg-white border-slate-200 text-xs" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Órgão Emissor / UF</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input 
                                      placeholder="Ex: PTC"
                                      value={s.rgOrgaoEmissor || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "rgOrgaoEmissor", e.target.value.toUpperCase())} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                    <Input 
                                      placeholder="Ex: AP"
                                      value={s.rgUf || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "rgUf", e.target.value.toUpperCase())} 
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
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
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Sexo</Label>
                                  <Select
                                    value={s.sexo || "Masculino"}
                                    onValueChange={(val) => handlePartnerChange(idx, "sexo", val)}
                                  >
                                    <SelectTrigger className="bg-white border-slate-200 text-xs h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Masculino">Masculino</SelectItem>
                                      <SelectItem value="Feminino">Feminino</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Condição na Empresa</Label>
                                  <Select
                                    value={s.condicaoSocio || "Sócio"}
                                    onValueChange={(val) => handlePartnerChange(idx, "condicaoSocio", val)}
                                  >
                                    <SelectTrigger className="bg-white border-slate-200 text-xs h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Sócio">Sócio</SelectItem>
                                      <SelectItem value="Sócio Administrador">Sócio Administrador</SelectItem>
                                      <SelectItem value="Administrador Não Sócio">Administrador Não Sócio</SelectItem>
                                      <SelectItem value="Representante Legal">Representante Legal</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Data de Início na Empresa</Label>
                                  <Input 
                                    type="date"
                                    value={s.dataIngresso || ""} 
                                    onChange={(e) => handlePartnerChange(idx, "dataIngresso", e.target.value)} 
                                    className="bg-white border-slate-200 text-xs" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Regime de Bens (se casado)</Label>
                                  <Input 
                                    value={s.regimeBens || ""} 
                                    onChange={(e) => handlePartnerChange(idx, "regimeBens", e.target.value)} 
                                    className="bg-white border-slate-200 text-xs" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Possui União Estável?</Label>
                                  <Select
                                    value={s.uniaoEstavel || "Não"}
                                    onValueChange={(val) => handlePartnerChange(idx, "uniaoEstavel", val)}
                                  >
                                    <SelectTrigger className="bg-white border-slate-200 text-xs h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Não">Não</SelectItem>
                                      <SelectItem value="Sim">Sim</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Regime de União Estável</Label>
                                  <Input 
                                    disabled={s.uniaoEstavel === "Não"}
                                    value={s.regimeBensUniaoEstavel || ""} 
                                    onChange={(e) => handlePartnerChange(idx, "regimeBensUniaoEstavel", e.target.value)} 
                                    className="bg-white border-slate-200 text-xs" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Emancipação?</Label>
                                  <Select
                                    value={s.emancipacao || "Não"}
                                    onValueChange={(val) => handlePartnerChange(idx, "emancipacao", val)}
                                  >
                                    <SelectTrigger className="bg-white border-slate-200 text-xs h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Não">Não</SelectItem>
                                      <SelectItem value="Sim">Sim</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Condição Administrador</Label>
                                  <Select
                                    value={s.condicaoAdministrador || "Administrador"}
                                    onValueChange={(val) => handlePartnerChange(idx, "condicaoAdministrador", val)}
                                  >
                                    <SelectTrigger className="bg-white border-slate-200 text-xs h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Administrador">Administrador</SelectItem>
                                      <SelectItem value="Não Administrador">Não Administrador</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Mandato / Cargo de Direção</Label>
                                  <div className="grid grid-cols-2 gap-1">
                                    <Input 
                                      placeholder="Início" 
                                      type="date"
                                      value={s.dataInicioMandato || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "dataInicioMandato", e.target.value)}
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                    <Input 
                                      placeholder="Cargo" 
                                      value={s.cargoDirecao || ""} 
                                      onChange={(e) => handlePartnerChange(idx, "cargoDirecao", e.target.value)}
                                      className="bg-white border-slate-200 text-xs" 
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1 md:col-span-3">
                                  <Label className="text-[9px] text-slate-500 font-bold uppercase">Endereço Residencial Completo</Label>
                                  <Input 
                                    placeholder="Rua, Número, Complemento, Bairro, Cidade/UF - CEP" 
                                    value={s.enderecoResidencial || ""} 
                                    onChange={(e) => handlePartnerChange(idx, "enderecoResidencial", e.target.value.toUpperCase())} 
                                    className="bg-white border-slate-200 text-xs" 
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed border-slate-200 bg-white rounded-xl">
                      <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">Nenhum sócio cadastrado para esta abertura.</p>
                      <p className="text-[10px] text-slate-400">Clique no botão "Adicionar Sócio" acima para iniciar.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: NOME EMPRESARIAL */}
              {activeTab === "nome_empresarial" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="bg-white border-b pb-4">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <FileSignature className="h-4.5 w-4.5 text-blue-600" />
                        Viabilidade de Nome Empresarial & Nome Fantasia
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Informe as três opções de nomes que serão enviadas para consulta de viabilidade perante a Junta Comercial.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-5">
                      
                      {/* Tem Nome Fantasia? */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700">A empresa terá Nome Fantasia?</Label>
                        <div className="flex gap-4">
                          {["Sim", "Não"].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setNomeFantasia(prev => ({ ...prev, temNomeFantasia: opt }))}
                              className={cn(
                                "flex-1 p-3.5 rounded-xl border text-center font-bold text-xs transition-all",
                                nomeFantasia.temNomeFantasia === opt 
                                  ? "border-blue-500 bg-blue-50/50 text-blue-700" 
                                  : "border-slate-200 bg-white hover:bg-slate-50"
                              )}
                            >
                                {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Nome Fantasia Input */}
                      {nomeFantasia.temNomeFantasia === "Sim" && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <Label className="text-[10px] text-slate-600 font-bold uppercase">Nome Fantasia da Empresa</Label>
                          <Input 
                            value={nomeFantasia.nomeFantasia} 
                            onChange={(e) => setNomeFantasia(prev => ({ ...prev, nomeFantasia: e.target.value.toUpperCase() }))}
                            className="bg-white border-slate-200 text-xs font-bold text-slate-800"
                            placeholder="EX: PROSPERARE ASSESSORIA"
                          />
                        </div>
                      )}

                      {/* 3 Opções de Nome Empresarial */}
                      <div className="space-y-4 pt-2">
                        <Label className="text-xs font-bold text-slate-700 block border-b pb-1">
                          Três Opções de Nome Empresarial (Ordem de Preferência)
                        </Label>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[9px] text-slate-500 font-bold uppercase">1ª Opção de Nome Empresarial (Principal)</Label>
                            <Input
                              value={nomeFantasia.opcaoNome1}
                              onChange={(e) => setNomeFantasia(prev => ({ ...prev, opcaoNome1: e.target.value.toUpperCase() }))}
                              className="bg-white border-slate-200 text-xs font-bold text-blue-700"
                              placeholder="EX: PROSPERARE ASSESSORIA SOCIETARIA LTDA"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[9px] text-slate-500 font-bold uppercase">2ª Opção de Nome Empresarial</Label>
                            <Input
                              value={nomeFantasia.opcaoNome2}
                              onChange={(e) => setNomeFantasia(prev => ({ ...prev, opcaoNome2: e.target.value.toUpperCase() }))}
                              className="bg-white border-slate-200 text-xs font-semibold"
                              placeholder="EX: PROSPERARE SERVICOS ADMINISTRATIVOS LTDA"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[9px] text-slate-500 font-bold uppercase">3ª Opção de Nome Empresarial</Label>
                            <Input
                              value={nomeFantasia.opcaoNome3}
                              onChange={(e) => setNomeFantasia(prev => ({ ...prev, opcaoNome3: e.target.value.toUpperCase() }))}
                              className="bg-white border-slate-200 text-xs font-semibold"
                              placeholder="EX: P FLOW ASSESSORIA SOCIETARIA LTDA"
                            />
                          </div>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 4: ENDEREÇO & CONTATOS */}
              {activeTab === "endereco" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="bg-white border-b pb-4">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="h-4.5 w-4.5 text-blue-600" />
                        Endereço de Sede e Contatos
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Informe o endereço onde funcionará a sede da empresa e os dados de contato oficiais.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-5">
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Município Sede</Label>
                          <Select
                            value={endereco.municipio}
                            onValueChange={(val) => setEndereco(prev => ({ ...prev, municipio: val }))}
                          >
                            <SelectTrigger className="bg-white border-slate-200 text-xs h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MACAPA">MACAPÁ</SelectItem>
                              <SelectItem value="SANTANA">SANTANA</SelectItem>
                              <SelectItem value="LARANJAL DO JARI">LARANJAL DO JARI</SelectItem>
                              <SelectItem value="OIAPOQUE">OIAPOQUE</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-[8px] text-amber-600 font-bold mt-1 block">Exige fluxo tradicional</span>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Natureza do Imóvel</Label>
                          <div className="flex gap-2">
                            {["Urbano", "Rural", "Sem regularização"].map((nat) => (
                              <button
                                key={nat}
                                type="button"
                                onClick={() => setEndereco(prev => ({ ...prev, naturezaImovel: nat }))}
                                className={cn(
                                  "flex-1 p-2 rounded-lg border text-center font-bold text-xs transition-all",
                                  endereco.naturezaImovel === nat 
                                    ? "border-blue-500 bg-blue-50/30 text-blue-700" 
                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                )}
                              >
                                {nat}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* CEP Lookup */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Pesquisar por CEP</Label>
                          <div className="flex gap-2">
                            <Input
                              value={endereco.cep}
                              onChange={(e) => setEndereco(prev => ({ ...prev, cep: e.target.value }))}
                              placeholder="00.000-000"
                              className="bg-white border-slate-200 text-xs"
                            />
                            <Button 
                              type="button" 
                              onClick={handleCepSearch} 
                              disabled={isLoadingCep}
                              className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3"
                            >
                              {isLoadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Tipo de Logradouro</Label>
                          <Select
                            value={endereco.tipoLogradouro}
                            onValueChange={(val) => setEndereco(prev => ({ ...prev, tipoLogradouro: val }))}
                          >
                            <SelectTrigger className="bg-white border-slate-200 text-xs h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RUA">RUA</SelectItem>
                              <SelectItem value="AVENIDA">AVENIDA</SelectItem>
                              <SelectItem value="ALAMEDA">ALAMEDA</SelectItem>
                              <SelectItem value="RODOVIA">RODOVIA</SelectItem>
                              <SelectItem value="TRAVESSA">TRAVESSA</SelectItem>
                              <SelectItem value="RAMAL">RAMAL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Logradouro / Rua</Label>
                          <Input
                            value={endereco.logradouro}
                            onChange={(e) => setEndereco(prev => ({ ...prev, logradouro: e.target.value.toUpperCase() }))}
                            className="bg-white border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Número</Label>
                          <Input
                            value={endereco.numero}
                            onChange={(e) => setEndereco(prev => ({ ...prev, numero: e.target.value }))}
                            className="bg-white border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Complemento</Label>
                          <Input
                            value={endereco.complemento}
                            onChange={(e) => setEndereco(prev => ({ ...prev, complemento: e.target.value.toUpperCase() }))}
                            className="bg-white border-slate-200 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Bairro</Label>
                          <Input
                            value={endereco.bairro}
                            onChange={(e) => setEndereco(prev => ({ ...prev, bairro: e.target.value.toUpperCase() }))}
                            className="bg-white border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Inscrição Imobiliária (IPTU)</Label>
                          <Input
                            value={endereco.iptu}
                            onChange={(e) => setEndereco(prev => ({ ...prev, iptu: e.target.value }))}
                            className="bg-white border-slate-200 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">UF Sede</Label>
                          <Input
                            value={endereco.uf}
                            onChange={(e) => setEndereco(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                            className="bg-white border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Município do Endereço</Label>
                          <Input
                            value={endereco.municipio}
                            onChange={(e) => setEndereco(prev => ({ ...prev, municipio: e.target.value.toUpperCase() }))}
                            className="bg-white border-slate-200 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500 font-bold uppercase">Referência de Localização</Label>
                        <Input
                          value={endereco.referencia}
                          onChange={(e) => setEndereco(prev => ({ ...prev, referencia: e.target.value.toUpperCase() }))}
                          className="bg-white border-slate-200 text-xs"
                          placeholder="EX: ATRAS DO SUPERMERCADO FORTALEZA"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Área Total Edificada (m²)</Label>
                          <Input
                            type="number"
                            value={endereco.areaTotalEdificada || ""}
                            onChange={(e) => setEndereco(prev => ({ ...prev, areaTotalEdificada: Number(e.target.value) }))}
                            className="bg-white border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Área do Empreendimento (m²)</Label>
                          <Input
                            type="number"
                            value={endereco.areaEmpreendimento || ""}
                            onChange={(e) => setEndereco(prev => ({ ...prev, areaEmpreendimento: Number(e.target.value) }))}
                            className="bg-white border-slate-200 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">E-mail Oficial da Empresa</Label>
                          <Input
                            type="email"
                            value={endereco.emailEmpresa}
                            onChange={(e) => setEndereco(prev => ({ ...prev, emailEmpresa: e.target.value }))}
                            className="bg-white border-slate-200 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] text-slate-500 font-bold uppercase">Telefone de Contato da Empresa</Label>
                          <Input
                            value={endereco.telefoneEmpresa}
                            onChange={(e) => setEndereco(prev => ({ ...prev, telefoneEmpresa: e.target.value }))}
                            className="bg-white border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 5: ATIVIDADES & CAPITAL SOCIAL */}
              {activeTab === "atividades" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  
                  {/* Capital Social */}
                  <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="bg-white border-b pb-4">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <DollarSign className="h-4.5 w-4.5 text-blue-600" />
                        Capital Social da Empresa
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Informe o valor total do investimento inicial da nova sociedade.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-700">Valor do Capital Social (R$)</Label>
                          <Input
                            type="number"
                            value={atividades.capitalSocial || ""}
                            onChange={(e) => setAtividades(prev => ({ ...prev, capitalSocial: Number(e.target.value) }))}
                            className="bg-white border-slate-200 text-sm font-black text-blue-700"
                            placeholder="Ex: 100000"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-400">Extenso do Capital Social</Label>
                          <div className="bg-slate-50 p-2.5 rounded-md border text-xs font-semibold text-slate-600 h-10 flex items-center">
                            {atividades.capitalSocial ? numberToExtensoBRL(atividades.capitalSocial) : "Digite um valor"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Economic Activities (CNAEs) */}
                  <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="bg-white border-b pb-4">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Briefcase className="h-4.5 w-4.5 text-blue-600" />
                        Atividades Econômicas (CNAEs) e Objeto Social
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Selecione as atividades oficiais do IBGE. O Objeto Social será atualizado automaticamente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-6">

                      {/* CNAE Search Official API */}
                      <div className="space-y-3 p-4 border border-blue-100 bg-blue-50/10 rounded-xl">
                        <Label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                          Buscar CNAE na Tabela Oficial do IBGE
                        </Label>
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-1.5">
                            <div className="relative">
                              <Input 
                                placeholder="Digite o código ou palavra-chave (ex: restaurante, assessoria, comércio)..."
                                value={cnaeSearchQuery}
                                onChange={(e) => setCnaeSearchQuery(e.target.value)}
                                className="bg-white border-slate-200 text-xs pr-8 h-10 font-medium"
                              />
                              {isLoadingIbge && (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600 absolute right-2.5 top-3" />
                              )}
                            </div>
                          </div>

                          <div className="w-48 space-y-1">
                            <Select
                              value={cnaeSearchTarget}
                              onValueChange={(val: "principal" | "secundaria") => setCnaeSearchTarget(val)}
                            >
                              <SelectTrigger className="bg-white border-slate-200 text-xs h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="principal">Atividade Principal</SelectItem>
                                <SelectItem value="secundaria">Atividade Secundária</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Search Results Dropdown */}
                        {cnaeSearchResults.length > 0 && (
                          <div className="max-h-48 overflow-y-auto border border-blue-200 rounded-lg bg-white shadow-lg divide-y divide-slate-100">
                            {cnaeSearchResults.map((item: any) => {
                              const cleanId = String(item.id).replace(/\D/g, "");
                              const desc = String(item.descricao || "").toUpperCase();
                              return (
                                <div 
                                  key={item.id}
                                  className="p-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs transition-colors"
                                  onClick={() => {
                                    const code = cleanId;
                                    const description = desc;
                                    
                                    if (cnaeSearchTarget === "principal") {
                                      setAtividades(prev => ({
                                        ...prev,
                                        atividadePrincipal: { code, description }
                                      }))
                                      toast({ title: "Atividade Principal Definida", description: `${code} - ${description}` })
                                    } else {
                                      setAtividades(prev => {
                                        if (prev.atividadesSecundarias.some(c => c.code === code)) {
                                          toast({ variant: "destructive", title: "CNAE já adicionado", description: "Esta atividade secundária já está na lista." })
                                          return prev
                                        }
                                        return {
                                          ...prev,
                                          atividadesSecundarias: [...prev.atividadesSecundarias, { code, description }]
                                        }
                                      })
                                      toast({ title: "Atividade Secundária Adicionada", description: `${code} - ${description}` })
                                    }
                                    setCnaeSearchQuery("")
                                    setCnaeSearchResults([])
                                  }}
                                >
                                  <div>
                                    <span className="font-bold text-blue-700">{cleanId}</span>
                                    <span className="text-slate-600 ml-2">{desc}</span>
                                  </div>
                                  <PlusCircle className="h-4 w-4 text-blue-600 hover:scale-110 transition-transform" />
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Display Selected Activities */}
                      <div className="space-y-4 pt-2">
                        
                        {/* Principal */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700">Atividade Principal da Empresa</Label>
                          {atividades.atividadePrincipal ? (
                            <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl">
                              <div className="text-xs">
                                <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded mr-2">
                                  {atividades.atividadePrincipal.code}
                                </span>
                                <span className="font-semibold text-slate-800 uppercase">
                                  {atividades.atividadePrincipal.description}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs"
                                onClick={() => setAtividades(prev => ({ ...prev, atividadePrincipal: null }))}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="p-3 border border-dashed border-slate-200 text-center rounded-xl text-xs text-slate-400 italic">
                              Nenhuma atividade principal definida. Use a caixa de busca oficial acima para selecionar.
                            </div>
                          )}
                        </div>

                        {/* Secundarias */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700">Atividades Secundárias ({atividades.atividadesSecundarias.length})</Label>
                          {atividades.atividadesSecundarias.length > 0 ? (
                            <div className="space-y-2">
                              {atividades.atividadesSecundarias.map((c, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                                  <div className="text-xs">
                                    <span className="font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded mr-2">
                                      {c.code}
                                    </span>
                                    <span className="font-medium text-slate-700 uppercase">
                                      {c.description}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs"
                                    onClick={() => setAtividades(prev => ({
                                      ...prev,
                                      atividadesSecundarias: prev.atividadesSecundarias.filter((_, i) => i !== idx)
                                    }))}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 border border-dashed border-slate-200 text-center rounded-xl text-xs text-slate-400 italic">
                              Nenhuma atividade secundária adicionada.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Objeto Social Redação */}
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-bold text-slate-700">Redação do Objeto Social da Empresa</Label>
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            Auto-gerado & Editável
                          </span>
                        </div>
                        <Textarea 
                          rows={4}
                          value={atividades.objetoSocial}
                          onChange={(e) => {
                            setAtividades(prev => ({ ...prev, objetoSocial: e.target.value }))
                            setIsObjetoSocialEdited(true)
                          }}
                          className="bg-white border-slate-200 text-xs leading-relaxed"
                          placeholder="Objeto social gerado a partir dos CNAEs ou redigido livremente..."
                        />
                      </div>

                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 6: PROTOCOLO JUNTA COMERCIAL */}
              {activeTab === "protocolo" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="bg-white border-b pb-4">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Award className="h-4.5 w-4.5 text-blue-600" />
                        Protocolo da Junta Comercial (JUCAP/DREI)
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Insira e gerencie as informações de tramitação e protocolo oficial do processo de abertura.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-5">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">Número de Protocolo / Viabilidade</Label>
                          <Input
                            value={protocoloJunta}
                            onChange={(e) => setProtocoloJunta(e.target.value.toUpperCase())}
                            className="bg-white border-slate-200 text-xs font-bold uppercase tracking-wider"
                            placeholder="EX: RE000182763"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">Status do Protocolo Junta</Label>
                          <Select
                            value={statusProtocolo}
                            onValueChange={(val) => setStatusProtocolo(val)}
                          >
                            <SelectTrigger className="bg-white border-slate-200 text-xs h-9 font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Aguardando Protocolo">Aguardando Protocolo</SelectItem>
                              <SelectItem value="Em Exigência">Em Exigência (Correções Pendentes)</SelectItem>
                              <SelectItem value="Deferido">Deferido (Aprovado)</SelectItem>
                              <SelectItem value="Indeferido">Indeferido (Recusado)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Observações / Anotações do Protocolo</Label>
                        <Textarea
                          rows={4}
                          value={obsProtocolo}
                          onChange={(e) => setObsProtocolo(e.target.value)}
                          className="bg-white border-slate-200 text-xs leading-relaxed"
                          placeholder="Informe aqui exigências apontadas pela Junta Comercial ou informações importantes da abertura..."
                        />
                      </div>

                      {/* Info warning */}
                      <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3">
                        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 space-y-1 leading-relaxed">
                          <p className="font-bold">Acompanhamento e Auditoria Jucap</p>
                          <p className="font-medium text-[11px] text-blue-700">
                            Ao manter o número do protocolo atualizado, a equipe e o cliente conseguem rastrear a tramitação em tempo real. O status e anotações salvos aqui refletem diretamente nos painéis de controle.
                          </p>
                        </div>
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
              className="text-xs font-bold text-slate-600 border-slate-300 w-full sm:w-auto rounded-lg"
            >
              Fechar
            </Button>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                className="text-xs font-bold border-amber-300 text-amber-700 hover:bg-amber-50 uppercase h-9 px-4 gap-1.5 rounded-lg"
                onClick={() => handleSaveOpening("SALVO")}
              >
                <Save className="h-4 w-4" />
                Salvar Rascunho
              </Button>

              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 px-5 shadow-md flex items-center gap-1.5 uppercase rounded-lg"
                onClick={() => handleSaveOpening("CONCLUIDO")}
              >
                <Check className="h-4 w-4" />
                Concluir Abertura
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template de Impressão Invisível (html2canvas) */}
      {printData && (
        <div 
          id="print-pdf-template" 
          style={{ 
            position: "absolute", 
            left: "-9999px", 
            top: 0, 
            width: "800px", 
            background: "#FFFFFF", 
            padding: "40px", 
            color: "#1E293B" 
          }}
          className="font-sans space-y-6"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-blue-600 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-xl">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="text-xl font-black tracking-tight text-slate-800 uppercase">
                  PROSPERARE <span className="text-blue-600">FLOW</span>
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ficha de Constituição de CNPJ</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identificação</span>
              <span className="text-sm font-black text-slate-800 uppercase block">{printData.label}</span>
            </div>
          </div>

          {/* Status & Protocol Grid */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status do Rascunho</span>
              <span className={cn(
                "inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                printData.status === "CONCLUIDO" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}>
                {printData.status === "CONCLUIDO" ? "Concluído" : "Rascunho"}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Protocolo Junta Comercial</span>
              <span className="text-xs font-bold text-slate-800 block">
                {printData.protocoloJunta || "Aguardando Protocolo"}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status Protocolo</span>
              <span className="text-xs font-bold text-slate-800 block">
                {printData.protocoloJunta ? (printData.statusProtocolo || "Deferido") : "Sem Protocolo"}
              </span>
            </div>
          </div>

          {/* Section 1: Dados Gerais */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b pb-1.5">
              1. Diretrizes do Negócio
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-white p-4 rounded-xl border">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Composição da Empresa</span>
                <p className="text-xs font-semibold text-slate-700">
                  {printData.dadosGerais?.compostaPorSocio === "individual" ? "Empresário Individual / Unipessoal" : "Sociedade com Sócios"}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Natureza Jurídica</span>
                <p className="text-xs font-semibold text-slate-700">{printData.dadosGerais?.naturezaJuridica}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Faturamento Anual Previsto</span>
                <p className="text-xs font-semibold text-slate-700">
                  {printData.dadosGerais?.faturamentoAnual === "ME" ? "Até R$ 360 mil (ME) - Microempresa" :
                   printData.dadosGerais?.faturamentoAnual === "EPP" ? "Entre R$ 360 mil e R$ 4,8 milhões (EPP)" : "Acima de R$ 4,8 milhões (OUTROS)"}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Empresa será Startup?</span>
                <p className="text-xs font-semibold text-slate-700">{printData.dadosGerais?.startup || "Não"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Data Início de Atividades</span>
                <p className="text-xs font-semibold text-slate-700">
                  {printData.dadosGerais?.dataInicioAtividades 
                    ? new Date(printData.dadosGerais.dataInicioAtividades + "T00:00:00").toLocaleDateString("pt-BR") 
                    : "Não informada"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Nome Empresarial */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b pb-1.5">
              2. Nome Empresarial & Nome Fantasia
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-white p-4 rounded-xl border">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Tem Nome Fantasia?</span>
                <p className="text-xs font-semibold text-slate-700">{printData.nomeFantasia?.temNomeFantasia || "Não"}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Nome Fantasia</span>
                <p className="text-xs font-semibold text-slate-700">{printData.nomeFantasia?.nomeFantasia || "Não informado"}</p>
              </div>
              <div className="col-span-2 space-y-1.5 pt-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Opções de Nome (Junta Comercial)</span>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-50 border">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">1ª Opção</span>
                    <span className="font-bold text-slate-700">{printData.nomeFantasia?.opcaoNome1 || "Não informada"}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">2ª Opção</span>
                    <span className="font-bold text-slate-700">{printData.nomeFantasia?.opcaoNome2 || "Não informada"}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 border">
                    <span className="text-[8px] font-black text-slate-400 uppercase block">3ª Opção</span>
                    <span className="font-bold text-slate-700">{printData.nomeFantasia?.opcaoNome3 || "Não informada"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Endereço Sede */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b pb-1.5">
              3. Localização da Sede
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-white p-4 rounded-xl border">
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Logradouro</span>
                <p className="text-xs font-semibold text-slate-700">
                  {printData.endereco?.tipoLogradouro || "RUA"} {printData.endereco?.logradouro}, Nº {printData.endereco?.numero}
                  {printData.endereco?.complemento ? ` - ${printData.endereco.complemento}` : ""}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Bairro</span>
                <p className="text-xs font-semibold text-slate-700">{printData.endereco?.bairro}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Cidade/UF</span>
                <p className="text-xs font-semibold text-slate-700">{printData.endereco?.municipio}/{printData.endereco?.uf}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">CEP</span>
                <p className="text-xs font-semibold text-slate-700">{printData.endereco?.cep}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Natureza do Imóvel</span>
                <p className="text-xs font-semibold text-slate-700">{printData.endereco?.naturezaImovel}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Inscrição Imobiliária (IPTU)</span>
                <p className="text-xs font-semibold text-slate-700">{printData.endereco?.iptu || "Não informada"}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Área Total Edificada / Empreendimento</span>
                <p className="text-xs font-semibold text-slate-700">
                  {printData.endereco?.areaTotalEdificada || 0} m² / {printData.endereco?.areaEmpreendimento || 0} m²
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">E-mail da Empresa</span>
                <p className="text-xs font-semibold text-slate-700">{printData.endereco?.emailEmpresa || "Não informado"}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Telefone da Empresa</span>
                <p className="text-xs font-semibold text-slate-700">{printData.endereco?.telefoneEmpresa || "Não informado"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Ponto de Referência</span>
                <p className="text-xs font-semibold text-slate-700">{printData.endereco?.referencia || "Não informado"}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Atividades & Capital */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b pb-1.5">
              4. Atividades Econômicas & Capital
            </h3>
            <div className="space-y-3 bg-white p-4 rounded-xl border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Capital Social</span>
                  <p className="text-xs font-black text-slate-800">
                    R$ {(printData.atividades?.capitalSocial || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    {printData.atividades?.capitalSocial ? ` (${numberToExtensoBRL(printData.atividades.capitalSocial).toUpperCase()})` : ""}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Atividade Principal (CNAE)</span>
                {printData.atividades?.atividadePrincipal ? (
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded mr-1.5 border border-blue-200">
                      {printData.atividades.atividadePrincipal.code}
                    </span>
                    {printData.atividades.atividadePrincipal.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">Não informada</p>
                )}
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Atividades Secundárias (CNAEs)</span>
                {printData.atividades?.atividadesSecundarias && printData.atividades.atividadesSecundarias.length > 0 ? (
                  <div className="space-y-1.5 mt-1">
                    {printData.atividades.atividadesSecundarias.map((c: any) => (
                      <p key={c.code} className="text-[11px] font-medium text-slate-600 flex items-start gap-1">
                        <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border text-[9px] shrink-0 font-bold">
                          {c.code}
                        </span>
                        <span>{c.description}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhuma atividade secundária selecionada</p>
                )}
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Objeto Social Gerado</span>
                <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 italic">
                  {printData.atividades?.objetoSocial}
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Quadro de Sócios */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider border-b pb-1.5">
              5. Quadro de Sócios & Administradores (QSA)
            </h3>
            {printData.socios && printData.socios.length > 0 ? (
              <div className="space-y-4">
                {printData.socios.map((s: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border space-y-3">
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase">{s.nome}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          {s.condicaoSocio || "SÓCIO"} • {s.condicaoAdministrador || "Não Administrador"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          R$ {(s.participacao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({s.participacaoPercentual || 0}%)
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-[10px] text-slate-600">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">CPF/CNPJ</span>
                        <span className="font-semibold">{s.cpfCnpj}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">RG</span>
                        <span className="font-semibold">{s.rg} {s.rgOrgaoEmissor}/{s.rgUf}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Nacionalidade</span>
                        <span className="font-semibold">{s.nacionalidade}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Profissão</span>
                        <span className="font-semibold">{s.profissao}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Estado Civil</span>
                        <span className="font-semibold">{s.estadoCivil} {s.regimeBens ? `(${s.regimeBens})` : ""}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Nascimento</span>
                        <span className="font-semibold">{s.dataNascimento ? new Date(s.dataNascimento + "T00:00:00").toLocaleDateString("pt-BR") : "Não informada"}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block">Endereço Residencial</span>
                        <span className="font-semibold">{s.enderecoResidencial || s.endereco}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border text-center text-slate-400 text-xs italic">
                Nenhum sócio cadastrado.
              </div>
            )}
          </div>

          {/* Page Footer */}
          <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 border-t pt-4">
            <span>DOCUMENTO DE ACOMPANHAMENTO DE ABERTURA - PROSPERARE FLOW - EM {new Date().toLocaleString("pt-BR")}</span>
            <span>PÁGINA DE CONTROLE</span>
          </div>
        </div>
      )}
    </div>
  )
}
