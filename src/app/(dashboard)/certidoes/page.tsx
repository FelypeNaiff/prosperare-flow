"use client"

import { useState, useMemo } from "react"
import { ShieldCheck, Search, RefreshCw, Eye, Building2, AlertTriangle, Plus, Loader2, Save, FileStack, Calendar, CheckCircle2, FileSignature, Trash2, FileDown } from "lucide-react"
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
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    id: "",
    clienteId: "",
    tipo: "",
    emissao: "",
    validade: "",
    numero: "",
    codigoAutenticacao: "",
    status: "REGULAR",
    observacoes: ""
  })
  
  const [activeClientName, setActiveClientName] = useState("")

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
       else pendentes++; // SEM_DADOS ou PENDENTE
    })
    
    return { empresas: processedClients.length, regulares, aVencer, irregulares, pendentes }
  }, [processedClients])

  const handleOpenModal = (client: any, type: string, existingCert: any) => {
    setActiveClientName(client.corporateName)
    if (existingCert) {
      setFormData({
        id: existingCert.id || "",
        clienteId: existingCert.clienteId || client.id,
        tipo: existingCert.tipo || type,
        emissao: existingCert.emissao || "",
        validade: existingCert.validade || "",
        numero: existingCert.numero || "",
        codigoAutenticacao: existingCert.codigoAutenticacao || "",
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
        status: "REGULAR",
        observacoes: ""
      })
      setEditingItem(null)
    }
    setIsModalOpen(true)
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#2C4156] uppercase">Gestão de Certidões (CNDs)</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Monitoramento consolidado de regularidade fiscal da sua carteira.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] gap-2 font-black uppercase text-xs h-11 px-6 shadow-sm" onClick={handleExportPDF}>
            <FileDown className="h-4 w-4" /> Exportar Matriz
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs h-11 px-6 shadow-lg">
            <Plus className="h-4 w-4" /> Novo Lote
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
              <h2 className="text-3xl font-black text-[#2C4156] uppercase tracking-tighter">PROSPERARE <span className="text-[#1FA67A]">FLOW</span></h2>
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
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px] pl-6 w-1/3">Empresa</TableHead>
                {CND_TYPES.map(type => (
                  <TableHead key={type} className="text-white font-black uppercase text-[10px] text-center w-24">
                    {type}
                  </TableHead>
                ))}
                <TableHead className="text-white font-black uppercase text-[10px] text-center w-32">Status Geral</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right pr-6 w-16 action-col">Ficha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsLoading || certsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-[#98A7AA]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#1FA67A]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Montando Matriz...</span>
                  </TableCell>
                </TableRow>
              ) : processedClients.length > 0 ? (
                processedClients.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-[#F7F7F7]/50 transition-colors group">
                    <TableCell className="pl-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2C4156] text-xs uppercase">{item.corporateName}</span>
                        <span className="text-[9px] font-mono text-[#98A7AA] font-bold tracking-widest">{item.cnpj}</span>
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
                                       "bg-white border hover:bg-[#E6F6F0] border-[#1FA67A]/30 text-[#1FA67A]";

                      const badgeClass = !cert ? "bg-[#F4F5F7] text-[#98A7AA]" :
                                         isLate ? "bg-[#E74C3C] text-white" :
                                         isWarning ? "bg-[#F39C12] text-white" :
                                         "bg-[#1FA67A] text-white";

                      return (
                        <TableCell key={type} className="text-center p-1.5">
                           <div 
                             onClick={() => handleOpenModal(item, type, cert)}
                             className={cn(
                               "w-full flex md:flex-col lg:flex-row items-center justify-between gap-1 p-1.5 rounded-lg cursor-pointer transition-all shadow-sm active:scale-95",
                               wrapperClass
                             )}
                             title={cert ? `Vencimento: ${dateStr}` : 'Clique para registar'}
                           >
                             <span className="text-[10px] font-bold font-mono tracking-tight">{!cert ? 'Sem Registro' : dateStr}</span>
                             <Badge className={cn("text-[8px] font-black uppercase px-1.5 py-0 min-h-0 h-4 border-none shrink-0", badgeClass)}>
                               {statusWord}
                             </Badge>
                           </div>
                        </TableCell>
                      )
                    })}
                    
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase border-none px-2 shadow-sm rounded-full",
                        item.statusGeral === 'REGULAR' ? "bg-[#1FA67A] text-white" :
                        item.statusGeral === 'IRREGULAR' ? "bg-[#E74C3C] text-white" :
                        item.statusGeral === 'ALERTA' ? "bg-[#F39C12] text-white" :
                        "bg-[#D2D7DB] text-[#39586D]" // SEM DADOS ou PENDENTE
                      )}>
                        {item.statusGeral.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right pr-6 action-col">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA] hover:text-[#1FA67A] opacity-0 group-hover:opacity-100 transition-opacity">
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
                      description="Ajuste a busca para localizar a matriz de certidoes da carteira."
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[450px] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0 relative">
            <Badge variant="outline" className="border-white/30 text-white font-black text-[9px] absolute top-4 right-4 uppercase bg-[#39586D]">{formData.tipo}</Badge>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Dados da' : 'Cadastrar'} Certidão</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-1">
              Registro CND — Empresa: {activeClientName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 bg-white space-y-4">
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
                  <Label className="text-[10px] font-black uppercase text-[#1FA67A] tracking-widest flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-[#1FA67A]" /> Validade
                  </Label>
                  <Input 
                    type="date"
                    value={formData.validade}
                    onChange={(e) => setFormData({...formData, validade: e.target.value})}
                    className="border-[#1FA67A] focus-visible:ring-[#1FA67A] font-black text-[#2C4156] h-11"
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
                 className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs shadow-lg" 
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
    </div>
  )
}
