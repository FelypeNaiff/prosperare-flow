
"use client"

import { Link as LinkIcon, Check, Plus, ExternalLink, Sparkles, MessageSquare, Search, Building2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

const INTEGRATIONS = [
  { id: 'receitaws', name: 'ReceitaWS (CNPJ)', description: 'Consulta automática de dados cadastrais via CNPJ.', status: 'Conectado', icon: Search, color: 'text-[#1FA67A]' },
  { id: 'gemini', name: 'Gemini AI (Google)', description: 'Assistente de inteligência artificial para redação e análise.', status: 'Conectado', icon: Sparkles, color: 'text-[#2574A9]' },
  { id: 'whatsapp', name: 'WhatsApp API', description: 'Envio automático de guias e notificações instantâneas.', status: 'Não conectado', icon: MessageSquare, color: 'text-[#98A7AA]' },
  { id: 'asaas', name: 'Asaas Financial', description: 'Geração automática de boletos bancários e cobrança via Pix.', status: 'Não conectado', icon: CreditCard, color: 'text-[#98A7AA]' },
  { id: 'focusnfe', name: 'Focus NFe', description: 'Emissão e gestão de notas fiscais de serviço e mercadoria.', status: 'Não conectado', icon: FileText, color: 'text-[#98A7AA]' },
  { id: 'sefa', name: 'SEFA-AP (Estado)', description: 'Integração direta para emissão de CND Estadual Amapá.', status: 'Não conectado', icon: Building2, color: 'text-[#98A7AA]' },
]

export default function IntegracoesPage() {
  const handleConnect = (name: string) => {
    toast({ title: `Iniciando integração com ${name}...` })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Integrações</h1>
        <p className="text-[#98A7AA] font-medium">Conecte o Prosperare Flow com as ferramentas que seu escritório já utiliza.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATIONS.map((item) => (
          <Card key={item.id} className="border-[#D2D7DB] flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg bg-[#F7F7F7]", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold text-[#2C4156]">{item.name}</CardTitle>
                </div>
              </div>
              <Badge className={cn(
                "text-[9px] uppercase font-bold",
                item.status === 'Conectado' ? "bg-[#7ED6B5] text-[#1FA67A]" : "bg-slate-100 text-slate-500"
              )}>
                {item.status}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs text-[#39586D] leading-relaxed">{item.description}</p>
            </CardContent>
            <CardFooter className="bg-[#F7F7F7]/50 border-t mt-4 p-3">
              <Button 
                variant={item.status === 'Conectado' ? "outline" : "default"}
                size="sm" 
                className={cn(
                  "w-full text-[10px] font-bold uppercase",
                  item.status === 'Conectado' ? "border-[#D2D7DB]" : "bg-[#1FA67A]"
                )}
                onClick={() => handleConnect(item.name)}
              >
                {item.status === 'Conectado' ? "Configurar" : "Conectar agora"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

function FileText(props: any) {
  return <FileTextIcon {...props} />
}
import { FileText as FileTextIcon } from "lucide-react"
