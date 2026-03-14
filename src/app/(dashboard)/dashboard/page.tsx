
"use client"

import { KpiCard } from "@/components/dashboard/kpi-card"
import { ObligationChart } from "@/components/dashboard/obligation-chart"
import { AttendanceChart } from "@/components/dashboard/attendance-chart"
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  TrendingUp,
  FileWarning,
  ArrowRight,
  TrendingDown,
  MessageSquare,
  FileSignature,
  Clock,
  Mail,
  Heart
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
          label="Atendimentos" 
          value="8" 
          icon={MessageSquare} 
          trend={0} 
          color="info" 
        />
        <KpiCard 
          label="Honorários Pendentes" 
          value="12" 
          icon={Clock} 
          trend={0} 
          color="warning" 
        />
        <KpiCard 
          label="Satisfação (NPS)" 
          value="9.2" 
          icon={Heart} 
          trend={2} 
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
              { type: 'Atendimento', client: 'Auto Peças Silva', task: 'Pedido Recisão', status: 'info' },
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-[#D2D7DB] bg-[#F7F7F7] text-sm hover:border-[#1FA67A] transition-colors cursor-pointer group">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  alert.status === 'danger' ? 'bg-[#E74C3C]' : 
                  alert.status === 'warning' ? 'bg-[#F2B705]' : 'bg-[#2574A9]'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#2C4156] truncate group-hover:text-[#1FA67A]">{alert.client}</p>
                  <p className="text-xs text-[#98A7AA]">{alert.task}</p>
                </div>
                <Badge 
                  className={cn(
                    "text-[10px] uppercase font-bold",
                    alert.status === 'danger' ? 'bg-[#FEE2E2] text-[#E74C3C]' : 
                    alert.status === 'warning' ? 'bg-[#FEF3C7] text-[#F2B705]' : 'bg-[#E3F0F9] text-[#2574A9]'
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
            <CardTitle className="text-[#2C4156]">Próximos Vencimentos Fatais</CardTitle>
            <CardDescription className="text-[#98A7AA]">Fique atento aos prazos da semana para evitar multas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="text-left text-[#98A7AA] border-b border-[#D2D7DB] pb-2 uppercase text-[10px] font-bold">
                       <th className="pb-2">Obrigação</th>
                       <th className="pb-2">Cliente</th>
                       <th className="pb-2">Vencimento</th>
                       <th className="pb-2">Ações</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#D2D7DB]">
                     {[
                       { doc: 'Guia DAS', cliente: 'ConstruMais Ltda', data: '20/10', status: 'danger' },
                       { doc: 'FGTS Digital', cliente: 'Restaurante Sabor', data: '20/10', status: 'warning' },
                       { doc: 'eSocial', cliente: 'Loja Variedades', data: '22/10', status: 'warning' },
                     ].map((p, i) => (
                       <tr key={i} className="hover:bg-[#F7F7F7] transition-colors group cursor-pointer">
                         <td className="py-3 font-bold text-[#2C4156] group-hover:text-[#1FA67A]">{p.doc}</td>
                         <td className="py-3 text-[#39586D]">{p.cliente}</td>
                         <td className="py-3">
                           <Badge 
                             className={cn(
                               "text-[10px] font-bold",
                               p.status === 'danger' ? 'bg-[#FEE2E2] text-[#E74C3C]' : 'bg-[#FEF3C7] text-[#F2B705]'
                             )}
                           >
                             {p.data}
                           </Badge>
                         </td>
                         <td className="py-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#1FA67A]"><Mail className="h-4 w-4" /></Button>
                         </td>
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
             <CardTitle className="text-[#2C4156]">Demanda por Departamento</CardTitle>
             <CardDescription className="text-[#98A7AA]">Distribuição de atendimentos em aberto.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
             <AttendanceChart />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
