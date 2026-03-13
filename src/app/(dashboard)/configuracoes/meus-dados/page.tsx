
"use client"

import { useState } from "react"
import { Building, Save, Upload, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

export default function MeusDadosPage() {
  const [isDirty, setIsDirty] = useState(false)

  const handleSave = () => {
    toast({
      title: "Configurações salvas com sucesso!",
      className: "bg-[#1FA67A] text-white border-none",
    })
    setIsDirty(false)
  }

  const simulateCep = (cep: string) => {
    if (cep.length === 8) {
      toast({ title: "Endereço localizado!" })
      // Aqui entraria a lógica de auto-preenchimento via API
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Meus Dados</h1>
          <p className="text-[#98A7AA] font-medium">Informações cadastrais do seu escritório contábil.</p>
        </div>
        {isDirty && (
          <Badge className="bg-[#F2B705] text-black border-none animate-pulse">
            Você tem alterações não salvas
          </Badge>
        )}
      </div>

      <Card className="border-[#D2D7DB] shadow-sm">
        <CardHeader className="border-b bg-[#F7F7F7]/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5 text-[#1FA67A]" />
            Perfil do Escritório
          </CardTitle>
          <CardDescription>Estes dados são utilizados na geração automática de contratos e documentos do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-[#D2D7DB] flex flex-col items-center justify-center bg-[#F7F7F7] hover:bg-white transition-colors cursor-pointer group">
                <Upload className="h-8 w-8 text-[#98A7AA] group-hover:text-[#1FA67A]" />
                <span className="text-[10px] font-bold text-[#98A7AA] uppercase mt-2">Logo 512x512</span>
              </div>
              <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase border-[#D2D7DB]">Alterar Foto</Button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Razão Social / Nome</Label>
                <Input defaultValue="Prosperare Flow Soluções Contábeis Ltda" onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Nome Fantasia</Label>
                <Input defaultValue="Prosperare Flow" onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">CNPJ / CPF</Label>
                <Input defaultValue="12.345.678/0001-90" onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Celular do Responsável</Label>
                <Input defaultValue="(96) 98122-3344" onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">CEP</Label>
              <Input placeholder="00000-000" onBlur={(e) => simulateCep(e.target.value)} onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Rua + Número</Label>
              <Input defaultValue="Av. FAB, 1000" onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Bairro</Label>
              <Input defaultValue="Centro" onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Município</Label>
              <Input defaultValue="Macapá" onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Estado</Label>
              <Input defaultValue="AP" onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">E-mail Principal</Label>
              <Input defaultValue="contato@prosperare.com.br" onChange={() => setIsDirty(true)} className="border-[#D2D7DB]" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-[#F7F7F7] flex justify-end p-4 border-t border-[#D2D7DB]">
          <Button onClick={handleSave} className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold px-8">
            <Save className="h-4 w-4" /> Salvar alterações
          </Button>
        </CardFooter>
      </Card>

      <Alert className="bg-[#E3F0F9] border-[#2574A9]/20 text-[#2574A9]">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs font-bold">
          Estes dados são utilizados na geração automática de contratos e documentos do sistema.
        </AlertDescription>
      </Alert>
    </div>
  )
}
