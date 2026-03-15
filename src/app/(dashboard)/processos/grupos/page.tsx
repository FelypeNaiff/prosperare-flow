
"use client"

import { useState } from "react"
import { Layers, Plus, Edit, Trash2, Loader2, Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"

export default function GruposObrigacoesPage() {
  const firestore = useFirestore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  
  const groupsQuery = useMemoFirebase(() => collection(firestore, "obligation_groups"), [firestore])
  const { data: groups = [], isLoading } = useCollection(groupsQuery)

  const [formData, setFormData] = useState({
    name: "",
    dept: "Fiscal",
    icon: "📋",
    color: "#1FA67A",
    active: true,
    processes: [] as any[]
  })

  const [newProcess, setNewProcess] = useState({
    title: "",
    dueDay: "20"
  })

  const handleOpenModal = (group?: any) => {
    if (group) {
      setEditingGroup(group)
      setFormData({
        name: group.name || "",
        dept: group.dept || "Fiscal",
        icon: group.icon || "📋",
        color: group.color || "#1FA67A",
        active: group.active !== false,
        processes: group.processes || []
      })
    } else {
      setEditingGroup(null)
      setFormData({
        name: "",
        dept: "Fiscal",
        icon: "📋",
        color: "#1FA67A",
        active: true,
        processes: []
      })
    }
    setIsModalOpen(true)
  }

  const handleSaveGroup = () => {
    if (!formData.name) {
      toast({ title: "Erro", description: "O nome do grupo é obrigatório.", variant: "destructive" })
      return
    }

    const id = editingGroup?.id || Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "obligation_groups", id)
    
    setDocumentNonBlocking(docRef, {
      ...formData,
      id,
      updatedAt: new Date().toISOString()
    }, { merge: true })
    
    setIsModalOpen(false)
    toast({ title: editingGroup ? "Grupo Atualizado!" : "Grupo Criado!" })
  }

  const handleDeleteGroup = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "obligation_groups", id))
    toast({ title: "Grupo removido", variant: "destructive" })
  }

  const addProcess = () => {
    if (!newProcess.title) return
    setFormData({
      ...formData,
      processes: [...(formData.processes || []), { ...newProcess, id: Math.random().toString(36).substr(2, 5) }]
    })
    setNewProcess({ title: "", dueDay: "20" })
  }

  const removeProcess = (id: string) => {
    setFormData({
      ...formData,
      processes: formData.processes.filter((p: any) => p.id !== id)
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Grupos de Obrigações</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Defina modelos de processos para automação por tipo de cliente.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" /> Novo Grupo
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Sincronizando Grupos...</p>
        </div>
      ) : (groups || []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(groups || []).map((group: any) => (
            <Card key={group.id} className="border-[#D2D7DB] hover:shadow-md transition-shadow group relative overflow-hidden bg-white">
              <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: group.color }} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{group.icon}</span>
                    <div>
                      <CardTitle className="text-sm font-black text-[#2C4156] uppercase leading-tight">{group.name}</CardTitle>
                      <Badge variant="outline" className="text-[8px] uppercase font-black mt-1 border-[#D2D7DB] text-[#98A7AA]">{group.dept}</Badge>
                    </div>
                  </div>
                  <Switch 
                    checked={group.active !== false} 
                    onCheckedChange={(v) => updateDocumentNonBlocking(doc(firestore, "obligation_groups", group.id), { active: v })} 
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Tarefas no Modelo</p>
                  <div className="flex flex-wrap gap-1">
                    {group.processes?.map((p: any, i: number) => (
                      <Badge key={i} className="bg-[#F7F7F7] text-[#39586D] border-[#D2D7DB] text-[8px] font-bold">
                        {p.title}
                      </Badge>
                    )) || <span className="text-[10px] text-destructive font-bold">NENHUMA TAREFA</span>}
                  </div>
                </div>
                
                <div className="pt-2 flex gap-2 border-t border-[#F7F7F7]">
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase border-[#D2D7DB] gap-1 flex-1 text-[#2C4156]" onClick={() => handleOpenModal(group)}>
                    <Edit className="h-3 w-3" /> Editar
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] hover:bg-[#E74C3C]/10" onClick={() => handleDeleteGroup(group.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-white/50 text-center p-12">
          <Layers className="h-12 w-12 text-[#D2D7DB] mb-4" />
          <h3 className="text-lg font-black text-[#2C4156] uppercase">Nenhum Grupo Definido</h3>
          <p className="text-sm text-[#98A7AA] font-bold max-w-sm">Crie grupos para automatizar a geração de tarefas mensais.</p>
          <Button className="mt-6 bg-[#1FA67A] font-black uppercase text-xs" onClick={() => handleOpenModal()}>Criar Primeiro Grupo</Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {editingGroup ? "Editar Grupo" : "Novo Grupo"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-8 bg-white">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Nome do Grupo</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Departamento</Label>
                <Input value={formData.dept} onChange={(e) => setFormData({...formData, dept: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-xs font-black text-[#2C4156] uppercase tracking-widest">Processos Recorrentes</h4>
              <div className="bg-[#F7F7F7] p-4 rounded-2xl border space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Título da Tarefa" className="flex-1" value={newProcess.title} onChange={(e) => setNewProcess({...newProcess, title: e.target.value.toUpperCase()})} />
                  <Input placeholder="Dia" className="w-20" value={newProcess.dueDay} onChange={(e) => setNewProcess({...newProcess, dueDay: e.target.value})} />
                  <Button className="bg-[#2C4156]" onClick={addProcess}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2">
                  {(formData.processes || []).map((proc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-[#2C4156]">{proc.title}</span>
                        <span className="text-[10px] font-bold text-[#98A7AA]">Dia {proc.dueDay}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]" onClick={() => removeProcess(proc.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-black uppercase text-xs" onClick={handleSaveGroup}>Salvar Configurações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
