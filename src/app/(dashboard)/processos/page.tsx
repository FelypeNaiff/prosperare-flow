
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
  CheckSquare,
  RefreshCw,
  History,
  MessageSquare,
  ArrowRightLeft,
  CheckCircle2,
  FileText,
  AtSign,
  Send,
  Layers,
  ChevronDown,
  Copy,
  MailCheck,
  Sparkles
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { ClientCommunicationTool } from "@/components/clients/client-communication-tool"

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'border-t-[#98A7AA]' },
  { id: 'progress', title: 'Em Progresso', color: 'border-t-[#2574A9]' },
  { id: 'review', title: 'Em Revisão', color: 'border-t-[#F2B705]' },
  { id: 'done', title: 'Concluído', color: 'border-t-[#1FA67A]' },
]

const MOCK_TASKS: any[] = []

const OBLIGATION_GROUPS = [
  { name: 'Folha de Pagamento', icon: '📋', color: '#1FA67A', count: 0 },
  { name: 'Fiscal Serviços', icon: '🔵', color: '#2574A9', count: 0 },
  { name: 'Fiscal Comércio', icon: '🟡', color: '#F2B705', count: 0 },
]

export default function ProcessosPage() {
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHandoffOpen, setIsHandoffOpen] = useState(false)
  const [activeView, setActiveView] = useState("kanban")

  const handleOpenTask = (task: any) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleConfirmHandoff = () => {
    setIsHandoffOpen(false)
    toast({
      title: "Bastão Passado!",
      description: `A responsabilidade da tarefa foi transferida com sucesso.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Processos e Tarefas</h1>
          <p className="text-[#98A7AA] font-medium">Gerencie o fluxo de trabalho do escritório e prazos fiscais.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] hover:bg-[#F7F7F7]">
            <CalendarIcon className="mr-2 h-4 w-4" /> Calendário
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90">
            <Plus className="mr-2 h-4 w-4" /> Novo Processo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
         <SummaryCard label="Total" value={0} color="primary" />
         <SummaryCard label="Em Multa" value={0} color="destructive" />
         <SummaryCard label="A Fazer" value={0} color="muted" />
         <SummaryCard label="Em Progresso" value={0} color="info" />
         <SummaryCard label="Concluído" value={0} color="success" />
      </div>

      <Tabs defaultValue="kanban" onValueChange={setActiveView}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-[#D2D7DB]/30">
            <TabsTrigger value="kanban" className="data-[state=active]:bg-white font-bold"><LayoutGrid className="mr-2 h-4 w-4" /> Kanban</TabsTrigger>
            <TabsTrigger value="lista" className="data-[state=active]:bg-white font-bold"><TableIcon className="mr-2 h-4 w-4" /> Lista</TabsTrigger>
            <TabsTrigger value="grupos" className="data-[state=active]:bg-white font-bold"><Layers className="mr-2 h-4 w-4" /> Por Grupo</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[600px]">
            {COLUMNS.map(col => (
              <div key={col.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-extrabold text-[#2C4156] flex items-center gap-2 text-sm uppercase tracking-wider">
                    {col.title}
                    <Badge variant="secondary" className="rounded-full px-1.5 h-5 min-w-5 flex items-center justify-center text-[10px] bg-[#D2D7DB] text-[#39586D]">
                      0
                    </Badge>
                  </h3>
                </div>
                
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="flex flex-col gap-3 pr-4 pb-4">
                    {MOCK_TASKS.filter(t => t.status === col.id).length === 0 && (
                      <div className="text-center py-8 text-xs text-[#98A7AA] font-bold">Vazio</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grupos" className="pt-4 space-y-6">
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-[#98A7AA] font-bold">
            Vincule empresas aos grupos para visualizar o progresso por obrigação.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string, value: number, color: string }) {
  const colorClasses = {
    primary: "text-[#2C4156] border-l-[#2C4156]",
    destructive: "text-[#E74C3C] border-l-[#E74C3C]",
    muted: "text-[#98A7AA] border-l-[#98A7AA]",
    info: "text-[#2574A9] border-l-[#2574A9]",
    success: "text-[#1FA67A] border-l-[#1FA67A]",
  }

  return (
    <Card className={cn("border-none shadow-sm bg-white border-l-4", colorClasses[color as keyof typeof colorClasses])}>
      <CardContent className="p-4 text-center space-y-1">
        <p className="text-[10px] font-extrabold text-[#98A7AA] uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </CardContent>
    </Card>
  )
}
