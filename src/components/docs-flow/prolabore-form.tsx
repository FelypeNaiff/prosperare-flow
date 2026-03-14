
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer, Download, Save, UserPlus, FileText, PenTool } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SignatureDialog } from "./signature-dialog"

export function ProlaboreForm() {
  const [isManual, setIsManual] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  const [formData, setFormData] = useState({
    socio: "",
    email: ""
  })

  const handleGenerate = () => {
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
            <Button variant="ghost" size="sm" className="text-[10px] font-bold text-[#1FA67A]" onClick={() => setIsManual(!isManual)}>
              {isManual ? "Selecionar da Base" : "Digitar Manual"}
            </Button>
          </div>

          {!isManual ? (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#39586D]">Empresa</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
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

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Dados do Sócio / Beneficiário</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold text-[#39586D]">Nome do Sócio</Label>
                <Input placeholder="Nome completo" onChange={(e) => setFormData({...formData, socio: e.target.value})} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold text-[#39586D]">E-mail para Assinatura</Label>
                <Input type="email" placeholder="socio@email.com" onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">CPF</Label>
                <Input placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Competência (Mês/Ano)</Label>
                <Input type="month" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Valor Bruto (R$)</Label>
                <Input type="number" placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#39586D]">Valor do INSS (R$)</Label>
                <Input type="number" placeholder="0,00" />
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
            <Button variant="outline" className="border-[#D2D7DB] font-bold gap-2">
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
