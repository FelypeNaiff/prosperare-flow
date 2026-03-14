
"use client"

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { 
  Paperclip, 
  MessageSquare, 
  History as HistoryIcon, 
  Info,
  DollarSign,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  FileText,
  Upload,
  User,
  Trash2
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

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

export function IrpfDetailsDrawer({ open, onOpenChange, declaration }: any) {
  if (!declaration) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="p-6 bg-[#2C4156] text-white space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Badge className="bg-[#1FA67A] border-none text-[10px] font-black uppercase">IRPF {declaration.year}</Badge>
              <SheetTitle className="text-2xl font-black text-white">{declaration.name}</SheetTitle>
              <SheetDescription className="text-white/70 font-mono text-sm">CPF: {declaration.cpf}</SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white"><Plus className="h-5 w-5" /></Button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {declaration.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-[9px] font-bold border-white/20 text-white uppercase whitespace-nowrap">
                {tag}
              </Badge>
            ))}
          </div>
        </SheetHeader>

        <Tabs defaultValue="checklist" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-6 h-12 bg-white border-b rounded-none justify-start gap-6">
            <TabsTrigger value="checklist" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase">Checklist</TabsTrigger>
            <TabsTrigger value="resumo" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase">Resumo Tributário</TabsTrigger>
            <TabsTrigger value="arquivos" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase flex gap-2">
              Arquivos <Badge className="bg-[#1FA67A]/10 text-[#1FA67A] h-4 min-w-4 p-1">5</Badge>
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase">Histórico</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6">
              <TabsContent value="checklist" className="m-0 space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#2C4156] uppercase">
                    <span>Progresso de Coleta</span>
                    <span>{declaration.progress}%</span>
                  </div>
                  <Progress value={declaration.progress} className="h-2" />
                </div>

                {CHECKLIST.map((group) => (
                  <div key={group.group} className="space-y-3">
                    <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">{group.group}</h4>
                    <div className="space-y-2">
                      {group.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-[#D2D7DB] hover:bg-[#F7F7F7] transition-colors group">
                          <Checkbox id={`${group.group}-${i}`} />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor={`${group.group}-${i}`} className="text-sm font-bold text-[#2C4156] cursor-pointer block leading-tight">
                              {item}
                            </Label>
                            <div className="flex items-center gap-4 text-[10px] text-[#98A7AA]">
                              <button className="flex items-center gap-1 hover:text-[#1FA67A] font-bold uppercase tracking-tighter">
                                <Upload className="h-3 w-3" /> Anexar
                              </button>
                              <button className="flex items-center gap-1 hover:text-[#2574A9] font-bold uppercase tracking-tighter">
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
                  <div className="p-4 bg-[#E3F0F9]/30 border rounded-xl space-y-1">
                    <p className="text-[10px] font-black text-[#2574A9] uppercase">Tipo de Declaração</p>
                    <p className="text-lg font-black text-[#2C4156]">Simplificada</p>
                  </div>
                  <div className="p-4 bg-[#7ED6B5]/20 border border-[#1FA67A]/20 rounded-xl space-y-1">
                    <p className="text-[10px] font-black text-[#1FA67A] uppercase">Resultado</p>
                    <p className="text-lg font-black text-[#1FA67A]">Restituição</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-[#98A7AA] uppercase">Valor Estimado</p>
                      <p className="text-xl font-black text-[#2C4156]">R$ 1.450,00</p>
                    </div>
                    <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none">✓ Confirmado</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#98A7AA] uppercase">Status Receita Federal</Label>
                    <div className="p-4 border rounded-xl bg-[#F7F7F7] flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border">
                        <Info className="h-5 w-5 text-[#2574A9]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2C4156]">Na fila de restituição</p>
                        <p className="text-xs text-[#98A7AA]">Previsão Lote 2 (Junho/2026)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="arquivos" className="m-0 space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { name: 'RG_Frente.pdf', type: 'PDF', size: '1.2 MB', date: '12/03' },
                    { name: 'Informe_Bradesco.pdf', type: 'PDF', size: '2.4 MB', date: '13/03' },
                    { name: 'Recibo_Medico.jpg', type: 'IMG', size: '800 KB', date: '14/03' },
                  ].map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-[#F7F7F7] group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#2C4156]/5 rounded-lg"><FileText className="h-4 w-4 text-[#2C4156]" /></div>
                        <div>
                          <p className="text-xs font-bold text-[#2C4156]">{file.name}</p>
                          <p className="text-[10px] text-[#98A7AA] font-bold uppercase">{file.type} • {file.size} • {file.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]"><Upload className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-[#1FA67A] font-bold gap-2">
                  <Upload className="h-4 w-4" /> Upload de Documento
                </Button>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <div className="p-4 border-t bg-[#F7F7F7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#2C4156] text-white text-[10px]">R</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[#98A7AA] uppercase">Responsável</span>
              <span className="text-xs font-bold text-[#2C4156]">{declaration.responsible} Santos</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 border-[#D2D7DB] font-bold text-[10px] uppercase gap-2">
              <ArrowRightLeft className="h-3 w-3" /> Mudar Coluna
            </Button>
            <Button className="h-8 bg-[#1FA67A] font-bold text-[10px] uppercase gap-2">
              <CheckCircle2 className="h-3 w-3" /> Finalizar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
