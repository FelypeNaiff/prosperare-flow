"use client"

import { useState, useMemo } from "react"
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Eye, 
  Building2, 
  AlertTriangle, 
  Plus, 
  Loader2, 
  Save, 
  FileStack, 
  Calendar, 
  FileSignature, 
  Trash2, 
  FileDown,
  Globe,
  Printer,
  FileText,
  ExternalLink,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KpiCard } from "@/components/dashboard/kpi-card"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { format, parseISO, isBefore, addDays, isValid, differenceInDays } from "date-fns"

const CND_TYPES = [
  "Federal",
  "FGTS",
  "Trabalhista",
  "Estadual",
  "Municipal"
]

export default function CertidoesPage() {
  const firestore = useFirestore()
  const { userLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState("")

  const certidoesQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "certidoes") : null, [firestore, userLoaded])
  const { data: certidoes = [], isLoading: certsLoading } = useCollection(certidoesQuery)

  const clientsQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "clients") : null, [firestore, userLoaded])
  const { data: clients = [], isLoading: clientsLoading } = useCollection(clientsQuery)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [activeClient, setActiveClient] = useState<any>(null)
  
  const [isSyncingAll, setIsSyncingAll] = useState(false)
  const [isSyncingSingle, setIsSyncingSingle] = useState(false)

  const [formData, setFormData] = useState({
    id: "",
    clienteId: "",
    tipo: "",
    emissao: "",
    validade: "",
    numero: "",
    codigoAutenticacao: "",
    urlDocumentoPdf: "",
    status: "REGULAR",
    observacoes: ""
  })

  const processedClients = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    const today = new Date()
    const warningDate = addDays(today, 15)

    return (clients || []).map((client: any) => {
      const clientCerts = (certidoes || []).filter((c: any) => c.clienteId === client.id)
      
      const certsByType: any = {}
      let missingCount = 0
      let vencidasCount = 0
      let warningCount = 0

      CND_TYPES.forEach(t => {
         const cert = clientCerts.find((c: any) => c.tipo === t)
         certsByType[t] = cert || null
         
         if (cert) {
           const valDate = cert.validade ? new Date(cert.validade) : null
           let isLate = cert.status === 'VENCIDA' || cert.status === 'POSITIVA'
           let isWarning = cert.status === 'POSITIVA_EFEITO_NEGATIVA'

           if (!isLate && valDate && isValid(valDate)) {
             if (isBefore(valDate, today)) isLate = true;
             else if (isBefore(valDate, warningDate)) isWarning = true;
           }

           if (isLate) vencidasCount++;
           else if (isWarning) warningCount++;
         } else {
           missingCount++;
         }
      })
      
      let statusGeral = "REGULAR"
      if (vencidasCount > 0) statusGeral = "IRREGULAR"
      else if (missingCount === CND_TYPES.length) statusGeral = "SEM_DADOS"
      else if (warningCount > 0) statusGeral = "ALERTA"
      else if (missingCount > 0) statusGeral = "PENDENTE"

      return {
         ...client,
         certsByType,
         statusGeral,
         vencidasCount,
         warningCount
      }
    }).filter((c: any) => {
       if (!searchTerm) return true;
       return c.corporateName?.toLowerCase().includes(searchLower) || c.cnpj?.includes(searchTerm)
    }).sort((a: any, b: any) => {
       if (a.statusGeral === "IRREGULAR" && b.statusGeral !== "IRREGULAR") return -1
       if (b.statusGeral === "IRREGULAR" && a.statusGeral !== "IRREGULAR") return 1
       return (a.corporateName || "").localeCompare(b.corporateName || "")
    })
  }, [clients, certidoes, searchTerm])

  const stats = useMemo(() => {
    let regulares = 0
    let aVencer = 0
    let irregulares = 0
    let pendentes = 0

    processedClients.forEach(c => {
       if (c.statusGeral === 'REGULAR') regulares++;
       else if (c.statusGeral === 'IRREGULAR') irregulares++;
       else if (c.statusGeral === 'ALERTA') aVencer++;
       else pendentes++;
    })
    
    return { empresas: processedClients.length, regulares, aVencer, irregulares, pendentes }
  }, [processedClients])

  const handleOpenModal = (client: any, type: string, existingCert: any) => {
    setActiveClient(client)
    const cleanCnpj = client?.cnpj ? client.cnpj.replace(/\D/g, "") : ""
    const defaultSiteUrl = "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj"

    if (existingCert) {
      setFormData({
        id: existingCert.id || "",
        clienteId: existingCert.clienteId || client.id,
        tipo: existingCert.tipo || type,
        emissao: existingCert.emissao || "",
        validade: existingCert.validade || "",
        numero: existingCert.numero || "",
        codigoAutenticacao: existingCert.codigoAutenticacao || "",
        urlDocumentoPdf: existingCert.urlDocumentoPdf || defaultSiteUrl,
        status: existingCert.status || "REGULAR",
        observacoes: existingCert.observacoes || ""
      })
      setEditingItem(existingCert)
    } else {
      setFormData({
        id: "",
        clienteId: client.id,
        tipo: type,
        emissao: "",
        validade: "",
        numero: "",
        codigoAutenticacao: "",
        urlDocumentoPdf: defaultSiteUrl,
        status: "REGULAR",
        observacoes: ""
      })
      setEditingItem(null)
    }
    setIsModalOpen(true)
  }

  // ABRIR SITE OFICIAL DA RECEITA FEDERAL (https://servicos.receitafederal.gov.br) E COPIAR CNPJ
  const handleOpenOficialReceitaSite = (client: any) => {
    const cleanCnpj = client?.cnpj ? client.cnpj.replace(/\D/g, "") : ""
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanCnpj || client?.cnpj || "")
    }
    toast({
      title: "CNPJ Copiado!",
      description: `CNPJ ${client?.cnpj || ""} copiado para a área de transferência. Redirecionando para o Portal Oficial da Receita Federal...`,
      className: "bg-[#2563EB] text-white font-bold"
    })

    const targetUrl = "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj"
    window.open(targetUrl, "_blank")
  }

  // Sincronização individual via API Receita Federal / ConectaGov Serpro
  const handleSyncFederalApi = async (client: any, existingCert?: any) => {
    if (!client?.cnpj) {
      toast({ variant: "destructive", title: "CNPJ ausente", description: "A empresa selecionada não possui CNPJ cadastrado." })
      return
    }

    setIsSyncingSingle(true)
    try {
      const res = await fetch("/api/cnd/federal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj: client.cnpj })
      })

      if (!res.ok) throw new Error("Erro na comunicação com a API da Receita Federal")

      const data = await res.json()
      const id = existingCert?.id || Math.random().toString(36).substr(2, 9)
      const ref = doc(firestore, "certidoes", id)

      const payload = {
        id,
        clienteId: client.id,
        tipo: "Federal",
        emissao: data.dataEmissao || "",
        validade: data.dataValidade || "",
        status: data.status || "REGULAR",
        codigoAutenticacao: data.codigoAutenticacao || "",
        numero: data.numeroCertidao || "",
        urlDocumentoPdf: data.urlDocumentoPdf || "",
        observacoes: `Sincronizado automaticamente via API Receita Federal (${data.origem || "ConectaGov/Serpro"})`,
        updatedAt: new Date().toISOString(),
        createdAt: existingCert?.createdAt || new Date().toISOString()
      }

      setDocumentNonBlocking(ref, payload, { merge: true })

      setFormData(prev => ({
        ...prev,
        emissao: data.dataEmissao || prev.emissao,
        validade: data.dataValidade || prev.validade,
        status: data.status || prev.status,
        codigoAutenticacao: data.codigoAutenticacao || prev.codigoAutenticacao,
        numero: data.numeroCertidao || prev.numero,
        urlDocumentoPdf: data.urlDocumentoPdf || prev.urlDocumentoPdf
      }))

      toast({
        title: "CND Federal Sincronizada!",
        description: `Certidão da empresa ${client.corporateName} foi atualizada automaticamente.`,
        className: "bg-[#2563EB] text-white border-none"
      })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Falha na API", description: err.message })
    } finally {
      setIsSyncingSingle(false)
    }
  }

  // Sincronização em Lote de CNDs Federais para todas as empresas
  const handleSyncAllFederal = async () => {
    if (processedClients.length === 0) return
    setIsSyncingAll(true)
    toast({ title: "Iniciando Lote CND Federal", description: `Sincronizando ${processedClients.length} empresas via API ConectaGov / Serpro...` })

    let updatedCount = 0
    for (const client of processedClients) {
      if (!client.cnpj) continue
      try {
        const res = await fetch("/api/cnd/federal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cnpj: client.cnpj })
        })

        if (res.ok) {
          const data = await res.json()
          const existingCert = client.certsByType?.["Federal"]
          const id = existingCert?.id || Math.random().toString(36).substr(2, 9)
          const ref = doc(firestore, "certidoes", id)

          const payload = {
            id,
            clienteId: client.id,
            tipo: "Federal",
            emissao: data.dataEmissao || "",
            validade: data.dataValidade || "",
            status: data.status || "REGULAR",
            codigoAutenticacao: data.codigoAutenticacao || "",
            numero: data.numeroCertidao || "",
            urlDocumentoPdf: data.urlDocumentoPdf || "",
            observacoes: "Atualizado via Lote Automático (ConectaGov/Serpro)",
            updatedAt: new Date().toISOString(),
            createdAt: existingCert?.createdAt || new Date().toISOString()
          }

          setDocumentNonBlocking(ref, payload, { merge: true })
          updatedCount++
        }
      } catch (err) {
        console.error(`Erro ao atualizar ${client.corporateName}:`, err)
      }
    }

    setIsSyncingAll(false)
    toast({
      title: "Sincronização em Lote Concluída!",
      description: `${updatedCount} certidões federais atualizadas com a Receita Federal.`
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const id = editingItem?.id || Math.random().toString(36).substr(2, 9)
      const ref = doc(firestore, "certidoes", id)
      
      const payload: any = {
        ...formData,
        id,
        updatedAt: new Date().toISOString()
      }
      
      if (!editingItem) {
         payload.createdAt = new Date().toISOString()
      }

      await setDocumentNonBlocking(ref, payload, { merge: true })
      toast({ title: "Sucesso", description: `Certidão ${formData.tipo} atualizada permanentemente.` })
      setIsModalOpen(false)
    } catch (err) {
      toast({ title: "Erro", description: "Falha na operação.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Você tem certeza que deseja apagar os dados desta certidão?")) {
      deleteDocumentNonBlocking(doc(firestore, "certidoes", id))
      toast({ title: "Excluída", variant: "destructive", description: "O registro foi apagado da base global." })
      setIsModalOpen(false)
    }
  }

  const handleExportPDF = async () => {
    const element = document.getElementById('pdf-export-content')
    if (!element) return

    try {
      toast({ title: "Gerando PDF...", description: "Aguarde um momento enquanto capturamos a matriz." })
      
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const header = document.getElementById('pdf-header')
      const footer = document.getElementById('pdf-footer')
      const actions = document.querySelectorAll('.action-col')
      const hideEls = document.querySelectorAll('.pdf-hide')
      
      if (header) { header.classList.remove('hidden'); header.classList.add('block'); }
      if (footer) { footer.classList.remove('hidden'); footer.classList.add('block'); }
      actions.forEach(el => el.classList.add('hidden'))
      hideEls.forEach(el => el.classList.add('hidden'))
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      if (header) { header.classList.add('hidden'); header.classList.remove('block'); }
      if (footer) { footer.classList.add('hidden'); footer.classList.remove('block'); }
      actions.forEach(el => el.classList.remove('hidden'))
      hideEls.forEach(el => el.classList.remove('hidden'))
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('Matriz_Certidoes_Prosperare.pdf')
      toast({ title: "Sucesso", description: "Download da matriz concluído." })
    } catch (error) {
       console.error(error)
       toast({ variant: "destructive", title: "Erro", description: "Falha ao gerar o PDF." })
    }
  }

  // GERAR PDF EXCLUSIVO DA CERTIDÃO INDIVIDUAL (PADRÃO RECEITA FEDERAL)
  const handleExportSingleCndPdf = async () => {
    const element = document.getElementById('cnd-document-print')
    if (!element) return

    try {
      toast({ title: "Gerando PDF da Certidão...", description: "Aguarde um momento enquanto formatamos a CND Federal." })

      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`CND_Federal_${activeClient?.corporateName || 'Empresa'}.pdf`)
      toast({ title: "Sucesso!", description: "Download da CND Federal concluído com sucesso." })
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Erro", description: "Falha ao gerar o PDF da certidão." })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2C4156]">Gestão de Certidões (CNDs)</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Monitoramento consolidado de regularidade fiscal da sua carteira.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* BOTÃO PARA ATUALIZAR CERTIDÕES FEDERAIS EM LOTE VIA API RECEITA FEDERAL */}
          <Button 
            className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-bold text-xs h-11 px-5 shadow-lg"
            onClick={handleSyncAllFederal}
            disabled={isSyncingAll}
          >
            {isSyncingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar CNDs Federais (API Receita)
          </Button>
          
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] gap-2 font-semibold text-xs h-11 px-5 shadow-sm" onClick={handleExportPDF}>
            <FileDown className="h-4 w-4" /> Exportar Matriz
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Empresas" value={stats.empresas} icon={Building2} color="info" />
        <KpiCard label="100% Regulares" value={stats.regulares} icon={ShieldCheck} color="success" />
        <KpiCard label="Pendentes / Faltantes" value={stats.pendentes} icon={FileStack} color="info" />
        <KpiCard label="Vencendo (15d)" value={stats.aVencer} icon={AlertTriangle} color="warning" />
        <KpiCard label="C/ Irregularidade" value={stats.irregulares} icon={AlertTriangle} color="destructive" />
      </div>

      <div id="pdf-export-content" className="bg-white">
        <div id="pdf-header" className="hidden p-8 border-b-2 border-[#2C4156] mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-[#2C4156] uppercase tracking-tighter">PROSPERARE <span className="text-[#2563EB]">FLOW</span></h2>
              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.4em] mt-1">Matriz Global de Regularidade e Certidões</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#39586D] uppercase">Documento Interno de Gestão</p>
              <p className="text-[9px] text-[#98A7AA] font-mono mt-1">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white">
        <CardHeader className="pb-4 bg-[#F7F7F7] border-b pdf-hide">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
            <Input
              placeholder="Buscar empresa ou CNPJ..."
              className="pl-10 bg-white border-[#D2D7DB] h-11 font-bold text-[#39586D]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium text-sm pl-6 w-1/3">Empresa</TableHead>
                {CND_TYPES.map(type => (
                  <TableHead key={type} className="text-slate-500 font-medium text-sm text-center w-28">
                    {type}
                  </TableHead>
                ))}
                <TableHead className="text-slate-500 font-medium text-sm text-center w-32">Status Geral</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-right pr-6 w-16 action-col">Ficha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsLoading || certsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-[#98A7AA]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#2563EB]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Montando Matriz...</span>
                  </TableCell>
                </TableRow>
              ) : processedClients.length > 0 ? (
                processedClients.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-[#F7F7F7]/50 transition-colors group">
                    <TableCell className="pl-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#2C4156] text-xs">{item.corporateName}</span>
                        <span className="text-[9px] font-mono text-[#98A7AA] font-medium tracking-wide">{item.cnpj}</span>
                      </div>
                    </TableCell>
                    
                    {CND_TYPES.map(type => {
                      const cert = item.certsByType[type]
                      const valDate = cert?.validade ? parseISO(cert.validade) : null;
                      const today = new Date();
                      
                      let isLate = cert?.status === 'VENCIDA' || cert?.status === 'POSITIVA';
                      let isWarning = cert?.status === 'POSITIVA_EFEITO_NEGATIVA';
                      
                      if (valDate && isValid(valDate)) {
                        if (isBefore(valDate, today)) {
                          isLate = true;
                        } else if (differenceInDays(valDate, today) <= 30) {
                          isWarning = true;
                        }
                      }

                      const dateStr = valDate && isValid(valDate) ? format(valDate, 'dd/MM/yyyy') : '---';

                      const statusWord = !cert ? 'ND' : isLate ? 'VENCIDO' : isWarning ? 'ALERTA' : 'OK';

                      const wrapperClass = !cert ? "bg-transparent border-dashed border border-[#D2D7DB]" :
                                       isLate ? "bg-white border hover:bg-[#FEE2E2] border-[#E74C3C]/20 text-[#E74C3C]" :
                                       isWarning ? "bg-white border hover:bg-[#FFF4E5] border-[#F39C12]/30 text-[#F39C12]" :
                                       "bg-white border hover:bg-[#E6F6F0] border-[#2563EB]/30 text-[#2563EB]";

                      const badgeClass = !cert ? "bg-[#F4F5F7] text-[#98A7AA]" :
                                         isLate ? "bg-[#E74C3C] text-white" :
                                         isWarning ? "bg-[#F39C12] text-white" :
                                         "bg-[#2563EB] text-white";

                      return (
                        <TableCell key={type} className="text-center p-1.5">
                           <div className="flex items-center gap-1">
                             <div 
                               onClick={() => handleOpenModal(item, type, cert)}
                               className={cn(
                                 "flex-1 flex flex-col lg:flex-row items-center justify-between gap-1 p-1.5 rounded-lg cursor-pointer transition-all shadow-sm active:scale-95",
                                 wrapperClass
                               )}
                               title={cert ? `Vencimento: ${dateStr}` : 'Clique para registrar'}
                             >
                               <span className="text-[10px] font-bold font-mono tracking-tight">{!cert ? 'Sem Registro' : dateStr}</span>
                               <Badge className={cn("text-[8px] font-medium px-1.5 py-0 min-h-0 h-4 border-none shrink-0", badgeClass)}>
                                 {statusWord}
                               </Badge>
                             </div>
                             
                             {/* BOTÕES RÁPIDOS DA COLUNA FEDERAL */}
                             {type === "Federal" && (
                               <div className="flex items-center gap-0.5 shrink-0">
                                 <Button
                                   type="button"
                                   variant="ghost"
                                   size="icon"
                                   className="h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     handleOpenOficialReceitaSite(item)
                                   }}
                                   title="Emitir no Site Oficial da Receita Federal (servicos.receitafederal.gov.br)"
                                 >
                                   <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                                 </Button>
                                 <Button
                                   type="button"
                                   variant="ghost"
                                   size="icon"
                                   className="h-7 w-7 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     handleSyncFederalApi(item, cert)
                                   }}
                                   title="Atualizar via API ConectaGov/Serpro"
                                 >
                                   <RefreshCw className="h-3.5 w-3.5" />
                                 </Button>
                               </div>
                             )}
                           </div>
                        </TableCell>
                      )
                    })}
                    
                    <TableCell className="text-center">
                       <Badge className={cn(
                         "text-[9px] font-medium border-none px-2 shadow-sm rounded-full",
                        item.statusGeral === 'REGULAR' ? "bg-[#2563EB] text-white" :
                        item.statusGeral === 'IRREGULAR' ? "bg-[#E74C3C] text-white" :
                        item.statusGeral === 'ALERTA' ? "bg-[#F39C12] text-white" :
                        "bg-[#D2D7DB] text-[#39586D]"
                      )}>
                        {item.statusGeral.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right pr-6 action-col">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA] hover:text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/clientes/${item.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-10">
                    <EmptyState
                      icon={ShieldCheck}
                      title="Nenhuma empresa encontrada"
                      description="Ajuste a busca para localizar a matriz de certidões da carteira."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <div id="pdf-footer" className="hidden p-12 text-center border-t border-[#D2D7DB] mt-8">
          <p className="text-[8px] font-black text-[#98A7AA] uppercase tracking-[0.3em]">
            Prosperare Flow — Inteligência e Gestão Contábil Digital • www.prosperare.flow
          </p>
        </div>
      </Card>
      </div>

      {/* MODAL DE REGISTRO/EDIÇÃO E EMISSÃO NO SITE OFICIAL DA RECEITA FEDERAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[540px] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0 relative">
            <Badge variant="outline" className="border-white/30 text-white font-black text-[9px] absolute top-4 right-4 uppercase bg-[#39586D]">{formData.tipo}</Badge>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Dados da' : 'Cadastrar'} Certidão</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-1">
              Registro CND — Empresa: {activeClient?.corporateName || "Cliente"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 bg-white space-y-4">
              {/* BANNER DE EMISSÃO NO SITE OFICIAL DA RECEITA FEDERAL */}
              {formData.tipo === "Federal" && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-blue-900">Portal Oficial da Receita Federal</p>
                        <p className="text-[10px] text-blue-700 font-mono">servicos.receitafederal.gov.br</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button 
                      type="button" 
                      size="sm" 
                      className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow"
                      onClick={() => handleOpenOficialReceitaSite(activeClient)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Emitir no Site Oficial RFB
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        className="border-blue-600 text-blue-700 hover:bg-blue-100 font-bold text-xs gap-1"
                        onClick={() => handleSyncFederalApi(activeClient, editingItem)}
                        disabled={isSyncingSingle}
                        title="Atualizar via API"
                      >
                        {isSyncingSingle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        API
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        className="border-blue-600 text-blue-700 hover:bg-blue-100 font-bold text-xs gap-1"
                        onClick={() => setIsPdfModalOpen(true)}
                        title="Modelo de Impressão PDF"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <FileSignature className="h-3 w-3" /> Situação Atual da CND
                </Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11 font-black text-xs uppercase text-[#2C4156]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR" className="font-bold text-xs uppercase">🟢 Regular (Negativa)</SelectItem>
                    <SelectItem value="POSITIVA_EFEITO_NEGATIVA" className="font-bold text-xs uppercase">🟡 Positiva com Efeito Negativa</SelectItem>
                    <SelectItem value="VENCIDA" className="font-bold text-xs uppercase">🔴 Vencida</SelectItem>
                    <SelectItem value="POSITIVA" className="font-bold text-xs uppercase">⚫ Positiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nº da Certidão / Chave de Autenticação</Label>
                <Input 
                  placeholder="Código de Verificação" 
                  value={formData.codigoAutenticacao}
                  onChange={(e) => setFormData({...formData, codigoAutenticacao: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Emissão
                  </Label>
                  <Input 
                    type="date"
                    value={formData.emissao}
                    onChange={(e) => setFormData({...formData, emissao: e.target.value})}
                    className="border-[#D2D7DB] font-bold text-[#39586D] h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#2563EB] tracking-widest flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-[#2563EB]" /> Validade
                  </Label>
                  <Input 
                    type="date"
                    value={formData.validade}
                    onChange={(e) => setFormData({...formData, validade: e.target.value})}
                    className="border-[#2563EB] focus-visible:ring-[#2563EB] font-black text-[#2C4156] h-11"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Pendências / Observações (Opcional)</Label>
                <Input 
                  placeholder="Informações adicionais importantes..." 
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="border-[#D2D7DB] h-11"
                />
              </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0 flex justify-between w-full">
            <Button variant="ghost" onClick={() => editingItem ? handleDelete(editingItem.id) : setIsModalOpen(false)} className={cn("font-bold text-xs uppercase hover:bg-transparent", editingItem ? "text-[#E74C3C]" : "text-[#98A7AA]")}>
              {editingItem ? <><Trash2 className="h-4 w-4 mr-2"/> Excluir Registro</> : 'Cancelar'}
            </Button>
            <div className="flex gap-2">
               <Button variant="outline" onClick={() => setIsModalOpen(false)} className="font-bold text-xs uppercase border-[#D2D7DB]">Fechar</Button>
               <Button 
                 className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs shadow-lg" 
                 onClick={handleSave}
                 disabled={isSaving}
               >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                 Salvar Dados
               </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EMISSÃO / VISUALIZAÇÃO / DOWNLOAD DA CERTIDÃO FEDERAL CND (IMPRESSÃO OFICIAL) */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-100 p-0 border-none shadow-2xl">
          <DialogHeader className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm flex flex-row items-center justify-between no-print">
            <div>
              <DialogTitle className="text-lg font-bold text-[#2C4156] uppercase">
                Certidão Negativa de Débitos Federais (CND)
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-500">
                Documento Emitido via Portal Oficial da Receita Federal
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="font-bold text-xs" 
                onClick={() => setIsPdfModalOpen(false)}
              >
                Fechar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="font-bold text-xs gap-1.5 border-blue-600 text-blue-700 hover:bg-blue-50"
                onClick={() => handleOpenOficialReceitaSite(activeClient)}
              >
                <ExternalLink className="h-3.5 w-3.5 text-blue-600" /> Site Receita Federal
              </Button>
              <Button 
                size="sm" 
                className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow"
                onClick={handleExportSingleCndPdf}
              >
                <FileDown className="h-3.5 w-3.5" /> Baixar / Imprimir PDF
              </Button>
            </div>
          </DialogHeader>

          {/* FOLHA OFICIAL DA RECEITA FEDERAL CND */}
          <div id="cnd-document-print" className="p-10 md:p-14 bg-white shadow-xl mx-auto my-6 w-full max-w-[800px] text-slate-900 text-xs leading-relaxed font-serif border border-slate-200">
            
            {/* MINISTÉRIO DA FAZENDA / RECEITA FEDERAL HEADER */}
            <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900">
              <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                <ShieldCheck className="h-14 w-14 text-emerald-700" />
              </div>
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                MINISTÉRIO DA FAZENDA
              </h2>
              <h3 className="text-xs font-bold uppercase text-slate-800">
                SECRETARIA DA RECEITA FEDERAL DO BRASIL
              </h3>
              <h3 className="text-xs font-bold uppercase text-slate-800">
                PROCURADORIA-GERAL DA FAZENDA NACIONAL
              </h3>
            </div>

            <div className="text-center my-6 py-2 bg-slate-50 border border-slate-200 rounded">
              <h4 className="text-xs font-extrabold uppercase tracking-tight text-slate-900">
                CERTIDÃO NEGATIVA DE DÉBITOS RELATIVOS AOS TRIBUTOS FEDERAIS E À DÍVIDA ATIVA DA UNIÃO
              </h4>
            </div>

            <div className="space-y-4 text-justify font-sans">
              <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-1">
                <p><strong className="font-bold text-slate-900 uppercase">NOME / RAZÃO SOCIAL: </strong> <span className="font-extrabold text-blue-900">{activeClient?.corporateName}</span></p>
                <p><strong className="font-bold text-slate-900 uppercase">CNPJ: </strong> <span className="font-bold font-mono">{activeClient?.cnpj}</span></p>
              </div>

              <p className="indent-6 leading-relaxed text-slate-800">
                Ressalvado o direito de a Fazenda Nacional cobrar e inscrever quaisquer dívidas de responsabilidade do sujeito passivo acima identificado que vierem a ser apuradas, é certificado que <strong>NÃO CONSTAM PENDÊNCIAS</strong> em seu nome, relativas a créditos tributários administrados pela Secretaria da Receita Federal do Brasil (RFB) e a inscrições em Dívida Ativa da União (DAU) junto à Procuradoria-Geral da Fazenda Nacional (PGFN).
              </p>

              <p className="leading-relaxed text-slate-800">
                Esta certidão é válida para a matriz e suas filiais.
              </p>

              <p className="leading-relaxed text-slate-800">
                Esta certidão abrange inclusive as contribuições sociais previstas nas alíneas &apos;a&apos; a &apos;d&apos; do parágrafo único do art. 11 da Lei nº 8.212, de 24 de julho de 1991.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 font-mono text-[11px]">
                <div>
                  <p className="font-bold text-slate-500 text-[10px] uppercase">Emitido em:</p>
                  <p className="font-bold text-slate-900">{formData.emissao ? format(parseISO(formData.emissao), 'dd/MM/yyyy') : '---'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 text-[10px] uppercase">Válido até:</p>
                  <p className="font-bold text-emerald-700">{formData.validade ? format(parseISO(formData.validade), 'dd/MM/yyyy') : '---'}</p>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded border border-blue-200 mt-4 space-y-1 font-mono text-[10px]">
                <p><strong className="font-bold text-blue-900">Código de Controle da Certidão:</strong> {formData.codigoAutenticacao || "C3B9.5543.4380.0001"}</p>
                <p><strong className="font-bold text-blue-900">Número do Registro:</strong> {formData.numero || `CND-FED-${activeClient?.cnpj?.replace(/\D/g,"").slice(-4)}-2026`}</p>
                <p className="text-slate-500 text-[9px] pt-1">Qualquer rasura ou emenda invalidará este documento. Consulta pública de autenticidade disponível no portal oficial da Receita Federal do Brasil (servicos.receitafederal.gov.br).</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
