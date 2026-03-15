
"use client"

import { useState, useEffect } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { 
  Plus,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Tag,
  UserCircle,
  X,
  Check,
  DollarSign,
  ListRestart
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const AVAILABLE_TAGS = [
  { name: 'AGUARDANDO RETORNO...', color: 'bg-[#F2B705] text-white' },
  { name: 'MALHA FISCAL', color: 'bg-[#E74C3C] text-white' },
  { name: 'NÃO PAGO', color: 'bg-[#A569BD] text-white' },
  { name: 'FINALIZADO!', color: 'bg-[#3498DB] text-white' },
  { name: 'PAGO', color: 'bg-[#2E86C1] text-white' },
  { name: '2 FATORES', color: 'bg-[#5DADE2] text-white' },
  { name: 'EM PROCESSAMENTO', color: 'bg-[#1FA67A] text-white' },
  { name: 'GOV', color: 'bg-[#566573] text-white' },
]

const DEFAULT_STAGES = [
  { id: 'not_started', title: '⚪ NÃO INICIADO' },
  { id: 'filling', title: '⚙️ EM PREENCHIMENTO' },
  { id: 'awaiting_production', title: '⏳ AGUARDANDO PRODUÇÃO' },
  { id: 'sent', title: '📤 ENVIADO RFB' },
  { id: 'completed', title: '✅ CONCLUIDA' },
]

export function IrpfDetailsDrawer({ open, onOpenChange, declaration }: any) {
  const firestore = useFirestore()
  const [showGovPass, setShowGovPass] = useState(false)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [serviceValue, setServiceValue] = useState(0)
  const [isPaid, setIsPaid] = useState(false)
  const [localData, setLocalData] = useState({ name: "", cpf: "", govPass: "" })

  // Busca estágios reais para o seletor
  const stagesQuery = useMemoFirebase(() => query(collection(firestore, "irpf_stages"), orderBy("order", "asc")), [firestore])
  const { data: dbStages } = useCollection(stagesQuery)
  const availableStages = (dbStages && dbStages.length > 0) ? dbStages : DEFAULT_STAGES

  useEffect(() => {
    if (declaration) {
      setActiveTags(declaration.tags || [])
      setServiceValue(declaration.value || 0)
      setIsPaid(declaration.isPaid || false)
      setLocalData({
        name: declaration.name || "",
        cpf: declaration.cpf || "",
        govPass: declaration.govPass || ""
      })
    }
  }, [declaration, open])

  if (!declaration) return null

  const handleUpdate = (data: any) => {
    const docRef = doc(firestore, "irpf_declarations", declaration.id)
    updateDocumentNonBlocking(docRef, data)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`
    })
  }

  const toggleTag = (tagName: string) => {
    const newTags = activeTags.includes(tagName)
      ? activeTags.filter(t => t !== tagName)
      : [...activeTags, tagName]
    
    setActiveTags(newTags)
    handleUpdate({ tags: newTags })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[700px] p-0 flex flex-col border-l-[#D2D7DB] overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#172B4D] rounded-full flex items-center justify-center shrink-0">
                    <UserCircle className="h-5 w-5 text-[#172B4D]" />
                  </div>
                  <SheetTitle className="text-2xl font-black text-[#172B4D] leading-tight">Ficha do Contribuinte</SheetTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider">Nome Completo</Label>
                  <Input 
                    value={localData.name} 
                    onChange={(e) => setLocalData({...localData, name: e.target.value})}
                    onBlur={() => handleUpdate({ name: localData.name })}
                    className="border-[#D2D7DB] font-bold text-[#172B4D]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider">CPF</Label>
                    <Input 
                      value={localData.cpf} 
                      onChange={(e) => setLocalData({...localData, cpf: e.target.value})}
                      onBlur={() => handleUpdate({ cpf: localData.cpf })}
                      className="border-[#D2D7DB] font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider">Etapa do Fluxo</Label>
                    <Select 
                      value={declaration.status} 
                      onValueChange={(v) => handleUpdate({ status: v })}
                    >
                      <SelectTrigger className="border-[#D2D7DB] font-black text-[#172B4D] uppercase text-[10px]">
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStages.map((stage: any) => (
                          <SelectItem key={stage.id} value={stage.id} className="text-[10px] font-black uppercase">
                            {stage.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-[#5E6C84] uppercase tracking-wider">Etiquetas</Label>
                <div className="flex flex-wrap gap-2 items-center">
                  {activeTags.map((tagName: string) => {
                    const tag = AVAILABLE_TAGS.find(t => t.name === tagName)
                    return (
                      <Badge 
                        key={tagName} 
                        className={cn(
                          "px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wide shadow-sm border-none cursor-pointer hover:brightness-90",
                          tag?.color || "bg-slate-400 text-white"
                        )}
                        onClick={() => toggleTag(tagName)}
                      >
                        {tagName}
                      </Badge>
                    )
                  })}
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="h-8 w-8 rounded bg-[#EBEDF0] hover:bg-[#D2D7DB] flex items-center justify-center transition-colors shadow-sm">
                        <Plus className="h-4 w-4 text-[#172B4D]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 bg-white border-[#D2D7DB] shadow-2xl" align="start">
                      <div className="p-3 border-b flex items-center justify-between bg-[#F4F5F7]">
                        <span className="text-xs font-bold text-[#5E6C84] uppercase text-center w-full">Etiquetas Sugeridas</span>
                      </div>
                      <div className="p-3 space-y-1 max-h-[300px] overflow-y-auto">
                        {AVAILABLE_TAGS.map((tag) => (
                          <div key={tag.name} className="flex items-center gap-2 group">
                            <Checkbox 
                              checked={activeTags.includes(tag.name)} 
                              onCheckedChange={() => toggleTag(tag.name)}
                              id={`tag-${tag.name}`}
                              className="h-4 w-4 rounded border-[#D2D7DB]"
                            />
                            <button
                              onClick={() => toggleTag(tag.name)}
                              className={cn(
                                "flex-1 flex items-center justify-between px-3 py-2 rounded text-[10px] font-black uppercase tracking-wide transition-all hover:brightness-90",
                                tag.color
                              )}
                            >
                              {tag.name}
                              {activeTags.includes(tag.name) && <Check className="h-3 w-3" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-black text-[#5E6C84] uppercase tracking-wider">Senha GOV.BR</Label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#F4F5F7] border border-[#D2D7DB] rounded p-2 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold truncate pr-2">{showGovPass ? localData.govPass : '••••••••'}</span>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setShowGovPass(!showGovPass)} className="text-[#5E6C84]">
                        {showGovPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <button onClick={() => copyToClipboard(localData.govPass, "Senha")} className="text-[#5E6C84]">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#F4F5F7] p-6 rounded-2xl border">
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-[#5E6C84] uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-3 w-3" /> Valor do Serviço
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5E6C84]">R$</span>
                  <Input 
                    type="number" 
                    className="pl-9 bg-white border-[#D2D7DB] font-black text-[#172B4D]" 
                    value={serviceValue}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setServiceValue(val)
                      handleUpdate({ value: val })
                    }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-[#5E6C84] uppercase tracking-wider">Status do Pagamento</Label>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-[#D2D7DB]">
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    isPaid ? "text-[#1FA67A]" : "text-[#E74C3C]"
                  )}>
                    {isPaid ? "Pago" : "Pendente"}
                  </span>
                  <Switch checked={isPaid} onCheckedChange={(v) => { setIsPaid(v); handleUpdate({ isPaid: v }); }} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-[#172B4D] uppercase tracking-widest flex items-center gap-2">
                <div className="w-1 h-4 bg-[#1FA67A] rounded-full" />
                Anotações e Progresso
              </h4>
              <div className="bg-[#F4F5F7] p-4 rounded-xl border border-[#D2D7DB] space-y-3">
                <Textarea 
                  placeholder="Escreva aqui detalhes sobre a movimentação, pendências ou dúvidas com o cliente..." 
                  className="bg-white border-[#D2D7DB] text-sm h-32"
                  value={declaration.notes || ""}
                  onChange={(e) => handleUpdate({ notes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-[#5E6C84] uppercase tracking-widest">
                  <span>Progresso Geral</span>
                  <span>{declaration.progress || 0}%</span>
                </div>
                <Progress value={declaration.progress || 0} className="h-2 bg-[#F4F5F7]" />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-[#F4F5F7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-[#172B4D] text-white text-[10px] font-black">R</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#5E6C84] uppercase tracking-widest">Responsável</span>
              <span className="text-xs font-bold text-[#172B4D]">Você</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="h-9 bg-[#1FA67A] font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-500/20" onClick={() => handleUpdate({ status: 'completed', progress: 100 })}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar Processo
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
