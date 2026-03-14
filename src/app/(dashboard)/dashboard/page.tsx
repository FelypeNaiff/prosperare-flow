
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
  Heart,
  Video,
  CreditCard
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 border-[#D2D7DB] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#2C4156]">Obrigações Fiscais por Status</CardTitle>
            <CardDescription className="text-[#98A7AA]">Resumo mensal de processos por tipo de obrigação.</CardDescription>
          </CardHeader>
          <CardContent>
            <ObligationChart />
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-[#D2D7DB] bg-[#F7F7F7]/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Alertas de Parcelamento</CardTitle>
                <CardDescription className="text-[10px] font-bold text-[#98A7AA]">Vencendo esta semana.</CardDescription>
              </div>
              <div className="p-2 bg-[#FEF3C7] rounded-full">
                <CreditCard className="h-4 w-4 text-[#F2B705]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#F2B705]/20 shadow-sm">
                <div>
                  <p className="text-xs font-black text-[#2C4156]">8 Parcelas Pendentes</p>
                  <p className="text-[10px] text-[#98A7AA]">Total: R$ 4.250,00</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-[#F2B705] hover:text-[#F2B705] hover:bg-[#F2B705]/5">
                  <Link href="/processos/parcelamentos">Ver Tudo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#D2D7DB] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-[#2C4156]">Agenda de Hoje</CardTitle>
                <CardDescription className="text-[#98A7AA]">Reuniões e consultorias.</CardDescription>
              </div>
              <div className="p-2 bg-[#E3F0F9] rounded-full">
                <Calendar className="h-5 w-5 text-[#2574A9]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { time: '10:00', client: 'Padaria Central', type: 'Video', status: 'confirm' },
                { time: '14:30', client: 'Oficina do João', type: 'Presencial', status: 'pending' },
              ].map((meet, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-[#F7F7F7] hover:border-[#1FA67A] transition-colors cursor-pointer group">
                  <div className="text-xs font-black text-[#2C4156] border-r pr-3">{meet.time}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#2C4156] truncate group-hover:text-[#1FA67A]">{meet.client}</p>
                    <p className="text-[10px] text-[#98A7AA]">{meet.type}</p>
                  </div>
                  {meet.type === 'Video' && <Video className="h-3 w-3 text-[#1FA67A]" />}
                </div>
              ))}
              <Button asChild variant="ghost" className="w-full text-xs font-bold text-[#39586D]" size="sm">
                <Link href="/agenda">Ver agenda completa <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#D2D7DB] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-[#2C4156]">Alertas Críticos</CardTitle>
                <CardDescription className="text-[#98A7AA]">Atenção imediata.</CardDescription>
              </div>
              <div className="p-2 bg-[#FEE2E2] rounded-full">
                <FileWarning className="h-5 w-5 text-[#E74C3C]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { type: 'Atrasado', client: 'Posto São Bento', task: 'FGTS Digital', status: 'danger' },
                { type: 'Vencendo', client: 'Mercado Ideal', task: 'CND Federal', status: 'warning' },
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
                      "text-[9px] uppercase font-bold",
                      alert.status === 'danger' ? 'bg-[#FEE2E2] text-[#E74C3C]' : 'bg-[#FEF3C7] text-[#F2B705]'
                    )}
                  >
                    {alert.type}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-[#2C4156]">Próximos Vencimentos Fatais</CardTitle>
            <CardDescription className="text-[#98A7AA]">Prazos da semana para evitar multas.</CardDescription>
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
