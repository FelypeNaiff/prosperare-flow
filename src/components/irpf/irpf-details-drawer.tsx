
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
  Tag
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  { name: 'Prioritário', color: 'bg-red-500' },
  { name: 'Restituição', color: 'bg-emerald-500' },
  { name: 'A Pagar', color: 'bg-orange-500' },
  { name: 'Novo Cliente', color: 'bg-blue-500' },
  { name: 'Em Dia', color: 'bg-slate-500' },
]

export function IrpfDetailsDrawer({ open, onOpenChange, declaration }: any) {
  const [showGovPass, setShowGovPass] = useState(false)
  const [activeTags, setActiveTags] = useState<string[]>(declaration?.tags || [])

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
      <SheetContent className="w-full sm:max-w-[600px] p-0 flex flex-col border-l-[#D2D7DB]">
        <SheetHeader className="p-8 bg-[#2C4156] text-white space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge className="bg-[#1FA67A] border-none text-[10px] font-black uppercase px-2 py-0.5 mb-2">IRPF {declaration.year}</Badge>
                <SheetTitle className="text-3xl font-black text-white leading-tight">{declaration.name}</SheetTitle>
              </div>
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white -mt-2">
                <Plus className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                <span className="text-[10px] font-black uppercase text-white/40">CPF</span>
                <span className="text-xs font-mono font-bold tracking-wider">{declaration.cpf}</span>
                <button onClick={() => copyToClipboard(declaration.cpf, "CPF")} className="text-white/40 hover:text-[#1FA67A] transition-colors ml-1">
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                <span className="text-[10px] font-black uppercase text-white/40">Senha Gov</span>
                <span className="text-xs font-mono font-bold tracking-wider">{showGovPass ? declaration.govPass : '••••••••'}</span>
                <div className="flex items-center gap-2 ml-1">
                  <button onClick={() => setShowGovPass(!showGovPass)} className="text-white/40 hover:text-[#1FA67A] transition-colors">
                    {showGovPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => copyToClipboard(declaration.govPass, "Senha GOV.BR")} className="text-white/40 hover:text-[#1FA67A] transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Seção de Etiquetas (Padrão Imagem) */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {activeTags.map((tag: string) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-[10px] font-black border-white/20 text-white uppercase px-3 py-1 bg-white/5 rounded-full"
                >
                  {tag}
                </Badge>
              ))}
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 p-0">
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-[#2C4156] border-white/10 shadow-2xl">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/40 uppercase px-2 py-1 mb-1 tracking-widest">Alterar Etiquetas</p>
                    {AVAILABLE_TAGS.map((tag) => (
                      <button
                        key={tag.name}
                        onClick={() => toggleTag(tag.name)}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-bold uppercase transition-colors",
                          activeTags.includes(tag.name) ? "bg-[#1FA67A] text-white" : "text-white/60 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", tag.color)} />
                          {tag.name}
                        </div>
                        {activeTags.includes(tag.name) && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="checklist" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-8 h-14 bg-white border-b rounded-none justify-start gap-8">
            <TabsTrigger value="checklist" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] data-[state=active]:text-[#2C4156] rounded-none h-full px-0 font-black text-[11px] uppercase tracking-wider bg-transparent">Checklist</TabsTrigger>
            <TabsTrigger value="resumo" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] data-[state=active]:text-[#2C4156] rounded-none h-full px-0 font-black text-[11px] uppercase tracking-wider bg-transparent">Resumo Tributário</TabsTrigger>
            <TabsTrigger value="arquivos" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] data-[state=active]:text-[#2C4156] rounded-none h-full px-0 font-black text-[11px] uppercase tracking-wider flex gap-2 bg-transparent">
              Arquivos <Badge className="bg-[#1FA67A]/10 text-[#1FA67A] h-4 min-w-4 p-1 border-none text-[10px]">5</Badge>
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] data-[state=active]:text-[#2C4156] rounded-none h-full px-0 font-black text-[11px] uppercase tracking-wider bg-transparent">Histórico</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden bg-white">
            <ScrollArea className="h-full p-8">
              <TabsContent value="checklist" className="m-0 space-y-10">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-[#2C4156] uppercase tracking-widest">
                    <span>Progresso de Coleta</span>
                    <span>{declaration.progress}%</span>
                  </div>
                  <Progress value={declaration.progress} className="h-2 bg-[#F7F7F7]" />
                </div>

                {CHECKLIST.map((group) => (
                  <div key={group.group} className="space-y-4">
                    <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">{group.group}</h4>
                    <div className="space-y-3">
                      {group.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-[#D2D7DB] hover:border-[#1FA67A] hover:bg-[#1FA67A]/5 transition-all group">
                          <Checkbox id={`${group.group}-${i}`} className="mt-1 h-5 w-5 rounded-md" />
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`${group.group}-${i}`} className="text-sm font-bold text-[#2C4156] cursor-pointer block leading-snug">
                              {item}
                            </Label>
                            <div className="flex items-center gap-6 text-[9px] text-[#98A7AA]">
                              <button className="flex items-center gap-1.5 hover:text-[#1FA67A] font-black uppercase tracking-widest transition-colors">
                                <Upload className="h-3 w-3" /> Anexar
                              </button>
                              <button className="flex items-center gap-1.5 hover:text-[#2574A9] font-black uppercase tracking-widest transition-colors">
                                <MessageSquare className="h-3 w-3" /> Observação
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="resumo" className="m-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-[#E3F0F9]/30 border border-[#2574A9]/10 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-[#2574A9] uppercase tracking-widest">Tipo de Declaração</p>
                    <p className="text-xl font-black text-[#2C4156]">Simplificada</p>
                  </div>
                  <div className="p-5 bg-[#7ED6B5]/20 border border-[#1FA67A]/10 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-[#1FA67A] uppercase tracking-widest">Resultado</p>
                    <p className="text-xl font-black text-[#1FA67A]">Restituição</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 border border-[#D2D7DB] rounded-2xl bg-white shadow-sm">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Valor Estimado</p>
                      <p className="text-2xl font-black text-[#2C4156]">R$ 1.450,00</p>
                    </div>
                    <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none font-black text-[10px] uppercase">✓ Confirmado</Badge>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest ml-1">Status Receita Federal</Label>
                    <div className="p-5 border border-[#D2D7DB] rounded-2xl bg-[#F7F7F7] flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border shadow-sm">
                        <Info className="h-6 w-6 text-[#2574A9]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2C4156]">Na fila de restituição</p>
                        <p className="text-xs text-[#98A7AA] font-medium">Previsão Lote 2 (Junho/2026)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="arquivos" className="m-0 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: 'RG_Frente.pdf', type: 'PDF', size: '1.2 MB', date: '12/03' },
                    { name: 'Informe_Bradesco.pdf', type: 'PDF', size: '2.4 MB', date: '13/03' },
                    { name: 'Recibo_Medico.jpg', type: 'IMG', size: '800 KB', date: '14/03' },
                  ].map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-[#F7F7F7] group transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-[#2C4156]/5 rounded-xl border border-[#2C4156]/10"><FileText className="h-5 w-5 text-[#2C4156]" /></div>
                        <div>
                          <p className="text-sm font-bold text-[#2C4156]">{file.name}</p>
                          <p className="text-[10px] text-[#98A7AA] font-black uppercase tracking-widest">{file.type} • {file.size} • {file.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-[#98A7AA]"><Upload className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-[#E74C3C]"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full h-12 bg-[#1FA67A] font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-emerald-500/20">
                  <Upload className="h-4 w-4" /> Upload de Documento
                </Button>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <div className="p-6 border-t bg-[#F7F7F7] flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-[#2C4156] text-white text-xs font-black">R</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Responsável</span>
              <span className="text-sm font-bold text-[#2C4156]">{declaration.responsible} Santos</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 border-[#D2D7DB] font-black text-[10px] uppercase tracking-widest gap-2 px-6 hover:bg-white transition-all">
              <ArrowRightLeft className="h-4 w-4 text-[#1FA67A]" /> Mudar Coluna
            </Button>
            <Button className="h-11 bg-[#1FA67A] font-black text-[10px] uppercase tracking-widest gap-2 px-6 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" /> Finalizar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
