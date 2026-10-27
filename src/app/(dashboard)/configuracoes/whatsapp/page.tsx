
"use client"

import { MessageSquare, CheckCircle2, Save, Plus, Edit, RadioTower } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

const TEMPLATES = [
  { name: 'Envio de guia DAS/PGDAS', text: 'Olá {nome_cliente}, sua guia de imposto no valor de {valor} vence dia {vencimento}.', active: true },
  { name: 'Envio de certidão', text: 'Informamos que a certidão {tipo} foi renovada com sucesso.', active: true },
  { name: 'Aviso de vencimento', text: 'Atenção {nome_cliente}, temos obrigações vencendo nos próximos dias.', active: false },
]

export default function WhatsappConfigPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">WhatsApp</h1>
          <p className="text-[#98A7AA] font-medium">Integração para envio de guias e comunicados instantâneos.</p>
        </div>
        <Button className="bg-[#2563EB] font-bold">Integrar número</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-[#D2D7DB]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Modelos de Mensagem</CardTitle>
              <Button variant="ghost" size="sm" className="text-[#2563EB] font-bold"><Plus className="h-4 w-4 mr-1" /> Novo modelo</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t">
              {TEMPLATES.map((tpl, i) => (
                <div key={i} className="p-4 flex justify-between items-start hover:bg-[#F7F7F7]">
                  <div className="space-y-1 pr-4">
                    <p className="text-sm font-bold text-[#2C4156]">{tpl.name}</p>
                    <p className="text-xs text-[#98A7AA] line-clamp-2 italic">"{tpl.text}"</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={tpl.active ? "bg-[#7ED6B5] text-[#2563EB] border-none" : "bg-slate-200 text-slate-500"}>
                      {tpl.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-[#D2D7DB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#98A7AA]">Status da Conexão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="font-bold text-[#2563EB]">Conectado</span>
              </div>
              <p className="text-xs text-[#98A7AA] mt-2">Instância: Macapá-01</p>
            </CardContent>
          </Card>

          <Card className="border-[#D2D7DB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#98A7AA]">Formato de Envio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup defaultValue="link">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="link" id="link" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="link" className="text-sm font-bold">Via link (acesso externo)</Label>
                    <Badge variant="outline" className="w-fit text-[9px] uppercase border-[#2563EB] text-[#2563EB] bg-[#7ED6B5]/10">✓ Rastreável</Badge>
                  </div>
                </div>
                <div className="flex items-start space-x-2 pt-2">
                  <RadioGroupItem value="anexo" id="anexo" />
                  <Label htmlFor="anexo" className="text-sm font-bold">Como anexo (envio direto)</Label>
                </div>
              </RadioGroup>
              <Separator />
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Fora do horário comercial</Label>
                  <Switch />
                </div>
                <Alert className="bg-[#E3F0F9] border-none p-3">
                  <AlertDescription className="text-[10px] text-[#2574A9] font-bold">
                    Seus envios serão realizados das 7:00 às 19:00, de segunda a sábado.
                  </AlertDescription>
                </Alert>
              </div>
              <Button className="w-full bg-[#2563EB] font-bold text-xs mt-4">Salvar Configuração</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
