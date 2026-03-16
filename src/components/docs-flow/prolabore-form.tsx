"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, Download, Save, UserPlus, FileText, PenTool, Loader2, X, Eye, ReceiptText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SignatureDialog } from "./signature-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function ProlaboreForm() {
  const firestore = useFirestore()
  const [isManual, setIsManual] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  const [isPreviewMode, setIsPreviewOpen] = useState(false)
  const [docType, setDocType] = useState<"prolabore" | "contracheque">("prolabore")
  
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    empresa: "",
    cnpj: "",
    socio: "",
    cpf: "",
    email: "",
    competencia: "",
    valorBruto: "0",
    inss: "0",
    irrf: "0"
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

  const handlePreview = () => {
    if (!formData.empresa || !formData.socio) {
      toast({ variant: "destructive", title: "Erro", description: "Dados da empresa e do sócio são obrigatórios." })
      return
    }
    setIsPreviewOpen(true)
    toast({ title: "Visualização Gerada!" })
  }

  const valorLiquido = Number(formData.valorBruto) - Number(formData.inss) - Number(formData.irrf)

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
            <CardTitle className="text-lg font-black text-[#2C4156] uppercase">Emissão de Proventos de Sócios</CardTitle>
            <CardDescription>Escolha o formato e preencha os dados para gerar o documento.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Tipo de Documento</Label>
              <RadioGroup 
                value={docType} 
                onValueChange={(v: any) => setDocType(v)}
                className="flex gap-4"
              >
                <div className={cn(
                  "flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                  docType === 'prolabore' ? "border-[#1FA67A] bg-[#1FA67A]/5" : "border-[#D2D7DB] bg-white"
                )} onClick={() => setDocType('prolabore')}>
                  <FileText className={cn("h-5 w-5", docType === 'prolabore' ? "text-[#1FA67A]" : "text-[#98A7AA]")} />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#2C4156] uppercase">Declaração</span>
                    <RadioGroupItem value="prolabore" id="t-pro" className="sr-only" />
                  </div>
                </div>
                <div className={cn(
                  "flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                  docType === 'contracheque' ? "border-[#2574A9] bg-[#2574A9]/5" : "border-[#D2D7DB] bg-white"
                )} onClick={() => setDocType('contracheque')}>
                  <ReceiptText className={cn("h-5 w-5", docType === 'contracheque' ? "text-[#2574A9]" : "text-[#98A7AA]")} />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#2C4156] uppercase">Contra-cheque</span>
                    <RadioGroupItem value="contracheque" id="t-con" className="sr-only" />
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Identificação da Empresa</h4>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold text-[#1FA67A]" onClick={() => {
                setIsManual(!isManual)
                setFormData({...formData, empresa: "", cnpj: ""})
              }}>
                {isManual ? "Selecionar da Base" : "Digitar Manual"}
              </Button>
            </div>

            {!isManual ? (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Empresa</Label>
                <Select onValueChange={handleSelectClient}>
                  <SelectTrigger className="border-[#D2D7DB]">
                    <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione o cliente..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients || []).map(c => (
                      <SelectItem key={c.id} value={c.id} className="uppercase text-xs font-bold">{c.corporateName}</SelectItem>
                    ))}
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

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Dados do Sócio / Beneficiário</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-[#39586D]">Nome do Sócio</Label>
                  <Input placeholder="Nome completo" value={formData.socio} onChange={(e) => setFormData({...formData, socio: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">CPF</Label>
                  <Input placeholder="000.000.000-00" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Competência (Mês/Ano)</Label>
                  <Input type="month" value={formData.competencia} onChange={(e) => setFormData({...formData, competencia: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Valor Bruto (R$)</Label>
                  <Input type="number" placeholder="0,00" value={formData.valorBruto} onChange={(e) => setFormData({...formData, valorBruto: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Desconto INSS (R$)</Label>
                  <Input type="number" placeholder="0,00" value={formData.inss} onChange={(e) => setFormData({...formData, inss: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-[#39586D]">E-mail para Assinatura</Label>
                  <Input type="email" placeholder="socio@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button className="flex-1 bg-[#2C4156] font-bold gap-2" onClick={handlePreview}>
                <Eye className="h-4 w-4" /> Visualizar Documento
              </Button>
              <Button 
                variant="outline" 
                className="border-[#2574A9] text-[#2574A9] hover:bg-[#2574A9]/5 font-bold gap-2"
                onClick={() => setIsSignatureOpen(true)}
              >
                <PenTool className="h-4 w-4" /> Assinatura Digital
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPreviewMode && (
        <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="border-[#D2D7DB] bg-[#F7F7F7] overflow-hidden sticky top-20 print:static print:bg-white print:border-none print:shadow-none">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between print:hidden">
              <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Pré-visualização do Documento</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}><X className="h-4 w-4 mr-1" /> Fechar</Button>
                <Button size="sm" className="bg-[#1FA67A] gap-2" onClick={() => window.print()}>
                  <Printer className="h-3 w-3" /> Imprimir / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 print:p-0">
              <div className="bg-white shadow-xl mx-auto w-full min-h-[800px] p-12 text-[#2C4156] text-[11px] leading-relaxed font-serif border print:shadow-none print:border-none print-container">
                
                {/* Cabeçalho */}
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

                {docType === 'prolabore' ? (
                  /* Layout Declaração */
                  <div className="space-y-12">
                    <div className="text-center space-y-2">
                      <h2 className="text-lg font-black uppercase underline underline-offset-8">DECLARAÇÃO DE RENDIMENTOS (PRÓ-LABORE)</h2>
                      <p className="font-bold text-[9px] text-[#98A7AA]">Prosperare Flow — Inteligência Documental</p>
                    </div>

                    <div className="space-y-8">
                      <p className="text-justify leading-loose">
                        A empresa <strong>{formData.empresa || "[NOME DA EMPRESA]"}</strong>, inscrita no CNPJ sob o nº <strong>{formData.cnpj || "[CNPJ]"}</strong>, declara para os devidos fins de comprovação de renda que o Sr(a). <strong>{formData.socio || "[NOME DO SÓCIO]"}</strong>, portador do CPF nº <strong>{formData.cpf || "[CPF]"}</strong>, na qualidade de sócio-administrador, percebeu a título de Pró-labore no mês de <strong>{formData.competencia || "[MÊS/ANO]"}</strong> a importância bruta de <strong>R$ {Number(formData.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
                      </p>

                      <div className="bg-[#F7F7F7] p-6 rounded-xl border space-y-3">
                        <h3 className="font-black text-[9px] uppercase tracking-widest text-[#1FA67A]">Resumo de Valores</h3>
                        <div className="flex justify-between border-b pb-2">
                          <span>Rendimento Bruto:</span>
                          <span className="font-bold">R$ {Number(formData.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 text-[#E74C3C]">
                          <span>Dedução INSS:</span>
                          <span className="font-bold">(-) R$ {Number(formData.inss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between pt-2 text-lg">
                          <span className="font-black">VALOR LÍQUIDO:</span>
                          <span className="font-black text-[#1FA67A]">R$ {valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <p className="text-justify">
                        Sendo a expressão da verdade, firmamos a presente.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Layout Contra-cheque */
                  <div className="space-y-8">
                    <div className="text-center border-2 border-[#2C4156] py-2 mb-4">
                      <h2 className="text-sm font-black uppercase">RECIBO DE PAGAMENTO DE PRÓ-LABORE</h2>
                    </div>

                    <div className="grid grid-cols-4 border-2 border-[#2C4156] divide-x-2 divide-[#2C4156]">
                      <div className="col-span-3 p-2">
                        <p className="text-[8px] font-black uppercase text-[#98A7AA]">Nome do Sócio/Contribuinte</p>
                        <p className="text-xs font-black uppercase">{formData.socio}</p>
                      </div>
                      <div className="p-2">
                        <p className="text-[8px] font-black uppercase text-[#98A7AA]">Competência</p>
                        <p className="text-xs font-black">{formData.competencia}</p>
                      </div>
                    </div>

                    <div className="border-2 border-[#2C4156] mt-[-2px] min-h-[300px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-2 border-[#2C4156] bg-[#F7F7F7]">
                            <th className="p-2 text-[8px] font-black">DESCRIÇÃO</th>
                            <th className="p-2 text-[8px] font-black text-right">REFERÊNCIA</th>
                            <th className="p-2 text-[8px] font-black text-right">PROVENTOS</th>
                            <th className="p-2 text-[8px] font-black text-right">DESCONTOS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="h-8">
                            <td className="p-2 text-[10px] font-bold">001 - PRÓ-LABORE MENSAL</td>
                            <td className="p-2 text-[10px] text-right">30 Dias</td>
                            <td className="p-2 text-[10px] text-right">R$ {Number(formData.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="p-2 text-[10px] text-right"></td>
                          </tr>
                          <tr className="h-8">
                            <td className="p-2 text-[10px] font-bold text-[#E74C3C]">501 - INSS S/ PRÓ-LABORE</td>
                            <td className="p-2 text-[10px] text-right">11.00%</td>
                            <td className="p-2 text-[10px] text-right"></td>
                            <td className="p-2 text-[10px] text-right text-[#E74C3C]">R$ {Number(formData.inss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-2 border-2 border-[#2C4156] mt-[-2px] divide-x-2 divide-[#2C4156]">
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span>Total de Proventos:</span>
                          <span className="font-bold">R$ {Number(formData.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#E74C3C]">
                          <span>Total de Descontos:</span>
                          <span className="font-bold">R$ {Number(formData.inss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-[#F7F7F7] flex flex-col justify-center items-end">
                        <p className="text-[8px] font-black uppercase text-[#98A7AA]">Valor Líquido a Receber</p>
                        <p className="text-xl font-black text-[#1FA67A]">R$ {valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-24 space-y-16">
                  <p className="text-right">Emitido em {new Date().toLocaleDateString('pt-BR')}</p>
                  <div className="grid grid-cols-2 gap-12 text-center pt-12">
                    <div className="border-t border-[#2C4156] pt-2">
                      <p className="font-bold uppercase text-[9px]">{formData.empresa || "EMPREGADOR"}</p>
                      <p className="text-[8px] text-[#98A7AA] uppercase tracking-widest">Carimbo e Assinatura</p>
                    </div>
                    <div className="border-t border-[#2C4156] pt-2">
                      <p className="font-bold uppercase text-[9px]">{formData.socio || "SÓCIO"}</p>
                      <p className="text-[8px] text-[#98A7AA] uppercase tracking-widest">Declaro que recebi a importância</p>
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
        documentTitle={docType === 'prolabore' ? "Declaração de Pró-labore" : "Contra-cheque"}
        recipientName={formData.socio || "Sócio"}
        recipientEmail={formData.email || "socio@email.com"}
      />
    </div>
  )
}
