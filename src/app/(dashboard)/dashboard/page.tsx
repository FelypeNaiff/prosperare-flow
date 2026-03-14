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
  MessageSquare,
  Clock,
  Mail,
  Heart,
  Video,
  CreditCard,
  ShieldAlert,
  Wifi,
  Activity,
  Zap
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">
            Painel <span className="text-[#1FA67A]">Prosperare Flow</span>
          </h1>
          <p className="text-[#98A7AA] font-medium">Bem-vindo. Aqui está o fluxo atual da sua operação contábil.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border rounded-lg px-4 py-2 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#1FA67A] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-[#98A7AA]">Sincronização</span>
              <span className="text-xs font-bold text-[#2C4156]">Em tempo real</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta Crítico de Exclusão do Simples */}
      <Alert className="bg-[#FEE2E2] border-[#E74C3C]/20 text-[#E74C3C] shadow-lg animate-in slide-in-from-top duration-700">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle className="font-black uppercase text-xs tracking-widest">Alerta Crítico: Risco de Exclusão do Simples</AlertTitle>
        <AlertDescription className="text-xs font-bold mt-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <span>O cliente <strong>Consultoria Tech</strong> teve um parcelamento de Simples Nacional cancelado. Risco de desenquadramento imediato!</span>
          <Button asChild variant="destructive" size="sm" className="h-7 text-[10px] font-black uppercase bg-[#E74C3C] border-none shadow-md">
            <Link href="/processos/parcelamentos">Resolver Agora <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Clientes" value="124" icon={Users} trend={12} color="primary" />
        <KpiCard label="Processos OK" value="85%" icon={CheckCircle2} trend={5} color="success" />
        <KpiCard label="Atrasos" value="14" icon={AlertCircle} trend={-2} color="destructive" />
        <KpiCard label="Tickets" value="8" icon={MessageSquare} color="info" />
        <KpiCard label="Honorários" value="12" icon={Clock} color="warning" />
        <KpiCard label="NPS" value="9.2" icon={Heart} trend={2} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 border-[#D2D7DB] shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-[#F7F7F7]/30 border-b">
            <CardTitle className="text-sm font-black uppercase text-[#2C4156] tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#1FA67A]" />
              Obrigações Fiscais por Status
            </CardTitle>
            <CardDescription className="text-xs font-bold text-[#98A7AA]">Resumo consolidado da produtividade mensal.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <ObligationChart />
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-[#D2D7DB] bg-[#2C4156] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#1FA67A]/20 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Status da Operação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusRow icon={Wifi} label="Integração WhatsApp" status="Ativo" />
              <StatusRow icon={Mail} label="Servidor de E-mail" status="Ativo" />
              <StatusRow icon={Zap} label="Certificados Digitais" status="4 Vencendo" warning />
              <Button variant="outline" className="w-full mt-4 bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-[10px] uppercase">
                Verificar Integridade
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#D2D7DB] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-black uppercase text-[#2C4156]">Agenda de Hoje</CardTitle>
                <CardDescription className="text-[10px] font-bold">Próximos compromissos.</CardDescription>
              </div>
              <div className="p-2 bg-[#E3F0F9] rounded-full">
                <Calendar className="h-4 w-4 text-[#2574A9]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { time: '10:00', client: 'Padaria Central', type: 'Video' },
                { time: '14:30', client: 'Oficina do João', type: 'Presencial' },
              ].map((meet, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-[#F7F7F7] hover:border-[#1FA67A] transition-colors cursor-pointer group">
                  <div className="text-xs font-black text-[#2C4156] border-r pr-3">{meet.time}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#2C4156] truncate group-hover:text-[#1FA67A]">{meet.client}</p>
                    <p className="text-[9px] font-bold text-[#98A7AA] uppercase tracking-tighter">{meet.type}</p>
                  </div>
                  {meet.type === 'Video' && <Video className="h-3.5 w-3.5 text-[#1FA67A]" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-[#2C4156] text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-[#E74C3C]" />
              Vencimentos Fatais (Semana)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#98A7AA] border-b bg-[#F7F7F7]/50 uppercase text-[9px] font-black">
                    <th className="p-3">Obrigação</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Venc.</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D2D7DB]">
                  {[
                    { doc: 'Guia DAS', cliente: 'ConstruMais Ltda', data: '20/10', status: 'danger' },
                    { doc: 'FGTS Digital', cliente: 'Restaurante Sabor', data: '20/10', status: 'warning' },
                    { doc: 'eSocial', cliente: 'Loja Variedades', data: '22/10', status: 'warning' },
                  ].map((p, i) => (
                    <tr key={i} className="hover:bg-[#F7F7F7]/50 transition-colors group cursor-pointer text-xs">
                      <td className="p-3 font-bold text-[#2C4156]">{p.doc}</td>
                      <td className="p-3 text-[#39586D]">{p.cliente}</td>
                      <td className="p-3">
                        <Badge className={cn(
                          "text-[9px] font-black border-none",
                          p.status === 'danger' ? "bg-[#FEE2E2] text-[#E74C3C]" : "bg-[#FEF3C7] text-[#F2B705]"
                        )}>
                          {p.data}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#1FA67A]"><Mail className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 border-[#D2D7DB] flex flex-col">
          <CardHeader>
             <CardTitle className="text-[#2C4156] text-sm font-black uppercase tracking-widest">Demanda por Departamento</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex justify-center items-center">
             <AttendanceChart />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatusRow({ icon: Icon, label, status, warning }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5", warning ? "text-[#F2B705]" : "text-[#1FA67A]")} />
        <span className="text-[11px] font-bold text-white/80">{label}</span>
      </div>
      <span className={cn("text-[9px] font-black uppercase", warning ? "text-[#F2B705]" : "text-[#1FA67A]")}>{status}</span>
    </div>
  )
}
