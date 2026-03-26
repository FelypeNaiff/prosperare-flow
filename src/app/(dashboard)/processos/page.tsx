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
  XCircle,
  Filter,
  FileText,
  ChevronDown,
  Download,
  Share2,
  ShieldCheck,
  ArrowUpRight
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
  DropdownMenuSeparator
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
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const processesQuery = useMemoFirebase(() => 
    userLoaded ? query(collection(firestore, "processes"), orderBy("prazo", "asc")) : null, 
    [firestore, userLoaded]
  )
  const { data: rawProcesses = [], isLoading } = useCollection(processesQuery)

  const clientsQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "clients") : null, 
    [firestore, userLoaded]
  )
  const { data: clients = [] } = useCollection(clientsQuery)

  const filteredProcesses = useMemo(() => {
    if (!rawProcesses || !userData) return []
    
    const competenceKey = format(selectedCompetence, "yyyy-MM")

    return rawProcesses.filter(p => {
      const pComp = p.competencia ? format(typeof p.competencia === 'string' ? parseISO(p.competencia) : new Date(p.competencia), "yyyy-MM") : ""
      if (pComp !== competenceKey) return false

      const searchLower = searchTerm.toLowerCase()
      const client = (clients || []).find(c => c.id === p.clienteId)
      const matchesSearch = !searchTerm || 
        client?.corporateName?.toLowerCase().includes(searchLower) ||
        client?.nomeFantasia?.toLowerCase().includes(searchLower) ||
        client?.cnpj?.includes(searchTerm) ||
        p.nomeProcesso?.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false

      if (userData.profile === 'ADMINISTRADOR' || userData.profile === 'SÓCIO') return true

      return (
        p.responsavelId === userData.fullName || 
        p.responsavelId === userData.id ||
        p.auxiliarId === userData.fullName ||
        p.auxiliarId === userData.id ||
        p.responsavelId === "Geral"
      )
    })
  }, [rawProcesses, userData, selectedCompetence, searchTerm, clients])

  const groupedProcesses = useMemo(() => {
    const groups: Record<string, any> = {}
    
    filteredProcesses.forEach(p => {
      const key = p.nomeProcesso || "Processo Avulso"
      if (!groups[key]) {
        groups[key] = {
          name: key,
          clientsCount: 0,
          processesCount: 0,
          departments: new Set(),
          responsibles: new Set(),
          items: []
        }
      }
      groups[key].items.push(p)
      groups[key].clientsCount++
      groups[key].processesCount++
      if (p.departamento) groups[key].departments.add(p.departamento)
      if (p.responsavelId) groups[key].responsibles.add(p.responsavelId)
    })

    return Object.values(groups)
  }, [filteredProcesses])

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

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const changeMonth = (direction: 'next' | 'prev') => {
    setSelectedCompetence(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Situação dos Processos</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Controle consolidado de produtividade e entregas.</p>
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

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
          <Input 
            placeholder="Buscar por cliente ou processo..." 
            className="pl-10 h-11 bg-white border-[#D2D7DB]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] font-bold h-11 px-4 gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] font-bold h-11 px-4 gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-[#D2D7DB] text-[#2C4156] font-black uppercase text-[10px] h-11">
                Ações em Lote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => toast({ title: "Modo Edição em Lote" })} className="font-bold uppercase text-[10px] gap-2">
                <ShieldCheck className="h-3.5 w-3.5" /> Edição em Lote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: "Modo Envio em Lote" })} className="font-bold uppercase text-[10px] gap-2">
                <Share2 className="h-3.5 w-3.5" /> Envio em Lote
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="font-bold uppercase text-[10px] gap-2" onClick={() => toast({ title: "Atribuir Docs" })}>
                <FileText className="h-3.5 w-3.5" /> Atribuir Documentos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center pl-4">
                  <Checkbox 
                    checked={selectedIds.length === filteredProcesses.length && filteredProcesses.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedIds(filteredProcesses.map(i => i.id))
                      else setSelectedIds([])
                    }}
                    className="border-white/30 data-[state=checked]:bg-[#1FA67A] data-[state=checked]:border-[#1FA67A]"
                  />
                </TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Processos</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Nº de Clientes</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Nº de Processos</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Departamentos</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Responsáveis</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1FA67A]" />
                  </TableCell>
                </TableRow>
              ) : groupedProcesses.length > 0 ? (
                groupedProcesses.map((group) => (
                  <React.Fragment key={group.name}>
                    <TableRow 
                      className="bg-white hover:bg-[#F7F7F7] cursor-pointer group transition-colors"
                      onClick={() => toggleGroup(group.name)}
                    >
                      <TableCell className="w-12 text-center pl-4">
                        <Checkbox 
                          checked={group.items.every((i: any) => selectedIds.includes(i.id))}
                          onCheckedChange={(checked) => {
                            const ids = group.items.map((i: any) => i.id)
                            if (checked) setSelectedIds(prev => [...new Set([...prev, ...ids])])
                            else setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
                          }}
                          className="h-5 w-5 data-[state=checked]:bg-[#1FA67A]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#2C4156] uppercase text-xs">{group.name}</span>
                          <ChevronRight className={cn(
                            "h-4 w-4 text-[#98A7AA] transition-transform",
                            openGroups.includes(group.name) && "rotate-90"
                          )} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs text-[#39586D]">{group.clientsCount}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-[#39586D]">{group.processesCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(group.departments).map((dept: any) => (
                            <Badge key={dept} variant="outline" className="text-[8px] uppercase border-[#D2D7DB]">{dept}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-2">
                          {Array.from(group.responsibles).slice(0, 3).map((resp: any) => (
                            <Avatar key={resp} className="h-6 w-6 border-2 border-white">
                              <AvatarFallback className="bg-[#2C4156] text-white text-[8px] font-black">
                                {resp.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {group.responsibles.size > 3 && (
                            <div className="h-6 w-6 rounded-full bg-[#F7F7F7] border-2 border-white flex items-center justify-center text-[8px] font-black text-[#98A7AA]">
                              +{group.responsibles.size - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {openGroups.includes(group.name) && (
                      <TableRow className="bg-[#F7F7F7]/50 hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0 border-b">
                          <div className="px-12 py-2">
                            <Table>
                              <TableHeader className="bg-transparent">
                                <TableRow className="border-none hover:bg-transparent">
                                  <TableHead className="text-[9px] font-black uppercase text-[#98A7AA] h-8">Cliente / CNPJ</TableHead>
                                  <TableHead className="text-[9px] font-black uppercase text-[#98A7AA] h-8 text-center">Status</TableHead>
                                  <TableHead className="text-[9px] font-black uppercase text-[#98A7AA] h-8 text-center">Vencimento</TableHead>
                                  <TableHead className="text-[9px] font-black uppercase text-[#98A7AA] h-8">Responsável</TableHead>
                                  <TableHead className="w-12"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.items.map((p: any) => {
                                  const client = clients.find(c => c.id === p.clienteId)
                                  return (
                                    <TableRow key={p.id} className="border-none hover:bg-[#EBEDF0] transition-colors rounded-lg group/item">
                                      <TableCell className="py-2">
                                        <div className="flex flex-col">
                                          <span className="text-[11px] font-bold text-[#2C4156] uppercase">{client?.corporateName || '---'}</span>
                                          <span className="text-[9px] font-mono text-[#98A7AA]">{client?.cnpj || '---'}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge className={cn(
                                          "text-[9px] font-black uppercase border-none px-2",
                                          p.situacao === 'concluido' ? "bg-[#7ED6B5] text-[#1FA67A]" :
                                          p.situacao === 'em_multa' ? "bg-[#FEE2E2] text-[#E74C3C]" :
                                          p.situacao === 'em_progresso' ? "bg-[#E3F0F9] text-[#2574A9]" : "bg-[#F3F4F6] text-[#98A7AA]"
                                        )}>
                                          {p.situacao?.replace('_', ' ')}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <span className="text-[10px] font-bold text-[#39586D]">
                                          {p.prazo ? format(typeof p.prazo === 'string' ? parseISO(p.prazo) : new Date(p.prazo), 'dd/MM/yyyy') : '--'}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-[10px] font-bold text-[#39586D] uppercase">{p.responsavelId || 'Geral'}</span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7 text-[#98A7AA] opacity-0 group-hover/item:opacity-100"
                                          onClick={() => handleOpenProcess(p)}
                                        >
                                          <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhum processo localizado para os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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

function Avatar({ className, children }: any) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>
      {children}
    </div>
  )
}

function AvatarFallback({ className, children }: any) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}>
      {children}
    </div>
  )
}
