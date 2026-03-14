
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

const MOCK_TASKS = [
  { id: 't1', client: 'Posto Sul', title: 'Folha de Pagamento - Setembro', status: 'todo', due: '05/10', priority: 'Urgente', responsible: 'Ricardo', group: 'Folha de Pagamento' },
  { id: 't2', client: 'Mercado Bom', title: 'PGDAS-D Apuração', status: 'progress', due: '20/10', priority: 'Alta', responsible: 'Fernanda', group: 'Fiscal Serviços' },
  { id: 't3', client: 'Tech Soluções', title: 'DCTF Mensal', status: 'todo', due: '15/10', priority: 'Média', responsible: 'Ricardo', group: 'Fiscal Lucro Presumido' },
  { id: 't4', client: 'Auto Peças', title: 'EFD ICMS IPI', status: 'review', due: '10/10', priority: 'Alta', responsible: 'Ana', group: 'Fiscal Comércio' },
  { id: 't5', client: 'Padaria Alfa', title: 'FGTS Digital', status: 'done', due: '20/10', priority: 'Urgente', responsible: 'Ricardo', group: 'Folha de Pagamento' },
]

const OBLIGATION_GROUPS = [
  { name: 'Folha de Pagamento', icon: '📋', color: '#1FA67A', count: 12 },
  { name: 'Fiscal Serviços', icon: '🔵', color: '#2574A9', count: 8 },
  { name: 'Fiscal Comércio', icon: '🟡', color: '#F2B705', count: 5 },
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
         <SummaryCard label="Total" value={142} color="primary" />
         <SummaryCard label="Em Multa" value={3} color="destructive" />
         <SummaryCard label="A Fazer" value={54} color="muted" />
         <SummaryCard label="Em Progresso" value={28} color="info" />
         <SummaryCard label="Concluído" value={57} color="success" />
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
                      {MOCK_TASKS.filter(t => t.status === col.id).length}
                    </Badge>
                  </h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA] hover:text-[#1FA67A]"><Plus className="h-4 w-4" /></Button>
                </div>
                
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="flex flex-col gap-3 pr-4 pb-4">
                    {MOCK_TASKS.filter(t => t.status === col.id).map(task => (
                      <Card 
                        key={task.id} 
                        className={cn(
                          "border-t-4 hover:shadow-lg transition-all cursor-pointer bg-white group",
                          col.color
                        )}
                        onClick={() => handleOpenTask(task)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-[#1FA67A] uppercase tracking-widest">{task.client}</span>
                            <Badge className={cn(
                              "text-[10px] px-1.5 h-4 uppercase font-extrabold",
                              task.priority === 'Urgente' ? 'bg-[#FEE2E2] text-[#E74C3C]' : 'bg-[#F7F7F7] text-[#98A7AA]'
                            )}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-bold text-[#2C4156] leading-snug group-hover:text-[#1FA67A] transition-colors">{task.title}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-[#F7F7F7]">
                            <div className="flex items-center gap-1 text-[#98A7AA]">
                              <Clock className="h-3 w-3" />
                              <span className="text-[10px] font-bold">{task.due}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-[#39586D]">{task.responsible}</span>
                              <div className="w-6 h-6 rounded-full bg-[#2C4156]/10 flex items-center justify-center border border-[#D2D7DB]">
                                <User className="h-3 w-3 text-[#2C4156]" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grupos" className="pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OBLIGATION_GROUPS.map((group) => (
              <Card key={group.name} className="border-[#D2D7DB] bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{group.icon}</span>
                      <h4 className="font-black text-[#2C4156] uppercase text-xs tracking-tight">{group.name}</h4>
                    </div>
                    <Badge className="bg-[#E3F0F9] text-[#2574A9] border-none font-bold text-[9px] uppercase">
                      {group.count} empresas
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-[#98A7AA]">
                      <span>Progresso Geral</span>
                      <span>75%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#F7F7F7] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1FA67A] w-[75%]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            {OBLIGATION_GROUPS.map((group) => (
              <div key={group.name} className="border rounded-xl bg-white overflow-hidden">
                <div className="p-4 bg-[#F7F7F7]/50 border-b flex items-center justify-between cursor-pointer hover:bg-[#F7F7F7] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: group.color }}>
                      <Layers className="h-4 w-4" />
                    </div>
                    <h3 className="font-black text-[#2C4156] uppercase text-sm tracking-tight">{group.name}</h3>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#98A7AA] group-hover:text-[#2C4156]" />
                </div>
                <div className="p-0">
                  <Table>
                    <TableBody>
                      {MOCK_TASKS.filter(t => t.group === group.name).map((task) => (
                        <TableRow key={task.id} className="hover:bg-[#F7F7F7]/30">
                          <TableCell className="w-[200px]">
                            <p className="text-xs font-black text-[#1FA67A] uppercase leading-tight">{task.client}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-bold text-[#2C4156]">{task.title}</p>
                          </TableCell>
                          <TableCell className="w-[120px]">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase border-none",
                              task.status === 'done' ? "bg-[#7ED6B5] text-[#1FA67A]" : 
                              task.status === 'todo' ? "bg-[#F3F4F6] text-[#98A7AA]" : "bg-[#FEF3C7] text-[#F2B705]"
                            )}>
                              {task.status === 'done' ? 'Concluído' : task.status === 'todo' ? 'A Fazer' : 'Em Progresso'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right w-[100px]">
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={() => handleOpenTask(task)}>
                              Ver detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detalhes da Tarefa / Processo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0 h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="p-6 bg-[#F7F7F7] border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#1FA67A] text-white text-[10px] uppercase font-bold">Processo Digital</Badge>
                  <span className="text-xs text-[#98A7AA] font-mono">ID: {selectedTask?.id}</span>
                </div>
                <DialogTitle className="text-2xl font-extrabold text-[#2C4156]">{selectedTask?.title}</DialogTitle>
                <DialogDescription className="font-medium text-[#39586D]">
                  Cliente: <span className="font-bold text-[#1FA67A]">{selectedTask?.client}</span>
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2 border-[#D2D7DB] font-bold text-[#2C4156]"
                  onClick={() => setIsHandoffOpen(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 text-[#1FA67A]" /> Passar Bastão
                </Button>
                <Button className="bg-[#1FA67A] gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Concluir Etapa
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="px-6 h-12 bg-white border-b rounded-none justify-start gap-6">
              <TabsTrigger value="detalhes" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase">Detalhes</TabsTrigger>
              <TabsTrigger value="checklist" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase">Checklist</TabsTrigger>
              <TabsTrigger value="finalizacao" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase flex gap-2">
                Protocolo <MailCheck className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="comentarios" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase flex gap-2">
                Comentários <Badge className="bg-[#1FA67A]/10 text-[#1FA67A] h-4 min-w-4 p-1">2</Badge>
              </TabsTrigger>
              <TabsTrigger value="historico" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase flex gap-2">
                Histórico <History className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-6">
                <TabsContent value="detalhes" className="m-0 space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-extrabold text-[#98A7AA]">Responsável Atual</Label>
                      <div className="flex items-center gap-2 p-2 bg-[#F7F7F7] rounded-lg border">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-[#2C4156] text-white text-[10px]">{selectedTask?.responsible?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-[#2C4156]">{selectedTask?.responsible} Santos</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-extrabold text-[#98A7AA]">Prazo Fatal</Label>
                      <div className="flex items-center gap-2 p-2 bg-[#FEE2E2]/30 rounded-lg border border-[#E74C3C]/20">
                        <Clock className="h-4 w-4 text-[#E74C3C]" />
                        <span className="text-sm font-bold text-[#E74C3C]">20/10/2024 às 18:00</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-extrabold text-[#98A7AA]">Prioridade</Label>
                      <div className="p-2">
                        <Badge className="bg-[#E74C3C] font-bold uppercase text-[10px]">{selectedTask?.priority}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-extrabold text-[#98A7AA]">Descrição do Processo</Label>
                    <div className="p-4 bg-[#F7F7F7] rounded-lg border text-sm text-[#39586D] leading-relaxed">
                      Execução da folha de pagamento mensal referente à competência de Setembro/2024. 
                      Inclui apuração de horas extras, benefícios, geração de holerites e guias de encargos (FGTS/INSS).
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-[#2C4156] text-sm uppercase flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#1FA67A]" /> Documentos Vinculados
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {['Relatorio_Horas.pdf', 'Planilha_Beneficios.xlsx'].map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-[#F7F7F7] cursor-pointer transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#2C4156]/5 rounded-lg"><FileText className="h-4 w-4 text-[#2C4156]" /></div>
                            <span className="text-xs font-bold text-[#39586D]">{doc}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px]">Ver</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="finalizacao" className="m-0 space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-[#E3F0F9]/30 border border-[#2574A9]/20 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-[#2574A9]">
                        <MailCheck className="h-5 w-5" />
                        <h4 className="font-bold text-sm uppercase">Envio Externo</h4>
                      </div>
                      <p className="text-xs text-[#39586D]">
                        Como o envio é feito por e-mail externo, use as ferramentas abaixo para facilitar o processo e manter o histórico.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold text-[#2C4156]">E-mail enviado ao cliente</Label>
                          <p className="text-[10px] text-[#98A7AA]">Marque este item após enviar o e-mail pelo seu Outlook/Gmail.</p>
                        </div>
                        <Checkbox className="h-6 w-6" />
                      </div>

                      <div className="p-4 border rounded-xl bg-[#F7F7F7] space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-[#2C4156] uppercase flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#1FA67A]" /> Sugestão de Texto para E-mail
                          </h5>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold gap-1" onClick={() => {
                            navigator.clipboard.writeText(`Olá, segue a guia de ${selectedTask?.title} para pagamento.`);
                            toast({ title: "Copiado!" });
                          }}>
                            <Copy className="h-3 w-3" /> Copiar Texto
                          </Button>
                        </div>
                        <div className="bg-white p-3 border rounded-lg text-xs font-mono text-[#39586D] leading-relaxed">
                          Assunto: Envio de Documento - {selectedTask?.client} - {selectedTask?.title}<br/><br/>
                          Olá, Sr(a). Responsável,<br/><br/>
                          Seguem em anexo os documentos referentes ao processo de <strong>{selectedTask?.title}</strong>.<br/>
                          Por favor, confirme o recebimento deste e-mail.<br/><br/>
                          Atenciosamente,<br/>
                          Equipe Prosperare Flow.
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="m-0">
                  <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D2D7DB]">
                    <TimelineItem 
                      icon={Plus} 
                      color="bg-[#2C4156]" 
                      title="Tarefa Criada" 
                      user="Fernanda Oliveira" 
                      time="20/10/2024 - 09:30" 
                      details="Processo de folha de pagamento iniciado para o cliente Posto Sul." 
                    />
                    <TimelineItem 
                      icon={RefreshCw} 
                      color="bg-[#2574A9]" 
                      title="Mudança de Status" 
                      user="Ricardo Santos" 
                      time="20/10/2024 - 10:15" 
                      details="Status alterado de 'A Fazer' para 'Em Progresso'." 
                    />
                    <TimelineItem 
                      icon={ArrowRightLeft} 
                      color="bg-[#F2B705]" 
                      title="Bastão Passado" 
                      user="Ricardo → Ana" 
                      time="21/10/2024 - 14:00" 
                      details="Ricardo passou para Ana finalizar os cálculos de encargos." 
                    />
                    <TimelineItem 
                      icon={AtSign} 
                      color="bg-[#1FA67A]" 
                      title="Menção em Comentário" 
                      user="Ana Souza" 
                      time="Hoje - 11:20" 
                      details="Ana mencionou @Ricardo Santos: 'Favor revisar o cálculo do FGTS Digital'." 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="comentarios" className="m-0 space-y-4">
                  <div className="space-y-4 pb-20">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8"><AvatarImage src="https://picsum.photos/seed/ana/40/40" /></Avatar>
                      <div className="flex-1 p-3 bg-[#F7F7F7] rounded-lg border space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#2C4156]">Ana Souza</span>
                          <span className="text-[10px] text-[#98A7AA]">Há 2h</span>
                        </div>
                        <p className="text-sm text-[#39586D]">@Ricardo Santos, já subi a planilha de horas extras. Pode validar?</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                    <div className="relative">
                      <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
                      <Input placeholder="Adicionar comentário... (@mencionar)" className="pl-9 pr-12 h-10" />
                      <Button size="icon" className="absolute right-1 top-1 h-8 w-8 bg-[#1FA67A]">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal Passagem de Bastão */}
      <Dialog open={isHandoffOpen} onOpenChange={setIsHandoffOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-[#1FA67A]/10 flex items-center justify-center mb-2">
              <ArrowRightLeft className="h-6 w-6 text-[#1FA67A]" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#2C4156]">Passagem de Bastão</DialogTitle>
            <DialogDescription>
              Transfira a responsabilidade desta tarefa detalhando o progresso atual.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-[#2C4156]">Transferir para:</Label>
              <Select defaultValue="ana">
                <SelectTrigger><SelectValue placeholder="Selecione o membro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ana">Ana Souza (Fiscal)</SelectItem>
                  <SelectItem value="fernanda">Fernanda Oliveira (Gestora)</SelectItem>
                  <SelectItem value="bruno">Bruno Lima (Assistente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-[#2C4156]">O que já foi feito?</Label>
              <Textarea placeholder="Descreva as etapas concluídas..." className="h-20" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-[#2C4156]">O que falta fazer?</Label>
              <Textarea placeholder="Orientações para o próximo responsável..." className="h-20" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-[#2C4156]">Prazo da próxima etapa</Label>
              <Input type="datetime-local" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHandoffOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A]" onClick={handleConfirmHandoff}>Confirmar Transferência</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function TimelineItem({ icon: Icon, color, title, user, time, details }: any) {
  return (
    <div className="relative">
      <div className={cn("absolute -left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md z-10", color)}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-bold text-[#2C4156]">{title}</h5>
          <span className="text-[10px] text-[#98A7AA] font-medium">{time}</span>
        </div>
        <p className="text-xs text-[#39586D] font-bold">Por: {user}</p>
        <p className="text-xs text-[#98A7AA] leading-relaxed">{details}</p>
      </div>
    </div>
  )
}
