
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  Table as TableIcon, 
  Clock, 
  User, 
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  FileText,
  Layers,
  Search,
  Loader2,
  GripVertical,
  Save,
  ChevronRight,
  Trash2
} from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser, 
  setDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, query, orderBy, doc, where } from "firebase/firestore"

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'border-t-[#98A7AA]' },
  { id: 'progress', title: 'Em Progresso', color: 'border-t-[#2574A9]' },
  { id: 'review', title: 'Em Revisão', color: 'border-t-[#F2B705]' },
  { id: 'done', title: 'Concluído', color: 'border-t-[#1FA67A]' },
]

export default function ProcessosPage() {
  const firestore = useFirestore()
  const { userData } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Queries reais
  const tasksQuery = useMemoFirebase(() => collection(firestore, "tasks"), [firestore])
  const { data: tasks = [], isLoading } = useCollection(tasksQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const templatesQuery = useMemoFirebase(() => collection(firestore, "process_templates"), [firestore])
  const { data: templates = [] } = useCollection(templatesQuery)

  const [newTask, setNewTask] = useState({
    clientId: "",
    title: "",
    templateId: "",
    dueDate: "",
    status: "todo",
    priority: "Média",
    description: ""
  })

  const handleCreateTask = () => {
    if (!newTask.clientId || !newTask.title) {
      toast({ title: "Erro", description: "Cliente e título são obrigatórios.", variant: "destructive" })
      return
    }

    const id = Math.random().toString(36).substr(2, 9)
    const client = clients?.find(c => c.id === newTask.clientId)
    const template = templates?.find(t => t.id === newTask.templateId)

    const taskData = {
      ...newTask,
      id,
      clientName: client?.corporateName || "Empresa Avulsa",
      createdAt: new Date().toISOString(),
      responsibleId: userData?.fullName || "Não Atribuído",
      checklist: template?.checklist || []
    }

    setDocumentNonBlocking(doc(firestore, "tasks", id), taskData, { merge: true })
    setIsNewModalOpen(false)
    setNewTask({ clientId: "", title: "", templateId: "", dueDate: "", status: "todo", priority: "Média", description: "" })
    toast({ title: "Processo Criado!", description: "A tarefa foi incluída no fluxo de trabalho." })
  }

  const handleDeleteTask = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "tasks", id))
    toast({ title: "Processo removido", variant: "destructive" })
  }

  // Lógica de Drag & Drop
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.setData("taskId", id)
  }

  const onDragOver = (e: React.DragEvent) => e.preventDefault()

  const onDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")
    if (!taskId) return

    updateDocumentNonBlocking(doc(firestore, "tasks", taskId), { status: targetStatus })
    setDraggedId(null)
  }

  const filteredTasks = (tasks || []).filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === 'todo').length,
    progress: filteredTasks.filter(t => t.status === 'progress').length,
    done: filteredTasks.filter(t => t.status === 'done').length,
    late: filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Processos e Tarefas</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Gerencie o fluxo de trabalho e prazos do escritório.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] gap-2 font-bold">
            <CalendarIcon className="h-4 w-4" /> Calendário
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold shadow-lg" onClick={() => setIsNewModalOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Processo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
         <SummaryCard label="Total" value={stats.total} color="primary" icon={Layers} />
         <SummaryCard label="Atrasados" value={stats.late} color="destructive" icon={AlertCircle} />
         <SummaryCard label="A Fazer" value={stats.todo} color="muted" icon={Clock} />
         <SummaryCard label="Em Progresso" value={stats.progress} color="info" icon={Loader2} />
         <SummaryCard label="Concluído" value={stats.done} color="success" icon={CheckCircle2} />
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
          <Input 
            placeholder="Buscar por título ou empresa..." 
            className="pl-10 bg-white border-[#D2D7DB]" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex gap-4 p-1 min-h-[600px]">
          {COLUMNS.map(col => (
            <div 
              key={col.id} 
              className={cn(
                "w-[300px] flex flex-col gap-4 bg-[#EBEDF0]/50 p-2 rounded-xl border-t-4 transition-all",
                col.color
              )}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.id)}
            >
              <div className="flex items-center justify-between px-2 pt-1">
                <h3 className="font-black text-[#2C4156] text-[11px] uppercase tracking-widest flex items-center gap-2">
                  {col.title}
                  <Badge variant="secondary" className="rounded-full px-1.5 h-5 min-w-5 flex items-center justify-center text-[10px] bg-white text-[#2C4156] border">
                    {filteredTasks.filter(t => t.status === col.id).length}
                  </Badge>
                </h3>
              </div>
              
              <div className="flex flex-col gap-3">
                {isLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1FA67A]" /></div>
                ) : filteredTasks.filter(t => t.status === col.id).length > 0 ? (
                  filteredTasks.filter(t => t.status === col.id).map(task => (
                    <Card 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => onDragStart(e, task.id)}
                      className={cn(
                        "bg-white border-[#D2D7DB] shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
                        draggedId === task.id && "opacity-40"
                      )}
                    >
                      <CardContent className="p-3 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1 flex-1">
                            <p className="text-[9px] font-black text-[#1FA67A] uppercase tracking-tighter truncate">{task.clientName}</p>
                            <h4 className="text-xs font-bold text-[#2C4156] leading-tight line-clamp-2">{task.title}</h4>
                          </div>
                          <GripVertical className="h-3 w-3 text-[#D2D7DB] shrink-0 opacity-0 group-hover:opacity-100" />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1.5">
                            <Clock className={cn("h-3 w-3", task.dueDate && new Date(task.dueDate) < new Date() ? "text-[#E74C3C]" : "text-[#98A7AA]")} />
                            <span className={cn(
                              "text-[9px] font-bold uppercase",
                              task.dueDate && new Date(task.dueDate) < new Date() ? "text-[#E74C3C]" : "text-[#98A7AA]"
                            )}>
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '--'}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-[#E74C3C] opacity-0 group-hover:opacity-100" 
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-[10px] font-black text-[#98A7AA] uppercase tracking-widest border-2 border-dashed rounded-xl border-[#D2D7DB]/50">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Modal de Novo Processo */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Novo Processo Operacional</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px]">
              Cadastre uma tarefa manual para o fluxo de produção.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Empresa / Cliente</Label>
              <Select value={newTask.clientId} onValueChange={(v) => setNewTask({...newTask, clientId: v})}>
                <SelectTrigger className="border-[#D2D7DB] h-11">
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {(clients || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.corporateName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Título do Processo</Label>
              <Input 
                placeholder="Ex: Entrega de DCTFWeb Mensal" 
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value.toUpperCase()})}
                className="border-[#D2D7DB] font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Data de Vencimento</Label>
                <Input 
                  type="date" 
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="border-[#D2D7DB]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Usar Modelo Existente</Label>
                <Select value={newTask.templateId} onValueChange={(v) => setNewTask({...newTask, templateId: v})}>
                  <SelectTrigger className="border-[#D2D7DB]">
                    <SelectValue placeholder="Opcional..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(templates || []).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Observações Internas</Label>
              <Textarea 
                placeholder="Detalhes adicionais para o executor..." 
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="border-[#D2D7DB] text-xs h-24"
              />
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsNewModalOpen(false)} className="font-bold text-xs uppercase">Cancelar</Button>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-8 shadow-lg" onClick={handleCreateTask}>
              <Save className="h-4 w-4 mr-2" /> Salvar e Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ label, value, color, icon: Icon }: any) {
  const colors = {
    primary: "border-l-[#2C4156] text-[#2C4156]",
    destructive: "border-l-[#E74C3C] text-[#E74C3C]",
    muted: "border-l-[#98A7AA] text-[#98A7AA]",
    info: "border-l-[#2574A9] text-[#2574A9]",
    success: "border-l-[#1FA67A] text-[#1FA67A]",
  }

  return (
    <Card className={cn("border-none shadow-sm bg-white border-l-4", colors[color as keyof typeof colors])}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
        <div className="p-2 bg-[#F7F7F7] rounded-lg">
          <Icon className="h-4 w-4 opacity-40" />
        </div>
      </CardContent>
    </Card>
  )
}
