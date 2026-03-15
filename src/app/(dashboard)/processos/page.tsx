
"use client"

import { useState, useMemo } from "react"
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Filter, 
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Loader2,
  Building2,
  User,
  GripVertical
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
  useMemoFirebase, 
  updateDocumentNonBlocking 
} from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { ProcessDetailsDrawer } from "@/components/processes/process-details-drawer"

export default function ProcessosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedModels, setExpandedModels] = useState<string[]>([])
  const [selectedProcess, setSelectedProcess] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const processesQuery = useMemoFirebase(() => query(collection(firestore, "processos"), orderBy("criadoEm", "desc")), [firestore])
  const { data: processes, isLoading } = useCollection(processesQuery)

  const modelsQuery = useMemoFirebase(() => collection(firestore, "processoModelos"), [firestore])
  const { data: models } = useCollection(modelsQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients } = useCollection(clientsQuery)

  const groupedData = useMemo(() => {
    if (!processes || !models) return []
    
    const groups: Record<string, any[]> = {}
    processes.forEach(p => {
      const modelId = p.modeloId || 'avulso'
      if (!groups[modelId]) groups[modelId] = []
      groups[modelId].push(p)
    })

    return Object.entries(groups).map(([modelId, items]) => {
      const model = models.find(m => m.id === modelId)
      return {
        id: modelId,
        nome: model?.nome || 'Processos Avulsos',
        dept: model?.departamento || 'Geral',
        processos: items
      }
    })
  }, [processes, models])

  const stats = useMemo(() => {
    if (!processes) return { total: 0, late: 0, todo: 0, progress: 0, done: 0, waived: 0 }
    return {
      total: processes.length,
      late: processes.filter(p => p.situacao === 'em_multa').length,
      todo: processes.filter(p => p.situacao === 'a_fazer').length,
      progress: processes.filter(p => p.situacao === 'em_progresso').length,
      done: processes.filter(p => p.situacao === 'concluido').length,
      waived: processes.filter(p => p.situacao === 'dispensado').length,
    }
  }, [processes])

  const toggleExpand = (id: string) => {
    setExpandedModels(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleOpenProcess = (process: any) => {
    const client = clients?.find(c => c.id === process.clienteId)
    setSelectedProcess({ ...process, client })
    setIsDrawerOpen(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão de Produção</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Acompanhamento centralizado de todas as entregas do escritório.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] gap-2 font-bold text-[#39586D]">
            <CalendarIcon className="h-4 w-4" /> Calendário
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg">
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

      <Card className="border-[#D2D7DB] shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b bg-[#F7F7F7]/50 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input 
                placeholder="Buscar por cliente ou processo..." 
                className="pl-10 bg-white border-[#D2D7DB]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase border-[#D2D7DB] gap-1">
                <Filter className="h-3 w-3" /> Filtrar
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase border-[#D2D7DB] gap-1">
                Edição em lote
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase border-[#D2D7DB] gap-1">
                Atribuir Documentos
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px] w-12"></TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Processo / Modelo</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Nº Clientes</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Nº Processos</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Departamento</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1FA67A]" /></TableCell></TableRow>
              ) : groupedData.length > 0 ? (
                groupedData.map((group) => (
                  <React.Fragment key={group.id}>
                    <TableRow className="bg-slate-50/50 cursor-pointer" onClick={() => toggleExpand(group.id)}>
                      <TableCell className="text-center">
                        {expandedModels.includes(group.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-black text-[#2C4156] uppercase text-xs">{group.nome}</TableCell>
                      <TableCell className="text-center font-bold text-[#39586D]">{new Set(group.processos.map(p => p.clienteId)).size}</TableCell>
                      <TableCell className="text-center font-bold text-[#39586D]">{group.processos.length}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px] uppercase font-black">{group.dept}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-[#98A7AA]" /></Button>
                      </TableCell>
                    </TableRow>
                    {expandedModels.includes(group.id) && group.processos.map(p => {
                      const client = clients?.find(c => c.id === p.clienteId)
                      return (
                        <TableRow key={p.id} className="hover:bg-[#F7F7F7] border-l-4 border-l-[#1FA67A]/20">
                          <TableCell></TableCell>
                          <TableCell className="pl-8" onClick={() => handleOpenProcess(p)}>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-[#2C4156] uppercase">{client?.corporateName}</span>
                              <span className="text-[9px] font-mono text-[#98A7AA]">{client?.cnpj}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase border-none",
                              p.situacao === 'concluido' ? "bg-[#7ED6B5] text-[#1FA67A]" :
                              p.situacao === 'em_multa' ? "bg-[#FEE2E2] text-[#E74C3C]" :
                              p.situacao === 'em_progresso' ? "bg-[#E3F0F9] text-[#2574A9]" : "bg-[#F3F4F6] text-[#98A7AA]"
                            )}>
                              {p.situacao.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-[10px] font-bold text-[#39586D]">
                            {p.prazo ? new Date(p.prazo).toLocaleDateString('pt-BR') : '--'}
                          </TableCell>
                          <TableCell className="text-[10px] font-bold text-[#39586D]">
                            {p.prazoMeta ? new Date(p.prazoMeta).toLocaleDateString('pt-BR') : '--'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase" onClick={() => handleOpenProcess(p)}>
                              Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-[#98A7AA] font-bold italic uppercase text-xs">Nenhum processo em execução.</TableCell></TableRow>
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
