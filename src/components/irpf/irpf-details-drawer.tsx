
"use client"

import { useState } from "react"
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
  MessageSquare, 
  History as HistoryIcon, 
  Info,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  FileText,
  Upload,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Settings2,
  Tag,
  Calendar,
  UserCircle,
  Paperclip,
  X,
  Search,
  Check,
  Edit2,
  DollarSign
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, formatCurrency } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

const CHECKLIST = [
  { group: 'Documentos Obrigatórios', items: [
    'Informe de rendimentos do empregador',
    'Informe de rendimentos bancários',
    'Comprovante de CPF',
    'Comprovante de residência',
    'Título de eleitor',
  ]},
  { group: 'Deduções', items: [
    'Recibos médicos / odontológicos',
    'Recibos de plano de saúde',
    'Comprovante de dependentes',
  ]},
  { group: 'Bens e Direitos', items: [
    'Escritura / contrato de imóveis',
    'Documentação de veículos (CRLV)',
  ]}
]

const AVAILABLE_TAGS = [
  { name: 'AGUARDANDO RETORNO...', color: 'bg-[#F2B705]' },
  { name: 'MALHA FISCAL', color: 'bg-[#E74C3C]' },
  { name: 'NÃO PAGO', color: 'bg-[#A569BD]' },
  { name: 'FINALIZADO!', color: 'bg-[#3498DB]' },
  { name: 'PAGO', color: 'bg-[#2E86C1]' },
  { name: '2 FATORES', color: 'bg-[#5DADE2]' },
  { name: 'EM PROCESSAMENTO', color: 'bg-[#1FA67A]' },
  { name: 'GOV', color: 'bg-[#566573]' },
]

export function IrpfDetailsDrawer({ open, onOpenChange, declaration }: any) {
  const [showGovPass, setShowGovPass] = useState(false)
  const [activeTags, setActiveTags] = useState<string[]>(declaration?.tags || [])
  const [newComment, setNewComment] = useState("")
  const [serviceValue, setServiceValue] = useState(declaration?.value || 0)
  const [isPaid, setIsPaid] = useState(declaration?.isPaid || false)

  if (!declaration) return null

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`
    })
  }

  const toggleTag = (tagName: string) => {
    if (activeTags.includes(tagName)) {
      setActiveTags(activeTags.filter(t => t !== tagName))
    } else {
      setActiveTags([...activeTags, tagName])
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[700px] p-0 flex flex-col border-l-[#D2D7DB]">
        <ScrollArea className="flex-1">
          <div className="p-8 space-y-8">
            {/* Header com Nome e Ações Rápidas */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#172B4D] rounded-full flex items-center justify-center">
                  <UserCircle className="h-4 w-4 text-[#172B4D]" />
                </div>
                <SheetTitle className="text-2xl font-black text-[#172B4D]">{declaration.name}</SheetTitle>
              </div>

              <div className="flex flex-wrap gap-2">
                <HeaderAction icon={Plus} label="Adicionar" />
                <HeaderAction icon={Calendar} label="Datas" />
                <HeaderAction icon={CheckCircle2} label="Checklist" />
                <HeaderAction icon={UserCircle} label="Membros" />
                <HeaderAction icon={Paperclip} label="Anexo" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Etiquetas Estilo Trello */}
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-[#5E6C84] uppercase tracking-wider">Etiquetas</Label>
                <div className="flex flex-wrap gap-2 items-center">
                  {activeTags.map((tagName: string) => {
                    const tag = AVAILABLE_TAGS.find(t => t.name === tagName)
                    return (
                      <div 
                        key={tagName} 
                        className={cn(
                          "px-3 py-1.5 rounded text-[11px] font-black text-white uppercase tracking-wide shadow-sm min-w-[40px] text-center",
                          tag?.color || "bg-slate-400"
                        )}
                      >
                        {tagName}
                      </div>
                    )
                  })}
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="h-8 w-8 rounded bg-[#EBEDF0] hover:bg-[#D2D7DB] flex items-center justify-center transition-colors">
                        <Plus className="h-4 w-4 text-[#172B4D]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 bg-white border-[#D2D7DB] shadow-2xl" align="start">
                      <div className="p-3 border-b flex items-center justify-between bg-[#F4F5F7]">
                        <span className="text-xs font-bold text-[#5E6C84] uppercase text-center w-full">Etiquetas</span>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><X className="h-3 w-3" /></Button>
                        </PopoverTrigger>
                      </div>
                      <div className="p-3 space-y-3">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-3 w-3 text-[#5E6C84]" />
                          <Input placeholder="Buscar etiquetas..." className="pl-7 h-8 text-xs bg-[#F4F5F7] border-none" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-[#5E6C84] uppercase tracking-widest">Etiquetas</p>
                          <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                            {AVAILABLE_TAGS.map((tag) => (
                              <div key={tag.name} className="flex items-center gap-2 group">
                                <Checkbox 
                                  checked={activeTags.includes(tag.name)} 
                                  onCheckedChange={() => toggleTag(tag.name)}
                                  className="h-4 w-4 rounded border-[#D2D7DB]"
                                />
                                <button
                                  onClick={() => toggleTag(tag.name)}
                                  className={cn(
                                    "flex-1 flex items-center justify-between px-3 py-2 rounded text-[11px] font-black text-white uppercase tracking-wide transition-all hover:brightness-90",
                                    tag.color
                                  )}
                                >
                                  {tag.name}
                                  {activeTags.includes(tag.name) && <Check className="h-3 w-3" />}
                                </button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#5E6C84] opacity-0 group-hover:opacity-100">
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button variant="secondary" className="w-full h-8 text-xs font-bold bg-[#EBEDF0] hover:bg-[#D2D7DB] text-[#172B4D]">
                          Criar uma nova etiqueta
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Informações de Acesso */}
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-[#5E6C84] uppercase tracking-wider">Acesso GOV.BR</Label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#F4F5F7] border border-[#D2D7DB] rounded p-2 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold">{declaration.cpf}</span>
                    <button onClick={() => copyToClipboard(declaration.cpf, "CPF")} className="text-[#5E6C84] hover:text-[#172B4D]">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 bg-[#F4F5F7] border border-[#D2D7DB] rounded p-2 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold">{showGovPass ? declaration.govPass : '••••••••'}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setShowGovPass(!showGovPass)} className="text-[#5E6C84]">
                        {showGovPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <button onClick={() => copyToClipboard(declaration.govPass, "Senha")} className="text-[#5E6C84]">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Controle Financeiro */}
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
                    onChange={(e) => setServiceValue(Number(e.target.value))}
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
                  <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                </div>
              </div>
            </div>

            <Tabs defaultValue="checklist" className="space-y-6">
              <TabsList className="bg-[#EBEDF0] h-10 p-1 gap-1">
                <TabsTrigger value="checklist" className="data-[state=active]:bg-white font-bold text-xs uppercase px-6">Checklist</TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:bg-white font-bold text-xs uppercase px-6">Histórico & Movimentação</TabsTrigger>
              </TabsList>

              <TabsContent value="checklist" className="space-y-10 mt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-[#5E6C84] uppercase tracking-widest">
                    <span>Progresso de Coleta</span>
                    <span>{declaration.progress}%</span>
                  </div>
                  <Progress value={declaration.progress} className="h-2 bg-[#F4F5F7]" />
                </div>

                {CHECKLIST.map((group) => (
                  <div key={group.group} className="space-y-4">
                    <h4 className="text-[11px] font-black text-[#172B4D] uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-4 bg-[#1FA67A] rounded-full" />
                      {group.group}
                    </h4>
                    <div className="space-y-2">
                      {group.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F4F5F7] transition-colors group">
                          <Checkbox id={`${group.group}-${i}`} className="mt-0.5 h-4 w-4 border-[#D2D7DB]" />
                          <Label htmlFor={`${group.group}-${i}`} className="text-sm font-medium text-[#172B4D] cursor-pointer">
                            {item}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="historico" className="space-y-8 mt-6">
                {/* Campo de Movimentação e Dúvidas */}
                <div className="bg-[#F4F5F7] p-4 rounded-xl border border-[#D2D7DB] space-y-3">
                  <Label className="text-[11px] font-black text-[#172B4D] uppercase tracking-widest">Registrar Movimentação / Dúvidas</Label>
                  <Textarea 
                    placeholder="Escreva aqui detalhes sobre a movimentação, pendências ou dúvidas com o cliente..." 
                    className="bg-white border-[#D2D7DB] text-sm h-24"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      className="bg-[#172B4D] font-bold uppercase text-[10px] px-6"
                      onClick={() => {
                        toast({ title: "Registro salvo no histórico!" });
                        setNewComment("");
                      }}
                    >
                      Salvar Registro
                    </Button>
                  </div>
                </div>

                <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D2D7DB]">
                  <TimelineItem 
                    icon={Plus} 
                    color="bg-[#172B4D]" 
                    title="Declaração Criada" 
                    user="Fernanda Oliveira" 
                    time="13/03/2026 - 09:30" 
                    details="Início do fluxo de IRPF 2026." 
                  />
                  <TimelineItem 
                    icon={Edit2} 
                    color="bg-[#2E86C1]" 
                    title="Ajuste de Valor" 
                    user="Ricardo Santos" 
                    time="Hoje - 10:15" 
                    details="Valor do serviço definido para R$ 250,00." 
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-[#F4F5F7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-[#172B4D] text-white text-[10px] font-black">R</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#5E6C84] uppercase tracking-widest">Responsável</span>
              <span className="text-xs font-bold text-[#172B4D]">{declaration.responsible} Santos</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 border-[#D2D7DB] font-black text-[10px] uppercase tracking-widest gap-2 bg-white">
              <ArrowRightLeft className="h-3.5 w-3.5 text-[#1FA67A]" /> Mudar Coluna
            </Button>
            <Button className="h-9 bg-[#1FA67A] font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function HeaderAction({ icon: Icon, label }: any) {
  return (
    <Button variant="secondary" size="sm" className="bg-[#EBEDF0] hover:bg-[#D2D7DB] text-[#172B4D] font-bold text-xs h-8 gap-2 px-3 border-none">
      <Icon className="h-3.5 w-3.5" /> {label}
    </Button>
  )
}

function TimelineItem({ icon: Icon, color, title, user, time, details }: any) {
  return (
    <div className="relative">
      <div className={cn("absolute -left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm z-10", color)}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h5 className="text-xs font-bold text-[#172B4D]">{title}</h5>
          <span className="text-[10px] text-[#5E6C84] font-medium">{time}</span>
        </div>
        <p className="text-[10px] text-[#172B4D] font-bold">Por: {user}</p>
        <p className="text-[11px] text-[#5E6C84] leading-relaxed">{details}</p>
      </div>
    </div>
  )
}
