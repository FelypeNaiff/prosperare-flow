
"use client"

import { useState } from "react"
import { Layers, Plus, Edit, Trash2, Users, CheckCircle2, Building2, Loader2, Save, X, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { collection, doc, query, orderBy } from "firebase/firestore"

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
        name: group.name,
        dept: group.dept,
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
    toast({ title: editingGroup ? "Grupo Atualizado!" : "Grupo Criado!", description: "As configurações foram salvas na nuvem." })
  }

  const handleDeleteGroup = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "obligation_groups", id))
    toast({ title: "Grupo removido", variant: "destructive" })
  }

  const addProcess = () => {
    if (!newProcess.title) return
    setFormData({
      ...formData,
      processes: [...formData.processes, { ...newProcess, id: Math.random().toString(36).substr(2, 5) }]
    })
    setNewProcess({ title: "", dueDay: "20" })
  }

  const removeProcess = (id: string) => {
    setFormData({
      ...formData,
      processes: formData.processes.filter(p => p.id !== id)
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
          {groups?.map((group) => (
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
                  <div className="flex flex-col items-end gap-2">
                    <Switch 
                      checked={group.active !== false} 
                      onCheckedChange={(v) => updateDocumentNonBlocking(doc(firestore, "obligation_groups", group.id), { active: v })} 
                    />
                  </div>
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
          <p className="text-sm text-[#98A7AA] font-bold max-w-sm">Crie grupos para automatizar a geração de tarefas mensais baseadas no regime tributário ou setor.</p>
          <Button className="mt-6 bg-[#1FA67A] font-black uppercase text-xs" onClick={() => handleOpenModal()}>Criar Primeiro Grupo</Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {editingGroup ? "Editar Grupo" : "Novo Grupo de Automação"}
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Defina os processos que serão replicados para todas as empresas vinculadas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-8 bg-white">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Nome do Grupo</Label>
                <Input 
                  placeholder="Ex: FISCAL SIMPLES NACIONAL" 
                  className="font-bold border-[#D2D7DB]"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Departamento Responsável</Label>
                <Input 
                  placeholder="Ex: Fiscal" 
                  className="font-bold border-[#D2D7DB]"
                  value={formData.dept}
                  onChange={(e) => setFormData({...formData, dept: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Cor de Identificação</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    className="w-12 h-10 p-1 border-[#D2D7DB]"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                  <Input 
                    className="flex-1 font-mono uppercase text-xs" 
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Emoji / Ícone</Label>
                <Input 
                  placeholder="📋" 
                  className="text-xl text-center border-[#D2D7DB]"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-[#2C4156] uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1FA67A]" />
                  Processos Recorrentes do Modelo
                </h4>
              </div>
              
              <div className="bg-[#F7F7F7] p-4 rounded-2xl border border-[#D2D7DB] space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Título da Tarefa</Label>
                    <Input 
                      placeholder="Ex: PGDAS-D" 
                      className="h-9 text-xs bg-white"
                      value={newProcess.title}
                      onChange={(e) => setNewProcess({...newProcess, title: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Dia Venc.</Label>
                    <Input 
                      placeholder="20" 
                      className="h-9 text-xs bg-white text-center"
                      value={newProcess.dueDay}
                      onChange={(e) => setNewProcess({...newProcess, dueDay: e.target.value})}
                    />
                  </div>
                  <Button className="mt-5 bg-[#2C4156] h-9 px-3" onClick={addProcess}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  {formData.processes.map((proc, i) => (
                    <div key={proc.id || i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D2D7DB] shadow-sm animate-in slide-in-from-left-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#1FA67A]/10 text-[#1FA67A] flex items-center justify-center font-black text-[10px]">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#2C4156]">{proc.title}</p>
                          <p className="text-[9px] text-[#98A7AA] font-bold uppercase">Todo dia {proc.dueDay} • Mensal</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] hover:bg-[#E74C3C]/10" onClick={() => removeProcess(proc.id)}>
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {formData.processes.length === 0 && (
                    <p className="text-center py-4 text-[10px] font-bold text-[#98A7AA] uppercase italic">Nenhuma tarefa adicionada ao modelo.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-[#D2D7DB] font-bold text-xs">Cancelar</Button>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-10 shadow-lg" onClick={handleSaveGroup}>
              <Save className="h-4 w-4 mr-2" /> Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
