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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Save, 
  Plus, 
  Trash2, 
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
  Layers,
  History
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
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

  const groupsQuery = useMemoFirebase(() => collection(firestore, "obligation_groups"), [firestore])
  const { data: dbGroups = [] } = useCollection(groupsQuery)

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "recorrente",
    departamento: "Fiscal",
    responsavelPadraoId: "Geral",
    groupIds: [] as string[],
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
        groupIds: model.groupIds || [],
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
        groupIds: [],
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
    
    // Garantir que todos os campos técnicos sejam salvos
    const finalData = {
      ...formData,
      id,
      updatedAt: new Date().toISOString(),
      prazoFixo: Number(formData.prazoFixo),
      dataGeracaoRecorrencia: Number(formData.dataGeracaoRecorrencia)
    }

    setDocumentNonBlocking(docRef, finalData, { merge: true })
    onOpenChange(false)
    toast({ title: model ? "Modelo Atualizado" : "Modelo Criado!" })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden flex flex-col border-none shadow-2xl">
        <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            {model ? `Editando: ${model.nome}` : "Novo Modelo de Inteligência"}
          </DialogTitle>
          <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
            Defina as regras de geração e execução para este fluxo de trabalho.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 bg-[#F7F7F7] border-b shrink-0">
            <TabsList className="bg-transparent h-14 p-0 gap-6 overflow-x-auto w-full justify-start scrollbar-hide">
              <TabTrigger value="geral" label="1. Geral" />
              <TabTrigger value="regimes" label="2. Grupos" />
              <TabTrigger value="prazo" label="3. Prazos" />
              <TabTrigger value="tarefas" label="4. Checklist" />
              {formData.tipo !== 'esporadico' && <TabTrigger value="recorrencia" label="5. Robô" />}
            </TabsList>
          </div>

          <div className="modal-scroll-content">
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
                      <RadioGroup value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})} className="flex gap-4">
                        <div className={cn("flex-1 flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer", formData.tipo === 'recorrente' ? "border-[#2563EB] bg-[#2563EB]/5" : "border-[#D2D7DB] bg-white")} onClick={() => setFormData({...formData, tipo: 'recorrente'})}>
                          <div className="flex items-center gap-3">
                            <Repeat className={cn("h-4 w-4", formData.tipo === 'recorrente' ? "text-[#2563EB]" : "text-[#98A7AA]")} />
                            <span className="text-xs font-black text-[#2C4156] uppercase">Recorrente</span>
                          </div>
                          <RadioGroupItem value="recorrente" id="tipo-rec" className="sr-only" />
                        </div>
                        <div className={cn("flex-1 flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer", formData.tipo === 'esporadico' ? "border-[#2574A9] bg-[#2574A9]/5" : "border-[#D2D7DB] bg-white")} onClick={() => setFormData({...formData, tipo: 'esporadico'})}>
                          <div className="flex items-center gap-3">
                            <Zap className={cn("h-4 w-4", formData.tipo === 'esporadico' ? "text-[#2574A9]" : "text-[#98A7AA]")} />
                            <span className="text-xs font-black text-[#2C4156] uppercase">Esporádico</span>
                          </div>
                          <RadioGroupItem value="esporadico" id="tipo-esp" className="sr-only" />
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Departamento Responsável</Label>
                      <Select value={formData.departamento} onValueChange={(v) => setFormData({...formData, departamento: v})}>
                        <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fiscal">Fiscal</SelectItem>
                          <SelectItem value="Pessoal">Pessoal</SelectItem>
                          <SelectItem value="Contábil">Contábil</SelectItem>
                          <SelectItem value="Legal">Legalização</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Descrição do Escopo</Label>
                      <Textarea value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="h-24 border-[#D2D7DB]" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="regimes" className="m-0 space-y-6">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 mb-6">
                  <Layers className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                    Este modelo será aplicado automaticamente a todos os clientes que pertencerem aos grupos selecionados abaixo.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dbGroups?.map((group: any) => (
                    <div 
                      key={group.id} 
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                        formData.groupIds.includes(group.id) ? "border-[#2563EB] bg-[#2563EB]/5" : "border-[#D2D7DB] bg-white hover:bg-[#F7F7F7]"
                      )} 
                      onClick={() => {
                        const ids = formData.groupIds.includes(group.id) 
                          ? formData.groupIds.filter(id => id !== group.id) 
                          : [...formData.groupIds, group.id]
                        setFormData({...formData, groupIds: ids})
                      }}
                    >
                      <Checkbox checked={formData.groupIds.includes(group.id)} className="h-5 w-5" />
                      <Label className="text-xs font-black uppercase cursor-pointer text-[#2C4156]">{group.name}</Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="prazo" className="m-0">
                <div className="bg-[#F7F7F7] p-8 rounded-2xl border space-y-8">
                  {formData.tipo === 'esporadico' ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <CalendarClock className="h-12 w-12 text-[#2563EB] mb-2" />
                      <div>
                        <h4 className="text-lg font-black text-[#2C4156] uppercase">Prazo Sob Demanda</h4>
                        <p className="text-xs font-bold text-[#98A7AA] mt-1">Neste tipo de fluxo, não há prazo fixo predefinido.</p>
                        <p className="text-[10px] font-black uppercase text-[#2563EB] tracking-wider mt-4">A data de vencimento será escolhida através do calendário ao instanciar o processo.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <Label className="text-sm font-black text-[#2C4156] uppercase flex items-center gap-2">
                          <CalendarClock className="h-5 w-5 text-[#2563EB]" /> Vencimento Fixo
                        </Label>
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#D2D7DB]">
                          <span className="text-xs font-bold text-[#98A7AA] uppercase">Todo dia</span>
                          <Input 
                            type="number" 
                            min="1" max="31" 
                            value={formData.prazoFixo} 
                            onChange={(e) => setFormData({...formData, prazoFixo: Number(e.target.value)})} 
                            className="w-24 font-black text-xl text-center border-none shadow-none focus-visible:ring-0" 
                          />
                        </div>
                        <p className="text-[10px] font-bold text-[#98A7AA] uppercase">A data de vencimento será calculada baseada na competência.</p>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-sm font-black text-[#2C4156] uppercase flex items-center gap-2">
                          <History className="h-5 w-5 text-[#2574A9]" /> Competência Relativa
                        </Label>
                        <Select value={formData.competencia} onValueChange={(v) => setFormData({...formData, competencia: v})}>
                          <SelectTrigger className="h-14 border-[#D2D7DB] bg-white font-bold text-[#2C4156] uppercase text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mes_anterior" className="font-bold">MÊS ANTERIOR (EX: FEVEREIRO REF. JANEIRO)</SelectItem>
                            <SelectItem value="mes_prazo" className="font-bold">MESMO MÊS (EX: FEVEREIRO REF. FEVEREIRO)</SelectItem>
                            <SelectItem value="mes_seguinte" className="font-bold">MÊS SEGUINTE (EX: FEVEREIRO REF. MARÇO)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tarefas" className="m-0 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-[#2C4156] uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-[#2563EB]" /> Etapas do Checklist
                  </h4>
                  <Button size="sm" className="bg-[#2C4156] gap-2 text-[10px] font-black uppercase h-9 shadow-md" onClick={addTarefa}>
                    <Plus className="h-4 w-4" /> Adicionar Etapa
                  </Button>
                </div>
                <div className="space-y-4">
                  {(formData.tarefas || []).map((tarefa, index) => (
                    <div key={tarefa.id} className="flex flex-col gap-4 p-5 bg-white border border-[#D2D7DB] rounded-2xl shadow-sm hover:border-[#2563EB] transition-all relative">
                      <div className="absolute top-5 left-[-12px] h-7 w-7 bg-[#2C4156] text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-lg">{index + 1}</div>
                      <div className="flex justify-between items-start pl-4">
                        <Input 
                          placeholder="Título da Tarefa (ex: Conferência de Notas)" 
                          className="border-none font-black text-[#2C4156] uppercase text-sm h-auto p-0 focus-visible:ring-0 shadow-none bg-transparent" 
                          value={tarefa.titulo} 
                          onChange={(e) => updateTarefa(tarefa.id, 'titulo', e.target.value)} 
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] hover:bg-red-50 rounded-full" onClick={() => removeTarefa(tarefa.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pl-4">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Responsabilidade</Label>
                          <Select value={tarefa.responsavelTipo} onValueChange={(v) => updateTarefa(tarefa.id, 'responsavelTipo', v)}>
                            <SelectTrigger className="h-9 border-[#D2D7DB] text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="responsavel_cliente" className="text-[10px] font-bold">RESP. CLIENTE</SelectItem>
                              <SelectItem value="departamento" className="text-[10px] font-bold">DEPARTAMENTO</SelectItem>
                              <SelectItem value="qualquer" className="text-[10px] font-bold">QUALQUER UM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Meta Interna (Dias)</Label>
                          <Input type="number" className="h-9 text-center font-black" value={tarefa.prazoMeta} onChange={(e) => updateTarefa(tarefa.id, 'prazoMeta', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Prioridade</Label>
                          <Select value={tarefa.prioridade} onValueChange={(v) => updateTarefa(tarefa.id, 'prioridade', v)}>
                            <SelectTrigger className="h-9 border-[#D2D7DB] text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baixa">BAIXA</SelectItem>
                              <SelectItem value="normal">NORMAL</SelectItem>
                              <SelectItem value="alta">ALTA</SelectItem>
                              <SelectItem value="urgente">URGENTE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Checkbox checked={tarefa.requerDocumento} onCheckedChange={(v) => updateTarefa(tarefa.id, 'requerDocumento', v)} id={`doc-${tarefa.id}`} />
                          <Label htmlFor={`doc-${tarefa.id}`} className="text-[10px] font-black uppercase cursor-pointer">Anexo Obrigatório</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recorrencia" className="m-0">
                <div className="bg-[#2C4156] text-white p-10 rounded-[2rem] space-y-10 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-[#2563EB]/20 rounded-full blur-[80px]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-2xl font-black uppercase tracking-tight">Status do Robô Prosperare</h4>
                      <p className="text-white/60 font-bold text-xs uppercase tracking-widest mt-1">O sistema instanciará este processo automaticamente.</p>
                    </div>
                    <Switch 
                      checked={formData.ativo} 
                      onCheckedChange={(v) => setFormData({...formData, ativo: !!v})} 
                      className="data-[state=checked]:bg-[#2563EB]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-white/10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-2">
                        <RefreshCcw className="h-4 w-4 text-[#2563EB]" /> Frequência de Geração
                      </Label>
                      <Select value={formData.recorrencia} onValueChange={(v) => setFormData({...formData, recorrencia: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-14 font-black text-white text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensal">MENSAL</SelectItem>
                          <SelectItem value="bimestral">BIMESTRAL</SelectItem>
                          <SelectItem value="trimestral">TRIMESTRAL</SelectItem>
                          <SelectItem value="anual">ANUAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#2563EB]" /> Dia do Mês (Gatilho)
                      </Label>
                      <Input 
                        type="number" min="1" max="31" 
                        className="bg-white/5 border-white/10 h-14 font-black text-3xl text-center text-[#2563EB]" 
                        value={formData.dataGeracaoRecorrencia} 
                        onChange={(e) => setFormData({...formData, dataGeracaoRecorrencia: Number(e.target.value)})} 
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold uppercase text-xs border-[#D2D7DB]">Cancelar</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-10 shadow-lg shadow-blue-500/20" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> {model ? "Salvar Inteligência" : "Gerar Estrutura de Fluxo"}
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
      className="data-[state=active]:bg-transparent data-[state=active]:text-[#2563EB] data-[state=active]:border-b-2 data-[state=active]:border-[#2563EB] rounded-none px-0 font-black uppercase text-[10px] tracking-widest shrink-0"
    >
      {label}
    </TabsTrigger>
  )
}