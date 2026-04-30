"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Printer, Eye, Loader2, X, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { ClientSearchSelect } from "@/components/clients/client-search-select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function AsoReferralForm() {
  const firestore = useFirestore()
  const [isManualClient, setIsManualClient] = useState(false)
  const [isPreviewMode, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    clientId: "",
    empresa: "",
    cnpj: "",
    nomeFuncionario: "",
    cpf: "",
    funcao: "",
    tipoExame: "",
  })

  // Carrega dados de reuso se existirem no sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("reuse_doc_data")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.type?.includes("ASO")) {
          setFormData(parsed.data)
          setIsPreviewOpen(true)
          sessionStorage.removeItem("reuse_doc_data")
          toast({ title: "Dados carregados do histórico" })
        }
      } catch (e) {
        console.error("Erro ao carregar reuso:", e)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tipoExame: value }))
  }

  const handleGenerate = () => {
    if (!formData.empresa || !formData.nomeFuncionario || !formData.tipoExame) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Preencha a empresa, o funcionário e o tipo de exame." })
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
      type: "ENCAMINHAMENTO ASO",
      title: `ASO: ${formData.nomeFuncionario}`,
      data: formData,
      createdAt: new Date().toISOString()
    }

    setDocumentNonBlocking(doc(firestore, "generated_documents", id), docData, { merge: true })
    
    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "Documento Salvo!", description: "Histórico atualizado." })
    }, 500)
  }

  const exames = [
    "Admissional",
    "Demissional",
    "Periódico",
    "Retorno ao Trabalho",
    "Mudança de Função",
    "Audiometria"
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className={cn("space-y-6", isPreviewMode ? "lg:col-span-5 no-print" : "lg:col-span-12 max-w-4xl mx-auto")}>
        <Card className="border-[#D2D7DB] shadow-sm">
          <CardHeader className="bg-[#F7F7F7]/50 border-b">
            <CardTitle className="text-lg font-black text-[#2C4156] uppercase">Encaminhamento ASO</CardTitle>
            <CardDescription>Preencha os dados para gerar o encaminhamento médico.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Dados da Empresa</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] font-bold text-[#1FA67A] uppercase gap-1"
                  onClick={() => {
                    setIsManualClient(!isManualClient)
                    setFormData({...formData, empresa: "", cnpj: "", clientId: ""})
                  }}
                >
                  {isManualClient ? "Selecionar da Base" : "Digitar Manualmente"}
                </Button>
              </div>
              
              {!isManualClient ? (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Empresa Cliente</Label>
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
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Dados do Funcionário</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-[#39586D]">Nome do Funcionário</Label>
                  <Input name="nomeFuncionario" placeholder="Ex: João da Silva" value={formData.nomeFuncionario} onChange={(e) => setFormData({...formData, nomeFuncionario: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">CPF</Label>
                  <Input name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Função</Label>
                  <Input name="funcao" placeholder="Ex: Auxiliar Administrativo" value={formData.funcao} onChange={(e) => setFormData({...formData, funcao: e.target.value.toUpperCase()})} />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Exame</h4>
              <div className="space-y-3">
                <RadioGroup onValueChange={handleRadioChange} value={formData.tipoExame}>
                  {exames.map((exame) => (
                    <div key={exame} className="flex items-center space-x-2">
                      <RadioGroupItem value={exame} id={exame.toLowerCase()} />
                      <Label htmlFor={exame.toLowerCase()} className="text-xs text-[#39586D]">{exame}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button className="flex-1 bg-[#2C4156] font-bold gap-2 uppercase text-[10px]" onClick={handleGenerate}>
                <Eye className="h-4 w-4" /> Visualizar Documento
              </Button>
              <Button variant="outline" className="flex-1 border-[#D2D7DB] text-[#39586D] font-bold gap-2 uppercase text-[10px]" onClick={handleSaveToHistory} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Histórico
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
                <Button size="sm" className="bg-[#1FA67A] gap-2 font-bold uppercase text-[10px]" onClick={() => window.print()}>
                  <Printer className="h-3 w-3" /> GERAR PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 print:p-0">
              <div className="bg-white mx-auto w-full min-h-[297mm] flex flex-col text-black text-[14px] font-sans p-16 print-container relative">
                
                <div className="flex justify-between items-start mb-12 border-b-2 border-[#003366] pb-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col">
                      <span className="text-3xl font-serif italic text-[#003366] tracking-tighter">Prosperare</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#98A7AA]">Serviços Contábeis</span>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-[#003366] rounded-sm skew-x-[-20deg]" />
                </div>

                <div className="flex-1 space-y-12">
                  <div className="text-center space-y-2 mb-12">
                    <h2 className="text-xl font-bold uppercase">ENCAMINHAMENTO PARA REALIZAÇÃO EXAME MÉDICO OCUPACIONAL</h2>
                  </div>

                  <div className="space-y-2">
                    <p>Razão Social: <strong>{formData.empresa || "[NOME DA EMPRESA]"}</strong></p>
                    <p>CNPJ: <strong>{formData.cnpj || "[CNPJ DA EMPRESA]"}</strong></p>
                  </div>

                  <div className="text-justify leading-relaxed">
                    <p>
                      Através do presente encaminhamos o Sr(a). <strong>{formData.nomeFuncionario || "_______________________"}</strong>, com atividade profissional de <strong>{formData.funcao || "_______________________"}</strong>, CPF: <strong>{formData.cpf || "_______________________"}</strong>, para realização do exame médico:
                    </p>
                  </div>

                  <div className="space-y-3 pl-4">
                    {exames.map((exame) => (
                      <div key={exame} className="flex items-center gap-2">
                        <span className="font-mono">({formData.tipoExame === exame ? " X " : "   "})</span>
                        <span>{exame}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-20 space-y-16">
                    <p className="font-bold">Macapá - AP, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    
                    <div className="pt-8">
                      <p className="border-t border-black w-96 mb-2"></p>
                      <p className="font-bold uppercase text-[12px]">{formData.empresa || "[NOME DA EMPRESA]"}</p>
                      <p className="text-[12px]">CNPJ: {formData.cnpj || "[CNPJ DA EMPRESA]"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-t-2 border-[#003366] pt-4">
                  <div className="bg-[#003366] p-4 flex justify-between items-center text-white text-[10px] font-bold rounded-sm">
                    <span className="uppercase">PROSPERARE <span className="font-normal">Serviços Contábeis LTDA</span></span>
                    <span className="font-normal text-[8px]">Av. Acelino de Leão, nº 1046 – Trem, Macapá - Amapá</span>
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
