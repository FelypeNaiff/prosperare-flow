
"use client"

import React, { useState, useMemo } from "react"
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Filter, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Loader2,
  CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  useMemoFirebase 
} from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { ProcessDetailsDrawer } from "@/components/processes/process-details-drawer"
import { CreateProcessModal } from "@/components/processes/create-process-modal"
import { format, parseISO, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ProcessosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedMonths, setExpandedModels] = useState<string[]>([])
  const [selectedProcess, setSelectedProcess] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Queries reais
  const processesQuery = useMemoFirebase(() => 
    query(collection(firestore, "processos"), orderBy("prazo", "asc")), 
    [firestore]
  )
  const { data: processes, isLoading } = useCollection(processesQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients } = useCollection(clientsQuery)

  // Agrupamento por Mês de Competência
  const groupedData = useMemo(() => {
    if (!processes) return []
    
    const groups: Record<string, any[]> = {}
    
    processes.forEach(p => {
      let monthKey = "Sem Competência"
      if (p.competencia) {
        try {
          const date = typeof p.competencia === 'string' ? parseISO(p.competencia) : new Date(p.competencia)
          if (isValid(date)) {
            monthKey = format(date, "MMMM yyyy", { locale: ptBR })
          }
        } catch (e) {
          console.error("Erro ao formatar data de competência", e)
        }
      }

      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(p)
    })

    // Ordena os meses
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === "Sem Competência") return 1
      if (b[0] === "Sem Competência") return -1
      return 0
    }).map(([month, items]) => ({
      id: month,
      label: month.toUpperCase(),
      processos: items
    }))
  }, [processes])

  const stats = useMemo(() => {
    const list = processes || []
    return {
      total: list.length,
      late: list.filter(p => p.situacao === 'em_multa').length,
      todo: list.filter(p => p.situacao === 'a_fazer').length,
      progress: list.filter(p => p.situacao === 'em_progresso').length,
      done: list.filter(p => p.situacao === 'concluido').length,
      waived: list.filter(p => p.situacao === 'dispensado').length,
    }
  }, [processes])

  const toggleExpand = (id: string) => {
    setExpandedModels(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleOpenProcess = (process: any) => {
    const client = (clients || []).find(c => c.id === process.clienteId)
    setSelectedProcess({ ...process, client })
    setIsDrawerOpen(true)
  }

  // Auto-expandir o mês atual se houver dados
  useMemo(() => {
    if (groupedData.length > 0 && expandedMonths.length === 0) {
      setExpandedModels([groupedData[0].id])
    }
  }, [groupedData])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão de Produção</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Acompanhamento de entregas agrupado por competência mensal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] gap-2 font-bold text-[#39586D]">
            <CalendarIcon className="h-4 w-4" /> Calendário
          </Button>
          <Button 
            className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg"
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
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase border-[#D2D7DB] gap-1 shrink-0">
                <Filter className="h-3 w-3" /> Filtrar
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase border-[#D2D7DB] shrink-0">
                Edição em lote
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase border-[#D2D7DB] shrink-0 text-[#1FA67A]">
                Gerar Guias
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px] w-12"></TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Empresa / Processo</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Situação</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Vencimento</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Meta Interna</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Resp.</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1FA67A]" /></TableCell></TableRow>
              ) : groupedData.length > 0 ? (
                groupedData.map((group) => (
                  <React.Fragment key={group.id}>
                    <TableRow className="bg-[#F4F5F7] cursor-pointer group" onClick={() => toggleExpand(group.id)}>
                      <TableCell className="text-center">
                        {expandedMonths.includes(group.id) ? <ChevronDown className="h-4 w-4 text-[#2C4156]" /> : <ChevronRight className="h-4 w-4 text-[#98A7AA]" />}
                      </TableCell>
                      <TableCell colSpan={6} className="py-3">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-4 w-4 text-[#1FA67A]" />
                          <span className="font-black text-[#2C4156] uppercase text-xs tracking-widest">{group.label}</span>
                          <Badge variant="secondary" className="bg-white text-[#2C4156] border text-[9px] font-black">
                            {group.processos.length} PROCESSOS
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedMonths.includes(group.id) && group.processos
                      .filter(p => {
                        const client = (clients || []).find(c => c.id === p.clienteId)
                        const searchLower = searchTerm.toLowerCase()
                        return !searchTerm || 
                          client?.corporateName?.toLowerCase().includes(searchLower) ||
                          client?.cnpj?.includes(searchTerm) ||
                          p.nomeProcesso?.toLowerCase().includes(searchLower)
                      })
                      .map(p => {
                        const client = (clients || []).find(c => c.id === p.clienteId)
                        return (
                          <TableRow key={p.id} className="hover:bg-[#F7F7F7] border-l-4 border-l-[#1FA67A]/20 transition-colors">
                            <TableCell></TableCell>
                            <TableCell className="py-4" onClick={() => handleOpenProcess(p)}>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-[#1FA67A] uppercase tracking-tighter mb-0.5">
                                  {p.nomeProcesso || 'Processo'}
                                </span>
                                <span className="text-xs font-black text-[#2C4156] uppercase leading-tight">{client?.corporateName || 'Cliente não identificado'}</span>
                                <span className="text-[9px] font-mono text-[#98A7AA]">{client?.cnpj}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn(
                                "text-[9px] font-black uppercase border-none px-3",
                                p.situacao === 'concluido' ? "bg-[#7ED6B5] text-[#1FA67A]" :
                                p.situacao === 'em_multa' ? "bg-[#FEE2E2] text-[#E74C3C]" :
                                p.situacao === 'em_progresso' ? "bg-[#E3F0F9] text-[#2574A9]" : "bg-[#F3F4F6] text-[#98A7AA]"
                              )}>
                                {p.situacao?.replace('_', ' ') || 'A Fazer'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-[#39586D]">
                                  {p.prazo ? format(typeof p.prazo === 'string' ? parseISO(p.prazo) : new Date(p.prazo), 'dd/MM') : '--'}
                                </span>
                                <span className="text-[8px] font-bold text-[#98A7AA] uppercase">Vencimento</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-[#2574A9]">
                                  {p.prazoMeta ? format(typeof p.prazoMeta === 'string' ? parseISO(p.prazoMeta) : new Date(p.prazoMeta), 'dd/MM') : '--'}
                                </span>
                                <span className="text-[8px] font-bold text-[#98A7AA] uppercase">Interno</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#2C4156] flex items-center justify-center text-white text-[8px] font-black uppercase">
                                  {p.responsavelId?.charAt(0) || 'G'}
                                </div>
                                <span className="text-[10px] font-bold text-[#39586D] truncate max-w-[80px]">{p.responsavelId || 'Geral'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]" onClick={() => handleOpenProcess(p)}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </React.Fragment>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-[#98A7AA] font-bold italic uppercase text-xs">Nenhum processo localizado para este período.</TableCell></TableRow>
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
    <Card className="border-none shadow-sm overflow-hidden bg-white">
      <CardContent className="p-0 flex flex-col">
        <div className={cn("h-1", color)} />
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-[#98A7AA] uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-[#2C4156]">{value}</p>
          </div>
          <Icon className="h-4 w-4 text-[#D2D7DB]" />
        </div>
      </CardContent>
    </Card>
  )
}
