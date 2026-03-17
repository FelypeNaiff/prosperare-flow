
"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Save, 
  Plus, 
  Trash2, 
  GripVertical, 
  Users, 
  Clock, 
  ClipboardList, 
  RefreshCcw,
  Search,
  X,
  FileText,
  CalendarClock,
  CheckCircle2,
  Zap,
  Repeat,
  User
} from "lucide-react"
import { useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function ProcessModelModal({ open, onOpenChange, model }: any) {
  const firestore = useFirestore()
  const [activeTab, setActiveTab] = useState("geral")
  const [searchTerm, setSearchTerm] = useState("")

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: allClients } = useCollection(clientsQuery)

  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: team = [] } = useCollection(usersQuery)

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "recorrente",
    departamento: "Fiscal",
    responsavelPadraoId: "Geral",
    regimes: [] as string[],
    dataGeracaoRecorrencia: 1,
    recorrencia: "mensal",
    prazoFixo: 20,
    competencia: "mes_anterior",
    tarefas: [] as any[],
    clientesVinculados: [] as string[],
    clientesExcluidos: [] as string[],
    ativo: true
  })

  useEffect(() => {
    if (model) {
      setFormData({
        ...formData,
        ...model,
        tarefas: model.tarefas || [],
        regimes: model.regimes || [],
        clientesVinculados: model.clientesVinculados || [],
        clientesExcluidos: model.clientesExcluidos || []
      })
    } else {
      setFormData({
        nome: "",
        descricao: "",
        tipo: "recorrente",
        departamento: "Fiscal",
        responsavelPadraoId: "Geral",
        regimes: [],
        dataGeracaoRecorrencia: 1,
        recorrencia: "mensal",
        prazoFixo: 20,
        competencia: "mes_anterior",
        tarefas: [],
        clientesVinculados: [],
        clientesExcluidos: [],
        ativo: true
      })
    }
  }, [model, open])

  const handleSave = () => {
    if (!formData.nome) {
      toast({ title: "Nome do modelo é obrigatório", variant: "destructive" })
      return
    }
    const id = model?.id || Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "processoModelos", id)
    setDocumentNonBlocking(docRef, { ...formData, id, updatedAt: new Date().toISOString() }, { merge: true })
    onOpenChange(false)
    toast({ title: model ? "Modelo Atualizado" : "Modelo Criado!" })
  }

  const toggleRegime = (regime: string) => {
    setFormData(prev => ({
      ...prev,
      regimes: prev.regimes.includes(regime) 
        ? prev.regimes.filter(r => r !== regime) 
        : [...prev.regimes, regime]
    }))
  }

  const addTarefa = () => {
    setFormData(prev => ({
      ...prev,
      tarefas: [...(prev.tarefas || []), {
        id: Math.random().toString(36).substr(2, 5),
        titulo: "",
        descricao: "",
        departamento: prev.departamento,
        responsavelTipo: "responsavel_cliente",
        prioridade: "normal",
        prazoTarefa: 20,
        prazoMeta: 2,
        requerDocumento: false
      }]
    }))
  }

  const removeTarefa = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tarefas: (prev.tarefas || []).filter(t => t.id !== id)
    }))
  }

  const updateTarefa = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tarefas: (prev.tarefas || []).map(t => t.id === id ? { ...t, [field]: value } : t)
    }))
  }

  const filteredClients = (allClients || []).filter(c => {
    const regimes = formData.regimes || []
    const snMatch = regimes.includes('sn') && c.taxRegime === 'Simples Nacional'
    const meiMatch = regimes.includes('mei') && c.taxRegime === 'MEI'
    const lpMatch = regimes.includes('lp') && c.taxRegime === 'Lucro Presumido'
    const lrMatch = regimes.includes('lr') && c.taxRegime === 'Lucro Real'
    const allMatch = regimes.length === 0 || regimes.includes('todos')
    
    return (snMatch || meiMatch || lpMatch || lrMatch || allMatch) && 
           (c.corporateName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj?.includes(searchTerm))
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col border-none shadow-2xl">
        <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            {model ? `Editando: ${model.nome}` : "Novo Modelo de Inteligência"}
          </DialogTitle>
          <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
            Defina as regras de geração e execução para este fluxo de trabalho.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 bg-[#F7F7F7] border-b">
            <TabsList className="bg-transparent h-14 p-0 gap-6 overflow-x-auto w-full justify-start scrollbar-hide">
              <TabTrigger value="geral" label="1. Geral" />
              <TabTrigger value="regimes" label="2. Regimes" />
              <TabTrigger value="clientes" label="3. Clientes" />
              <TabTrigger value="prazo" label="4. Prazo" />
              <TabTrigger value="tarefas" label="5. Tarefas" />
              <TabTrigger value="recorrencia" label="6. Recorrência" />
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-8">
              <TabsContent value="geral" className="m-0 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Nome do Processo</Label>
                      <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value.toUpperCase()})} className="font-bold border-[#D2D7DB]" placeholder="Ex: PGDAS MENSAL" />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Tipo de Fluxo</Label>
                      <RadioGroup 
                        value={formData.tipo} 
                        onValueChange={(v) => setFormData({...formData, tipo: v})}
                        className="flex gap-4"
                      >
                        <div className={cn(
                          "flex-1 flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                          formData.tipo === 'recorrente' ? "border-[#1FA67A] bg-[#1FA67A]/5" : "border-[#D2D7DB] bg-white"
                        )} onClick={() => setFormData({...formData, tipo: 'recorrente'})}>
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", formData.tipo === 'recorrente' ? "bg-[#1FA67A] text-white" : "bg-[#F7F7F7] text-[#98A7AA]")}>
                              <Repeat className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-black text-[#2C4156] uppercase">Recorrente</span>
                              <span className="text-[9px] font-bold text-[#98A7AA]">Geração Automática</span>
                            </div>
                          </div>
                          <RadioGroupItem value="recorrente" id="tipo-rec" className="sr-only" />
                        </div>

                        <div className={cn(
                          "flex-1 flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                          formData.tipo === 'esporadico' ? "border-[#2574A9] bg-[#2574A9]/5" : "border-[#D2D7DB] bg-white"
                        )} onClick={() => setFormData({...formData, tipo: 'esporadico'})}>
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", formData.tipo === 'esporadico' ? "bg-[#2574A9] text-white" : "bg-[#F7F7F7] text-[#98A7AA]")}>
                              <Zap className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-black text-[#2C4156] uppercase">Esporádico</span>
                              <span className="text-[9px] font-bold text-[#98A7AA]">Geração Manual</span>
                            </div>
                          </div>
                          <RadioGroupItem value="esporadico" id="tipo-esp" className="sr-only" />
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Departamento Responsável</Label>
                        <Select value={formData.departamento} onValueChange={(v) => setFormData({...formData, departamento: v})}>
                          <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fiscal">Fiscal</SelectItem>
                            <SelectItem value="Pessoal">Departamento Pessoal</SelectItem>
                            <SelectItem value="Contábil">Contábil</SelectItem>
                            <SelectItem value="Legal">Legalização</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Responsável Padrão</Label>
                        <Select value={formData.responsavelPadraoId} onValueChange={(v) => setFormData({...formData, responsavelPadraoId: v})}>
                          <SelectTrigger className="border-[#D2D7DB] font-bold">
                            <SelectValue placeholder="Escolher..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Geral" className="font-bold">GERAL / CLIENTE</SelectItem>
                            {team?.map(u => (
                              <SelectItem key={u.id} value={u.fullName} className="font-medium uppercase">{u.fullName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Descrição do Escopo</Label>
                      <Textarea value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="h-24 border-[#D2D7DB]" placeholder="Descreva os detalhes deste processo para a equipe..." />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="regimes" className="m-0 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <RegimeCheck id="sn" label="Simples Nacional" checked={(formData.regimes || []).includes('sn')} onToggle={() => toggleRegime('sn')} />
                  <RegimeCheck id="mei" label="MEI" checked={(formData.regimes || []).includes('mei')} onToggle={() => toggleRegime('mei')} />
                  <RegimeCheck id="lp" label="Lucro Presumido" checked={(formData.regimes || []).includes('lp')} onToggle={() => toggleRegime('lp')} />
                  <RegimeCheck id="lr" label="Lucro Real" checked={(formData.regimes || []).includes('lr')} onToggle={() => toggleRegime('lr')} />
                  <RegimeCheck id="imune" label="Imune/Isenta" checked={(formData.regimes || []).includes('imune')} onToggle={() => toggleRegime('imune')} />
                  <RegimeCheck id="todos" label="Todos os Regimes" checked={(formData.regimes || []).includes('todos')} onToggle={() => toggleRegime('todos')} />
                </div>
              </TabsContent>

              <TabsContent value="clientes" className="m-0 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                    <Input placeholder="Buscar clientes sugeridos pelo regime..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <Badge className="bg-[#1FA67A] font-black text-[10px] px-4 py-1.5 uppercase shrink-0 border-none">
                    {(formData.clientesVinculados || []).length} Selecionados
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredClients.map((client) => {
                    const isSelected = (formData.clientesVinculados || []).includes(client.id)
                    return (
                      <div 
                        key={client.id} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                          isSelected ? "border-[#1FA67A] bg-[#1FA67A]/5" : "border-[#D2D7DB] bg-white hover:bg-[#F7F7F7]"
                        )}
                        onClick={() => {
                          const currentLinked = formData.clientesVinculados || []
                          const newLinked = isSelected 
                            ? currentLinked.filter(id => id !== client.id)
                            : [...currentLinked, client.id]
                          setFormData({...formData, clientesVinculados: newLinked})
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarFallback className="bg-[#2C4156] text-white text-[10px] font-black">{client.corporateName?.substr(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-[#2C4156] uppercase leading-none">{client.corporateName}</span>
                            <span className="text-[9px] font-mono text-[#98A7AA]">{client.cnpj}</span>
                          </div>
                        </div>
                        {isSelected ? <CheckCircle2 className="h-4 w-4 text-[#1FA67A]" /> : <div className="h-4 w-4 rounded-full border border-[#D2D7DB]" />}
                      </div>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="prazo" className="m-0 space-y-8">
                <div className="bg-[#F7F7F7] p-6 rounded-2xl border space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-sm font-black text-[#2C4156] uppercase">Vencimento Fixo</Label>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#98A7AA] uppercase">Todo dia</span>
                        <Input type="number" min="1" max="31" value={formData.prazoFixo} onChange={(e) => setFormData({...formData, prazoFixo: Number(e.target.value)})} className="w-20 font-black text-center" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-black text-[#2C4156] uppercase">Competência</Label>
                      <Select value={formData.competencia} onValueChange={(v) => setFormData({...formData, competencia: v})}>
                        <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                          <SelectItem value="mes_prazo">Mesmo Mês do Prazo</SelectItem>
                          <SelectItem value="mes_seguinte">Mês Seguinte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tarefas" className="m-0 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-[#2C4156] uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-[#1FA67A]" /> Checklist do Modelo
                  </h4>
                  <Button size="sm" className="bg-[#2C4156] gap-2 text-[10px] font-black uppercase h-8" onClick={addTarefa}>
                    <Plus className="h-3 w-3" /> Adicionar Etapa
                  </Button>
                </div>
                <div className="space-y-3">
                  {(formData.tarefas || []).map((tarefa, index) => (
                    <div key={tarefa.id} className="flex flex-col gap-3 p-4 bg-white border border-[#D2D7DB] rounded-2xl shadow-sm hover:border-[#1FA67A] transition-all relative group">
                      <div className="absolute top-4 left-[-10px] h-6 w-6 bg-[#2C4156] text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex justify-between items-start pl-4">
                        <Input 
                          placeholder="Título da Tarefa..." 
                          className="border-none font-black text-[#2C4156] uppercase text-sm h-auto p-0 focus-visible:ring-0 shadow-none" 
                          value={tarefa.titulo}
                          onChange={(e) => updateTarefa(tarefa.id, 'titulo', e.target.value)}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]" onClick={() => removeTarefa(tarefa.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pl-4">
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-[#98A7AA]">Responsável</Label>
                          <Select value={tarefa.responsavelTipo} onValueChange={(v) => updateTarefa(tarefa.id, 'responsavelTipo', v)}>
                            <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="responsavel_cliente">Resp. pelo Cliente</SelectItem>
                              <SelectItem value="usuario_fixo">Usuário Fixo</SelectItem>
                              <SelectItem value="qualquer">Qualquer Colaborador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-[#98A7AA]">Meta Interna (Dias Antes)</Label>
                          <Input type="number" className="h-8 text-center text-[10px]" value={tarefa.prazoMeta} onChange={(e) => updateTarefa(tarefa.id, 'prazoMeta', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[8px] font-black uppercase text-[#98A7AA]">Prioridade</Label>
                          <Select value={tarefa.prioridade} onValueChange={(v) => updateTarefa(tarefa.id, 'prioridade', v)}>
                            <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baixa">Baixa</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="urgente">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                          <Checkbox checked={tarefa.requerDocumento} onCheckedChange={(v) => updateTarefa(tarefa.id, 'requerDocumento', v)} id={`doc-${tarefa.id}`} />
                          <Label htmlFor={`doc-${tarefa.id}`} className="text-[10px] font-black uppercase cursor-pointer">Exigir Documento</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recorrencia" className="m-0 space-y-6">
                {formData.tipo === 'recorrente' ? (
                  <div className="bg-[#2C4156] text-white p-8 rounded-3xl space-y-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-[-20px] right-[-20px] w-48 h-48 bg-[#1FA67A]/20 rounded-full blur-3xl" />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Status do Robô de Geração</h4>
                        <p className="text-white/60 font-bold text-xs uppercase tracking-widest">O sistema criará os processos automaticamente.</p>
                      </div>
                      <Checkbox className="h-8 w-8 rounded-xl border-white/20 data-[state=checked]:bg-[#1FA67A] data-[state=checked]:border-[#1FA67A]" checked={formData.ativo} onCheckedChange={(v) => setFormData({...formData, ativo: !!v})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/10">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-2">
                          <RefreshCcw className="h-3 w-3 text-[#1FA67A]" /> Frequência de Geração
                        </Label>
                        <Select value={formData.recorrencia} onValueChange={(v) => setFormData({...formData, recorrencia: v})}>
                          <SelectTrigger className="bg-white/5 border-white/10 h-12 font-bold text-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="bimestral">Bimestral</SelectItem>
                            <SelectItem value="trimestral">Trimestral</SelectItem>
                            <SelectItem value="semestral">Semestral</SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-2">
                          <Clock className="h-3 w-3 text-[#1FA67A]" /> Dia do Mês para Criar
                        </Label>
                        <Input type="number" min="1" max="31" className="bg-white/5 border-white/10 h-12 font-black text-xl text-center text-white" value={formData.dataGeracaoRecorrencia} onChange={(e) => setFormData({...formData, dataGeracaoRecorrencia: Number(e.target.value)})} />
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                      <CalendarClock className="h-8 w-8 text-[#1FA67A]" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Previsão</p>
                        <p className="text-sm font-black text-white">Próxima geração: {formData.dataGeracaoRecorrencia}/{new Date().getMonth() + 2}/{new Date().getFullYear()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl text-center p-12 space-y-4">
                    <Zap className="h-12 w-12 text-[#98A7AA] opacity-20" />
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-[#2C4156] uppercase">Modelo Esporádico</h4>
                      <p className="text-sm text-[#98A7AA] font-bold max-w-sm">Este fluxo não possui recorrência automática. Ele deve ser instanciado manualmente quando necessário.</p>
                    </div>
                    <Button variant="outline" className="border-[#D2D7DB] font-black text-[10px] uppercase" onClick={() => setFormData({...formData, tipo: 'recorrente'})}>
                      <RefreshCcw className="h-3 w-3 mr-2" /> Mudar para Recorrente
                    </Button>
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold uppercase text-xs border-[#D2D7DB]">Cancelar</Button>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-10 shadow-lg shadow-emerald-500/20" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> {model ? "Salvar Inteligência" : "Gerar Estrutura"}
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
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

function RegimeCheck({ id, label, checked, onToggle }: any) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
        checked ? "border-[#1FA67A] bg-[#1FA67A]/5" : "border-[#D2D7DB] bg-white hover:bg-[#F7F7F7]"
      )}
      onClick={onToggle}
    >
      <Checkbox checked={checked} onCheckedChange={onToggle} id={id} className="h-5 w-5 rounded-lg border-[#D2D7DB]" />
      <Label htmlFor={id} className="text-[10px] font-black uppercase cursor-pointer text-[#2C4156]">{label}</Label>
    </div>
  )
}
