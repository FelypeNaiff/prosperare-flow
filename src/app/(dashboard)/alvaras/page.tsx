"use client"

import { useState, useMemo } from "react"
import { ShieldCheck, Search, FileSignature, AlertTriangle, FileText, Plus, Edit, Trash2, Loader2, Building2, Calendar, Save, FileDown } from "lucide-react"
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

export default function AlvarasPage() {
  const firestore = useFirestore()
  const { userLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const alvarasQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "alvaras") : null, [firestore, userLoaded])
  const { data: alvaras = [], isLoading: alvarasLoading } = useCollection(alvarasQuery)

  const clientsQuery = useMemoFirebase(() => userLoaded ? collection(firestore, "clients") : null, [firestore, userLoaded])
  const { data: clients = [] } = useCollection(clientsQuery)

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

  // Calculations
  const processedList = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    
    return (alvaras || []).map((a: any) => {
      const client = (clients || []).find((c: any) => c.id === a.clienteId)
      return { ...a, clientName: client?.corporateName || "Cliente Removido", clientCnpj: client?.cnpj || "" }
    }).filter((a: any) => {
       if (!searchTerm) return true;
       return a.clientName.toLowerCase().includes(searchLower) || 
              a.tipo?.toLowerCase().includes(searchLower) || 
              a.numero?.toLowerCase().includes(searchLower)
    }).sort((a: any, b: any) => {
      const dateA = a.validade ? new Date(a.validade).getTime() : 0;
      const dateB = b.validade ? new Date(b.validade).getTime() : 0;
      return dateA - dateB; 
    })
  }, [alvaras, clients, searchTerm])

  const stats = useMemo(() => {
    const today = new Date()
    const warningDate = addDays(today, 30)

    let ativos = 0
    let vencendo = 0
    let vencidos = 0

    ;(alvaras || []).forEach((a: any) => {
      if (a.status === 'VENCIDO') {
        vencidos++
      } else if (a.status === 'CASSADO') {
        // ignora
      } else {
        if (a.validade) {
          const valDate = new Date(a.validade)
          if (isValid(valDate)) {
            if (isBefore(valDate, today)) {
               vencidos++
            } else if (isBefore(valDate, warningDate)) {
               vencendo++
            } else {
               ativos++
            }
          }
        } else {
          ativos++
        }
      }
    })

    return { total: (alvaras || []).length, ativos, vencendo, vencidos }
  }, [alvaras])

  const handleOpenModal = (item?: any) => {
    if (item) {
      setFormData({
        id: item.id || "",
        clienteId: item.clienteId || "",
        tipo: item.tipo || "",
        numero: item.numero || "",
        orgaoEmissor: item.orgaoEmissor || "",
        dataEmissao: item.dataEmissao || "",
        validade: item.validade || "",
        status: item.status || "ATIVO",
        observacoes: item.observacoes || ""
      })
      setEditingItem(item)
    } else {
      setFormData({
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
            <FileDown className="h-4 w-4" /> Exportar Relatório
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg h-11 px-6" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" /> Novo Alvará ou Licença
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total de Registros" value={stats.total} icon={FileText} color="info" />
        <KpiCard label="Regulares / Ativos" value={stats.ativos} icon={ShieldCheck} color="success" />
        <KpiCard label="Vencendo (30d)" value={stats.vencendo} icon={AlertTriangle} color="warning" />
        <KpiCard label="Vencidos/Críticos" value={stats.vencidos} icon={AlertTriangle} color="destructive" />
      </div>

      <div id="pdf-export-content" className="bg-white">
        <div id="pdf-header" className="hidden p-8 border-b-2 border-[#2C4156] mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-[#2C4156] uppercase tracking-tighter">PROSPERARE <span className="text-[#1FA67A]">FLOW</span></h2>
              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.4em] mt-1">Relatório Oficial de Alvarás e Licenças</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#39586D] uppercase">Documento Interno de Gestão</p>
              <p className="text-[9px] text-[#98A7AA] font-mono mt-1">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden">
        <CardHeader className="pb-4 bg-[#F7F7F7] border-b pdf-hide">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
            <Input
              placeholder="Buscar por cliente, emissor ou número..."
              className="pl-10 bg-white border-[#D2D7DB] h-11"
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
                <TableHead className="text-white font-black uppercase text-[10px]">Descrição</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center w-48">Data Vencimento</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right pr-6 w-24 action-col">Ações</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right pr-6 action-col">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alvarasLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#1FA67A]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Carregando Base...</span>
                  </TableCell>
                </TableRow>
              ) : processedList.length > 0 ? (
                processedList.map((item: any) => {
                  const valDate = item.validade ? new Date(item.validade) : null;
                  const today = new Date();
                  
                  let isLate = item.status === 'VENCIDO' || item.status === 'CASSADO';
                  let isWarning = item.status === 'EM_RENOVACAO';
                  
                  if (valDate && isValid(valDate)) {
                    if (isBefore(valDate, today)) {
                      isLate = true;
                    } else if (differenceInDays(valDate, today) <= 30) {
                      isWarning = true;
                    }
                  }

                  const dateStr = valDate && isValid(valDate) ? format(valDate, 'dd/MM/yyyy') : 'Sem Prazo';

                  const statusWord = isLate && item.status !== 'EM_RENOVACAO' ? 'VENCIDO' : isWarning ? 'ALERTA' : 'OK';

                  const wrapperClass = isLate ? "bg-white border hover:bg-[#FEE2E2] border-[#E74C3C]/20 text-[#E74C3C]" :
                                       isWarning ? "bg-white border hover:bg-[#FFF4E5] border-[#F39C12]/30 text-[#F39C12]" :
                                       "bg-white border hover:bg-[#E6F6F0] border-[#1FA67A]/30 text-[#1FA67A]";

                  const badgeClass = isLate ? "bg-[#E74C3C] text-white" :
                                     isWarning ? "bg-[#F39C12] text-white" :
                                     "bg-[#1FA67A] text-white";

                  return (
                  <TableRow key={item.id} className="hover:bg-[#F7F7F7]/50 group transition-colors pdf-row">
                    <TableCell className="pl-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2C4156] text-xs uppercase">{item.clientName}</span>
                        <span className="text-[9px] font-mono text-[#98A7AA] font-bold tracking-widest">{item.clientCnpj || '---'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#39586D] text-[11px] uppercase">{item.tipo}</span>
                        <span className="text-[9px] text-[#98A7AA] font-bold">{item.orgaoEmissor || '---'} {item.numero ? `| Reg: ${item.numero}` : ''}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-1.5 align-middle">
                       <div 
                         className={cn(
                           "w-full max-w-[160px] mx-auto flex items-center justify-between gap-1 p-1.5 rounded-lg shadow-sm border",
                           wrapperClass
                         )}
                       >
                         <span className="text-[10px] font-bold font-mono tracking-tight">{dateStr}</span>
                         <Badge className={cn("text-[8px] font-black uppercase px-2 py-0 min-h-0 h-4 border-none", badgeClass)}>
                           {statusWord}
                         </Badge>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 action-col">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#39586D]" onClick={() => handleOpenModal(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA] font-bold text-[10px] uppercase">
                    Nenhum alvará ou licença registrado encontrado.
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
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Editar' : 'Novo'} Alvará / Licença</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Gerencie a documentação e garanta o compliance da empresa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="modal-scroll-content">
            <div className="grid grid-cols-2 gap-5 p-6 bg-white">
              
              <div className="col-span-2 space-y-2">
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

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <FileSignature className="h-3 w-3" /> Tipo de Documento
                </Label>
                <Input 
                  placeholder="Ex: Alvará de Funcionamento" 
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold uppercase"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Órgão Emissor</Label>
                <Input 
                  placeholder="Ex: Prefeitura Municipal / Corpo de Bombeiros" 
                  value={formData.orgaoEmissor}
                  onChange={(e) => setFormData({...formData, orgaoEmissor: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold uppercase"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nº de Registro / Inscrição</Label>
                <Input 
                  placeholder="000.000.000-00" 
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  className="border-[#D2D7DB] font-mono font-bold"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Status de Operação</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11 font-black text-xs uppercase text-[#2C4156]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO" className="font-bold text-xs uppercase">🟢 Ativo / Regular</SelectItem>
                    <SelectItem value="EM_RENOVACAO" className="font-bold text-xs uppercase">🟡 Em Processo de Renovação</SelectItem>
                    <SelectItem value="VENCIDO" className="font-bold text-xs uppercase">🔴 Vencido</SelectItem>
                    <SelectItem value="CASSADO" className="font-bold text-xs uppercase">⚫ Cassado / Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Data de Emissão
                </Label>
                <Input 
                  type="date"
                  value={formData.dataEmissao}
                  onChange={(e) => setFormData({...formData, dataEmissao: e.target.value})}
                  className="border-[#D2D7DB] font-bold text-[#39586D]"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#1FA67A] tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-[#1FA67A]" /> Vencimento
                </Label>
                <Input 
                  type="date"
                  value={formData.validade}
                  onChange={(e) => setFormData({...formData, validade: e.target.value})}
                  className="border-[#1FA67A] focus-visible:ring-[#1FA67A] font-black text-[#2C4156]"
                />
              </div>

              <div className="col-span-2 space-y-2 pt-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Anotações Internas (Opcional)</Label>
                <Input 
                  placeholder="Informações adicionais importantes..." 
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="border-[#D2D7DB]"
                />
              </div>

            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="font-bold text-xs uppercase border-[#D2D7DB]">Cancelar</Button>
            <Button 
              className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-10 shadow-lg" 
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
