"use client"

import { useState, useEffect } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { 
  X,
  UserCircle,
  Send,
  Trash2,
  CalendarDays,
  Clock,
  MessageSquare,
  Save,
  Loader2
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { buildTaskAssignmentNotificationKey, createAppNotification } from "@/lib/notifications"
import { 
  useFirestore, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  useUser
} from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TicketDetailsDrawer({ open, onOpenChange, ticket, clients, team, templates }: any) {
  const firestore = useFirestore()
  const { user } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [localData, setLocalData] = useState({
    title: "",
    notes: "",
    clientId: "",
    templateId: "",
    responsibleId: "",
    dueDate: ""
  })
  
  const [newComment, setNewComment] = useState("")
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionStart, setMentionStart] = useState(-1)

  const commentsQuery = useMemoFirebase(() => 
    ticket?.id ? query(collection(firestore, "tasks", ticket.id, "comments"), orderBy("createdAt", "asc")) : null, 
    [firestore, ticket?.id]
  )
  const { data: comments = [] } = useCollection(commentsQuery)

  useEffect(() => {
    if (ticket && open) {
      setLocalData({
        title: ticket.title || "",
        notes: ticket.notes || "",
        clientId: ticket.clientId || "none",
        templateId: ticket.templateId || "none",
        responsibleId: ticket.responsibleId || "",
        dueDate: ticket.dueDate || ""
      })
    }
  }, [ticket?.id, open])

  if (!ticket) return null

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      const updates: any = {
        title: localData.title,
        notes: localData.notes,
        clientId: localData.clientId,
        templateId: localData.templateId,
        responsibleId: localData.responsibleId,
        dueDate: localData.dueDate,
        updatedAt: new Date().toISOString()
      }

      if (localData.clientId && localData.clientId !== 'none') {
        const client = clients.find((c: any) => c.id === localData.clientId)
        if (client) updates.clientName = client.corporateName
      } else {
        updates.clientName = ""
      }
      
      if (localData.responsibleId) {
        const resp = team.find((t: any) => t.id === localData.responsibleId)
        if (resp) updates.responsibleName = resp.fullName
      } else {
        updates.responsibleName = ""
      }

      if (localData.templateId && localData.templateId !== 'none') {
        const temp = templates.find((t: any) => t.id === localData.templateId)
        if (temp) updates.title = temp.nome
      }

      const docRef = doc(firestore, "tasks", ticket.id)
      await updateDocumentNonBlocking(docRef, updates)

      // Notify responsible user if they were changed
      if (localData.responsibleId && localData.responsibleId !== ticket.responsibleId) {
        createAppNotification(firestore, {
          userId: localData.responsibleId,
          title: "Demanda Interna Designada",
          message: `Você foi designado para a demanda: ${updates.title || localData.title}`,
          type: "assignment",
          link: "/atendimentos",
          taskId: ticket.id,
          remetente: user?.displayName || "Sistema",
          metaKey: buildTaskAssignmentNotificationKey(ticket.id, localData.responsibleId),
        })
      }

      toast({ title: "Alterações Salvas!", description: "A demanda foi atualizada com sucesso." })
    } catch (e) {
      console.error(e)
      toast({ title: "Erro ao salvar", description: "Não foi possível atualizar a demanda.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir esta demanda irreversivelmente?")) {
      deleteDocumentNonBlocking(doc(firestore, "tasks", ticket.id))
      toast({ title: "Demanda excluída", variant: "destructive" })
      onOpenChange(false)
    }
  }

  const notifyUser = (userId: string, title: string, message: string, type: 'assignment' | 'mention') => {
    createAppNotification(firestore, {
      userId,
      title,
      message,
      type,
      link: "/atendimentos",
      taskId: ticket.id,
      remetente: user?.displayName || "Sistema",
    })
  }

  const handleSendComment = () => {
    if (!newComment.trim()) return
    const commentId = Math.random().toString(36).substr(2, 9)
    const commentData = {
      id: commentId,
      text: newComment,
      userId: user?.uid,
      userName: user?.displayName || "Usuário",
      createdAt: new Date().toISOString()
    }
    setDocumentNonBlocking(doc(firestore, "tasks", ticket.id, "comments", commentId), commentData, { merge: true })

    const mentionsRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions = Array.from(newComment.matchAll(mentionsRegex));
    
    if (mentions.length > 0) {
      mentions.forEach((match: any) => {
        const userId = match[2];
        if (userId) {
          notifyUser(
            userId,
            "Você foi mencionado",
            `${user?.displayName || 'Usuário'} mencionou você na demanda ${ticket.title}.`,
            'mention'
          )
        }
      })
    }

    setNewComment("")
  }

  const renderCommentText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part: string, i: number) => {
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
      <SheetContent className="w-full sm:max-w-[700px] p-0 flex flex-col border-l-[#D2D7DB] overflow-hidden bg-[#F7F7F7]">
        <div className="p-6 bg-white border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2C4156] rounded-xl flex items-center justify-center shrink-0">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <SheetTitle className="text-xl font-black text-[#2C4156] leading-tight uppercase">Ficha da Demanda</SheetTitle>
              <p className="text-[10px] font-bold text-[#98A7AA]">ID: {ticket.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-[#D2D7DB] shadow-sm space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-wider">Título da Demanda</Label>
                <Input 
                  value={localData.title} 
                  onChange={(e) => setLocalData({...localData, title: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold text-[#2C4156] uppercase"
                  disabled={localData.templateId !== 'none' && localData.templateId !== ''}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-wider">Empresa</Label>
                  <Select value={localData.clientId} onValueChange={(v) => setLocalData(prev => ({ ...prev, clientId: v }))}>
                    <SelectTrigger className="border-[#D2D7DB] font-bold text-[#2C4156] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione...</SelectItem>
                      {(clients || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs uppercase">{c.corporateName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-wider">Modelo</Label>
                  <Select value={localData.templateId} onValueChange={(v) => {
                    const temp = templates.find((t: any) => t.id === v)
                    setLocalData(prev => ({ 
                      ...prev, 
                      templateId: v,
                      title: temp ? temp.nome : prev.title 
                    }))
                  }}>
                    <SelectTrigger className="border-[#D2D7DB] font-bold text-[#2C4156] text-xs">
                      <SelectValue placeholder="Sem Modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem Modelo</SelectItem>
                      {(templates || []).map((t: any) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs uppercase">{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-wider">Responsável</Label>
                  <Select value={localData.responsibleId} onValueChange={(v) => setLocalData(prev => ({ ...prev, responsibleId: v }))}>
                    <SelectTrigger className="border-[#D2D7DB] font-bold text-[#2C4156] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(team || []).map((t: any) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs uppercase">{t.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-wider">Prazo de Conclusão</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                    <Input 
                      type="date"
                      value={localData.dueDate} 
                      onChange={(e) => setLocalData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="border-[#D2D7DB] font-bold text-[#2C4156] pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-wider">Notas Internas</Label>
                <Textarea 
                  value={localData.notes} 
                  onChange={(e) => setLocalData({...localData, notes: e.target.value})}
                  className="border-[#D2D7DB] min-h-[100px] text-sm"
                  placeholder="Insira detalhes da tarefa..."
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#D2D7DB] shadow-sm overflow-hidden flex flex-col h-[350px]">
              <div className="p-3 border-b bg-[#F4F5F7]">
                <h4 className="text-[11px] font-black text-[#2C4156] uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Conversa Interna
                </h4>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pr-3">
                  {(!comments || comments.length === 0) ? (
                     <div className="text-center py-6 text-[10px] font-black text-[#98A7AA] uppercase">
                       Nenhum comentário ainda.
                     </div>
                  ) : (
                    (comments || []).map((comment: any) => {
                      const isMe = comment.userId === user?.uid;
                      return (
                        <div key={comment.id} className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                          <div className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
                            isMe ? "bg-[#2563EB] text-white rounded-br-sm" : "bg-[#F4F5F7] text-[#2C4156] rounded-bl-sm"
                          )}>
                            {renderCommentText(comment.text)}
                          </div>
                          <span className="text-[9px] font-bold text-[#98A7AA]">
                            {comment.userName.split(' ')[0]} • {new Date(comment.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 border-t bg-white flex gap-2 relative">
                <Input 
                  placeholder="Digite uma mensagem. Use @Nome para mencionar..." 
                  className="border-[#D2D7DB] h-9 pr-10 inline-flex"
                  value={newComment}
                  onChange={handleTextChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !showMentions) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                />
                <Button size="icon" className="h-9 w-9 bg-[#2C4156] shrink-0" onClick={handleSendComment}>
                  <Send className="h-4 w-4" />
                </Button>

                {showMentions && filteredTeam.length > 0 && (
                  <div className="absolute z-50 bottom-14 left-3 bg-white border border-[#D2D7DB] shadow-lg rounded-xl overflow-hidden max-h-48 overflow-y-auto w-64">
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
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4">
               <Button 
                 className="bg-[#2563EB] hover:bg-[#2563EB]/95 gap-2 text-xs font-black uppercase shadow-sm h-11 px-8" 
                 onClick={handleSaveChanges}
                 disabled={isSaving}
               >
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                 Salvar Alterações
               </Button>
               <Button variant="destructive" className="gap-2 text-xs font-black uppercase shadow-sm h-11 px-6" onClick={handleDelete}>
                 <Trash2 className="h-4 w-4" /> Excluir Demanda
               </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
