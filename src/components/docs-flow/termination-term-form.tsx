
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Printer, Download, Save, UserPlus, CheckCircle2, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function TerminationTermForm() {
  const [isManualClient, setIsManualClient] = useState(false)
  const [isPreviewMode, setIsPreviewOpen] = useState(false)

  const handleGenerate = () => {
    setIsPreviewOpen(true)
    toast({ title: "Documento Gerado!", description: "Pré-visualização pronta para impressão." })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className={cn("space-y-6", isPreviewMode ? "lg:col-span-5" : "lg:col-span-12 max-w-4xl mx-auto")}>
        <Card className="border-[#D2D7DB] shadow-sm">
          <CardHeader className="bg-[#F7F7F7]/50 border-b">
            <CardTitle className="text-lg font-black text-[#2C4156] uppercase">Termo de Quitação de Rescisão</CardTitle>
            <CardDescription>Preencha os dados do desligamento para gerar o termo oficial.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Dados do Empregador</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] font-bold text-[#1FA67A] uppercase gap-1"
                  onClick={() => setIsManualClient(!isManualClient)}
                >
                  <UserPlus className="h-3 w-3" /> {isManualClient ? "Selecionar da Base" : "Digitar Manualmente"}
                </Button>
              </div>
              
              {!isManualClient ? (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Empresa Cliente</Label>
                  <Select>
                    <SelectTrigger className="border-[#D2D7DB]">
                      <SelectValue placeholder="Selecione o cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Padaria Central Ltda</SelectItem>
                      <SelectItem value="2">Oficina do João ME</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-[#39586D]">Razão Social</Label>
                    <Input placeholder="Nome da empresa" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-[#39586D]">CNPJ</Label>
                    <Input placeholder="00.000.000/0000-00" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Dados do Funcionário</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-[#39586D]">Nome Completo</Label>
                  <Input placeholder="Nome do colaborador" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">CPF</Label>
                  <Input placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">CTPS / Série</Label>
                  <Input placeholder="000000 / 000-0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Data de Admissão</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Data de Demissão</Label>
                  <Input type="date" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Valores e Memória de Cálculo</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Valor Total Líquido (R$)</Label>
                  <Input type="number" placeholder="0,00" className="font-black text-[#1FA67A]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Motivo do Desligamento</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Dispensa sem justa causa</SelectItem>
                      <SelectItem value="2">Pedido de demissão</SelectItem>
                      <SelectItem value="3">Término de contrato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-[#39586D]">Espelho de Cálculo (Detalhamento)</Label>
                  <Textarea placeholder="Descreva as verbas: Saldo salário, 13º proporcional, Férias..." className="h-32 text-xs font-mono" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button className="flex-1 bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-bold gap-2" onClick={handleGenerate}>
                <Printer className="h-4 w-4" /> Gerar e Visualizar
              </Button>
              <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] font-bold gap-2">
                <Save className="h-4 w-4" /> Salvar no Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPreviewMode && (
        <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="border-[#D2D7DB] bg-[#F7F7F7] overflow-hidden">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Visualização de Impressão</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}>Fechar</Button>
                <Button size="sm" className="bg-[#1FA67A] gap-2"><Download className="h-3 w-3" /> PDF</Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-white shadow-xl mx-auto w-full min-h-[800px] p-12 text-[#2C4156] text-xs leading-relaxed font-serif border">
                <div className="text-center space-y-4 mb-12 border-b pb-8">
                  <h2 className="text-xl font-black uppercase underline underline-offset-8">TERMO DE QUITAÇÃO DE RESCISÃO CONTRATUAL</h2>
                  <p className="font-bold text-[10px]">Prosperare Flow — Inteligência Documental</p>
                </div>

                <div className="space-y-8">
                  <p className="text-justify">
                    Pelo presente instrumento, a empresa <strong>[NOME DA EMPRESA]</strong>, inscrita no CNPJ sob o nº <strong>[00.000.000/0000-00]</strong>, declara para os devidos fins que o Sr(a). <strong>[NOME DO FUNCIONÁRIO]</strong>, portador do CPF <strong>[000.000.000-00]</strong>, recebeu nesta data a importância líquida de <strong>R$ [VALOR]</strong>, referente às verbas rescisórias do contrato de trabalho iniciado em [DATA] e encerrado em [DATA].
                  </p>

                  <div className="space-y-2">
                    <h3 className="font-black border-b pb-1 text-[10px] uppercase">MEMÓRIA DE CÁLCULO / DISCRIMINAÇÃO</h3>
                    <div className="bg-[#F7F7F7] p-4 rounded font-mono whitespace-pre-wrap">
                      [DETALHAMENTO DO CÁLCULO DIGITADO NO FORMULÁRIO]
                    </div>
                  </div>

                  <p className="text-justify">
                    Com o recebimento das importâncias acima discriminadas, o colaborador dá à empresa plena, geral e irrevogável quitação de todas as parcelas decorrentes do contrato de trabalho, nada mais tendo a reclamar a qualquer título.
                  </p>

                  <div className="mt-24 space-y-16">
                    <p className="text-right">Macapá - AP, {new Date().toLocaleDateString('pt-BR')}</p>
                    
                    <div className="grid grid-cols-2 gap-12 text-center pt-12">
                      <div className="border-t border-[#2C4156] pt-2">
                        <p className="font-bold uppercase">[NOME DA EMPRESA]</p>
                        <p className="text-[9px] text-[#98A7AA]">EMPREGADOR</p>
                      </div>
                      <div className="border-t border-[#2C4156] pt-2">
                        <p className="font-bold uppercase">[NOME DO FUNCIONÁRIO]</p>
                        <p className="text-[9px] text-[#98A7AA]">COLABORADOR</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
