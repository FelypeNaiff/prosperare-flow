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
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { arrayUnion, collection, doc, writeBatch, type WriteBatch } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

const toDateInputValue = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function ProcessDetailsDrawer({ open, onOpenChange, process }: any) {
  const firestore = useFirestore()
  const { userData } = useUser()
  const [localProcess, setLocalProcess] = useState<any>(null)
  const [localTarefas, setLocalTarefas] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionStart, setMentionStart] = useState(-1)
  
  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: team = [] } = useCollection(usersQuery)

  useEffect(() => {
    if (process) {
      setLocalProcess({ ...process })
      setLocalTarefas(process.tarefas || [])
    }
  }, [process])

  if (!process || !localProcess) return null

  const addNotification = (batch: WriteBatch, userId: string, title: string, message: string, type: 'assignment' | 'mention', createdAt: string) => {
    const notificationRef = doc(collection(firestore, "notifications"))
    batch.set(notificationRef, {
      id: notificationRef.id,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt,
      processId: localProcess.id,
      remetente: userData?.fullName || "Sistema",
      link: "/processos"
    })
  }

  const addAuditEntry = (batch: WriteBatch, action: string, previousValue: unknown, newValue: unknown, occurredAt: string) => {
    const auditRef = doc(collection(firestore, "processAuditLogs"))
    batch.set(auditRef, {
      id: auditRef.id,
      processId: localProcess.id,
      clientId: localProcess.clienteId || null,
      processName: localProcess.nomeProcesso || null,
      action,
      previousValue: previousValue ?? null,
      newValue: newValue ?? null,
      actorId: userData?.id || userData?.uid || null,
      actorName: userData?.fullName || userData?.email || "Usuário não identificado",
      occurredAt
    })
  }

  const handleUpdate = async (field: string, value: any) => {
    if (isSaving || localProcess[field] === value) return
    setIsSaving(true)
    const previousValue = localProcess[field]
    const occurredAt = new Date().toISOString()
    const batch = writeBatch(firestore)
    batch.update(doc(firestore, "processes", localProcess.id), {
      [field]: value,
      atualizadoEm: occurredAt,
      atualizadoPor: userData?.fullName || userData?.email || "Usuário não identificado",
      ...(field === "situacao" ? { concluidoEm: value === "concluido" ? occurredAt : null } : {})
    })
    addAuditEntry(batch, `CAMPO_${field.toUpperCase()}_ALTERADO`, previousValue, value, occurredAt)

    if (field === 'responsavelId' || field === 'auxiliarId') {
      const selectedUser = team?.find(u => u.fullName === value)
      if (selectedUser?.id) {
        addNotification(
          batch,
          selectedUser.id,
          field === 'responsavelId' ? "Novo Processo Atribuído" : "Você é Auxiliar em um Processo",
          `Você foi definido como ${field === 'responsavelId' ? 'Responsável' : 'Auxiliar'} no processo "${localProcess.nomeProcesso}" para ${localProcess.client?.corporateName}.`,
          'assignment',
          occurredAt
        )
      }
    }

    try {
      await batch.commit()
      setLocalProcess((current: any) => ({ ...current, [field]: value, atualizadoEm: occurredAt }))
      toast({ title: "Alteração salva" })
    } catch (error) {
      console.error(`Falha ao atualizar ${field}:`, error)
      toast({ title: "Não foi possível salvar", description: "A alteração não foi aplicada.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTarefa = async (tarefaId: string) => {
    if (isSaving) return
    const newTarefas = localTarefas.map(t => 
      t.id === tarefaId ? { ...t, situacao: t.situacao === 'concluido' ? 'a_fazer' : 'concluido' } : t
    )
    // Lógica de automação de situação do processo
    let newSituacao = localProcess.situacao
    const total = newTarefas.length
    const concluídas = newTarefas.filter(t => t.situacao === 'concluido').length
    
    if (total > 0) {
      if (concluídas === total) {
        newSituacao = 'concluido'
      } else if (concluídas > 0) {
        // Se algumas estão concluídas mas não todas, e o processo está "a_fazer", move para "em_progresso"
        if (localProcess.situacao === 'a_fazer') {
          newSituacao = 'em_progresso'
        }
      } else if (concluídas === 0) {
        // Se nenhuma está concluída e o processo estava em andamento, volta para "a_fazer"
        if (localProcess.situacao === 'em_progresso' || localProcess.situacao === 'concluido') {
          newSituacao = 'a_fazer'
        }
      }
    }

    setIsSaving(true)
    const occurredAt = new Date().toISOString()
    const batch = writeBatch(firestore)
    batch.update(doc(firestore, "processes", localProcess.id), {
      tarefas: newTarefas,
      situacao: newSituacao,
      atualizadoEm: occurredAt,
      atualizadoPor: userData?.fullName || userData?.email || "Usuário não identificado",
      concluidoEm: newSituacao === "concluido" ? occurredAt : null
    })
    const previousTask = localTarefas.find(t => t.id === tarefaId)
    const changedTask = newTarefas.find(t => t.id === tarefaId)
    addAuditEntry(batch, "TAREFA_ALTERADA", { id: tarefaId, situacao: previousTask?.situacao || null }, { id: tarefaId, situacao: changedTask?.situacao || null }, occurredAt)

    try {
      await batch.commit()
      setLocalTarefas(newTarefas)
      setLocalProcess((current: any) => ({ ...current, tarefas: newTarefas, situacao: newSituacao }))
      if (newSituacao === "concluido") toast({ title: "Processo finalizado", description: "Todas as tarefas foram concluídas." })
    } catch (error) {
      console.error("Falha ao atualizar tarefa:", error)
      toast({ title: "Não foi possível atualizar a tarefa", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || isSaving) return
    if (newComment.trim().length > 2000) {
      toast({ title: "Comentário muito longo", description: "Use no máximo 2.000 caracteres.", variant: "destructive" })
      return
    }
    
    const comment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
      user: userData?.fullName || "Usuário"
    }
    
    const mentionsRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions = Array.from(newComment.matchAll(mentionsRegex))
      .filter((match, index, all) => all.findIndex(item => item[2] === match[2]) === index)
      .slice(0, 20)
    
    setIsSaving(true)
    const batch = writeBatch(firestore)
    batch.update(doc(firestore, "processes", localProcess.id), {
      comments: arrayUnion(comment),
      atualizadoEm: comment.createdAt,
      atualizadoPor: userData?.fullName || userData?.email || "Usuário não identificado"
    })
    addAuditEntry(batch, "COMENTARIO_ADICIONADO", null, comment.id, comment.createdAt)
    mentions.forEach(match => {
      const userId = match[2]
      if (userId) {
        addNotification(batch, userId, "Você foi mencionado", `${userData?.fullName || "Alguém"} mencionou você no processo de ${localProcess.client?.corporateName}.`, 'mention', comment.createdAt)
      }
    })

    try {
      await batch.commit()
      setLocalProcess((current: any) => ({ ...current, comments: [...(current.comments || []), comment] }))
      setNewComment("")
      toast({ title: "Comentário adicionado" })
    } catch (error) {
      console.error("Falha ao adicionar comentário:", error)
      toast({ title: "Não foi possível adicionar o comentário", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const progressValue = localTarefas.length > 0 
    ? Math.round((localTarefas.filter(t => t.situacao === 'concluido').length / localTarefas.length) * 100)
    : 0

  const usersData = (team || [])
    .filter((u: any) => u && u.id && u.fullName)
    .map((u: any) => ({ id: String(u.id), display: String(u.fullName) }))

  const renderCommentText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const match = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        return <span key={i} className="font-bold text-[#2563EB]">{`@${match[1]}`}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  const handleTextChange = (e: any) => {
    const val = e.target.value;
    setNewComment(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      if (lastAtPos === 0 || textBeforeCursor[lastAtPos - 1] === ' ' || textBeforeCursor[lastAtPos - 1] === '\n') {
        const searchText = textBeforeCursor.slice(lastAtPos + 1);
        if (!searchText.includes(' ')) {
          setShowMentions(true);
          setMentionSearch(searchText.toLowerCase());
          setMentionStart(lastAtPos);
          return;
        }
      }
    }
    setShowMentions(false);
  };

  const handleMentionSelect = (u: any) => {
    const textBefore = newComment.slice(0, mentionStart);
    const mentionText = `@[${u.fullName}](${u.id}) `;
    const textAfter = newComment.slice(mentionStart + mentionSearch.length + 1);
    
    setNewComment(textBefore + mentionText + textAfter);
    setShowMentions(false);
  };

  const filteredTeam = (team || []).filter((u: any) => 
    u && u.id && u.fullName && u.fullName.toLowerCase().includes(mentionSearch)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[1000px] p-0 border-l-[#D2D7DB] overflow-hidden flex flex-col">
        <SheetTitle className="sr-only">Detalhes do Processo</SheetTitle>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-[7] border-r flex flex-col overflow-hidden bg-white">
            <header className="p-8 border-b bg-[#F7F7F7]/50">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2C4156] text-white flex items-center justify-center font-black text-xl shadow-lg">
                    {localProcess.client?.corporateName?.substr(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#2C4156] uppercase leading-tight">{localProcess.client?.corporateName}</h2>
                    <p className="text-sm font-bold text-[#98A7AA] uppercase tracking-widest">{localProcess.client?.cnpj}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full"><X className="h-5 w-5" /></Button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Situação Atual</Label>
                  <Select value={localProcess.situacao} disabled={isSaving} onValueChange={(v) => handleUpdate('situacao', v)}>
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
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-[#D2D7DB]/50 shadow-sm min-w-[160px]">
                  <div className="p-1.5 bg-[#F7F7F7] rounded-lg text-[#2C4156]">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[8px] font-black text-[#98A7AA] uppercase leading-none mb-1">Responsável</span>
                    <Select value={localProcess.responsavelId} disabled={isSaving} onValueChange={(v) => handleUpdate('responsavelId', v)}>
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
                  <div className="p-1.5 bg-[#F7F7F7] rounded-lg text-[#2563EB]">
                    <UserPlus className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[8px] font-black text-[#98A7AA] uppercase leading-none mb-1">Auxiliar</span>
                    <Select value={localProcess.auxiliarId || "Nenhum"} disabled={isSaving} onValueChange={(v) => handleUpdate('auxiliarId', v)}>
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

                <div className="flex min-w-[170px] items-center gap-3 rounded-xl border border-[#D2D7DB]/50 bg-white p-2 shadow-sm">
                  <div className="rounded-lg bg-[#F7F7F7] p-1.5 text-[#E74C3C]">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Label htmlFor="process-deadline" className="mb-1 text-[8px] font-black uppercase leading-none text-[#98A7AA]">Vencimento</Label>
                    <Input
                      id="process-deadline"
                      type="date"
                      value={toDateInputValue(localProcess.prazo)}
                      disabled={isSaving}
                      onChange={(event) => {
                        const value = event.target.value
                        if (value) handleUpdate("prazo", new Date(`${value}T12:00:00`).toISOString())
                      }}
                      className="h-6 border-0 p-0 text-[10px] font-bold text-[#2C4156] shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
            </header>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Observações do Processo</Label>
                  <Textarea 
                    className="h-32 border-[#D2D7DB] text-sm focus:ring-[#2563EB]" 
                    key={localProcess.id}
                    defaultValue={localProcess.descricao}
                    disabled={isSaving}
                    onBlur={(e) => handleUpdate('descricao', e.target.value)}
                    placeholder="Adicione informações relevantes..."
                  />
                </div>

                <Tabs defaultValue="comments" className="w-full">
                  <TabsList className="bg-[#F7F7F7] p-1 h-10 border mb-4">
                    <TabsTrigger value="comments" className="text-[10px] font-black uppercase gap-2 px-8">
                      <MessageCircle className="h-3.5 w-3.5" /> Comentários
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments" className="space-y-6">
                    <div className="bg-[#F7F7F7] p-4 rounded-2xl border border-[#D2D7DB] shadow-inner">
                      <div className="relative">
                        <AtSign className="absolute left-3 top-3.5 h-4 w-4 text-[#98A7AA] z-10" />
                        <Textarea 
                          className="pl-9 h-24 bg-white border-[#D2D7DB] text-xs resize-none w-full"
                          placeholder="Digite seu comentário. Use @Nome para mencionar alguém..."
                          value={newComment}
                          onChange={handleTextChange}
                        />

                        {showMentions && filteredTeam.length > 0 && (
                          <div className="absolute z-50 bottom-12 left-8 bg-white border border-[#D2D7DB] shadow-lg rounded-xl overflow-hidden max-h-48 overflow-y-auto w-64">
                            {filteredTeam.map((u: any) => (
                              <div 
                                key={u.id}
                                className="px-4 py-2 hover:bg-[#2563EB] hover:text-white cursor-pointer text-xs font-bold text-[#2C4156] transition-colors uppercase border-b last:border-b-0 flex items-center gap-2"
                                onClick={() => handleMentionSelect(u)}
                              >
                                <div className="h-5 w-5 bg-[#F7F7F7] text-[#2C4156] rounded-full flex items-center justify-center text-[8px] border">
                                  {u.fullName.charAt(0)}
                                </div>
                                {u.fullName}
                              </div>
                            ))}
                          </div>
                        )}
                        <Button 
                          className="absolute bottom-2 right-2 h-8 bg-[#2563EB] text-[10px] font-black uppercase gap-2"
                          onClick={handleAddComment}
                          disabled={isSaving || !newComment.trim()}
                        >
                          <Send className="h-3 w-3" /> Enviar
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {localProcess.comments?.length > 0 ? (
                        [...localProcess.comments].reverse().map((c: any) => (
                          <div key={c.id} className="flex gap-3 items-start p-3 bg-white border rounded-xl shadow-sm">
                            <Avatar className="h-8 w-8 border">
                              <AvatarFallback className="bg-[#2C4156] text-white text-[10px] font-black">{c.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#2C4156] uppercase">{c.user}</span>
                                <span className="text-[9px] font-bold text-[#98A7AA]">{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                              </div>
                              <p className="text-xs text-[#39586D] leading-relaxed whitespace-pre-wrap">{renderCommentText(c.text)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-[#98A7AA] text-[10px] font-black uppercase tracking-widest border-2 border-dashed rounded-2xl opacity-40">
                          Nenhum comentário.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>

          <div className="flex-[3] bg-[#F4F5F7] flex flex-col overflow-hidden">
            <header className="p-6 border-b space-y-4">
              <h3 className="font-black text-[#2C4156] uppercase text-xs tracking-widest flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#2563EB]" /> Tarefas do Processo
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
                {localTarefas.map((tarefa) => (
                  <Card key={tarefa.id} className={cn(
                    "border-[#D2D7DB] shadow-sm",
                    tarefa.situacao === 'concluido' && "opacity-60 bg-[#EBEDF0]"
                  )}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={tarefa.situacao === 'concluido'} 
                          onCheckedChange={() => toggleTarefa(tarefa.id)} 
                          disabled={isSaving}
                          className="mt-1 h-5 w-5 rounded-lg"
                        />
                        <div className="flex-1">
                          <p className={cn(
                            "text-xs font-black text-[#2C4156] leading-tight uppercase",
                            tarefa.situacao === 'concluido' && "line-through"
                          )}>
                            {tarefa.titulo}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
