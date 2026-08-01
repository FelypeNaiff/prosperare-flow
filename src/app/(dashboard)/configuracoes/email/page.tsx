
"use client"

import { Mail, CheckCircle2, Save, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export default function EmailConfigPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">E-mail de Disparo</h1>
        <p className="text-[#98A7AA] font-medium">Configure como o sistema envia notificações e documentos aos clientes.</p>
      </div>

      <Alert className="bg-[#7ED6B5]/20 border-[#2563EB]/20 text-[#2563EB]">
        <CheckCircle2 className="h-5 w-5" />
        <AlertTitle className="font-bold">E-mail de disparo verificado</AlertTitle>
        <AlertDescription>Seu servidor SMTP está conectado e as mensagens estão sendo entregues.</AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-lg">Servidor SMTP</CardTitle>
            <CardDescription>Utilize nosso serviço padrão ou integre seu próprio servidor para maior personalização.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">E-mail configurado</Label>
              <Input readOnly defaultValue="envios@prosperare.com.br" className="bg-[#F7F7F7]" />
            </div>
            <Button variant="outline" className="w-full border-[#D2D7DB] font-bold text-[#39586D]">Configurar e-mail de disparo</Button>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Repeat className="h-5 w-5 text-[#2563EB]" />
              Régua de Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold">Habilitar Recurso</Label>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Repetir envio a cada:</Label>
              <Select defaultValue="2">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 dia</SelectItem>
                  <SelectItem value="2">2 dias</SelectItem>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="5">5 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-[#98A7AA] italic">O sistema enviará até que o cliente confirme a leitura.</p>
            <Button className="w-full bg-[#2563EB] font-bold">Salvar Configuração</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
