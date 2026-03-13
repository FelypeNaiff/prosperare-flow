
"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, Building2, ShieldCheck, TrendingUp, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientCertificatesTable } from "@/components/certificates/client-certificates-table"
import { Progress } from "@/components/ui/progress"

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
    lastGlobalSync: '22/09/2024 às 14:30'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {clientData.name}
          </h1>
          <p className="text-sm text-muted-foreground">CNPJ: {clientData.cnpj}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" /> Histórico
          </Button>
          <Button className="bg-accent hover:bg-accent/90 gap-2">
            <RefreshCw className="h-4 w-4" /> Consultar Todas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saúde Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold">{clientData.score}%</span>
              <TrendingUp className="h-5 w-5 text-emerald-500 mb-1" />
            </div>
            <Progress value={clientData.score} className="h-2" />
            <p className="text-xs text-muted-foreground mt-4">
              Última sincronização geral: {clientData.lastGlobalSync}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resumo de Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-emerald-500">4</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Válidas</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-yellow-500">1</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">A Vencer</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-orange-500">0</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Críticas</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-red-500">0</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Vencidas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certidões Negativas de Débito (CNDs)</CardTitle>
          <CardDescription>Lista completa de certidões federais, estaduais e municipais.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientCertificatesTable clientId={clientId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Consultas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { data: '22/09/2024 14:30', acao: 'Consulta Automática', status: 'Sucesso', detalhes: '5 certidões atualizadas' },
              { data: '15/09/2024 09:15', acao: 'Consulta Manual', status: 'Sucesso', detalhes: 'CND FGTS atualizada' },
              { data: '01/09/2024 23:00', acao: 'Rotina Semanal', status: 'Falha', detalhes: 'Erro de conexão portal SEFAZ' },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div className="flex gap-4">
                  <span className="text-muted-foreground font-mono">{log.data}</span>
                  <span className="font-medium">{log.acao}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{log.detalhes}</span>
                  <Badge variant={log.status === 'Sucesso' ? 'default' : 'destructive'} className={log.status === 'Sucesso' ? 'bg-emerald-500' : ''}>
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
