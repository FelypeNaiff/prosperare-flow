"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, Save, FileText, Eye, ReceiptText, Loader2, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { ClientSearchSelect } from "@/components/clients/client-search-select"

export function ProlaboreForm() {
  const firestore = useFirestore()
  const [isManual, setIsManual] = useState(false)
  const [isPreviewMode, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [docType, setDocType] = useState<"prolabore" | "contracheque">("contracheque")
  
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    clientId: "",
    empresa: "",
    cnpj: "",
    socio: "",
    cpf: "",
    email: "",
    competencia: "",
    valorBruto: "0",
    inss: "0",
    irrf: "0",
    cadastro: "2"
  })

  // Carrega dados de reuso se existirem
  useEffect(() => {
    const saved = sessionStorage.getItem("reuse_doc_data")
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.type?.includes("PRO-LABORE")) {
        setFormData(parsed.data)
        if (parsed.type?.includes("DECLARAÇÃO")) setDocType("prolabore")
        else setDocType("contracheque")
        setIsPreviewOpen(true)
        sessionStorage.removeItem("reuse_doc_data")
        toast({ title: "Dados carregados com sucesso" })
      }
    }
  }, [])

  const handleSelectClient = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId)
    if (client) {
      setFormData({
        ...formData,
        clientId: client.id,
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
  }

  const handleSaveToHistory = () => {
    if (!formData.empresa) return
    setIsSaving(true)
    
    const id = Math.random().toString(36).substr(2, 9)
    const docData = {
      id,
      clientId: formData.clientId || "manual",
      clientName: formData.empresa,
      type: docType === 'prolabore' ? "PRO-LABORE (DECLARAÇÃO)" : "PRO-LABORE (RECIBO)",
      title: `${docType.toUpperCase()}: ${formData.socio}`,
      data: formData,
      createdAt: new Date().toISOString()
    }

    setDocumentNonBlocking(doc(firestore, "generated_documents", id), docData, { merge: true })
    
    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "Documento Salvo!", description: "O registro foi adicionado ao histórico geral." })
    }, 500)
  }

  const valorBrutoNum = Number(formData.valorBruto) || 0
  const inssNum = Number(formData.inss) || 0
  const irrfNum = Number(formData.irrf) || 0
  const valorLiquido = valorBrutoNum - inssNum - irrfNum
  const baseIRPF = valorBrutoNum - inssNum

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatCompetencia = (val: string) => {
    if (!val) return "--/----"
    const parts = val.split('-')
    if (parts.length < 2) return val
    return `${parts[1]}/${parts[0]}`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className={cn("space-y-6", isPreviewMode ? "lg:col-span-5 no-print" : "lg:col-span-12 max-w-4xl mx-auto")}>
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
                  docType === 'prolabore' ? "border-[#2563EB] bg-[#2563EB]/5" : "border-[#D2D7DB] bg-white"
                )} onClick={() => setDocType('prolabore')}>
                  <FileText className={cn("h-5 w-5", docType === 'prolabore' ? "text-[#2563EB]" : "text-[#98A7AA]")} />
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
                    <span className="text-xs font-black text-[#2C4156] uppercase">Recibo (Contracheque)</span>
                    <RadioGroupItem value="contracheque" id="t-con" className="sr-only" />
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Identificação da Empresa</h4>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold text-[#2563EB]" onClick={() => {
                setIsManual(!isManual)
                setFormData({...formData, empresa: "", cnpj: "", clientId: ""})
              }}>
                {isManual ? "Selecionar da Base" : "Digitar Manual"}
              </Button>
            </div>

            {!isManual ? (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Empresa</Label>
                <ClientSearchSelect 
                  clients={clients} 
                  value={formData.clientId} 
                  onValueChange={handleSelectClient} 
                />
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
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Desconto IRRF (R$)</Label>
                  <Input type="number" placeholder="0,00" value={formData.irrf} onChange={(e) => setFormData({...formData, irrf: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Nº Cadastro</Label>
                  <Input placeholder="Ex: 2" value={formData.cadastro} onChange={(e) => setFormData({...formData, cadastro: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button className="flex-1 bg-[#2C4156] font-bold gap-2" onClick={handlePreview}>
                <Eye className="h-4 w-4" /> Visualizar Documento
              </Button>
              <Button variant="outline" className="flex-1 border-[#D2D7DB] text-[#39586D] font-bold gap-2" onClick={handleSaveToHistory} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar no Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPreviewMode && (
        <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="border-[#D2D7DB] bg-[#F7F7F7] overflow-hidden sticky top-20 print:static print:bg-white print:border-none print:shadow-none">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between no-print">
              <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Pré-visualização</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}><X className="h-4 w-4 mr-1" /> Fechar</Button>
                <Button size="sm" className="bg-[#2563EB] gap-2 font-bold uppercase text-[10px]" onClick={() => window.print()}>
                  <Printer className="h-3 w-3" /> GERAR PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 print:p-0">
              <div className="bg-white mx-auto w-full min-h-[297mm] p-8 text-black leading-tight font-serif print-container">
                
                {docType === 'prolabore' ? (
                  <div className="space-y-12 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-8 border-b pb-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-black uppercase text-black">{formData.empresa || "[NOME DA EMPRESA]"}</h2>
                        <p className="font-bold text-slate-500">CNPJ: {formData.cnpj || "00.000.000/0000-00"}</p>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h2 className="text-lg font-black uppercase underline underline-offset-8">DECLARAÇÃO DE RENDIMENTOS (PRÓ-LABORE)</h2>
                    </div>

                    <div className="space-y-8">
                      <p className="text-justify leading-loose">
                        A empresa <strong>{formData.empresa || "[NOME DA EMPRESA]"}</strong>, inscrita no CNPJ sob o nº <strong>{formData.cnpj || "[CNPJ]"}</strong>, declara para os devidos fins de comprovação de renda que o Sr(a). <strong>{formData.socio || "[NOME DO SÓCIO]"}</strong>, portador do CPF nº <strong>{formData.cpf || "[CPF]"}</strong>, na qualidade de sócio-administrador, percebeu a título de Pró-labore no mês de <strong>{formatCompetencia(formData.competencia)}</strong> a importância bruta de <strong>R$ {formatCurrency(valorBrutoNum)}</strong>.
                      </p>

                      <div className="bg-[#F7F7F7] p-6 rounded-xl border-2 border-black space-y-3">
                        <h3 className="font-black text-[9px] uppercase tracking-widest text-[#2563EB]">Resumo de Valores</h3>
                        <div className="flex justify-between border-b border-black pb-2">
                          <span>Rendimento Bruto:</span>
                          <span className="font-bold">R$ {formatCurrency(valorBrutoNum)}</span>
                        </div>
                        <div className="flex justify-between border-b border-black pb-2 text-[#E74C3C]">
                          <span>Dedução INSS (11%):</span>
                          <span className="font-bold">(-) R$ {formatCurrency(inssNum)}</span>
                        </div>
                        <div className="flex justify-between border-b border-black pb-2 text-[#E74C3C]">
                          <span>Dedução IRRF:</span>
                          <span className="font-bold">(-) R$ {formatCurrency(irrfNum)}</span>
                        </div>
                        <div className="flex justify-between pt-2 text-lg">
                          <span className="font-black">VALOR LÍQUIDO:</span>
                          <span className="font-black text-[#2563EB]">R$ {formatCurrency(valorLiquido)}</span>
                        </div>
                      </div>

                      <p className="text-justify mt-8">
                        Sendo a expressão da verdade, firmamos a presente em Macapá - AP, ____ de ________________ de 20____.
                      </p>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-12 text-center pt-8">
                      <div className="border-t border-black pt-2">
                        <p className="font-bold uppercase text-[9px]">{formData.empresa || "EMPREGADOR"}</p>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest">Carimbo e Assinatura</p>
                      </div>
                      <div className="border-t border-black pt-2">
                        <p className="font-bold uppercase text-[9px]">{formData.socio || "SÓCIO"}</p>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest">Assinatura do Recebedor</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-black text-[10px] uppercase font-sans h-fit">
                    <div className="flex border-b-2 border-black">
                      <div className="w-[60%] bg-[#E5E7EB] border-r-2 border-black p-1 font-black">EMPREGADOR</div>
                      <div className="w-[40%] p-1 text-center font-black text-xs">Recibo de Pró-labore</div>
                    </div>
                    <div className="flex border-b-2 border-black h-8 items-center">
                      <div className="w-[60%] border-r-2 border-black p-1 font-bold">{formData.empresa || "NOME DO CLIENTE"}</div>
                      <div className="w-[15%] border-r-2 border-black bg-[#F3F4F6] text-center font-bold">TIPO</div>
                      <div className="w-[25%] p-1 text-center font-bold">Mensal</div>
                    </div>
                    <div className="flex border-b-2 border-black h-8 items-center">
                      <div className="w-[60%] border-r-2 border-black p-1 font-bold">CNPJ: {formData.cnpj || "00.000.000/0000-00"}</div>
                      <div className="w-[15%] border-r-2 border-black bg-[#F3F4F6] text-center font-bold">REF</div>
                      <div className="w-[25%] p-1 text-center font-bold">{formatCompetencia(formData.competencia)}</div>
                    </div>
                    <div className="flex bg-[#E5E7EB] border-b border-black">
                      <div className="w-[20%] border-r border-black p-0.5 text-center font-black">Cadastro</div>
                      <div className="w-[80%] p-0.5 pl-2 font-black">Nome do Sócio / Beneficiário</div>
                    </div>
                    <div className="flex border-b-2 border-black h-12">
                      <div className="w-[20%] border-r-2 border-black p-2 text-center text-sm font-black flex items-center justify-center">{formData.cadastro}</div>
                      <div className="w-[80%] flex flex-col justify-center">
                        <div className="p-1 pl-2 font-black text-sm">{formData.socio}</div>
                        <div className="p-1 pl-2 border-t border-black text-[8px] font-bold text-[#4B5563]">SÓCIO - ADMINISTRADOR</div>
                      </div>
                    </div>
                    <div className="flex bg-[#E5E7EB] border-b-2 border-black font-black text-center">
                      <div className="w-[10%] border-r border-black p-0.5">Cod</div>
                      <div className="w-[35%] border-r border-black p-0.5 text-left pl-2">Descrição</div>
                      <div className="w-[15%] border-r border-black p-0.5">Referência</div>
                      <div className="w-[20%] border-r border-black p-0.5 text-right pr-2">Proventos</div>
                      <div className="w-[20%] p-0.5 text-right pr-2">Descontos</div>
                    </div>
                    <div className="min-h-[250px] relative">
                      <div className="flex border-b border-gray-300 h-8 items-center">
                        <div className="w-[10%] border-r border-black p-1 text-center font-bold">1</div>
                        <div className="w-[35%] border-r border-black p-1 pl-2 font-bold">PRÓ-LABORE MENSAL</div>
                        <div className="w-[15%] border-r border-black p-1 text-center font-bold">30 DIAS</div>
                        <div className="w-[20%] border-r border-black p-1 text-right pr-2 font-bold">R$ {formatCurrency(valorBrutoNum)}</div>
                        <div className="w-[20%] p-1 text-right pr-2"></div>
                      </div>
                      <div className="flex border-b border-gray-300 h-8 items-center">
                        <div className="w-[10%] border-r border-black p-1 text-center font-bold">150</div>
                        <div className="w-[35%] border-r border-black p-1 pl-2 font-bold">INSS SÓCIO</div>
                        <div className="w-[15%] border-r border-black p-1 text-center font-bold">11%</div>
                        <div className="w-[20%] border-r border-black p-1 text-right pr-2"></div>
                        <div className="w-[20%] p-1 text-right pr-2 font-bold">R$ {formatCurrency(inssNum)}</div>
                      </div>
                      {irrfNum > 0 && (
                        <div className="flex border-b border-gray-300 h-8 items-center">
                          <div className="w-[10%] border-r border-black p-1 text-center font-bold">230</div>
                          <div className="w-[35%] border-r border-black p-1 pl-2 font-bold">IRRF SÓCIO</div>
                          <div className="w-[15%] border-r border-black p-1 text-center font-bold">VAR.</div>
                          <div className="w-[20%] border-r border-black p-1 text-right pr-2"></div>
                          <div className="w-[20%] p-1 text-right pr-2 font-bold">R$ {formatCurrency(irrfNum)}</div>
                        </div>
                      )}
                      <div className="absolute top-0 bottom-0 w-[10%] border-r border-black pointer-events-none" />
                      <div className="absolute top-0 bottom-0 w-[45%] border-r border-black pointer-events-none" />
                      <div className="absolute top-0 bottom-0 w-[60%] border-r border-black pointer-events-none" />
                      <div className="absolute top-0 bottom-0 w-[80%] border-r border-black pointer-events-none" />
                    </div>
                    <div className="flex border-t-2 border-black h-10 items-center">
                      <div className="w-[45%]"></div>
                      <div className="w-[15%] border-x-2 border-black p-1 font-black text-center bg-[#E5E7EB] h-full flex items-center justify-center">TOTAIS</div>
                      <div className="w-[20%] border-r-2 border-black p-1 text-right pr-2 font-black text-sm">R$ {formatCurrency(valorBrutoNum)}</div>
                      <div className="w-[20%] p-1 text-right pr-2 font-black text-sm">R$ {formatCurrency(inssNum + irrfNum)}</div>
                    </div>
                    <div className="flex border-t-2 border-black h-12 items-center bg-[#F9FAFB]">
                      <div className="w-[60%]"></div>
                      <div className="w-[20%] border-x-2 border-black p-1 font-black text-center bg-[#E5E7EB] h-full flex items-center justify-center">LÍQUIDO</div>
                      <div className="w-[20%] p-1 text-right pr-2 font-black text-lg">R$ {formatCurrency(valorLiquido)}</div>
                    </div>
                    <div className="flex border-t-2 border-black bg-[#E5E7EB] font-black text-[8px] text-center">
                      <div className="w-[20%] border-r border-black p-0.5">Base INSS</div>
                      <div className="w-[20%] border-r border-black p-0.5">Base FGTS</div>
                      <div className="w-[20%] border-r border-black p-0.5">FGTS Mês</div>
                      <div className="w-[20%] border-r border-black p-0.5">Base IRPF</div>
                      <div className="w-[20%] p-0.5">Total Desc.</div>
                    </div>
                    <div className="flex border-t border-black font-black h-8 items-center text-center">
                      <div className="w-[20%] border-r border-black p-1">R$ {formatCurrency(valorBrutoNum)}</div>
                      <div className="w-[20%] border-r border-black p-1">R$ 0,00</div>
                      <div className="w-[20%] border-r border-black p-1">R$ 0,00</div>
                      <div className="w-[20%] border-r border-black p-1">R$ {formatCurrency(baseIRPF)}</div>
                      <div className="w-[20%] p-1">R$ {formatCurrency(inssNum + irrfNum)}</div>
                    </div>
                    <div className="flex border-t-2 border-black p-4 h-24 items-end justify-between">
                      <div className="w-[60%] flex flex-col gap-2">
                        <div className="border-b border-black w-full"></div>
                        <span className="font-black text-[8px] uppercase">Assinatura do Recebedor: {formData.socio}</span>
                      </div>
                      <div className="w-[30%] flex items-baseline gap-2">
                        <span className="font-bold">Data:</span>
                        <div className="flex-1 flex gap-1 justify-center">
                          <span className="border-b border-black w-10"></span>
                          <span>/</span>
                          <span className="border-b border-black w-10"></span>
                          <span>/</span>
                          <span className="border-b border-black w-14"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}