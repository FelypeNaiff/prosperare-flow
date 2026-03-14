
"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, Building2, ShieldCheck, TrendingUp, History, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientCertificatesTable } from "@/components/certificates/client-certificates-table"
import { Progress } from "@/components/ui/progress"
import { ClientCommunicationTool } from "@/components/clients/client-communication-tool"

export default function DetalhesEmpresaCertidoesPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  // Mock de dados da empresa específica
  const clientData = {
    id: clientId,
    name: 'Padaria Central Ltda',
    cnpj: '12.345.678/0001-90',
    score: 92,
    regime: 'Simples Nacional',
    email: 'contato@padariacentral.com.br',
    lastGlobalSync: '22/09/2024 às 14:30'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#39586D]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#2C4156]">{clientData.name}</h1>
            <Badge variant="outline" className="border-[#D2D7DB] text-[#39586D] uppercase text-[10px] font-bold">{clientData.regime}</Badge>
          </div>
          <p className="text-sm text-[#98A7AA] font-bold">CNPJ: {clientData.cnpj}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <ClientCommunicationTool 
            client={{ name: clientData.name, email: clientData.email, regime: clientData.regime }}
            trigger={
              <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] font-bold">
                <Mail className="h-4 w-4" /> Enviar Relatório
              </Button>
            }
          />
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold shadow-lg shadow-emerald-500/20">
            <RefreshCw className="h-4 w-4" /> Atualizar CNDs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-[#D2D7DB] overflow-hidden">
          <div className="h-1.5 bg-[#1FA67A]" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Score de Saúde Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black text-[#2C4156]">{clientData.score}%</span>
              <TrendingUp className="h-6 w-6 text-[#1FA67A] mb-1" />
            </div>
            <Progress value={clientData.score} className="h-2 bg-[#F7F7F7]" />
            <p className="text-[10px] text-[#98A7AA] font-bold mt-4 uppercase">
              Última varredura completa: {clientData.lastGlobalSync}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-[#D2D7DB]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Resumo de Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-around py-4">
            <StatusMetric label="Válidas" value="4" color="#1FA67A" />
            <StatusMetric label="A Vencer" value="1" color="#F2B705" />
            <StatusMetric label="Críticas" value="0" color="#E67E22" />
            <StatusMetric label="Vencidas" value="0" color="#E74C3C" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Certidões Negativas de Débito (CNDs)</CardTitle>
          <CardDescription className="text-xs font-bold text-[#98A7AA]">Acompanhamento em tempo real das certidões federais, estaduais e municipais.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6">
            <ClientCertificatesTable clientId={clientId} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#D2D7DB]">
        <CardHeader>
          <CardTitle className="text-sm font-black text-[#2C4156] uppercase flex items-center gap-2">
            <History className="h-4 w-4 text-[#1FA67A]" />
            Log de Consultas e Alterações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#F7F7F7]">
            {[
              { data: '22/09/2024 14:30', acao: 'Consulta Automática', status: 'Sucesso', detalhes: '5 certidões atualizadas via robô.' },
              { data: '15/09/2024 09:15', acao: 'Consulta Manual', status: 'Sucesso', detalhes: 'CND FGTS atualizada por Ricardo Santos.' },
              { data: '01/09/2024 23:00', acao: 'Rotina Semanal', status: 'Falha', detalhes: 'Erro de conexão com portal SEFAZ-AP.' },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-[#F7F7F7]/50 transition-colors">
                <div className="flex gap-6">
                  <span className="text-[10px] text-[#98A7AA] font-mono font-bold">{log.data}</span>
                  <div>
                    <p className="text-xs font-black text-[#2C4156] uppercase">{log.acao}</p>
                    <p className="text-[10px] text-[#39586D] font-medium">{log.detalhes}</p>
                  </div>
                </div>
                <Badge className={cn(
                  "text-[9px] font-black uppercase border-none",
                  log.status === 'Sucesso' ? "bg-[#7ED6B5] text-[#1FA67A]" : "bg-[#FEE2E2] text-[#E74C3C]"
                )}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusMetric({ label, value, color }: any) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl font-black" style={{ color }}>{value}</span>
      <span className="text-[9px] uppercase font-black text-[#98A7AA] tracking-tighter">{label}</span>
    </div>
  )
}
