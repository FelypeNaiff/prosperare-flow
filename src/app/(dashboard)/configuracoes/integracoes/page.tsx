
"use client"

import { Link as LinkIcon, Check, Plus, ExternalLink, Sparkles, MessageSquare, Search, Building2, CreditCard, Send, MapPin, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const INTEGRATIONS = [
  { 
    id: 'brasil-api', 
    name: 'Brasil API', 
    description: 'A mais completa: Consulta de CNPJ, CEP, Bancos, FIPE e Feriados nacionais.', 
    status: 'Conectado', 
    icon: Globe, 
    color: 'text-[#2563EB]',
    url: 'https://brasilapi.com.br'
  },
  { 
    id: 'viacep', 
    name: 'ViaCEP', 
    description: 'O padrão de mercado para validação de endereços e preenchimento automático via CEP.', 
    status: 'Conectado', 
    icon: MapPin, 
    color: 'text-[#2574A9]',
    url: 'https://viacep.com.br'
  },
  { 
    id: 'telegram', 
    name: 'Telegram Bot API', 
    description: 'Envio de alertas de vencimento de guias e notificações críticas diretamente aos clientes.', 
    status: 'Não conectado', 
    icon: Send, 
    color: 'text-[#98A7AA]',
    url: 'https://core.telegram.org/bots/api'
  },
  { 
    id: 'cnpj-ws', 
    name: 'CNPJ.ws', 
    description: 'Consulta avançada de CNPJ com dados detalhados de sócios e histórico de Simples Nacional.', 
    status: 'Não conectado', 
    icon: Search, 
    color: 'text-[#98A7AA]',
    url: 'https://cnpj.ws'
  },
  { 
    id: 'opencnpj', 
    name: 'OpenCNPJ', 
    description: 'Focada em dados abertos da Receita Federal. Ideal para enriquecimento de base de dados.', 
    status: 'Não conectado', 
    icon: Building2, 
    color: 'text-[#98A7AA]',
    url: 'https://opencnpj.org'
  },
  { 
    id: 'gemini', 
    name: 'Gemini AI (Google)', 
    description: 'Assistente de inteligência artificial para redação de e-mails e análise documental.', 
    status: 'Conectado', 
    icon: Sparkles, 
    color: 'text-[#2574A9]',
    url: '#'
  },
]

export default function IntegracoesPage() {
  const handleConnect = (name: string) => {
    toast({ title: `Configurando integração com ${name}...` })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Ecossistema de APIs</h1>
        <p className="text-[#98A7AA] font-bold text-sm">Conecte o Prosperare Flow com as melhores fontes de dados gratuitas do mercado.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATIONS.map((item) => (
          <Card key={item.id} className="border-[#D2D7DB] flex flex-col hover:shadow-md transition-all group">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg bg-[#F7F7F7] group-hover:scale-110 transition-transform", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-black text-[#2C4156] uppercase">{item.name}</CardTitle>
                </div>
              </div>
              <Badge className={cn(
                "text-[9px] uppercase font-black tracking-widest border-none",
                item.status === 'Conectado' ? "bg-[#7ED6B5] text-[#2563EB]" : "bg-slate-100 text-slate-500"
              )}>
                {item.status}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-xs text-[#39586D] font-medium leading-relaxed">{item.description}</p>
              {item.url !== '#' && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1 text-[10px] font-black text-[#2563EB] uppercase mt-4 hover:underline"
                >
                  Documentação <ExternalLink className="h-2 w-2" />
                </a>
              )}
            </CardContent>
            <CardFooter className="bg-[#F7F7F7]/50 border-t mt-4 p-3">
              <Button 
                variant={item.status === 'Conectado' ? "outline" : "default"}
                size="sm" 
                className={cn(
                  "w-full text-[10px] font-black uppercase tracking-widest",
                  item.status === 'Conectado' ? "border-[#D2D7DB] text-[#2C4156]" : "bg-[#2563EB] hover:bg-[#2563EB]/90"
                )}
                onClick={() => handleConnect(item.name)}
              >
                {item.status === 'Conectado' ? "Gerenciar Chaves" : "Conectar Agora"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
