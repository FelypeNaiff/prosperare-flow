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
import { Layers, Building2, Calendar, Save, Loader2 } from "lucide-react"
import { format, parse, addMonths, lastDayOfMonth, setDate } from "date-fns"

export function CreateProcessModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const firestore = useFirestore()
  const [isSaving, setIsSaving] = useState(false)

  const modelsQuery = useMemoFirebase(() => collection(firestore, "processoModelos"), [firestore])
  const { data: models = [] } = useCollection(modelsQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    modeloId: "",
    clienteId: "",
    competencia: format(new Date(), "yyyy-MM"),
  })

  const handleCreate = async () => {
    if (!formData.modeloId || !formData.clienteId) {
      toast({ title: "Atenção", description: "Selecione o modelo e o cliente para continuar.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const model = (models || []).find(m => m.id === formData.modeloId)
      const client = (clients || []).find(c => c.id === formData.clienteId)
      
      if (!model || !client) throw new Error("Dados não localizados")

      const competenceDate = parse(formData.competencia, "yyyy-MM", new Date())
      
      const id = Math.random().toString(36).substr(2, 9)
      const processRef = doc(firestore, "processes", id)

      const day = model.prazoFixo || 20
      let dueDate = setDate(competenceDate, day)
      
      if (model.competencia === 'mes_anterior') {
        dueDate = addMonths(dueDate, 1) 
      } else if (model.competencia === 'mes_seguinte') {
        dueDate = addMonths(dueDate, -1)
      }

      const lastDay = lastDayOfMonth(dueDate)
      if (dueDate > lastDay) dueDate = lastDay

      const newProcess = {
        id,
        modeloId: model.id,
        clienteId: client.id,
        nomeProcesso: model.nome,
        situacao: "a_fazer",
        departamento: model.departamento || "Geral",
        responsavelId: "Geral",
        prazo: dueDate.toISOString(),
        prazoMeta: dueDate.toISOString(),
        competencia: competenceDate.toISOString(),
        atrasoGeraMulta: false,
        criadoEm: new Date().toISOString(),
        tarefas: (model.tarefas || []).map((t: any) => ({
          id: Math.random().toString(36).substr(2, 5),
          modeloTarefaId: t.id,
          ordem: t.ordem || 0,
          titulo: t.titulo,
          descricao: t.descricao || "",
          situacao: "a_fazer",
          prioridade: t.prioridade || "normal",
          prazo: dueDate.toISOString()
        }))
      }

      setDocumentNonBlocking(processRef, newProcess, { merge: true })
      
      toast({ 
        title: "Processo Instanciado!", 
        description: `O fluxo "${model.nome}" foi criado para ${client.corporateName}.` 
      })
      onOpenChange(false)
      setFormData({ modeloId: "", clienteId: "", competencia: format(new Date(), "yyyy-MM") })
    } catch (e) {
      toast({ title: "Erro ao criar", description: "Verifique os dados e tente novamente.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-[#2C4156] text-white">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">Novo Processo Manual</DialogTitle>
          <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
            Instancie um modelo de inteligência para execução imediata.
          </DialogDescription>
        </DialogHeader>

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
              <Building2 className="h-3 w-3" /> Empresa / Cliente
            </Label>
            <Select value={formData.clienteId} onValueChange={(v) => setFormData({...formData, clienteId: v})}>
              <SelectTrigger className="border-[#D2D7DB] h-11">
                <SelectValue placeholder="Selecione o cliente da base..." />
              </SelectTrigger>
              <SelectContent>
                {(clients || []).map(c => (
                  <SelectItem key={c.id} value={c.id} className="font-bold uppercase text-xs">{c.corporateName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Competência de Referência
            </Label>
            <Input 
              type="month" 
              value={formData.competencia} 
              onChange={(e) => setFormData({...formData, competencia: e.target.value})}
              className="border-[#D2D7DB] h-11 font-bold"
            />
          </div>
        </div>

        <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold uppercase text-xs border-[#D2D7DB]">Cancelar</Button>
          <Button 
            className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-8 shadow-lg shadow-emerald-500/20" 
            onClick={handleCreate}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Criar Processo Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}