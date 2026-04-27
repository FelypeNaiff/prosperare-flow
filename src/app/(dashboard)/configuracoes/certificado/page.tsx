
"use client"

import { Key, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function CertificadoEscritorioPage() {
  const certValido = true
  const diasParaVencer = 124

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Certificado Digital</h1>
        <p className="text-[#98A7AA] font-medium">Gestão da assinatura digital do escritório para processos automáticos.</p>
      </div>

      {certValido ? (
        <Alert className="bg-[#7ED6B5]/20 border-[#1FA67A]/20 text-[#1FA67A]">
          <CheckCircle2 className="h-5 w-5" />
          <AlertTitle className="font-bold">Certificado digital verificado</AlertTitle>
          <AlertDescription>
            Seu certificado está configurado e pronto para uso em automações.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Certificado vencido ou não configurado</AlertTitle>
          <AlertDescription>
            Alguns processos automáticos podem falhar sem um certificado válido.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-[#D2D7DB]">
        <CardHeader>
          <CardTitle className="text-[#2C4156] flex items-center gap-2">
            <Key className="h-5 w-5 text-[#1FA67A]" />
            Dados do Certificado
          </CardTitle>
          <CardDescription>
            Utilizamos o certificado digital para realizar os processos solicitados automaticamente através dos portais do governo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Data de Vencimento</Label>
              <div className="flex gap-2">
                <Input readOnly defaultValue="15/05/2025" className="bg-[#F7F7F7] border-[#D2D7DB]" />
                <Badge className="bg-[#7ED6B5] text-[#1FA67A] whitespace-nowrap flex items-center px-3 border-none">
                  Vence em {diasParaVencer} dias
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Ações Disponíveis</Label>
              <Button className="w-full bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold">
                <RefreshCw className="h-4 w-4" /> Atualizar Certificado Digital
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
