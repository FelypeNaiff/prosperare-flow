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
import { Printer, Download, Save, UserPlus, CheckCircle2, FileText, PenTool, Image as ImageIcon, Loader2, X, Eye } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { SignatureDialog } from "./signature-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { format, parseISO, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"

export function TerminationTermForm() {
  const firestore = useFirestore()
  const [isManualClient, setIsManualClient] = useState(false)
  const [isPreviewMode, setIsPreviewOpen] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    empresa: "",
    cnpj: "",
    funcionario: "",
    cpf: "",
    emailFuncionario: "",
    valor: "",
    admissao: "",
    demissao: "",
    calculo: ""
  })

  const handleSelectClient = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId)
    if (client) {
      setFormData({
        ...formData,
        empresa: client.corporateName,
        cnpj: client.cnpj
      })
    }
  }

  const handleGenerate = () => {
    if (!formData.empresa || !formData.funcionario || !formData.valor) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Preencha os dados básicos da rescisão para visualizar." })
      return
    }
    setIsPreviewOpen(true)
    toast({ title: "Documento Gerado!", description: "Pré-visualização pronta para conferência e impressão." })
  }

  const getClientLogo = (name: string) => {
    if (!name) return null;
    const seed = name.length;
    return `https://picsum.photos/seed/${seed}/200/80`;
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "__/__/____"
    try {
      const date = parseISO(dateStr)
      return isValid(date) ? format(date, "dd/MM/yyyy") : "__/__/____"
    } catch {
      return "__/__/____"
    }
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
                  onClick={() => {
                    setIsManualClient(!isManualClient)
                    setFormData({...formData, empresa: "", cnpj: ""})
                  }}
                >
                  <UserPlus className="h-3 w-3" /> {isManualClient ? "Selecionar da Base" : "Digitar Manualmente"}
                </Button>
              </div>
              
              {!isManualClient ? (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Empresa Cliente</Label>
                  <Select onValueChange={handleSelectClient}>
                    <SelectTrigger className="border-[#D2D7DB]">
                      <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione o cliente..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <div className="p-2 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      ) : (
                        (clients || []).map(c => (
                          <SelectItem key={c.id} value={c.id} className="uppercase text-xs font-bold">{c.corporateName}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-[#39586D]">Razão Social</Label>
                    <Input placeholder="Nome da empresa" value={formData.empresa} onChange={(e) => setFormData({...formData, empresa: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-[#39586D]">CNPJ</Label>
                    <Input placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Dados do Funcionário</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-[#39586D]">Nome Completo</Label>
                  <Input placeholder="Nome do colaborador" value={formData.funcionario} onChange={(e) => setFormData({...formData, funcionario: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">CPF</Label>
                  <Input placeholder="000.000.000-00" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">E-mail para Assinatura</Label>
                  <Input type="email" placeholder="e-mail@exemplo.com" value={formData.emailFuncionario} onChange={(e) => setFormData({...formData, emailFuncionario: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Data de Admissão</Label>
                  <Input type="date" value={formData.admissao} onChange={(e) => setFormData({...formData, admissao: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Data de Demissão</Label>
                  <Input type="date" value={formData.demissao} onChange={(e) => setFormData({...formData, demissao: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Valores e Memória de Cálculo</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-[#39586D]">Valor Total Líquido (R$)</Label>
                  <Input type="number" placeholder="0,00" className="font-black text-[#1FA67A]" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Espelho de Cálculo (Detalhamento)</Label>
                  <Textarea placeholder="Descreva as verbas: Saldo salário, 13º proporcional, Férias..." className="h-32 text-xs font-mono" value={formData.calculo} onChange={(e) => setFormData({...formData, calculo: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button className="flex-1 bg-[#2C4156] hover:bg-[#2C4156]/90 font-bold gap-2" onClick={handleGenerate}>
                <Eye className="h-4 w-4" /> Visualizar Termo
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
          <Card className="border-[#D2D7DB] bg-[#F7F7F7] overflow-hidden sticky top-20 print:static print:bg-white print:border-none print:shadow-none">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between print:hidden">
              <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Visualização de Impressão</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}><X className="h-4 w-4 mr-1" /> Fechar</Button>
                <Button 
                  size="sm" 
                  className="bg-[#2574A9] hover:bg-[#2574A9]/90 gap-2 font-bold"
                  onClick={() => setIsSignatureOpen(true)}
                >
                  <PenTool className="h-3 w-3" /> Assinatura Digital
                </Button>
                <Button size="sm" className="bg-[#1FA67A] gap-2" onClick={() => window.print()}>
                  <Printer className="h-3 w-3" /> Imprimir / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 print:p-0">
              <div className="bg-white shadow-xl mx-auto w-full min-h-[800px] p-12 text-[#2C4156] text-[12px] leading-relaxed font-serif border print:shadow-none print:border-none print-container">
                
                <div className="flex items-start justify-between mb-12 border-b pb-8">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black uppercase text-[#2C4156]">{formData.empresa || "[NOME DA EMPRESA]"}</h2>
                    <p className="font-bold text-[#98A7AA]">CNPJ: {formData.cnpj || "00.000.000/0000-00"}</p>
                  </div>
                  {formData.empresa && (
                    <div className="relative w-32 h-12 grayscale opacity-80">
                      <Image 
                        src={getClientLogo(formData.empresa)!} 
                        alt="Logo Cliente" 
                        fill 
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="text-center space-y-2 mb-12">
                  <h2 className="text-xl font-black uppercase underline underline-offset-8">TERMO DE QUITAÇÃO DE RESCISÃO CONTRATUAL</h2>
                </div>

                <div className="space-y-8 text-justify">
                  <p>
                    Que entre si fazem na melhor forma de direito, de um lado <strong>{formData.empresa || "[NOME DO CLIENTE]"}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ nº <strong>{formData.cnpj || "[CNPJ]"}</strong>, a seguir chamado apenas de <strong>EMPREGADOR</strong>, e de outro lado <strong>{formData.funcionario || "[NOME DO FUNCIONÁRIO]"}</strong>, pessoa física, portador do CPF <strong>{formData.cpf || "[CPF]"}</strong>, a seguir chamado apenas de <strong>EMPREGADO</strong>.
                  </p>

                  <p>
                    O EMPREGADO recebe neste ato do EMPREGADOR a importância de <strong>R$ {Number(formData.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, em moeda corrente e legal do país, valor esse que se refere a quitação do contrato de trabalho, firmado entre as partes, desde <strong>{formatDate(formData.admissao)}</strong> a <strong>{formatDate(formData.demissao)}</strong>.
                  </p>

                  <div className="space-y-2">
                    <h3 className="font-black border-b pb-1 text-[10px] uppercase tracking-widest text-[#1FA67A]">ESPELHO DE CÁLCULO</h3>
                    <div className="bg-[#F7F7F7] p-4 rounded font-mono whitespace-pre-wrap text-[11px] min-h-[100px]">
                      {formData.calculo || "[DETALHAMENTO DO CÁLCULO]"}
                    </div>
                  </div>

                  <p>
                    O EMPREGADO, uma vez recebendo a importância em moeda corrente do país nesta data, bem como assinando este termo, dá ao EMPREGADOR, <strong>PLENA E GERAL QUITAÇÃO</strong>, para nada mais reclamar em época alguma, seja a que título for, em relação aos direitos ou obrigações presentes ou futuras, em se tratando não somente do mencionado Contrato de Trabalho, mas também de todo período que ficou para trás da data deste referido TERMO, abrindo mão também de qualquer ação civil, criminal ou trabalhista.
                  </p>

                  <p>
                    Assim, sendo a expressão da verdade o EMPREGADO firma com o EMPREGADOR, o presente <strong>TERMO DE QUITAÇÃO TOTAL DOS DIREITOS TRABALHISTAS</strong>, para que surta os seus jurídicos e legais efeitos.
                  </p>

                  <div className="mt-24 space-y-16">
                    <p className="text-right">Macapá - AP, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    
                    <div className="grid grid-cols-2 gap-12 text-center pt-12">
                      <div className="border-t border-[#2C4156] pt-2">
                        <p className="font-bold uppercase text-[10px]">{formData.empresa || "EMPREGADOR"}</p>
                        <p className="text-[9px] text-[#98A7AA] uppercase tracking-widest">Carimbo e Assinatura</p>
                      </div>
                      <div className="border-t border-[#2C4156] pt-2">
                        <p className="font-bold uppercase text-[10px]">{formData.funcionario || "EMPREGADO"}</p>
                        <p className="text-[9px] text-[#98A7AA] uppercase tracking-widest">Assinatura do Recebedor</p>
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
