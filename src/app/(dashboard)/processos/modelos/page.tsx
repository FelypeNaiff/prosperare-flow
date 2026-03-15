
"use client"

import { useState } from "react"
import { 
  FileText, 
  Plus, 
  Copy, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  CheckCircle2,
  X,
  Save,
  Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const DEPARTMENTS = ["FISCAL", "PESSOAL", "CONTÁBIL", "FINANCEIRO", "ADMINISTRATIVO"]

export default function ModelosProcessosPage() {
  const router = useRouter()
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  const templatesQuery = useMemoFirebase(() => collection(firestore, "process_templates"), [firestore])
  const { data: templates = [], isLoading } = useCollection(templatesQuery)

  const [formData, setFormData] = useState({
    title: "",
    dept: "FISCAL",
    description: "",
    checklist: [] as string[]
  })

  const [newItem, setNewItem] = useState("")

  const handleOpenModal = (template?: any) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        title: template.title || "",
        dept: template.dept || "FISCAL",
        description: template.description || "",
        checklist: template.checklist || []
      })
    } else {
      setEditingTemplate(null)
      setFormData({ title: "", dept: "FISCAL", description: "", checklist: [] })
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!formData.title) {
      toast({ title: "Erro", description: "O título do modelo é obrigatório.", variant: "destructive" })
      return
    }

    const id = editingTemplate?.id || Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "process_templates", id)
    
    setDocumentNonBlocking(docRef, {
      ...formData,
      id,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    setIsModalOpen(false)
    toast({ title: editingTemplate ? "Modelo Atualizado!" : "Modelo Criado!" })
  }

  const handleDuplicate = (template: any) => {
    const id = Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "process_templates", id)
    
    setDocumentNonBlocking(docRef, {
      ...template,
      id,
      title: `${template.title} (CÓPIA)`,
      createdAt: new Date().toISOString()
    }, { merge: true })

    toast({ title: "Modelo Duplicado!", description: "Uma cópia foi criada com sucesso." })
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "process_templates", id))
    toast({ title: "Modelo removido", variant: "destructive" })
  }

  const addChecklistItem = () => {
    if (!newItem) return
    setFormData({ ...formData, checklist: [...formData.checklist, newItem] })
    setNewItem("")
  }

  const removeChecklistItem = (index: number) => {
    setFormData({ ...formData, checklist: formData.checklist.filter((_, i) => i !== index) })
  }

  const filteredTemplates = (templates || []).filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.dept?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#39586D]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Modelos de Processos</h1>
            <p className="text-[#98A7AA] font-bold text-sm">Gerencie padrões de checklists para sua operação.</p>
          </div>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" /> Novo Modelo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
        <Input 
          placeholder="Buscar modelos por título ou departamento..." 
          className="pl-10 bg-white border-[#D2D7DB]" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Sincronizando Modelos...</p>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((model) => (
            <Card key={model.id} className="border-[#D2D7DB] hover:shadow-md transition-all group overflow-hidden bg-white">
              <div className="h-1.5 w-full bg-[#2C4156] opacity-20 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-[#F7F7F7] rounded-lg">
                    <FileText className="h-5 w-5 text-[#2C4156]" />
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-[#D2D7DB] text-[#39586D]">{model.dept}</Badge>
                </div>
                <CardTitle className="text-base font-black mt-2 text-[#2C4156] uppercase truncate" title={model.title}>
                  {model.title}
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-[#98A7AA]">
                  {model.checklist?.length || 0} Etapas no Checklist
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2 border-[#D2D7DB] text-[10px] font-black uppercase h-8" onClick={() => handleDuplicate(model)}>
                    <Copy className="h-3 w-3" /> Duplicar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2 border-[#D2D7DB] text-[10px] font-black uppercase h-8 text-[#2C4156]" onClick={() => handleOpenModal(model)}>
                    <Edit className="h-3 w-3 text-[#1FA67A]" /> Editar
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase text-[#E74C3C] h-8 hover:bg-[#E74C3C]/5" onClick={() => handleDelete(model.id)}>
                  <Trash2 className="h-3 w-3 mr-2" /> Excluir Modelo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-white/50 text-center p-12">
          <Layers className="h-12 w-12 text-[#D2D7DB] mb-4" />
          <h3 className="text-lg font-black text-[#2C4156] uppercase">Nenhum Modelo Localizado</h3>
          <p className="text-sm text-[#98A7AA] font-bold max-w-sm">Crie checklists padrão para serem usados nos grupos de obrigações.</p>
          <Button className="mt-6 bg-[#1FA67A] font-black uppercase text-xs shadow-lg" onClick={() => handleOpenModal()}>Criar Primeiro Modelo</Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {editingTemplate ? "Editar Modelo" : "Novo Modelo de Processo"}
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Defina o nome e os passos para a execução deste processo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6 bg-white">
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Nome do Modelo</Label>
                <Input 
                  placeholder="Ex: FECHAMENTO DE FOLHA MENSAL" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold"
                />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Departamento</Label>
                <Select value={formData.dept} onValueChange={(v) => setFormData({...formData, dept: v})}>
                  <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-xs font-black text-[#2C4156] uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#1FA67A]" /> Checklist de Execução
              </h4>
              <div className="bg-[#F7F7F7] p-4 rounded-2xl border space-y-4 shadow-inner">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Próxima etapa do processo..." 
                    className="flex-1 bg-white border-[#D2D7DB] text-sm" 
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                  />
                  <Button className="bg-[#2C4156] shadow-md" onClick={addChecklistItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.checklist.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D2D7DB] shadow-sm group">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#2C4156]/5 text-[10px] font-black text-[#2C4156]">{index + 1}</span>
                        <span className="text-xs font-bold text-[#39586D]">{item}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeChecklistItem(index)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {formData.checklist.length === 0 && (
                    <p className="text-center py-4 text-[10px] font-bold text-[#98A7AA] uppercase italic">
                      Adicione itens ao checklist para padronizar a execução.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-[#D2D7DB] font-bold text-xs uppercase">Cancelar</Button>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-8 shadow-lg" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> Salvar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
