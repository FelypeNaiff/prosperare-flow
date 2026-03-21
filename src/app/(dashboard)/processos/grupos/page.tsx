"use client"

import { useState, useMemo } from "react"
import { 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Save, 
  CheckCircle2, 
  FileText, 
  Users, 
  Search, 
  X, 
  Check, 
  Building2, 
  UserPlus
} from "lucide-react"
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function GruposObrigacoesPage() {
  const firestore = useFirestore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("config")
  
  const [searchVinculadas, setSearchVinculadas] = useState('')
  const [searchNova, setSearchNova] = useState('')

  const groupsQuery = useMemoFirebase(() => collection(firestore, "obligation_groups"), [firestore])
  const { data: groups = [], isLoading } = useCollection(groupsQuery)

  const templatesQuery = useMemoFirebase(() => collection(firestore, "processoModelos"), [firestore])
  const { data: templates = [] } = useCollection(templatesQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: allClients = [] } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    name: "",
    dept: "Fiscal",
    icon: "📋",
    color: "#1FA67A",
    active: true,
    processes: [] as any[],
    clientesVinculados: [] as string[]
  })

  const [newProcess, setNewProcess] = useState({
    templateId: "",
    title: "",
    dueDay: "20"
  })

  const vinculadasFiltradas = useMemo(() => {
    return (allClients || []).filter(c =>
      (formData.clientesVinculados || []).includes(c.id) &&
      (c.corporateName?.toLowerCase().includes(searchVinculadas.toLowerCase()) ||
       c.cnpj?.includes(searchVinculadas))
    )
  }, [allClients, formData.clientesVinculados, searchVinculadas])

  const disponiveis = useMemo(() => {
    return (allClients || []).filter(c =>
      !(formData.clientesVinculados || []).includes(c.id) &&
      (c.corporateName?.toLowerCase().includes(searchNova.toLowerCase()) ||
       c.cnpj?.includes(searchNova))
    )
  }, [allClients, formData.clientesVinculados, searchNova])

  const handleOpenModal = (group?: any) => {
    setSearchVinculadas('')
    setSearchNova('')
    if (group) {
      setEditingGroup(group)
      setFormData({
        name: group.name || "",
        dept: group.dept || "Fiscal",
        icon: group.icon || "📋",
        color: group.color || "#1FA67A",
        active: group.active !== false,
        processes: group.processes || [],
        clientesVinculados: group.clientesVinculados || []
      })
    } else {
      setEditingGroup(null)
      setFormData({
        name: "",
        dept: "Fiscal",
        icon: "📋",
        color: "#1FA67A",
        active: true,
        processes: [],
        clientesVinculados: []
      })
    }
    setActiveTab("config")
    setIsModalOpen(true)
  }

  function adicionarEmpresa(clienteId: string) {
    setFormData(prev => ({
      ...prev,
      clientesVinculados: prev.clientesVinculados.includes(clienteId) 
        ? prev.clientesVinculados 
        : [...prev.clientesVinculados, clienteId]
    }))
    setSearchNova('')
  }

  function removerEmpresa(clienteId: string) {
    setFormData(prev => ({
      ...prev,
      clientesVinculados: prev.clientesVinculados.filter(id => id !== clienteId)
    }))
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
    if (confirm("Excluir permanentemente este grupo?")) {
      deleteDocumentNonBlocking(doc(firestore, "obligation_groups", id))
      toast({ title: "Grupo removido", variant: "destructive" })
    }
  }

  const addProcess = () => {
    if (!newProcess.title) {
      toast({ title: "Título obrigatório" })
      return
    }
    setFormData({
      ...formData,
      processes: [...(formData.processes || []), { ...newProcess, id: Math.random().toString(36).substr(2, 5) }]
    })
    setNewProcess({ templateId: "", title: "", dueDay: "20" })
  }

  const removeProcess = (id: string) => {
    setFormData({
      ...formData,
      processes: (formData.processes || []).filter((p: any) => p.id !== id)
    })
  }

  const handleSelectTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId)
    if (template) {
      setNewProcess({ 
        ...newProcess, 
        templateId, 
        title: template.nome || template.title,
        dueDay: template.prazoFixo?.toString() || "20"
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Grupos de Obrigações</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Agrupe modelos de processos para automação por perfil de cliente.</p>
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
          {groups.map((group: any) => {
            const count = group.clientesVinculados?.length || 0
            return (
              <Card key={group.id} className="border-[#D2D7DB] hover:shadow-md transition-shadow group relative overflow-hidden bg-white">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: group.color }} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{group.icon}</span>
                      <div>
                        <CardTitle className="text-sm font-black text-[#2C4156] uppercase leading-tight">{group.name}</CardTitle>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-[8px] uppercase font-black border-[#D2D7DB] text-[#98A7AA]">{group.dept}</Badge>
                          <Badge className="text-[8px] font-black uppercase bg-[#E3F0F9] text-[#2574A9] border-none">
                            {count} {count === 1 ? 'Cliente' : 'Clientes'}
                          </Badge>
                        </div>
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
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Processos Vinculados</p>
                    <div className="flex flex-wrap gap-1">
                      {(group.processes || []).map((p: any, i: number) => (
                        <Badge key={i} className="bg-[#F7F7F7] text-[#39586D] border-[#D2D7DB] text-[8px] font-bold uppercase">
                          {p.title}
                        </Badge>
                      ))}
                      {(!group.processes || group.processes.length === 0) && (
                        <span className="text-[10px] text-destructive font-bold uppercase">Nenhum processo</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2 flex gap-2 border-t border-[#F7F7F7]">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase border-[#D2D7DB] gap-1 flex-1 text-[#2C4156]" onClick={() => handleOpenModal(group)}>
                      <Edit className="h-3 w-3" /> Gerenciar Grupo
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] hover:bg-[#E74C3C]/10" onClick={() => handleDeleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-white/50 text-center p-12">
          <Layers className="h-12 w-12 text-[#D2D7DB] mb-4" />
          <h3 className="text-lg font-black text-[#2C4156] uppercase">Nenhum Grupo Definido</h3>
          <p className="text-sm text-[#98A7AA] font-bold max-w-sm">Crie grupos para automatizar a geração de tarefas baseadas em modelos.</p>
          <Button className="mt-6 bg-[#1FA67A] font-black uppercase text-xs shadow-lg" onClick={() => handleOpenModal()}>Criar Primeiro Grupo</Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                  {editingGroup ? `Grupo: ${formData.name}` : "Novo Grupo de Obrigações"}
                </DialogTitle>
                <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
                  Configure as regras, tarefas e empresas vinculadas a este fluxo.
                </DialogDescription>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                <Users className="h-5 w-5 text-[#1FA67A]" />
                <div className="flex flex-col">
                  <span className="text-xs font-black leading-none">{formData.clientesVinculados?.length || 0}</span>
                  <span className="text-[8px] font-bold uppercase text-white/60">Ativas</span>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 bg-[#F7F7F7] border-b">
              <TabsList className="bg-transparent h-14 p-0 gap-8">
                <TabsTrigger value="config" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#1FA67A] data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none px-0 font-black uppercase text-[10px] tracking-widest gap-2">
                  Configurações
                </TabsTrigger>
                <TabsTrigger value="processos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#1FA67A] data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none px-0 font-black uppercase text-[10px] tracking-widest gap-2">
                  Tarefas (Modelos)
                </TabsTrigger>
                <TabsTrigger value="clientes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#1FA67A] data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none px-0 font-black uppercase text-[10px] tracking-widest gap-2">
                  Clientes e Exceções
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="config" className="m-0 space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Nome do Grupo</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                        className="border-[#D2D7DB] font-bold uppercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Departamento</Label>
                      <Input 
                        value={formData.dept} 
                        onChange={(e) => setFormData({...formData, dept: e.target.value})}
                        className="border-[#D2D7DB]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Ícone</Label>
                      <Input 
                        value={formData.icon} 
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        className="border-[#D2D7DB] text-center text-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Cor de Identificação</Label>
                      <div className="flex gap-2">
                        <input 
                          type="color"
                          value={formData.color} 
                          onChange={(e) => setFormData({...formData, color: e.target.value})}
                          className="border-[#D2D7DB] w-12 h-10 p-1 rounded-md"
                        />
                        <Input readOnly value={formData.color} className="flex-1 font-mono uppercase text-xs" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="processos" className="m-0 space-y-6">
                  <div className="bg-[#F7F7F7] p-5 rounded-2xl border border-[#D2D7DB] space-y-5 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-6 space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Vincular Modelo de Checklist</Label>
                        <Select value={newProcess.templateId} onValueChange={handleSelectTemplate}>
                          <SelectTrigger className="bg-white border-[#D2D7DB] h-10">
                            <SelectValue placeholder="Selecione um modelo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(templates || []).map(t => (
                              <SelectItem key={t.id} value={t.id} className="font-bold uppercase text-xs">{t.nome || t.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4 space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Vencimento (Dia)</Label>
                        <Input 
                          placeholder="Dia (ex: 20)" 
                          className="bg-white border-[#D2D7DB] h-10" 
                          value={newProcess.dueDay} 
                          onChange={(e) => setNewProcess({...newProcess, dueDay: e.target.value})} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button className="w-full bg-[#2C4156] h-10 shadow-md" onClick={addProcess}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(formData.processes || []).map((proc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D2D7DB] shadow-sm hover:shadow-md transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-[#1FA67A]/10 rounded-lg text-[#1FA67A]">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-[#2C4156] uppercase">{proc.title}</span>
                              <p className="text-[9px] font-bold text-[#98A7AA] uppercase">Prazo fatal: Dia {proc.dueDay}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeProcess(proc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="clientes" className="m-0">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                    <div className="lg:col-span-7 space-y-6 flex flex-col min-h-0">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Empresas Vinculadas ao Fluxo</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                          <Input 
                            placeholder="PESQUISAR POR NOME OU CNPJ" 
                            className="pl-10 h-10 bg-[#F7F7F7] border-[#D2D7DB]"
                            value={searchVinculadas}
                            onChange={(e) => setSearchVinculadas(e.target.value)}
                            style={{ borderColor: '#D2D7DB', outline: 'none' }}
                          />
                        </div>
                      </div>

                      <ScrollArea className="h-[400px] border rounded-2xl bg-white p-4">
                        <div className="space-y-3">
                          {vinculadasFiltradas.map(cliente => (
                            <div key={cliente.id} className="flex items-center justify-between p-3 bg-white border border-[#D2D7DB] rounded-xl group hover:border-[#1FA67A] transition-all">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 border-none shadow-sm rounded-lg overflow-hidden">
                                  <AvatarFallback className="bg-[#2C4156] text-white font-black text-xs rounded-lg">
                                    {cliente.corporateName?.substr(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-[#2C4156] uppercase leading-none">{cliente.corporateName}</span>
                                  <span className="text-[10px] font-mono text-[#98A7AA]">{cliente.cnpj}</span>
                                </div>
                              </div>
                              <button 
                                className="h-8 w-8 flex items-center justify-center text-[#E74C3C] hover:bg-[#FEE2E2] rounded-full transition-colors text-xl font-bold"
                                onClick={() => removerEmpresa(cliente.id)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {vinculadasFiltradas.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-slate-50/50">
                              <Users className="h-8 w-8 mx-auto text-[#D2D7DB] mb-2" />
                              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Nenhuma empresa encontrada</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="lg:col-span-5 space-y-4 flex flex-col min-h-0">
                      <div className="bg-[#F7F7F7] p-6 rounded-2xl border border-[#D2D7DB] space-y-4 shadow-inner flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-[#1FA67A] rounded-lg text-white">
                            <UserPlus className="h-4 w-4" />
                          </div>
                          <h4 className="text-[10px] font-black text-[#1FA67A] uppercase tracking-[0.2em]">Incluir Nova Empresa</h4>
                        </div>
                        
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                          <Input 
                            placeholder="ADICIONAR À LISTA" 
                            className="pl-10 h-11 bg-white border-[#1FA67A]/30 font-bold uppercase text-xs"
                            value={searchNova}
                            onChange={(e) => setSearchNova(e.target.value)}
                            autoFocus
                            style={{ borderColor: '#D2D7DB', outline: 'none' }}
                          />
                        </div>
                        
                        <ScrollArea className="flex-1 bg-white border rounded-xl mt-2">
                          <div className="p-2 space-y-1">
                            {disponiveis.map(cliente => (
                              <button
                                key={cliente.id}
                                onClick={() => adicionarEmpresa(cliente.id)}
                                className="w-full px-3 py-3 cursor-pointer hover:bg-gray-50 rounded-lg text-left transition-all border border-transparent hover:border-[#D2D7DB]"
                              >
                                <p className="text-[10px] font-black text-[#2C4156] uppercase leading-tight">{cliente.corporateName}</p>
                                <p className="text-[9px] font-mono text-[#98A7AA] mt-0.5">{cliente.cnpj}</p>
                              </button>
                            ))}
                            {disponiveis.length === 0 && (
                              <div className="text-center py-12 px-4">
                                <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">
                                  {searchNova ? 'Nenhuma empresa encontrada' : 'Todos os clientes já vinculados'}
                                </p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>

            <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold text-xs uppercase border-[#D2D7DB]">Cancelar</Button>
              <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-8 shadow-lg shadow-emerald-500/20" onClick={handleSaveGroup}>
                <Save className="h-4 w-4 mr-2" /> Salvar Alterações do Grupo
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TabTrigger({ value, label }: { value: string, label: string }) {
  return (
    <TabsTrigger 
      value={value} 
      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#1FA67A] data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none px-0 font-black uppercase text-[10px] tracking-widest shrink-0"
    >
      {label}
    </TabsTrigger>
  )
}