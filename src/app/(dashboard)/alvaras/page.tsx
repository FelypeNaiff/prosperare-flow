"use client"

import { useState, useMemo } from "react"
import { ShieldCheck, Search, FileSignature, AlertTriangle, Plus, Edit, Trash2, Loader2, Building2, Calendar, Save, FileDown, Eye } from "lucide-react"
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
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import Link from "next/link"

const ALVARA_TYPES = [
  "Bombeiro",
  "Vigilância",
  "Prefeitura"
]

export default function AlvarasPage() {
  const firestore = useFirestore()
  const { userLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [activeClientName, setActiveClientName] = useState("")

  const alvarasQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "alvaras") : null, [firestore, userLoaded])
  const { data: alvaras = [], isLoading: alvarasLoading } = useCollection(alvarasQuery)

  const clientsQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "clients") : null, [firestore, userLoaded])
  const { data: clients = [], isLoading: clientsLoading } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    id: "",
    clienteId: "",
    tipo: "",
    numero: "",
    orgaoEmissor: "",
    dataEmissao: "",
    validade: "",
    status: "ATIVO",
    observacoes: ""
  })

  // Agrupamento por cliente com matriz de alvarás
  const processedClients = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    const today = new Date()
    const warningDate = addDays(today, 30)

    return (clients || []).map((client: any) => {
      const clientAlvaras = (alvaras || []).filter((a: any) => a.clienteId === client.id)
      
      const alvarasByType: any = {}
      let missingCount = 0
      let vencidosCount = 0
      let alertaCount = 0

      ALVARA_TYPES.forEach(t => {
        const alvara = clientAlvaras.find((a: any) => a.tipo === t)
        alvarasByType[t] = alvara || null
        
        if (alvara) {
          const valDate = alvara.validade ? new Date(alvara.validade) : null
          let isLate = alvara.status === 'VENCIDO' || alvara.status === 'CASSADO'
          let isWarning = false

          if (valDate && isValid(valDate)) {
            if (isBefore(valDate, today)) {
              isLate = true
            } else if (isBefore(valDate, warningDate)) {
              isWarning = true
            }
          }

          if (isLate) vencidosCount++
          else if (isWarning) alertaCount++
        } else {
          missingCount++
        }
      })
      
      const hasAnyMovement = clientAlvaras.some((a: any) => a.status !== 'DISPENSADO')
      const onlyDispensed = clientAlvaras.length > 0 && clientAlvaras.every((a: any) => a.status === 'DISPENSADO')

      let statusGeral = "REGULAR"
      if (onlyDispensed) statusGeral = "DISPENSADO"
      else if (vencidosCount > 0) statusGeral = "IRREGULAR"
      else if (alertaCount > 0) statusGeral = "ALERTA"

      return {
        ...client,
        alvarasByType,
        statusGeral,
        vencidosCount,
        alertaCount,
        hasAnyMovement
      }
    }).filter((c: any) => {
      if (!searchTerm) return true
      return c.corporateName?.toLowerCase().includes(searchLower) || c.cnpj?.includes(searchTerm)
    }).sort((a: any, b: any) => {
      if (a.statusGeral === "DISPENSADO" && b.statusGeral !== "DISPENSADO") return 1
      if (b.statusGeral === "DISPENSADO" && a.statusGeral !== "DISPENSADO") return -1
      if (a.hasAnyMovement && !b.hasAnyMovement) return -1
      if (b.hasAnyMovement && !a.hasAnyMovement) return 1
      if (a.statusGeral === "IRREGULAR" && b.statusGeral !== "IRREGULAR") return -1
      if (b.statusGeral === "IRREGULAR" && a.statusGeral !== "IRREGULAR") return 1
      return (a.corporateName || "").localeCompare(b.corporateName || "")
    })
  }, [clients, alvaras, searchTerm])

  const stats = useMemo(() => {
    let empresas = 0
    let regulares = 0
    let alerta = 0
    let irregulares = 0

    processedClients.forEach(c => {
      empresas++
      if (c.statusGeral === 'REGULAR') regulares++
      else if (c.statusGeral === 'IRREGULAR') irregulares++
      else if (c.statusGeral === 'ALERTA') alerta++
    })
    
    return { empresas, regulares, alerta, irregulares }
  }, [processedClients])

  const handleOpenModal = (client: any, type: string, existingAlvara: any) => {
    setActiveClientName(client.corporateName)
    if (existingAlvara) {
      setFormData({
        id: existingAlvara.id || "",
        clienteId: existingAlvara.clienteId || client.id,
        tipo: existingAlvara.tipo || type,
        numero: existingAlvara.numero || "",
        orgaoEmissor: existingAlvara.orgaoEmissor || "",
        dataEmissao: existingAlvara.dataEmissao || "",
        validade: existingAlvara.validade || "",
        status: existingAlvara.status || "ATIVO",
        observacoes: existingAlvara.observacoes || ""
      })
      setEditingItem(existingAlvara)
    } else {
      setFormData({
        id: "",
        clienteId: client.id,
        tipo: type,
        numero: "",
        orgaoEmissor: "",
        dataEmissao: "",
        validade: "",
        status: "ATIVO",
        observacoes: ""
      })
      setEditingItem(null)
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.clienteId || !formData.tipo) {
      toast({ title: "Erro", description: "Empresa e Tipo são obrigatórios.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const id = editingItem?.id || Math.random().toString(36).substr(2, 9)
      const ref = doc(firestore, "alvaras", id)
      
      const payload: any = {
        ...formData,
        id,
        updatedAt: new Date().toISOString()
      }
      
      if (!editingItem) {
         payload.createdAt = new Date().toISOString()
      }

      await setDocumentNonBlocking(ref, payload, { merge: true })
      toast({ title: "Sucesso", description: `Alvará ${editingItem ? 'atualizado' : 'cadastrado'} permanentemente.` })
      setIsModalOpen(false)
    } catch (err) {
      toast({ title: "Erro", description: "Falha na operação.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Você tem certeza que deseja remover este Alvará ou Licença?")) {
      deleteDocumentNonBlocking(doc(firestore, "alvaras", id))
      toast({ title: "Removido", variant: "destructive" })
    }
  }

  const handleExportPDF = async () => {
    const element = document.getElementById('pdf-export-content')
    if (!element) return

    try {
      toast({ title: "Gerando PDF...", description: "Aguarde um momento enquanto capturamos os dados." })
      
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const header = document.getElementById('pdf-header')
      const footer = document.getElementById('pdf-footer')
      const actions = document.querySelectorAll('.action-col')
      
      if (header) { header.classList.remove('hidden'); header.classList.add('block'); }
      if (footer) { footer.classList.remove('hidden'); footer.classList.add('block'); }
      actions.forEach(el => el.classList.add('hidden'))
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      if (header) { header.classList.add('hidden'); header.classList.remove('block'); }
      if (footer) { footer.classList.add('hidden'); footer.classList.remove('block'); }
      actions.forEach(el => el.classList.remove('hidden'))
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('Relatorio_Alvaras_Prosperare.pdf')
      toast({ title: "Sucesso", description: "Download do PDF concluído." })
    } catch (error) {
       console.error(error)
       toast({ variant: "destructive", title: "Erro", description: "Falha ao gerar o PDF." })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#2C4156] uppercase">Gestão de Alvarás e Licenças</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Controle centralizado e global de licenciamentos da sua carteira.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] gap-2 font-black uppercase text-xs h-11 px-6 shadow-sm" onClick={handleExportPDF}>
            <FileDown className="h-4 w-4" /> Exportar Matriz
          </Button>
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-black uppercase text-xs shadow-lg h-11 px-6">
            <Plus className="h-4 w-4" /> Novo Lote
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Empresas" value={stats.empresas} icon={Building2} color="info" />
        <KpiCard label="100% Regulares" value={stats.regulares} icon={ShieldCheck} color="success" />
        <KpiCard label="Em Alerta (30d)" value={stats.alerta} icon={AlertTriangle} color="warning" />
        <KpiCard label="C/ Irregularidade" value={stats.irregulares} icon={AlertTriangle} color="destructive" />
      </div>

      <div id="pdf-export-content" className="bg-white">
        <div id="pdf-header" className="hidden p-8 border-b-2 border-[#2C4156] mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-[#2C4156] uppercase tracking-tighter">PROSPERARE <span className="text-[#2563EB]">FLOW</span></h2>
              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.4em] mt-1">Relatório Oficial de Alvarás e Licenças</p>
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
                <TableHead className="text-white font-black uppercase text-[10px] pl-6 w-1/4">Empresa</TableHead>
                {ALVARA_TYPES.map(type => (
                  <TableHead key={type} className="text-white font-black uppercase text-[10px] text-center w-28">
                    {type}
                  </TableHead>
                ))}
                <TableHead className="text-white font-black uppercase text-[10px] text-center w-32">Status Geral</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right pr-6 w-16 action-col">Ficha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsLoading || alvarasLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#2563EB]" />
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
                    
                    {ALVARA_TYPES.map(type => {
                      const alvara = item.alvarasByType[type]
                      const valDate = alvara?.validade ? parseISO(alvara.validade) : null;
                      const today = new Date();
                      
                      const isDispensed = alvara?.status === 'DISPENSADO';
                      let isLate = alvara?.status === 'VENCIDO' || alvara?.status === 'CASSADO';
                      let isWarning = false;
                      
                      if (valDate && isValid(valDate)) {
                        if (isBefore(valDate, today)) {
                          isLate = true;
                        } else if (differenceInDays(valDate, today) <= 30) {
                          isWarning = true;
                        }
                      }

                      const dateStr = valDate && isValid(valDate) ? format(valDate, 'dd/MM/yyyy') : '---';

                      const statusWord = !alvara ? 'ND' : isDispensed ? 'DISPENSADO' : isLate ? 'VENCIDO' : isWarning ? 'ALERTA' : 'OK';

                      const wrapperClass = !alvara ? "bg-transparent border-dashed border border-[#D2D7DB]" :
                                       isDispensed ? "bg-white border hover:bg-[#F4F5F7] border-[#D1D5DB] text-[#6B7280]" :
                                       isLate ? "bg-white border hover:bg-[#FEE2E2] border-[#E74C3C]/20 text-[#E74C3C]" :
                                       isWarning ? "bg-white border hover:bg-[#FFF4E5] border-[#F39C12]/30 text-[#F39C12]" :
                                       "bg-white border hover:bg-[#E6F6F0] border-[#2563EB]/30 text-[#2563EB]";

                      const badgeClass = !alvara ? "bg-[#F4F5F7] text-[#98A7AA]" :
                                         isDispensed ? "bg-[#D1D5DB] text-[#4B5563]" :
                                         isLate ? "bg-[#E74C3C] text-white" :
                                         isWarning ? "bg-[#F39C12] text-white" :
                                         "bg-[#2563EB] text-white";

                      return (
                        <TableCell key={type} className="text-center p-1.5">
                           <div 
                             onClick={() => handleOpenModal(item, type, alvara)}
                             className={cn(
                               "w-full flex md:flex-col lg:flex-row items-center justify-between gap-1 p-1.5 rounded-lg cursor-pointer transition-all shadow-sm active:scale-95",
                               wrapperClass
                             )}
                             title={alvara ? `Vencimento: ${dateStr}` : 'Clique para registrar'}
                           >
                             <span className="text-[10px] font-bold font-mono tracking-tight">{!alvara ? 'Sem Registro' : dateStr}</span>
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
                  <TableCell colSpan={6} className="py-10">
                    <EmptyState
                      icon={ShieldCheck}
                      title="Nenhuma empresa encontrada"
                      description="Ajuste a busca para localizar a matriz de alvarás da carteira."
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
            <Badge variant="outline" className="border-white/30 text-white font-black text-[9px] absolute top-4 right-4 uppercase bg-[#39586D]">{formData.tipo || 'Tipo'}</Badge>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Editar' : 'Cadastrar'} Alvará</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-1">
              Gerencie a documentação — Empresa: {activeClientName || 'Selecione uma empresa'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 bg-white space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> Empresa Vinculada
                </Label>
                <Select value={formData.clienteId} onValueChange={(v) => setFormData({...formData, clienteId: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11 font-bold text-xs uppercase text-[#39586D]">
                    <SelectValue placeholder="Selecione o Cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients || []).sort((a: any, b: any) => (a.corporateName || "").localeCompare(b.corporateName || "")).map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase text-[#39586D]">
                        {c.corporateName} {c.cnpj ? `— ${c.cnpj}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <FileSignature className="h-3 w-3" /> Tipo de Alvará / Licença
                </Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11 font-bold text-xs uppercase text-[#39586D]">
                    <SelectValue placeholder="Selecione o Tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ALVARA_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="font-bold text-xs uppercase">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Órgão Emissor</Label>
                <Input 
                  placeholder="Ex: Prefeitura Municipal / Corpo de Bombeiros" 
                  value={formData.orgaoEmissor}
                  onChange={(e) => setFormData({...formData, orgaoEmissor: e.target.value})}
                  className="border-[#D2D7DB] font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nº de Registro / Inscrição</Label>
                <Input 
                  placeholder="000.000.000-00" 
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  className="border-[#D2D7DB] font-mono font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Status Atual</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11 font-black text-xs uppercase text-[#2C4156]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO" className="font-bold text-xs uppercase">🟢 Ativo / Regular</SelectItem>
                    <SelectItem value="EM_RENOVACAO" className="font-bold text-xs uppercase">🟡 Em Processo de Renovação</SelectItem>
                    <SelectItem value="VENCIDO" className="font-bold text-xs uppercase">🔴 Vencido</SelectItem>
                    <SelectItem value="CASSADO" className="font-bold text-xs uppercase">⚫ Cassado / Cancelado</SelectItem>
                    <SelectItem value="DISPENSADO" className="font-bold text-xs uppercase">⚫ Dispensado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Emissão
                  </Label>
                  <Input 
                    type="date"
                    value={formData.dataEmissao}
                    onChange={(e) => setFormData({...formData, dataEmissao: e.target.value})}
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

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Anotações (Opcional)</Label>
                <Input 
                  placeholder="Informações adicionais..." 
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="border-[#D2D7DB]"
                />
              </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="font-bold text-xs uppercase border-[#D2D7DB]">Cancelar</Button>
            <Button 
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-10 shadow-lg" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
