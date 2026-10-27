
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
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown,
  Loader2,
  ListRestart
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"

export function IrpfFlowManager({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const firestore = useFirestore()
  const [newFlowTitle, setNewFlowTitle] = useState("")

  const stagesQuery = useMemoFirebase(() => query(collection(firestore, "irpf_stages"), orderBy("order", "asc")), [firestore])
  const { data: stages, isLoading } = useCollection(stagesQuery)

  const handleAddFlow = () => {
    if (!newFlowTitle) return
    const id = Math.random().toString(36).substr(2, 9)
    const flowRef = doc(firestore, "irpf_stages", id)
    
    setDocumentNonBlocking(flowRef, {
      id,
      title: newFlowTitle.toUpperCase(),
      order: (stages?.length || 0) + 1
    }, { merge: true })
    
    setNewFlowTitle("")
    toast({ title: "Nova Etapa Criada!" })
  }

  const handleDeleteFlow = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "irpf_stages", id))
    toast({ title: "Etapa removida", variant: "destructive" })
  }

  const handleMove = (id: string, currentOrder: number, direction: 'up' | 'down') => {
    if (!stages) return
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1
    const targetStage = stages.find(s => s.order === targetOrder)
    const currentStage = stages.find(s => s.id === id)

    if (currentStage && targetStage) {
      setDocumentNonBlocking(doc(firestore, "irpf_stages", currentStage.id), { order: targetOrder }, { merge: true })
      setDocumentNonBlocking(doc(firestore, "irpf_stages", targetStage.id), { order: currentOrder }, { merge: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[#2563EB] mb-2">
            <ListRestart className="h-6 w-6" />
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Gerenciar Fluxos</DialogTitle>
          </div>
          <DialogDescription>Personalize as colunas (etapas) do seu Kanban de IRPF.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Ex: AGUARDANDO ASSINATURA" 
              value={newFlowTitle}
              onChange={(e) => setNewFlowTitle(e.target.value)}
              className="bg-[#F7F7F7] border-[#D2D7DB] font-bold uppercase text-xs"
            />
            <Button className="bg-[#2563EB] font-bold" onClick={handleAddFlow}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Etapas Atuais (Ordem Visual)</Label>
            <div className="border rounded-xl divide-y bg-white overflow-hidden shadow-sm">
              {isLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" /></div>
              ) : stages && stages.length > 0 ? (
                stages.map((stage, index) => (
                  <div key={stage.id} className="p-3 flex items-center justify-between group hover:bg-[#F7F7F7] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-[#98A7AA] w-4">{stage.order}</span>
                      <span className="text-xs font-black text-[#2C4156] uppercase">{stage.title}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-[#98A7AA]"
                        disabled={index === 0}
                        onClick={() => handleMove(stage.id, stage.order, 'up')}
                      >
                        <MoveUp className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-[#98A7AA]"
                        disabled={index === (stages?.length || 0) - 1}
                        onClick={() => handleMove(stage.id, stage.order, 'down')}
                      >
                        <MoveDown className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-[#E74C3C]"
                        onClick={() => handleDeleteFlow(stage.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#98A7AA] font-bold italic">
                  Usando colunas padrão. Crie uma para personalizar.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
          <Button className="w-full bg-[#2C4156] font-bold" onClick={() => onOpenChange(false)}>Concluir Edição</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
