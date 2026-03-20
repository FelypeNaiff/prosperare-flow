"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Printer, Eye, Loader2, X, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { format, parseISO, isValid } from "date-fns"
import { ClientSearchSelect } from "@/components/clients/client-search-select"

export function TerminationTermForm() {
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
    funcionario: "",
    cpf: "",
    emailFuncionario: "",
    valor: "",
    valorExtenso: "",
    admissao: "",
    demissao: "",
    calculo: ""
  })

  // Carrega dados de reuso se existirem no sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("reuse_doc_data")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.type?.includes("RESCISÃO")) {
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

  const handleGenerate = () => {
    if (!formData.empresa || !formData.funcionario || !formData.valor) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Preencha os dados básicos da rescisão." })
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
      type: "RESCISÃO (TERMO)",
      title: `RESCISÃO: ${formData.funcionario}`,
      data: formData,
      createdAt: new Date().toISOString()
    }

    setDocumentNonBlocking(doc(firestore, "generated_documents", id), docData, { merge: true })
    
    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "Documento Salvo!", description: "Histórico atualizado." })
    }, 500)
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
      <div className={cn("space-y-6", isPreviewMode ? "lg:col-span-5 no-print" : "lg:col-span-12 max-w-4xl mx-auto")}>
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
                  <Label className="text-xs font-bold text-[#39586D]">Nome Completo</Label>
                  <Input placeholder="Nome do colaborador" value={formData.funcionario} onChange={(e) => setFormData({...formData, funcionario: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">CPF</Label>
                  <Input placeholder="000.000.000-00" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
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
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Valores</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Valor Total Líquido (R$)</Label>
                  <Input type="number" placeholder="0,00" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-[#39586D]">Espelho de Cálculo (Detalhamento)</Label>
                  <Textarea placeholder="Descreva as verbas..." className="h-24 text-xs font-mono" value={formData.calculo} onChange={(e) => setFormData({...formData, calculo: e.target.value})} />
                </div>
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
              <div className="bg-white mx-auto w-full min-h-[297mm] flex flex-col text-black text-[12px] font-serif p-16 print-container relative">
                
                <div className="flex justify-between items-start mb-8 border-b-2 border-[#003366] pb-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col">
                      <span className="text-3xl font-serif italic text-[#003366] tracking-tighter">Prosperare</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#98A7AA]">Serviços Contábeis</span>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-[#003366] rounded-sm skew-x-[-20deg]" />
                </div>

                <div className="flex-1 space-y-8">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-xl font-black uppercase underline underline-offset-8">TERMO DE QUITAÇÃO DE RESCISÃO CONTRATUAL</h2>
                  </div>

                  <div className="space-y-6 text-justify leading-relaxed text-black">
                    <p>
                      Que entre si fazem na melhor forma de direito, de um lado <strong>{formData.empresa || "[CLIENTE]"}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ nº <strong>{formData.cnpj || "[CNPJ]"}</strong>, a seguir chamado apenas de <strong>EMPREGADOR</strong>, e de outro lado <strong>{formData.funcionario || "[NOME DO FUNCIONÁRIO]"}</strong>, pessoa física, portador do CPF <strong>{formData.cpf || "[CPF]"}</strong>, a seguir chamado apenas de <strong>EMPREGADO</strong>.
                    </p>

                    <p>
                      O EMPREGADO recebe neste ato do EMPREGADOR a importância de <strong>R$ {Number(formData.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, em moeda corrente e legal do país, valor esse que se refere a quitação do contrato de trabalho, firmado entre as partes, desde <strong>{formatDate(formData.admissao)}</strong> a <strong>{formatDate(formData.demissao)}</strong>.
                    </p>

                    <div className="space-y-2">
                      <h3 className="font-black border-b pb-1 text-[10px] uppercase tracking-widest text-black">ESPELHO DE CÁLCULO</h3>
                      <div className="bg-slate-50 p-4 rounded font-mono whitespace-pre-wrap text-[11px] min-h-[100px] border border-slate-100 text-black">
                        {formData.calculo || "[DETALHAMENTO DO CÁLCULO]"}
                      </div>
                    </div>

                    <p>
                      O EMPREGADO, uma vez recebendo a importância em moeda corrente do país nesta data, bem como assinando este termo, dá ao EMPREGADOR, <strong>PLENA E GERAL QUITAÇÃO</strong>, para nada mais reclamar em época alguma, seja a que título for, em relação a obrigações presentes ou futuras, em se tratando não somente do mencionado Contrato de Trabalho, mas também de todo período que ficou para trás da data deste referido TERMO, abrindo mão também de qualquer ação civil, criminal ou trabalhista.
                    </p>
                  </div>

                  <div className="mt-12 space-y-12">
                    <p className="text-right text-black font-bold">Macapá - AP, {new Date().toLocaleDateString('pt-BR')}</p>
                    
                    <div className="grid grid-cols-2 gap-12 text-center pt-8">
                      <div className="border-t border-black pt-2">
                        <p className="font-bold uppercase text-[10px] text-black">{formData.empresa || "EMPREGADOR"}</p>
                        <p className="text-[8px] text-black/60 uppercase tracking-widest">Carimbo e Assinatura</p>
                      </div>
                      <div className="border-t border-black pt-2">
                        <p className="font-bold uppercase text-[10px] text-black">{formData.funcionario || "EMPREGADO"}</p>
                        <p className="text-[8px] text-black/60 uppercase tracking-widest">Assinatura do Recebedor</p>
                      </div>
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