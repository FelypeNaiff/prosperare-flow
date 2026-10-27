"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Layers, Building2, Calendar, Save, Loader2, User } from "lucide-react"
import { format, parse, addMonths, lastDayOfMonth, setDate } from "date-fns"
import { MultiClientSearchSelect } from "@/components/clients/multi-client-search-select"

export function CreateProcessModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const firestore = useFirestore()
  const [isSaving, setIsSaving] = useState(false)

  const modelsQuery = useMemoFirebase(() => collection(firestore, "processoModelos"), [firestore])
  const { data: models = [] } = useCollection(modelsQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: team = [] } = useCollection(usersQuery)

  const [formData, setFormData] = useState({
    modeloId: "",
    clientIds: [] as string[],
    competencia: format(new Date(), "yyyy-MM"),
    responsavelId: "Padrao",
    customDeadline: ""
  })

  const selectedModel = (models || []).find((m: any) => m.id === formData.modeloId)
  const isSporadic = selectedModel?.tipo === 'esporadico'

  const handleCreate = async () => {
    if (!formData.modeloId || formData.clientIds.length === 0) {
      toast({ title: "Atenção", description: "Selecione o modelo e pelo menos uma empresa.", variant: "destructive" })
      return
    }

    if (isSporadic && !formData.customDeadline) {
      toast({ title: "Atenção", description: "Para processos esporádicos, o prazo de entrega é obrigatório.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const model = selectedModel
      if (!model) throw new Error("Modelo não localizado")

      const competenceDate = parse(formData.competencia, "yyyy-MM", new Date())
      
      let finalDueDateStr = ""
      if (isSporadic) {
        const [year, month, day] = formData.customDeadline.split("-")
        finalDueDateStr = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0).toISOString()
      } else {
        const day = model.prazoFixo || 20
        let dueDate = setDate(competenceDate, day)
        
        if (model.competencia === 'mes_anterior') {
          dueDate = addMonths(dueDate, 1) 
        } else if (model.competencia === 'mes_seguinte') {
          dueDate = addMonths(dueDate, -1)
        }

        const lastDay = lastDayOfMonth(dueDate)
        if (dueDate > lastDay) dueDate = lastDay
        finalDueDateStr = dueDate.toISOString()
      }

      formData.clientIds.forEach(clientId => {
        const client = (clients || []).find(c => c.id === clientId)
        if (!client) return

        const id = Math.random().toString(36).substr(2, 9)
        const processRef = doc(firestore, "processes", id)

        let finalResponsible = formData.responsavelId === "Padrao" 
          ? (model.responsavelPadraoId !== "Geral" ? model.responsavelPadraoId : (client.accountingContactUserId || "Geral"))
          : formData.responsavelId

        const newProcess = {
          id,
          modeloId: model.id,
          clienteId: client.id,
          nomeProcesso: model.nome,
          situacao: "a_fazer",
          departamento: model.departamento || "Geral",
          responsavelId: finalResponsible,
          prazo: finalDueDateStr,
          prazoMeta: finalDueDateStr,
          competencia: competenceDate.toISOString(),
          criadoEm: new Date().toISOString(),
          tarefas: (model.tarefas || []).map((t: any) => ({
            id: Math.random().toString(36).substr(2, 5),
            modeloTarefaId: t.id,
            titulo: t.titulo,
            situacao: "a_fazer"
          }))
        }

        setDocumentNonBlocking(processRef, newProcess, { merge: true })
      })
      
      toast({ 
        title: "Geração em Lote Concluída!", 
        description: `${formData.clientIds.length} processos foram criados com sucesso.` 
      })
      onOpenChange(false)
      setFormData({ modeloId: "", clientIds: [], competencia: format(new Date(), "yyyy-MM"), responsavelId: "Padrao", customDeadline: "" })
    } catch (e) {
      toast({ title: "Erro ao criar", description: "Houve uma falha na geração dos processos.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl flex flex-col">
        <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">Geração em Massa</DialogTitle>
          <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
            Instancie processos simultaneamente para múltiplos clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="modal-scroll-content">
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                <Layers className="h-3 w-3" /> Modelo de Checklist
              </Label>
              <Select value={formData.modeloId} onValueChange={(v) => setFormData({...formData, modeloId: v})}>
                <SelectTrigger className="border-[#D2D7DB] h-11">
                  <SelectValue placeholder="Selecione a inteligência..." />
                </SelectTrigger>
                <SelectContent>
                  {(models || []).map(m => (
                    <SelectItem key={m.id} value={m.id} className="font-bold uppercase text-xs">{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Empresas / Clientes
              </Label>
              <MultiClientSearchSelect 
                clients={clients} 
                value={formData.clientIds} 
                onValueChange={(v: string[]) => setFormData({...formData, clientIds: v})} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Competência
                </Label>
                <Input 
                  type="month" 
                  value={formData.competencia} 
                  onChange={(e) => setFormData({...formData, competencia: e.target.value})}
                  className="border-[#D2D7DB] h-11 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3" /> Atribuir Responsável
                </Label>
                <Select value={formData.responsavelId} onValueChange={(v) => setFormData({...formData, responsavelId: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Padrao" className="font-bold">USAR PADRÃO DO MODELO/CLIENTE</SelectItem>
                    {team?.map(u => (
                      <SelectItem key={u.id} value={u.fullName} className="text-xs font-bold uppercase">{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isSporadic && (
              <div className="space-y-2 border-t pt-4">
                <Label className="text-[10px] font-black uppercase text-[#2563EB] tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-[#2563EB]" /> Prazo / Vencimento do Processo
                </Label>
                <Input 
                  type="date" 
                  value={formData.customDeadline} 
                  onChange={(e) => setFormData({...formData, customDeadline: e.target.value})}
                  className="border-[#2563EB] focus-visible:ring-[#2563EB] h-11 font-bold text-[#2C4156]"
                />
                <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Por se tratar de um fluxo esporádico, defina o prazo real de entrega.</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold uppercase text-xs border-[#D2D7DB]">Cancelar</Button>
          <Button 
            className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-8 shadow-lg shadow-blue-500/20" 
            onClick={handleCreate}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Criar Processos Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
