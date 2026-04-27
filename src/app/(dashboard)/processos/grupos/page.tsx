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
  UserPlus,
  PlayCircle,
  Calendar,
  AlertTriangle,
  RefreshCcw,
  Zap
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
import { collection, doc, query, where, getDocs, setDoc } from "firebase/firestore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format, parse, addMonths, lastDayOfMonth, setDate, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function GruposObrigacoesPage() {
  const firestore = useFirestore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("config")
  
  // Estados para geração de processos
  const [isGenModalOpen, setIsGenModalOpen] = useState(false)
  const [selectedGroupForGen, setSelectedGroupForGen] = useState<any>(null)
  const [genCompetencia, setGenCompetencia] = useState(format(new Date(), "yyyy-MM"))
  const [isGenerating, setIsGenerating] = useState(false)

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
    clientesVinculados: [] as string[],
    linkedModelId: ""
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
       c.nomeFantasia?.toLowerCase().includes(searchVinculadas.toLowerCase()) ||
       c.cnpj?.includes(searchVinculadas))
    )
  }, [allClients, formData.clientesVinculados, searchVinculadas])

  const disponiveis = useMemo(() => {
    return (allClients || []).filter(c =>
      !(formData.clientesVinculados || []).includes(c.id) &&
      (c.corporateName?.toLowerCase().includes(searchNova.toLowerCase()) ||
       c.nomeFantasia?.toLowerCase().includes(searchNova.toLowerCase()) ||
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
        clientesVinculados: group.clientesVinculados || [],
        linkedModelId: group.linkedModelId || ""
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
        clientesVinculados: [],
        linkedModelId: ""
      })
    }
    setActiveTab("config")
    setIsModalOpen(true)
  }

  const handleOpenGenModal = (group: any) => {
    setSelectedGroupForGen(group)
    setIsGenModalOpen(true)
  }

  const handleGenerateProcessos = async () => {
    if (!selectedGroupForGen || !genCompetencia) return

    setIsGenerating(true)
    try {
      const competenceDate = parse(genCompetencia, "yyyy-MM", new Date())
      const competenceKey = format(competenceDate, "yyyy-MM")

      // 1. Verificar se já existem processos para este grupo e competência
      const processesQuery = query(
        collection(firestore, "processes"),
        where("groupId", "==", selectedGroupForGen.id),
        where("competenciaKey", "==", competenceKey)
      )
      const existing = await getDocs(processesQuery)
      
      if (!existing.empty) {
        if (!confirm(`Já existem processos gerados para ${format(competenceDate, 'MMMM/yyyy', { locale: ptBR })} neste grupo. Deseja regenerar? (Isso não apagará os existentes, criará novos)`)) {
          setIsGenerating(false)
          return
        }
      }

      // 2. Gerar processos para cada cliente vinculado
      const clientsToProcess = selectedGroupForGen.clientesVinculados || []
      let count = 0

      for (const clientId of clientsToProcess) {
        const client = (allClients || []).find(c => c.id === clientId)
        if (!client) continue

        // Gerar um processo para cada modelo vinculado ao grupo
        for (const modelRef of (selectedGroupForGen.processes || [])) {
          const model = (templates || []).find(t => t.id === modelRef.templateId)
          if (!model) continue

          const id = Math.random().toString(36).substr(2, 9)
          const day = parseInt(modelRef.dueDay) || 20
          let dueDate = setDate(competenceDate, day)
          
          const processData = {
            id,
            groupId: selectedGroupForGen.id,
            groupName: selectedGroupForGen.name,
            clienteId: client.id,
            nomeProcesso: modelRef.title || model.nome,
            situacao: "a_fazer",
            departamento: selectedGroupForGen.dept || "Fiscal",
            responsavelId: client.accountingContactUserId || "Geral",
            prazo: dueDate.toISOString(),
            competencia: competenceDate.toISOString(),
            competenciaKey: competenceKey,
            criadoEm: new Date().toISOString(),
            tarefas: (model.tarefas || []).map((t: any) => ({
              id: Math.random().toString(36).substr(2, 5),
              titulo: t.titulo,
              situacao: "a_fazer"
            }))
          }

          await setDoc(doc(firestore, "processes", id), processData)
          count++
        }
      }

      toast({ title: "Geração Concluída!", description: `${count} processos foram instanciados para ${clientsToProcess.length} clientes.` })
      setIsGenModalOpen(false)
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Erro na geração", description: "Houve uma falha técnica ao criar os processos." })
    } finally {
      setIsGenerating(false)
    }
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
        <div className="order-2 md:order-1">
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs shadow-lg" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" /> Novo Grupo
          </Button>
        </div>
        <div className="order-1 md:order-2 md:text-right">
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Grupos de Obrigações</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Automação de processos por perfil de cliente.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Sincronizando Grupos...</p>
        </div>
      ) : (groups || []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(groups || []).map((group: any) => {
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
                    </div>
                  </div>
                  
                  <div className="pt-2 flex flex-col gap-2 border-t border-[#F7F7F7]">
                    <Button 
                      className="bg-[#2C4156] hover:bg-[#2C4156]/90 gap-2 h-9 text-[10px] font-black uppercase shadow-sm"
                      onClick={() => handleOpenGenModal(group)}
                    >
                      <PlayCircle className="h-4 w-4" /> Gerar Processos
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase border-[#D2D7DB] gap-1 flex-1 text-[#2C4156]" onClick={() => handleOpenModal(group)}>
                        <Edit className="h-3 w-3" /> Gerenciar
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] hover:bg-[#E74C3C]/10" onClick={() => handleDeleteGroup(group.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
          <Button className="mt-6 bg-[#1FA67A] font-black uppercase text-xs shadow-lg" onClick={() => handleOpenModal()}>Criar Primeiro Grupo</Button>
        </div>
      )}

      {/* Modal de Gerenciamento do Grupo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                  {editingGroup ? `Grupo: ${formData.name}` : "Novo Grupo de Obrigações"}
                </DialogTitle>
                <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
                  Configure as regras e empresas vinculadas.
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
                <TabsTrigger value="config" className="data-[state=active]:bg-transparent data-[state=active]:text-[#1FA67A] data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none px-0 font-black uppercase text-[10px] tracking-widest">
                  Configurações
                </TabsTrigger>
                <TabsTrigger value="processos" className="data-[state=active]:bg-transparent data-[state=active]:text-[#1FA67A] data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none px-0 font-black uppercase text-[10px] tracking-widest">
                  Modelos de Tarefas
                </TabsTrigger>
                <TabsTrigger value="clientes" className="data-[state=active]:bg-transparent data-[state=active]:text-[#1FA67A] data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none px-0 font-black uppercase text-[10px] tracking-widest">
                  Clientes e Exceções
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="modal-scroll-content">
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
                      <Select value={formData.dept} onValueChange={(v) => setFormData({...formData, dept: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fiscal">Fiscal</SelectItem>
                          <SelectItem value="Pessoal">Pessoal</SelectItem>
                          <SelectItem value="Contábil">Contábil</SelectItem>
                          <SelectItem value="Legal">Legalização</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="processos" className="m-0 space-y-6">
                  <div className="bg-[#F7F7F7] p-5 rounded-2xl border border-[#D2D7DB] space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-6 space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Vincular Modelo</Label>
                        <Select value={newProcess.templateId} onValueChange={handleSelectTemplate}>
                          <SelectTrigger className="bg-white border-[#D2D7DB]">
                            <SelectValue placeholder="Selecione um modelo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(templates || []).map(t => (
                              <SelectItem key={t.id} value={t.id} className="font-bold uppercase text-xs">{t.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4 space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Vencimento (Dia)</Label>
                        <Input 
                          placeholder="Dia (ex: 20)" 
                          className="bg-white border-[#D2D7DB]" 
                          value={newProcess.dueDay} 
                          onChange={(e) => setNewProcess({...newProcess, dueDay: e.target.value})} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button className="w-full bg-[#2C4156]" onClick={addProcess}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(formData.processes || []).map((proc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D2D7DB]">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-[#1FA67A]" />
                            <div>
                              <span className="text-xs font-black text-[#2C4156] uppercase">{proc.title}</span>
                              <p className="text-[9px] font-bold text-[#98A7AA] uppercase">Dia {proc.dueDay}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]" onClick={() => removeProcess(proc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="clientes" className="m-0">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-4">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Empresas Vinculadas</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                        <Input 
                          placeholder="PESQUISAR VINCULADAS" 
                          className="pl-10 h-10 bg-[#F7F7F7]"
                          value={searchVinculadas}
                          onChange={(e) => setSearchVinculadas(e.target.value)}
                        />
                      </div>
                      <ScrollArea className="h-[400px] border rounded-2xl bg-white p-4">
                        <div className="space-y-3">
                          {vinculadasFiltradas.map(cliente => (
                            <div key={cliente.id} className="flex items-center justify-between p-3 border border-[#D2D7DB] rounded-xl">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-[#2C4156] text-white font-black text-xs">
                                    {cliente.corporateName?.substr(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-[#2C4156] uppercase">{cliente.corporateName}</span>
                                  <span className="text-[10px] font-mono text-[#98A7AA]">{cliente.cnpj}</span>
                                </div>
                              </div>
                              <button onClick={() => removerEmpresa(cliente.id)} className="h-8 w-8 text-[#E74C3C] text-xl font-bold">×</button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-[#F7F7F7] p-6 rounded-2xl border border-[#D2D7DB] space-y-4">
                        <Label className="text-[10px] font-black uppercase text-[#1FA67A]">Incluir Nova Empresa</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                          <Input 
                            placeholder="BUSCAR CLIENTE" 
                            className="pl-10 h-11 bg-white"
                            value={searchNova}
                            onChange={(e) => setSearchNova(e.target.value)}
                          />
                        </div>
                        <ScrollArea className="h-[350px] bg-white border rounded-xl">
                          <div className="p-2 space-y-1">
                            {disponiveis.map(cliente => (
                              <button
                                key={cliente.id}
                                onClick={() => adicionarEmpresa(cliente.id)}
                                className="w-full px-3 py-3 hover:bg-gray-50 rounded-lg text-left transition-all border border-transparent hover:border-[#D2D7DB]"
                              >
                                <p className="text-[10px] font-black text-[#2C4156] uppercase">{cliente.corporateName}</p>
                                <p className="text-[9px] font-mono text-[#98A7AA]">{cliente.cnpj}</p>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>

            <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
              <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-8 shadow-lg" onClick={handleSaveGroup}>
                <Save className="h-4 w-4 mr-2" /> Salvar Alterações do Grupo
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de Geração de Processos */}
      <Dialog open={isGenModalOpen} onOpenChange={setIsGenModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <div className="flex items-center gap-3">
              <RefreshCcw className="h-6 w-6 text-[#1FA67A]" />
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Gerar Processos do Mês</DialogTitle>
            </div>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Grupo: {selectedGroupForGen?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Competência / Mês de Referência</Label>
              <Input 
                type="month" 
                value={genCompetencia} 
                onChange={(e) => setGenCompetencia(e.target.value)}
                className="h-12 border-[#D2D7DB] font-bold text-xl text-[#2C4156]"
              />
            </div>

            <div className="bg-[#F7F7F7] p-4 rounded-xl border border-[#D2D7DB] space-y-2">
              <div className="flex items-center gap-2 text-[#2574A9]">
                <Building2 className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase">Abrangência</span>
              </div>
              <p className="text-xs font-bold text-[#39586D]">
                Esta ação criará tarefas para os {selectedGroupForGen?.clientesVinculados?.length || 0} clientes vinculados a este grupo.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
                O sistema clonará toda a estrutura de checklist e prazos definida nos modelos vinculados a este grupo.
              </p>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsGenModalOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
            <Button 
              className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-8 shadow-lg" 
              onClick={handleGenerateProcessos}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              Gerar Processos Agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TabTrigger({ value, label }: { value: string, label: string }) {
  return (
    <TabsTrigger 
      value={value} 
      className="data-[state=active]:bg-transparent data-[state=active]:text-[#1FA67A] data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none px-0 font-black uppercase text-[10px] tracking-widest shrink-0"
    >
      {label}
    </TabsTrigger>
  )
}
