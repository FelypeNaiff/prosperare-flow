"use client"

import { KpiCard } from "@/components/dashboard/kpi-card"
import { ObligationChart } from "@/components/dashboard/obligation-chart"
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  TrendingUp,
  FileWarning,
  ArrowRight
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
        <p className="text-muted-foreground">Bem-vindo ao ContaHub. Aqui está um resumo da sua operação.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard 
          label="Clientes Ativos" 
          value="124" 
          icon={Users} 
          trend={12} 
          color="info" 
        />
        <KpiCard 
          label="Processos em Dia" 
          value="85%" 
          icon={CheckCircle2} 
          trend={5} 
          color="success" 
        />
        <KpiCard 
          label="Tarefas Atrasadas" 
          value="14" 
          icon={AlertCircle} 
          trend={-2} 
          color="destructive" 
        />
        <KpiCard 
          label="Certidões a Vencer" 
          value="8" 
          icon={Calendar} 
          trend={0} 
          color="warning" 
        />
        <KpiCard 
          label="Receita do Mês" 
          value="R$ 42.500" 
          icon={TrendingUp} 
          trend={8} 
          color="info" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Obrigações Fiscais por Status</CardTitle>
            <CardDescription>Resumo mensal de processos por tipo de obrigação.</CardDescription>
          </CardHeader>
          <CardContent>
            <ObligationChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Alertas Críticos</CardTitle>
              <CardDescription>Pendências que exigem atenção imediata.</CardDescription>
            </div>
            <FileWarning className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { type: 'Atrasado', client: 'Posto São Bento', task: 'FGTS Digital', status: 'danger' },
              { type: 'Vencendo', client: 'Mercado Ideal', task: 'CND Federal', status: 'warning' },
              { type: 'Inadimplente', client: 'Padaria Alfa', task: 'Honorário Set/24', status: 'danger' },
              { type: 'Atrasado', client: 'Auto Peças Silva', task: 'DCTFWeb', status: 'danger' },
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border bg-background/50 text-sm">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  alert.status === 'danger' ? 'bg-destructive' : 'bg-chart-2'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{alert.client}</p>
                  <p className="text-xs text-muted-foreground">{alert.task}</p>
                </div>
                <Badge variant={alert.status === 'danger' ? 'destructive' : 'outline'}>
                  {alert.type}
                </Badge>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-sm" size="sm">
              Ver todos os alertas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Certidões Urgentes</CardTitle>
            <CardDescription>CNDs com vencimento em menos de 15 dias.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="text-left text-muted-foreground border-b pb-2">
                     <th className="font-medium pb-2">Tipo</th>
                     <th className="font-medium pb-2">Cliente</th>
                     <th className="font-medium pb-2">Dias</th>
                     <th className="font-medium pb-2">Validade</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {[
                     { tipo: 'Federal', cliente: 'ConstruMais Ltda', dias: 4, validade: '15/10/24' },
                     { tipo: 'Trabalhista', cliente: 'Restaurante Sabor', dias: 7, validade: '18/10/24' },
                     { tipo: 'Estadual', cliente: 'Loja Variedades', dias: 12, validade: '23/10/24' },
                   ].map((cnd, i) => (
                     <tr key={i} className="hover:bg-muted/50 transition-colors">
                       <td className="py-3 font-medium">{cnd.tipo}</td>
                       <td className="py-3">{cnd.cliente}</td>
                       <td className="py-3">
                         <Badge variant={cnd.dias <= 5 ? 'destructive' : 'outline'}>
                           {cnd.dias} dias
                         </Badge>
                       </td>
                       <td className="py-3 text-muted-foreground">{cnd.validade}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
             <CardTitle>Regimes Tributários</CardTitle>
             <CardDescription>Distribuição da carteira de clientes.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center h-[200px] items-center">
             <div className="flex flex-wrap justify-center gap-4">
                {[
                  { label: 'Simples Nacional', value: 64, color: 'bg-chart-1' },
                  { label: 'Lucro Presumido', value: 28, color: 'bg-chart-3' },
                  { label: 'MEI', value: 20, color: 'bg-chart-2' },
                  { label: 'Lucro Real', value: 12, color: 'bg-chart-4' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-white font-bold", item.color)}>
                      {item.value}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
