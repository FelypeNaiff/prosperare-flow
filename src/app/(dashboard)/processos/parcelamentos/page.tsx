"use client"

import { useState, useMemo } from "react"
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle,
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  History,
  ShieldAlert,
  Edit,
  Loader2,
  Trash2,
  ChevronRight,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { InstallmentFormModal } from "@/components/installments/installment-form-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import React from "react"

export default function ParcelamentosPage() {
  const firestore = useFirestore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Novos Componentes de Estado
  const [editingInst, setEditingInst] = useState<any>(null)
  const [historyInst, setHistoryInst] = useState<any>(null)
  const [openGroups, setOpenGroups] = useState<string[]>([])
  
  // Filtros de Sheet
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [orgaoFilter, setOrgaoFilter] = useState("Todos")

  const installmentsQuery = useMemoFirebase(() => collection(firestore, "installments"), [firestore])
  const { data: installments = [], isLoading } = useCollection(installmentsQuery)

  const filteredData = useMemo(() => {
    return (installments || []).filter(i => {
      const matchesSearch = i.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            i.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            i.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "Todos" ? true : i.status === statusFilter
      const matchesOrgao = orgaoFilter === "Todos" ? true : i.tipo === orgaoFilter

      return matchesSearch && matchesStatus && matchesOrgao
    })
  }, [installments, searchTerm, statusFilter, orgaoFilter])

  // Lógica de Agrupamento por Empresa
  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredData.forEach(item => {
      const client = item.clientName || 'Cliente Avulso'
      if (!groups[client]) groups[client] = []
      groups[client].push(item)
    })
    
    // Convert object to array and sort by length or name
    return Object.keys(groups).sort().map(key => ({
      clientName: key,
      items: groups[key]
    }))
  }, [filteredData])

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const uniqueOrgaos = useMemo(() => Array.from(new Set((installments || []).map(i => i.tipo).filter(Boolean))), [installments])

  const stats = {
    ativos: (installments || []).filter(i => i.status === 'Ativo').length,
    cancelados: (installments || []).filter(i => i.status?.includes('Cancelado')).length,
    quitados: (installments || []).filter(i => i.status === 'Quitado').length,
    esteMes: (installments || []).filter(i => i.createdAt?.startsWith(new Date().toISOString().substring(0, 7))).length
  }

  const hasCriticalRisk = (installments || []).some(i => i.tipo?.includes('Simples Nacional') && i.status?.includes('Cancelado'))

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation()
    deleteDocumentNonBlocking(doc(firestore, "installments", id))
    toast({ title: "Registro removido", variant: "destructive" })
  }

  const handleEdit = (item: any, e?: React.MouseEvent) => {
    if(e) e.stopPropagation()
    setEditingInst(item)
  }

  const handleHistory = (item: any, e?: React.MouseEvent) => {
    if(e) e.stopPropagation()
    setHistoryInst(item)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-[#7ED6B5] text-[#2563EB] border-none font-bold text-[10px] uppercase h-6">Ativo</Badge>
      case 'Cancelado':
      case 'Cancelado por não pagamento':
        return <Badge className="bg-[#FEE2E2] text-[#E74C3C] border-none font-bold text-[10px] uppercase h-6">Cancelado</Badge>
      case 'Quitado':
        return <Badge className="bg-[#E3F0F9] text-[#2574A9] border-none font-bold text-[10px] uppercase h-6">Quitado</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] uppercase h-6">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-[#2563EB]" />
            Controle de Parcelamentos
          </h1>
          <p className="text-[#98A7AA] font-medium text-sm">Gestão consolidada de acordos e dívidas parceladas.</p>
        </div>
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-semibold text-xs shadow-lg h-11 px-6" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Parcelamento
        </Button>
      </div>

      {hasCriticalRisk && (
        <Alert className="bg-[#FEE2E2] border-[#E74C3C]/20 text-[#E74C3C] shadow-lg">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-semibold text-xs tracking-wide">Atenção: Risco de Exclusão do Simples</AlertTitle>
          <AlertDescription className="text-xs font-medium mt-1">
            Existem parcelamentos do Simples Nacional cancelados. Verifique os clientes afetados para evitar a exclusão de ofício do regime.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiMini label="Ativos" value={stats.ativos} icon={CheckCircle2} color="success" />
        <KpiMini label="Gerados este mês" value={stats.esteMes} icon={Clock} color="info" />
        <KpiMini label="Cancelados" value={stats.cancelados} icon={XCircle} color="destructive" />
        <KpiMini label="Quitados" value={stats.quitados} icon={CheckCircle2} color="info" />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 border-b border-[#D2D7DB] pb-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
          <Input 
            placeholder="Buscar por cliente ou tipo/órgão..." 
            className="pl-10 h-11 bg-white border-[#D2D7DB] shadow-sm font-bold w-full" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] font-bold h-11 px-4 gap-2 bg-white shadow-sm shrink-0">
              <Filter className="h-4 w-4" /> Filtros
              {(statusFilter !== "Todos" || orgaoFilter !== "Todos") && (
                 <span className="h-2 w-2 rounded-full bg-[#E74C3C] ml-1"></span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#F7F7F7] border-l-[#D2D7DB]">
            <SheetHeader className="mb-6 pt-4">
              <SheetTitle className="text-[#2C4156] font-black uppercase tracking-tight text-xl">Filtros Avançados</SheetTitle>
            </SheetHeader>
            <div className="space-y-6">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Status do Parcelamento</Label>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                   <SelectTrigger className="bg-white border-[#D2D7DB] font-bold text-xs uppercase text-[#39586D] h-11">
                     <SelectValue placeholder="Selecione..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Todos" className="text-xs font-bold uppercase">Todos os Status</SelectItem>
                     <SelectItem value="Ativo" className="text-xs font-bold uppercase text-[#2563EB]">Ativo</SelectItem>
                     <SelectItem value="Cancelado" className="text-xs font-bold uppercase text-[#E74C3C]">Cancelado</SelectItem>
                     <SelectItem value="Quitado" className="text-xs font-bold uppercase text-[#2574A9]">Quitado</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Tipo / Órgão</Label>
                 <Select value={orgaoFilter} onValueChange={setOrgaoFilter}>
                   <SelectTrigger className="bg-white border-[#D2D7DB] font-bold text-xs uppercase text-[#39586D] h-11">
                     <SelectValue placeholder="Selecione..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Todos" className="text-xs font-bold uppercase">Todos os Órgãos</SelectItem>
                     {uniqueOrgaos.map(orgao => (
                       <SelectItem key={orgao} value={orgao} className="text-xs font-bold uppercase">{orgao}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               
               <Button 
                  variant="outline" 
                  className="w-full mt-4 border-[#D2D7DB] text-[#E74C3C] font-black uppercase text-xs h-11"
                  onClick={() => { setStatusFilter("Todos"); setOrgaoFilter("Todos") }}
               >
                  Limpar Filtros
               </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Empresa</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-center">Acordos Vigentes</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-right">Valor Total Agregado</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase mt-2">Sincronizando Acordos...</p>
                  </TableCell>
                </TableRow>
              ) : groupedData.length > 0 ? (
                groupedData.map((group) => {
                  const isActiveCount = group.items.filter(i => i.status === 'Ativo').length;
                  const totalValue = group.items.filter(i => i.status !== 'Cancelado').reduce((acc, curr) => acc + Number(curr.value || 0), 0)
                  return (
                    <React.Fragment key={group.clientName}>
                      <TableRow 
                        className="bg-white hover:bg-[#F7F7F7] cursor-pointer group transition-colors border-b"
                        onClick={() => toggleGroup(group.clientName)}
                      >
                        <TableCell className="w-10 text-center">
                           <Button variant="ghost" size="icon" className="h-6 w-6 text-[#98A7AA]">
                              {openGroups.includes(group.clientName) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                           </Button>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-semibold text-[#2C4156] text-xs">{group.clientName}</span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-xs text-[#39586D]">
                           {isActiveCount} {isActiveCount === 1 ? 'Acordo' : 'Acordos'}
                        </TableCell>
                        <TableCell className="text-right font-black text-[#2563EB] text-xs">
                          R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / Mês
                        </TableCell>
                        <TableCell className="text-right pr-4">
                        </TableCell>
                      </TableRow>
                      
                      {openGroups.includes(group.clientName) && (
                        <TableRow className="bg-[#F7F7F7]/50 hover:bg-[#F7F7F7]/50 border-none">
                          <TableCell colSpan={5} className="p-0">
                            <div className="px-14 py-4 space-y-2">
                               <h4 className="text-[10px] font-semibold text-[#98A7AA] border-b pb-2 mb-2">Desdobramento dos Parcelamentos</h4>
                               <Table>
                                  <TableBody>
                                    {group.items.map((item) => (
                                      <TableRow key={item.id} className={cn(
                                        "bg-white border border-[#E9ECEF] hover:border-[#2563EB] transition-colors rounded-xl shadow-sm mb-2 relative",
                                        (item.status?.includes('Cancelado')) && "bg-slate-50 border-slate-200 grayscale opacity-70 hover:border-slate-300"
                                      )}>
                                        <TableCell className="w-1/3 p-4 rounded-l-xl">
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-0.5">
                                              <span className="text-[11px] font-semibold text-[#39586D]">{item.tipo}</span>
                                              {item.tipo?.includes('Simples') && item.status?.includes('Cancelado') && (
                                                <ShieldAlert className="h-3.5 w-3.5 text-[#E74C3C]" />
                                              )}
                                            </div>
                                            <span className="text-[9px] text-[#98A7AA] font-medium">{item.descricao || 'Sem descrição particular'}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="w-1/4 p-4">
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-semibold text-[#98A7AA]">Evolução / Pagamento</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-semibold text-[#2C4156]">{item.currentParcel || 0} / {item.totalParcels || 0}</span>
                                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-[#2563EB]" 
                                                  style={{ width: `${(Number(item.currentParcel) / Number(item.totalParcels)) * 100}%` }} 
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="p-4">
                                             <div className="flex flex-col gap-1">
                                               <span className="text-[9px] font-semibold text-[#98A7AA]">Valor & Dia</span>
                                               <div className="flex items-center gap-2">
                                                  <span className="font-semibold text-[#2563EB] text-xs">R$ {Number(item.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                  <span className="text-[10px] text-[#2C4156] font-medium">Dia {item.dueDay}</span>
                                             </div>
                                           </div>
                                        </TableCell>
                                        <TableCell className="p-4 text-center">
                                          {getStatusBadge(item.status)}
                                        </TableCell>
                                        <TableCell className="p-4 text-right rounded-r-xl">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                              <Button variant="ghost" size="icon" className="text-[#98A7AA]">
                                                <MoreVertical className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[180px]">
                                              <DropdownMenuItem onClick={(e) => handleHistory(item, e)} className="gap-2 text-xs font-bold text-[#39586D]"><History className="h-4 w-4 text-[#98A7AA]" /> Ver Parcelas</DropdownMenuItem>
                                              <DropdownMenuItem onClick={(e) => handleEdit(item, e)} className="gap-2 text-xs font-bold text-[#39586D]"><Edit className="h-4 w-4 text-[#98A7AA]" /> Alterar Cadastro</DropdownMenuItem>
                                              <DropdownMenuItem 
                                                className="gap-2 text-xs font-bold text-[#E74C3C] cursor-pointer"
                                                onClick={(e) => handleDelete(item.id, e)}
                                              >
                                                <Trash2 className="h-4 w-4 text-[#E74C3C]/60" /> Excluir Vínculo
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                               </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhum parcelamento localizado para a consulta.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InstallmentFormModal 
         open={isModalOpen || !!editingInst} 
         onOpenChange={(v: boolean) => {
            setIsModalOpen(v)
            if (!v) setEditingInst(null)
         }} 
         initialData={editingInst} 
      />

      <Dialog open={!!historyInst} onOpenChange={(v: boolean) => !v && setHistoryInst(null)}>
         <DialogContent className="sm:max-w-[425px] border-[#D2D7DB] bg-[#F7F7F7]">
            <DialogHeader>
               <DialogTitle className="text-[#2C4156] font-black uppercase text-xl flex items-center gap-2">
                  <History className="h-5 w-5 text-[#98A7AA]" />
                  Memorial do Acordo
               </DialogTitle>
               <DialogDescription className="text-[#98A7AA] font-bold text-xs uppercase">
                  Auditoria de histórico do contrato.
               </DialogDescription>
            </DialogHeader>
            {historyInst && (
               <div className="py-4 space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-[#D2D7DB] shadow-sm">
                     <p className="text-[10px] font-black uppercase text-[#98A7AA] mb-1">Empresa</p>
                     <p className="text-sm font-black text-[#2C4156] uppercase">{historyInst.clientName}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#D2D7DB] shadow-sm gap-4 flex flex-col">
                     <div>
                        <p className="text-[10px] font-black uppercase text-[#98A7AA] mb-1">Órgão Registrado</p>
                        <p className="text-xs font-bold text-[#39586D] uppercase">{historyInst.tipo}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-[#98A7AA] mb-1">Observações de Abertura</p>
                        <p className="text-xs italic text-[#39586D] font-medium">{historyInst.notes || 'Nenhuma nota registrada no contrato.'}</p>
                     </div>
                     <div className="flex border-t pt-3 mt-1 gap-6">
                        <div>
                           <p className="text-[10px] font-black uppercase text-[#98A7AA] mb-1">Data Criação</p>
                           <p className="text-xs font-bold text-[#2C4156]">{new Date(historyInst.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-[#98A7AA] mb-1">Status Sistema</p>
                           {getStatusBadge(historyInst.status)}
                        </div>
                     </div>
                  </div>
               </div>
            )}
            <DialogFooter>
               <Button onClick={() => setHistoryInst(null)} className="w-full bg-[#2C4156] hover:bg-[#2C4156]/90 text-white font-black uppercase text-xs">
                  Fechar Memorial
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  )
}

function KpiMini({ label, value, icon: Icon, color }: any) {
  const colors = {
    success: "bg-[#7ED6B5]/20 text-[#2563EB]",
    info: "bg-[#E3F0F9]/20 text-[#2574A9]",
    destructive: "bg-[#FEE2E2]/20 text-[#E74C3C]",
    warning: "bg-[#FEF3C7]/20 text-[#F2B705]",
  }
  return (
    <Card className="border-[#D2D7DB] bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">{label}</p>
          <p className="text-2xl mt-1 font-black text-[#2C4156]">{value}</p>
        </div>
        <div className={cn("p-2.5 rounded-xl", colors[color as keyof typeof colors])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
