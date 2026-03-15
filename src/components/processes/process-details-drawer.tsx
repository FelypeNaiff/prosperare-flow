
"use client"

import { useState, useEffect } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CheckCircle2, 
  Clock, 
  User, 
  Building2, 
  ArrowUpRight, 
  History,
  Paperclip,
  MessageCircle,
  X,
  FileText,
  AlertTriangle,
  MoreVertical,
  Link as LinkIcon,
  ClipboardList,
  Send,
  AtSign,
  UserPlus
} from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

export function ProcessDetailsDrawer({ open, onOpenChange, process }: any) {
  const firestore = useFirestore()
  const [localTarefas, setLocalTarefas] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  
  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: team = [] } = useCollection(usersQuery)

  useEffect(() => {
    if (process) {
      setLocalTarefas(process.tarefas || [])
    }
  }, [process])

  if (!process) return null

  const handleUpdate = (field: string, value: any) => {
    const docRef = doc(firestore, "processos", process.id)
    updateDocumentNonBlocking(docRef, { [field]: value })
  }

  const toggleTarefa = (tarefaId: string) => {
    const newTarefas = localTarefas.map(t => 
      t.id === tarefaId ? { ...t, situacao: t.situacao === 'concluido' ? 'a_fazer' : 'concluido' } : t
    )
    setLocalTarefas(newTarefas)
    handleUpdate('tarefas', newTarefas)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    
    const comments = process.comments || []
    const comment = {
      id: Math.random().toString(36).substr(2, 9),
      text: newComment,
      createdAt: new Date().toISOString(),
      user: "Você"
    }
    
    handleUpdate('comments', [...comments, comment])
    setNewComment("")
    toast({ title: "Comentário adicionado" })
  }

  const progressValue = localTarefas.length > 0 
    ? Math.round((localTarefas.filter(t => t.situacao === 'concluido').length / localTarefas.length) * 100)
    : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[1000px] p-0 border-l-[#D2D7DB] overflow-hidden flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* LADO ESQUERDO (70%) */}
          <div className="flex-[7] border-r flex flex-col overflow-hidden bg-white">
            <header className="p-8 border-b bg-[#F7F7F7]/50">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2C4156] text-white flex items-center justify-center font-black text-xl shadow-lg">
                    {process.client?.corporateName?.substr(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#2C4156] uppercase leading-tight">{process.client?.corporateName}</h2>
                    <p className="text-sm font-bold text-[#98A7AA] uppercase tracking-widest">{process.client?.cnpj}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full"><X className="h-5 w-5" /></Button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Situação Atual</Label>
                  <Select value={process.situacao} onValueChange={(v) => handleUpdate('situacao', v)}>
                    <SelectTrigger className="w-[180px] h-9 border-[#D2D7DB] bg-white font-black text-[10px] uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a_fazer">⚪ A Fazer</SelectItem>
                      <SelectItem value="em_progresso">🔵 Em Progresso</SelectItem>
                      <SelectItem value="concluido">🟢 Concluído</SelectItem>
                      <SelectItem value="em_multa">🔴 Em Multa</SelectItem>
                      <SelectItem value="dispensado">🔘 Dispensado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-10 w-px bg-[#D2D7DB] hidden md:block" />
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-[#D2D7DB]/50 shadow-sm min-w-[160px]">
                  <div className="p-1.5 bg-[#F7F7F7] rounded-lg text-[#2C4156]">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[8px] font-black text-[#98A7AA] uppercase leading-none mb-1">Responsável</span>
                    <Select value={process.responsavelId} onValueChange={(v) => handleUpdate('responsavelId', v)}>
                      <SelectTrigger className="h-5 border-none p-0 text-[10px] font-bold text-[#2C4156] shadow-none focus:ring-0">
                        <SelectValue placeholder="Escolher..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Geral" className="text-[10px] font-bold">GERAL</SelectItem>
                        {team?.map(u => (
                          <SelectItem key={u.id} value={u.fullName} className="text-[10px] font-bold uppercase">{u.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-[#D2D7DB]/50 shadow-sm min-w-[160px]">
                  <div className="p-1.5 bg-[#F7F7F7] rounded-lg text-[#1FA67A]">
                    <UserPlus className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[8px] font-black text-[#98A7AA] uppercase leading-none mb-1">Auxiliar</span>
                    <Select value={process.auxiliarId || "Nenhum"} onValueChange={(v) => handleUpdate('auxiliarId', v)}>
                      <SelectTrigger className="h-5 border-none p-0 text-[10px] font-bold text-[#2C4156] shadow-none focus:ring-0">
                        <SelectValue placeholder="Escolher..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nenhum" className="text-[10px] font-bold">NENHUM</SelectItem>
                        {team?.map(u => (
                          <SelectItem key={u.id} value={u.fullName} className="text-[10px] font-bold uppercase">{u.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <StatItem label="Vencimento" value={process.prazo ? new Date(process.prazo).toLocaleDateString('pt-BR') : '--'} icon={Clock} color="text-[#E74C3C]" />
                <StatItem label="Meta Interna" value={process.prazoMeta ? new Date(process.prazoMeta).toLocaleDateString('pt-BR') : '--'} icon={ArrowUpRight} color="text-[#2574A9]" />
              </div>
            </header>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between bg-[#FEE2E2]/30 p-4 rounded-2xl border border-[#E74C3C]/10">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#E74C3C]" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#E74C3C]">Configuração Crítica</p>
                      <p className="text-sm font-bold text-[#2C4156]">Este processo gera multa automática em caso de atraso.</p>
                    </div>
                  </div>
                  <Switch checked={process.atrasoGeraMulta} onCheckedChange={(v) => handleUpdate('atrasoGeraMulta', v)} />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Observações do Processo</Label>
                  <Textarea 
                    className="h-32 border-[#D2D7DB] text-sm focus:ring-[#1FA67A]" 
                    defaultValue={process.descricao}
                    onBlur={(e) => handleUpdate('descricao', e.target.value)}
                    placeholder="Adicione informações relevantes para este processo específico..."
                  />
                </div>

                <Tabs defaultValue="comments" className="w-full">
                  <TabsList className="bg-[#F7F7F7] p-1 h-10 border mb-4">
                    <TabsTrigger value="comments" className="text-[10px] font-black uppercase gap-2 px-8">
                      <MessageCircle className="h-3.5 w-3.5" /> Comentários e Menções
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments" className="space-y-6">
                    <div className="bg-[#F7F7F7] p-4 rounded-2xl border border-[#D2D7DB] shadow-inner">
                      <div className="relative">
                        <AtSign className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
                        <Textarea 
                          className="pl-9 h-24 bg-white border-[#D2D7DB] text-xs resize-none"
                          placeholder="Digite aqui para comentar. Use @ para mencionar um colega..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button 
                          className="absolute bottom-2 right-2 h-8 bg-[#1FA67A] text-[10px] font-black uppercase gap-2"
                          onClick={handleAddComment}
                        >
                          <Send className="h-3 w-3" /> Enviar
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {process.comments?.length > 0 ? (
                        process.comments.map((c: any) => (
                          <div key={c.id} className="flex gap-3 items-start p-3 bg-white border rounded-xl hover:shadow-sm transition-shadow">
                            <Avatar className="h-8 w-8 border">
                              <AvatarFallback className="bg-[#2C4156] text-white text-[10px] font-black">{c.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#2C4156] uppercase">{c.user}</span>
                                <span className="text-[9px] font-bold text-[#98A7AA]">{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                              </div>
                              <p className="text-xs text-[#39586D] leading-relaxed">{c.text}</p>
                            </div>
                          </div>
                        )).reverse()
                      ) : (
                        <div className="py-12 text-center text-[#98A7AA] text-[10px] font-black uppercase tracking-widest border-2 border-dashed rounded-2xl opacity-40">
                          Nenhum comentário registrado.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>

            <footer className="p-6 border-t bg-[#F7F7F7] flex justify-end items-center">
              <Button variant="ghost" className="text-[#E74C3C] font-bold text-xs uppercase underline" onClick={() => handleUpdate('situacao', 'dispensado')}>
                Dispensar Processo
              </Button>
            </footer>
          </div>

          {/* LADO DIREITO (30%) */}
          <div className="flex-[3] bg-[#F4F5F7] flex flex-col overflow-hidden">
            <header className="p-6 border-b space-y-4">
              <h3 className="font-black text-[#2C4156] uppercase text-xs tracking-widest flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#1FA67A]" /> Tarefas do Processo
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black text-[#98A7AA] uppercase">
                  <span>Conclusão</span>
                  <span>{progressValue}%</span>
                </div>
                <Progress value={progressValue} className="h-1.5 bg-white" />
              </div>
            </header>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {localTarefas.map((tarefa, i) => (
                  <Card key={tarefa.id} className={cn(
                    "border-[#D2D7DB] shadow-sm group hover:border-[#1FA67A] transition-all",
                    tarefa.situacao === 'concluido' && "opacity-60 bg-[#EBEDF0]"
                  )}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={tarefa.situacao === 'concluido'} 
                          onCheckedChange={() => toggleTarefa(tarefa.id)} 
                          className="mt-1 h-5 w-5 rounded-lg data-[state=checked]:bg-[#1FA67A]"
                        />
                        <div className="flex-1">
                          <p className={cn(
                            "text-xs font-black text-[#2C4156] leading-tight uppercase",
                            tarefa.situacao === 'concluido' && "line-through"
                          )}>
                            {tarefa.titulo}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="text-[7px] h-4 font-black border-[#D2D7DB] text-[#98A7AA] uppercase">{tarefa.prioridade}</Badge>
                            {tarefa.requerDocumento && <Badge className="bg-[#FEF3C7] text-[#F2B705] border-none text-[7px] h-4 font-black uppercase">Doc Requerido</Badge>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {localTarefas.length === 0 && (
                  <div className="py-12 text-center text-[#98A7AA] text-[10px] font-black uppercase italic">Sem tarefas vinculadas.</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StatItem({ label, value, icon: Icon, color, isAvatar }: any) {
  return (
    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-[#D2D7DB]/50 shadow-sm min-w-[140px]">
      <div className={cn("p-1.5 bg-[#F7F7F7] rounded-lg", color)}>
        {isAvatar ? (
          <Avatar className="h-4 w-4">
            <AvatarFallback className="text-[8px] bg-[#2C4156] text-white">R</AvatarFallback>
          </Avatar>
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-[#98A7AA] uppercase leading-none mb-0.5">{label}</span>
        <span className="text-[10px] font-bold text-[#2C4156] leading-none">{value}</span>
      </div>
    </div>
  )
}
