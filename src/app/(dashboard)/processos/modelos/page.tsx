
"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Layers, 
  Loader2, 
  CheckCircle2, 
  Copy, 
  Edit, 
  Trash2,
  CalendarClock,
  Users,
  ClipboardList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { ProcessModelModal } from "@/components/processes/model-modal"
import { toast } from "@/hooks/use-toast"

export default function ModelosProcessosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<any>(null)

  const modelsQuery = useMemoFirebase(() => query(collection(firestore, "processoModelos"), orderBy("nome", "asc")), [firestore])
  const { data: models, isLoading } = useCollection(modelsQuery)

  const filteredModels = (models || []).filter(m => 
    m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.departamento?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (model: any) => {
    setEditingModel(model)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "processoModelos", id))
    toast({ title: "Modelo Removido", variant: "destructive" })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Modelos de Processos</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Estruture checklists inteligentes para automação do escritório.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg" onClick={() => { setEditingModel(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo Modelo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
        <Input 
          placeholder="Buscar modelos por nome ou departamento..." 
          className="pl-10 bg-white border-[#D2D7DB]" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest mt-4">Sincronizando Inteligência...</p>
        </div>
      ) : filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <Card key={model.id} className="border-[#D2D7DB] hover:shadow-md transition-all group overflow-hidden bg-white">
              <div className="h-1.5 w-full bg-[#2C4156] opacity-20 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-[#F7F7F7] rounded-lg text-[#2C4156]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-[#D2D7DB] text-[#39586D]">{model.departamento}</Badge>
                    <Badge className="bg-[#E3F0F9] text-[#2574A9] border-none text-[8px] font-black uppercase">{model.tipo}</Badge>
                  </div>
                </div>
                <CardTitle className="text-base font-black mt-2 text-[#2C4156] uppercase truncate">
                  {model.nome}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#98A7AA]">
                    <Users className="h-3 w-3" /> {model.clientesVinculados?.length || 0} Clientes
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#98A7AA]">
                    <ClipboardList className="h-3 w-3" /> {model.tarefas?.length || 0} Tarefas
                  </div>
                </div>
                
                {model.tipo === 'recorrente' && (
                  <div className="bg-[#F7F7F7] p-2 rounded-lg border border-[#D2D7DB]/50">
                    <p className="text-[9px] font-black uppercase text-[#98A7AA] tracking-tighter">Próxima Geração</p>
                    <p className="text-xs font-bold text-[#2C4156]">Dia {model.dataGeracaoRecorrencia || '10'} ({model.recorrencia})</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] font-black uppercase h-8 border-[#D2D7DB]" onClick={() => handleEdit(model)}>
                    <Edit className="h-3 w-3 mr-2 text-[#1FA67A]" /> Editar
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 border-[#D2D7DB]"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs font-bold uppercase gap-2"><Copy className="h-3.5 w-3.5" /> Duplicar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(model.id)} className="text-xs font-bold uppercase gap-2 text-[#E74C3C]"><Trash2 className="h-3.5 w-3.5" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-white/50 text-center p-12">
          <Layers className="h-12 w-12 text-[#D2D7DB] mb-4" />
          <h3 className="text-lg font-black text-[#2C4156] uppercase">Nenhum Modelo Definido</h3>
          <p className="text-sm text-[#98A7AA] font-bold max-w-sm">Crie a inteligência por trás dos seus processos para automatizar a geração de tarefas.</p>
          <Button className="mt-6 bg-[#1FA67A] font-black uppercase text-xs" onClick={() => setIsModalOpen(true)}>Criar Primeiro Modelo</Button>
        </div>
      )}

      <ProcessModelModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        model={editingModel} 
      />
    </div>
  )
}
