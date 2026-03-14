
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
import { Printer, Download, Save, UserPlus, CheckCircle2, FileText, PenTool, Image as ImageIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { SignatureDialog } from "./signature-dialog"

export function TerminationTermForm() {
  const [isManualClient, setIsManualClient] = useState(false)
  const [isPreviewMode, setIsPreviewOpen] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  const [formData, setFormData] = useState({
    empresa: "",
    cnpj: "",
    funcionario: "",
    emailFuncionario: "",
    valor: ""
  })

  const handleGenerate = () => {
    setIsPreviewOpen(true)
    toast({ title: "Documento Gerado!", description: "Pré-visualização pronta para impressão." })
  }

  // Mock de logotipo baseado no nome da empresa para demonstração
  const getClientLogo = (name: string) => {
    if (!name) return null;
    const seed = name.length;
    return `https://picsum.photos/seed/${seed}/200/80`;
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
                  <Select onValueChange={(v) => setFormData({...formData, empresa: v === "1" ? "Padaria Central Ltda" : "Oficina do João ME", cnpj: v === "1" ? "12.345.678/0001-90" : "98.765.432/0001-21"})}>
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
                    <Input placeholder="Nome da empresa" onChange={(e) => setFormData({...formData, empresa: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-[#39586D]">CNPJ</Label>
                    <Input placeholder="00.000.000/0000-00" onChange={(e) => setFormData({...formData, cnpj: e.target.value})} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Dados do Funcionário</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-[#39586D]">Nome Completo</Label>
                  <Input placeholder="Nome do colaborador" onChange={(e) => setFormData({...formData, funcionario: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-[#39586D]">E-mail para Assinatura Digital</Label>
                  <Input type="email" placeholder="e-mail@exemplo.com" onChange={(e) => setFormData({...formData, emailFuncionario: e.target.value})} />
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
                  <Input type="number" placeholder="0,00" className="font-black text-[#1FA67A]" onChange={(e) => setFormData({...formData, valor: e.target.value})} />
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
                <div className="col-span-2 space-y-2">
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
          <Card className="border-[#D2D7DB] bg-[#F7F7F7] overflow-hidden sticky top-20">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Visualização de Impressão</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}>Fechar</Button>
                <Button 
                  size="sm" 
                  className="bg-[#2574A9] hover:bg-[#2574A9]/90 gap-2 font-bold"
                  onClick={() => setIsSignatureOpen(true)}
                >
                  <PenTool className="h-3 w-3" /> Assinatura Digital
                </Button>
                <Button size="sm" className="bg-[#1FA67A] gap-2"><Download className="h-3 w-3" /> PDF</Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-white shadow-xl mx-auto w-full min-h-[800px] p-12 text-[#2C4156] text-[11px] leading-relaxed font-serif border">
                
                {/* Cabeçalho Dinâmico */}
                <div className="flex items-start justify-between mb-12 border-b pb-8">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black uppercase text-[#2C4156]">{formData.empresa || "[NOME DA EMPRESA]"}</h2>
                    <p className="font-bold text-[#98A7AA]">CNPJ: {formData.cnpj || "00.000.000/0000-00"}</p>
                  </div>
                  {formData.empresa ? (
                    <div className="relative w-32 h-12 grayscale opacity-80">
                      <Image 
                        src={getClientLogo(formData.empresa)!} 
                        alt="Logo Cliente" 
                        fill 
                        className="object-contain"
                        data-ai-hint="company logo"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-12 border-2 border-dashed rounded flex items-center justify-center text-[8px] font-bold text-[#D2D7DB] uppercase">
                      Logotipo Cliente
                    </div>
                  )}
                </div>

                <div className="text-center space-y-2 mb-12">
                  <h2 className="text-lg font-black uppercase underline underline-offset-8">TERMO DE QUITAÇÃO DE RESCISÃO CONTRATUAL</h2>
                  <p className="font-bold text-[9px] text-[#98A7AA]">Prosperare Flow — Inteligência Documental</p>
                </div>

                <div className="space-y-8">
                  <p className="text-justify">
                    Pelo presente instrumento, a empresa <strong>{formData.empresa || "[NOME DA EMPRESA]"}</strong>, inscrita no CNPJ sob o nº <strong>{formData.cnpj || "[00.000.000/0000-00]"}</strong>, declara para os devidos fins que o Sr(a). <strong>{formData.funcionario || "[NOME DO FUNCIONÁRIO]"}</strong>, recebeu nesta data a importância líquida de <strong>R$ {formData.valor || "[VALOR]"}</strong>, referente às verbas rescisórias do contrato de trabalho encerrado conforme discriminado abaixo.
                  </p>

                  <div className="space-y-2">
                    <h3 className="font-black border-b pb-1 text-[9px] uppercase tracking-widest text-[#1FA67A]">MEMÓRIA DE CÁLCULO / DISCRIMINAÇÃO</h3>
                    <div className="bg-[#F7F7F7] p-4 rounded font-mono whitespace-pre-wrap text-[10px]">
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
                        <p className="font-bold uppercase text-[9px]">{formData.empresa || "EMPREGADOR"}</p>
                        <p className="text-[8px] text-[#98A7AA] uppercase tracking-widest">Contratante</p>
                      </div>
                      <div className="border-t border-[#2C4156] pt-2">
                        <p className="font-bold uppercase text-[9px]">{formData.funcionario || "COLABORADOR"}</p>
                        <p className="text-[8px] text-[#98A7AA] uppercase tracking-widest">Signatário</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <SignatureDialog 
        open={isSignatureOpen} 
        onOpenChange={setIsSignatureOpen} 
        documentTitle="Termo de Quitação de Rescisão"
        recipientName={formData.funcionario || "Colaborador"}
        recipientEmail={formData.emailFuncionario || "funcionario@email.com"}
      />
    </div>
  )
}
