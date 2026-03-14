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
  ArrowRight,
  TrendingDown
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">
          Painel <span className="text-[#1FA67A]">Prosperare Flow</span>
        </h1>
        <p className="text-[#98A7AA] font-medium">Bem-vindo. Aqui está o fluxo atual da sua operação contábil.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard 
          label="Clientes Ativos" 
          value="124" 
          icon={Users} 
          trend={12} 
          color="primary" 
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
          color="success" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#D2D7DB] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#2C4156]">Obrigações Fiscais por Status</CardTitle>
            <CardDescription className="text-[#98A7AA]">Resumo mensal de processos por tipo de obrigação.</CardDescription>
          </CardHeader>
          <CardContent>
            <ObligationChart />
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-[#2C4156]">Alertas Críticos</CardTitle>
              <CardDescription className="text-[#98A7AA]">Pendências que exigem atenção imediata.</CardDescription>
            </div>
            <div className="p-2 bg-[#FEE2E2] rounded-full">
              <FileWarning className="h-5 w-5 text-[#E74C3C]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { type: 'Atrasado', client: 'Posto São Bento', task: 'FGTS Digital', status: 'danger' },
              { type: 'Vencendo', client: 'Mercado Ideal', task: 'CND Federal', status: 'warning' },
              { type: 'Inadimplente', client: 'Padaria Alfa', task: 'Honorário Set/24', status: 'danger' },
              { type: 'Atrasado', client: 'Auto Peças Silva', task: 'DCTFWeb', status: 'danger' },
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-[#D2D7DB] bg-[#F7F7F7] text-sm hover:border-[#1FA67A] transition-colors cursor-pointer group">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  alert.status === 'danger' ? 'bg-[#E74C3C]' : 'bg-[#F2B705]'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#2C4156] truncate group-hover:text-[#1FA67A]">{alert.client}</p>
                  <p className="text-xs text-[#98A7AA]">{alert.task}</p>
                </div>
                <Badge 
                  className={cn(
                    "text-[10px] uppercase font-bold",
                    alert.status === 'danger' 
                      ? 'bg-[#FEE2E2] text-[#E74C3C] hover:bg-[#FEE2E2]' 
                      : 'bg-[#FEF3C7] text-[#F2B705] hover:bg-[#FEF3C7]'
                  )}
                >
                  {alert.type}
                </Badge>
              </div>
            ))}
            <Button asChild variant="ghost" className="w-full text-xs font-bold text-[#39586D] hover:bg-[#F7F7F7] hover:text-[#1FA67A]" size="sm">
              <Link href="/processos">
                Ver todos os alertas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-[#2C4156]">Certidões Urgentes</CardTitle>
            <CardDescription className="text-[#98A7AA]">CNDs com vencimento em menos de 15 dias.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="text-left text-[#98A7AA] border-b border-[#D2D7DB] pb-2 uppercase text-[10px] font-bold">
                       <th className="pb-2">Tipo</th>
                       <th className="pb-2">Cliente</th>
                       <th className="pb-2">Dias</th>
                       <th className="pb-2">Validade</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#D2D7DB]">
                     {[
                       { tipo: 'Federal', cliente: 'ConstruMais Ltda', dias: 4, validade: '15/10/24' },
                       { tipo: 'Trabalhista', cliente: 'Restaurante Sabor', dias: 7, validade: '18/10/24' },
                       { tipo: 'Estadual', cliente: 'Loja Variedades', dias: 12, validade: '23/10/24' },
                     ].map((cnd, i) => (
                       <tr key={i} className="hover:bg-[#F7F7F7] transition-colors group cursor-pointer">
                         <td className="py-3 font-bold text-[#2C4156] group-hover:text-[#1FA67A]">{cnd.tipo}</td>
                         <td className="py-3 text-[#39586D]">{cnd.cliente}</td>
                         <td className="py-3">
                           <Badge 
                             className={cn(
                               "text-[10px] font-bold",
                               cnd.dias <= 5 
                                 ? 'bg-[#FEE2E2] text-[#E74C3C] hover:bg-[#FEE2E2]' 
                                 : 'bg-[#FEF3C7] text-[#F2B705] hover:bg-[#FEF3C7]'
                             )}
                           >
                             {cnd.dias} dias
                           </Badge>
                         </td>
                         <td className="py-3 text-[#98A7AA] font-mono">{cnd.validade}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 border-[#D2D7DB]">
          <CardHeader>
             <CardTitle className="text-[#2C4156]">Regimes Tributários</CardTitle>
             <CardDescription className="text-[#98A7AA]">Distribuição da carteira de clientes.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center h-[200px] items-center">
             <div className="flex flex-wrap justify-center gap-6">
                {[
                  { label: 'Simples', value: 64, color: '#1FA67A' },
                  { label: 'Presumido', value: 28, color: '#39586D' },
                  { label: 'MEI', value: 20, color: '#2C4156' },
                  { label: 'Lucro Real', value: 12, color: '#2574A9' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 group cursor-default">
                    <div 
                      className={cn("w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transition-transform group-hover:scale-110")}
                      style={{ backgroundColor: item.color }}
                    >
                      {item.value}
                    </div>
                    <span className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-tighter text-center max-w-[60px]">{item.label}</span>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
