"use client"

import React, { useState, useMemo } from "react"
import { 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  MoreVertical,
  Loader2,
  CalendarDays,
  Trash2,
  UserPlus,
  X,
  Layers,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { ProcessDetailsDrawer } from "@/components/processes/process-details-drawer"
import { CreateProcessModal } from "@/components/processes/create-process-modal"
import { format, parseISO, addMonths, subMonths, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ProcessosPage() {
  const firestore = useFirestore()
  const { userData, userLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompetence, setSelectedCompetence] = useState<Date>(startOfMonth(new Date()))
  const [selectedProcess, setSelectedProcess] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const processesQuery = useMemoFirebase(() => 
    userLoaded ? query(collection(firestore, "processes"), orderBy("prazo", "asc")) : null, 
    [firestore, userLoaded]
  )
  const { data: rawProcesses, isLoading } = useCollection(processesQuery)

  const clientsQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "clients") : null, 
    [firestore, userLoaded]
  )
  const { data: clients = [] } = useCollection(clientsQuery)

  const usersQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "users") : null, 
    [firestore, userLoaded]
  )
  const { data: team = [] } = useCollection(usersQuery)

  const filteredProcesses = useMemo(() => {
    if (!rawProcesses || !userData) return []
    
    const competenceKey = format(selectedCompetence, "yyyy-MM")

    return rawProcesses.filter(p => {
      const pComp = p.competencia ? format(typeof p.competencia === 'string' ? parseISO(p.competencia) : new Date(p.competencia), "yyyy-MM") : ""
      if (pComp !== competenceKey) return false

      if (userData.profile === 'ADMINISTRADOR' || userData.profile === 'SÓCIO') return true

      return (
        p.responsavelId === userData.fullName || 
        p.responsavelId === userData.id ||
        p.auxiliarId === userData.fullName ||
        p.auxiliarId === userData.id ||
        p.responsavelId === "Geral"
      )
    })
  }, [rawProcesses, userData, selectedCompetence])

  const hierarchicalData = useMemo(() => {
    const departments: Record<string, any> = {}
    const searchLower = searchTerm.toLowerCase()

    const searchFiltered = filteredProcesses.filter(p => {
      if (!searchTerm) return true
      const client = (clients || []).find(c => c.id === p.clienteId)
      return (
        client?.corporateName?.toLowerCase().includes(searchLower) ||
        client?.nomeFantasia?.toLowerCase().includes(searchLower) ||
        client?.cnpj?.includes(searchTerm) ||
        p.nomeProcesso?.toLowerCase().includes(searchLower)
      )
    })

    searchFiltered.forEach(p => {
      const dept = p.departamento || "Geral"
      const obName = p.nomeProcesso || "Processo Avulso"

      if (!departments[dept]) departments[dept] = {}
      if (!departments[dept][obName]) departments[dept][obName] = []
      
      departments[dept][obName].push(p)
    })

    return Object.entries(departments).map(([deptName, obligations]) => ({
      name: deptName,
      obligations: Object.entries(obligations).map(([obName, items]) => ({
        name: obName,
        items: items as any[]
      }))
    }))
  }, [filteredProcesses, searchTerm, clients])

  const stats = useMemo(() => {
    const list = filteredProcesses || []
    return {
      total: list.length,
      late: list.filter(p => p.situacao === 'em_multa').length,
      todo: list.filter(p => p.situacao === 'a_fazer').length,
      progress: list.filter(p => p.situacao === 'em_progresso').length,
      done: list.filter(p => p.situacao === 'concluido').length,
      waived: list.filter(p => p.situacao === 'dispensado').length,
    }
  }, [filteredProcesses])

  const handleOpenProcess = (process: any) => {
    const client = (clients || []).find(c => c.id === process.clienteId)
    setSelectedProcess({ ...process, client })
    setIsDrawerOpen(true)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleBatchDelete = () => {
    if (confirm(`Deseja excluir permanentemente ${selectedIds.length} processos?`)) {
      selectedIds.forEach(id => deleteDocumentNonBlocking(doc(firestore, "processes", id)))
      toast({ title: "Processos excluídos", variant: "destructive" })
      setSelectedIds([])
    }
  }

  const handleBatchAssign = (userName: string) => {
    selectedIds.forEach(id => updateDocumentNonBlocking(doc(firestore, "processes", id), { responsavelId: userName }))
    toast({ title: `${selectedIds.length} processos atribuídos a ${userName}` })
    setSelectedIds([])
  }

  const changeMonth = (direction: 'next' | 'prev') => {
    setSelectedCompetence(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão de Produção</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Controle de obrigações por departamento e processo.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-[#D2D7DB] rounded-xl px-2 py-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] font-black text-[#98A7AA] uppercase leading-none">Competência</span>
              <span className="text-xs font-black text-[#2C4156] uppercase">{format(selectedCompetence, "MMMM yyyy", { locale: ptBR })}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg h-11 px-6"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Criar Processo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiMiniCard label="Total" value={stats.total} icon={Layers} color="bg-[#2C4156]" />
        <KpiMiniCard label="Em Multa" value={stats.late} icon={AlertCircle} color="bg-[#E74C3C]" />
        <KpiMiniCard label="A Fazer" value={stats.todo} icon={Clock} color="bg-[#98A7AA]" />
        <KpiMiniCard label="Progresso" value={stats.progress} icon={Loader2} color="bg-[#2574A9]" />
        <KpiMiniCard label="Concluído" value={stats.done} icon={CheckCircle2} color="bg-[#1FA67A]" />
        <KpiMiniCard label="Dispensado" value={stats.waived} icon={XCircle} color="bg-[#39586D]" />
      </div>

      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 bg-[#2C4156] text-white p-4 rounded-xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedIds([])} className="text-white hover:bg-white/10">
              <X className="h-4 w-4" />
            </Button>
            <span className="font-black uppercase text-xs tracking-widest">{selectedIds.length} Processos Selecionados</span>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-white text-[#2C4156] font-black uppercase text-[10px] hover:bg-white/90">
                  <UserPlus className="h-3 w-3 mr-2" /> Atribuir Responsável
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={() => handleBatchAssign("Geral")} className="font-bold text-xs uppercase">GERAL</DropdownMenuItem>
                {team.map(u => (
                  <DropdownMenuItem key={u.id} onClick={() => handleBatchAssign(u.fullName)} className="font-bold text-xs uppercase">
                    {u.fullName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="destructive" className="font-black uppercase text-[10px]" onClick={handleBatchDelete}>
              <Trash2 className="h-3 w-3 mr-2" /> Apagar Lote
            </Button>
          </div>
        </div>
      )}

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b bg-[#F7F7F7]/50 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input 
                placeholder="Buscar cliente, processo ou CNPJ..." 
                className="pl-10 bg-white border-[#D2D7DB]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" /></div>
          ) : hierarchicalData.length > 0 ? (
            <div className="divide-y divide-[#D2D7DB]">
              {hierarchicalData.map((dept) => (
                <div key={dept.name} className="bg-white">
                  <div className="bg-[#2C4156]/5 px-6 py-2 border-y border-[#D2D7DB]/50">
                    <h2 className="text-[11px] font-black text-[#2C4156] uppercase tracking-[0.2em]">{dept.name}</h2>
                  </div>
                  
                  {dept.obligations.map((ob) => (
                    <div key={ob.name} className="border-b last:border-none">
                      <div className="bg-[#F7F7F7] px-8 py-3 flex items-center gap-3">
                        <div className="w-1 h-4 bg-[#1FA67A] rounded-full" />
                        <h3 className="text-xs font-black text-[#39586D] uppercase tracking-wider">{ob.name}</h3>
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold border-[#D2D7DB] text-[#98A7AA]">
                          {ob.items.length} CLIENTES
                        </Badge>
                      </div>

                      <Table>
                        <TableBody>
                          {ob.items.map(p => {
                            const client = (clients || []).find(c => c.id === p.clienteId)
                            const isSelected = selectedIds.includes(p.id)
                            return (
                              <TableRow key={p.id} className={cn(
                                "hover:bg-[#F7F7F7] transition-colors group",
                                isSelected && "bg-[#1FA67A]/5"
                              )}>
                                <TableCell className="w-12 text-center pl-8">
                                  <Checkbox 
                                    checked={isSelected} 
                                    onCheckedChange={() => toggleSelect(p.id)}
                                    className="h-5 w-5 data-[state=checked]:bg-[#1FA67A]"
                                  />
                                </TableCell>
                                <TableCell className="py-4" onClick={() => handleOpenProcess(p)}>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-[#2C4156] uppercase leading-tight">{client?.corporateName || 'Cliente não identificado'}</span>
                                    <span className="text-[9px] font-mono text-[#98A7AA]">{client?.cnpj}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center w-40">
                                  <Badge className={cn(
                                    "text-[9px] font-black uppercase border-none px-3",
                                    p.situacao === 'concluido' ? "bg-[#7ED6B5] text-[#1FA67A]" :
                                    p.situacao === 'em_multa' ? "bg-[#FEE2E2] text-[#E74C3C]" :
                                    p.situacao === 'em_progresso' ? "bg-[#E3F0F9] text-[#2574A9]" : "bg-[#F3F4F6] text-[#98A7AA]"
                                  )}>
                                    {p.situacao?.replace('_', ' ') || 'A Fazer'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center w-32">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-[#39586D]">
                                      {p.prazo ? format(typeof p.prazo === 'string' ? parseISO(p.prazo) : new Date(p.prazo), 'dd/MM') : '--'}
                                    </span>
                                    <span className="text-[8px] font-bold text-[#98A7AA] uppercase tracking-tighter">Vencimento</span>
                                  </div>
                                </TableCell>
                                <TableCell className="w-40">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#2C4156] flex items-center justify-center text-white text-[8px] font-black uppercase">
                                      {p.responsavelId?.charAt(0) || 'G'}
                                    </div>
                                    <span className="text-[10px] font-bold text-[#39586D] truncate max-w-[100px] uppercase">{p.responsavelId || 'Geral'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right pr-8 w-12">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]" onClick={() => handleOpenProcess(p)}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-12 bg-white">
              <CalendarDays className="h-12 w-12 text-[#D2D7DB] mb-4" />
              <h3 className="text-lg font-black text-[#2C4156] uppercase">Nenhum processo localizado</h3>
              <p className="text-sm text-[#98A7AA] font-bold max-w-sm">Tente ajustar os filtros de busca ou mude a competência mensal.</p>
              <Button className="mt-6 bg-[#1FA67A] font-black uppercase text-xs" onClick={() => setIsCreateModalOpen(true)}>Criar Novo Processo</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProcessDetailsDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
        process={selectedProcess} 
      />

      <CreateProcessModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  )
}

function KpiMiniCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white h-20">
      <CardContent className="p-0 flex flex-col h-full">
        <div className={cn("h-1", color)} />
        <div className="p-4 flex items-center justify-between flex-1">
          <div>
            <p className="text-[9px] font-black text-[#98A7AA] uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-[#2C4156] leading-none">{value}</p>
          </div>
          <Icon className="h-4 w-4 text-[#D2D7DB]" />
        </div>
      </CardContent>
    </Card>
  )
}
