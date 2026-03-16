
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, Download, Save, UserPlus, FileText, PenTool, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SignatureDialog } from "./signature-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"

export function ProlaboreForm() {
  const firestore = useFirestore()
  const [isManual, setIsManual] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    empresa: "",
    cnpj: "",
    socio: "",
    email: "",
    competencia: "",
    valorBruto: "",
    inss: ""
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
    if (!formData.empresa || !formData.socio) {
      toast({ variant: "destructive", title: "Erro", description: "Dados da empresa e do sócio são obrigatórios." })
      return
    }
    toast({ title: "Declaração de Pró-labore Gerada!" })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <CardTitle className="text-lg font-black text-[#2C4156] uppercase">Declaração de Pró-labore Avulso</CardTitle>
          <CardDescription>Emita comprovantes de rendimento de sócios rapidamente.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
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

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Dados do Sócio / Beneficiário</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold text-[#39586D]">Nome do Sócio</Label>
                <Input placeholder="Nome completo" value={formData.socio} onChange={(e) => setFormData({...formData, socio: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold text-[#39586D]">E-mail para Assinatura</Label>
                <Input type="email" placeholder="socio@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">CPF</Label>
                <Input placeholder="000.000.000-00" />
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
                <Label className="text-xs font-bold text-[#39586D]">Valor do INSS (R$)</Label>
                <Input type="number" placeholder="0,00" value={formData.inss} onChange={(e) => setFormData({...formData, inss: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button className="flex-1 bg-[#1FA67A] font-bold gap-2" onClick={handleGenerate}>
              <Printer className="h-4 w-4" /> Gerar Documento
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-[#2574A9] text-[#2574A9] hover:bg-[#2574A9]/5 font-bold gap-2"
              onClick={() => setIsSignatureOpen(true)}
            >
              <PenTool className="h-4 w-4" /> Enviar p/ Assinatura
            </Button>
            <Button variant="outline" className="border-[#D2D7DB] font-bold gap-2 text-[#39586D]">
              <Save className="h-4 w-4" /> Salvar Histórico
            </Button>
          </div>
        </CardContent>
      </Card>

      <SignatureDialog 
        open={isSignatureOpen} 
        onOpenChange={setIsSignatureOpen} 
        documentTitle="Declaração de Pró-labore"
        recipientName={formData.socio || "Sócio"}
        recipientEmail={formData.email || "socio@email.com"}
      />
    </div>
  )
}
