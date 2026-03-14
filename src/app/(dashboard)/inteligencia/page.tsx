
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  DollarSign, 
  Target,
  ArrowUpRight,
  Users,
  PieChart as PieIcon,
  ChevronRight
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const SCORE_LEADERBOARD = [
  { id: 1, name: 'Padaria Central Ltda', score: 98, status: 'Excelente', trend: '+2%' },
  { id: 2, name: 'Agro Vale S.A', score: 92, status: 'Excelente', trend: '+5%' },
  { id: 3, name: 'Oficina do João ME', score: 65, status: 'Atenção', trend: '-10%' },
  { id: 4, name: 'Consultoria Tech', score: 42, status: 'Crítico', trend: '-5%' },
]

const chartData = [
  { name: 'Jan', valor: 32000 },
  { name: 'Fev', valor: 35000 },
  { name: 'Mar', valor: 38000 },
  { name: 'Abr', valor: 42000 },
  { name: 'Mai', valor: 45000 },
  { name: 'Jun', valor: 48000 },
]

export default function InteligenciaPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-[#1FA67A]" />
            Inteligência Prosperare
          </h1>
          <p className="text-[#98A7AA] font-bold text-sm">Visão analítica e estratégica da sua operação contábil.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] font-bold">Gerar Insight IA</Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-bold">Relatório Executivo</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Ticket Médio" value="R$ 1.420" icon={DollarSign} color="#1FA67A" />
        <MetricCard label="Churn Rate (Ano)" value="1.2%" icon={Users} color="#E74C3C" />
        <MetricCard label="Saúde Média" value="84%" icon={ShieldCheck} color="#2574A9" />
        <MetricCard label="Meta Faturamento" value="92%" icon={Target} color="#F2B705" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Projeção de Crescimento</CardTitle>
            <CardDescription className="text-xs font-bold text-[#98A7AA]">Faturamento mensal vs Meta anual.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} />
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Ranking de Saúde Fiscal</CardTitle>
            <CardDescription className="text-xs font-bold text-[#98A7AA]">Clientes ordenados por regularidade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {SCORE_LEADERBOARD.map((item) => (
              <div key={item.id} className="space-y-2 group cursor-pointer">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-black text-[#2C4156] group-hover:text-[#1FA67A] transition-colors">{item.name}</p>
                    <p className={cn(
                      "text-[9px] font-bold uppercase",
                      item.status === 'Excelente' ? 'text-[#1FA67A]' : item.status === 'Atenção' ? 'text-[#F2B705]' : 'text-[#E74C3C]'
                    )}>{item.status} • {item.trend}</p>
                  </div>
                  <span className="text-sm font-black text-[#2C4156]">{item.score}%</span>
                </div>
                <Progress value={item.score} className={cn(
                  "h-1.5",
                  item.score > 80 ? "[&>div]:bg-[#1FA67A]" : item.score > 50 ? "[&>div]:bg-[#F2B705]" : "[&>div]:bg-[#E74C3C]"
                )} />
              </div>
            ))}
            <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-[#98A7AA] hover:text-[#1FA67A] mt-2">
              Ver relatório completo <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#D2D7DB] bg-[#F7F7F7]/50">
          <CardHeader>
            <CardTitle className="text-[#2C4156] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#E74C3C]" />
              Risco de Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-xl border border-[#D2D7DB] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#E74C3C] font-black text-xl">!</div>
                <div>
                  <p className="text-sm font-bold text-[#2C4156]">Atenção Crítica</p>
                  <p className="text-xs text-[#98A7AA]">3 clientes possuem honorários atrasados há mais de 15 dias.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="font-bold text-[10px] uppercase border-[#D2D7DB]">Acessar Cobrança</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB] bg-[#E3F0F9]/30">
          <CardHeader>
            <CardTitle className="text-[#2C4156] flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-[#2574A9]" />
              Oportunidades de Up-sell
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-xl border border-[#D2D7DB] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#E3F0F9] flex items-center justify-center text-[#2574A9]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2C4156]">Consultoria Financeira</p>
                  <p className="text-xs text-[#98A7AA]">12 clientes MEI podem migrar para Simples Nacional este mês.</p>
                </div>
              </div>
              <Button className="bg-[#2574A9] hover:bg-[#2574A9]/90 font-bold text-[10px] uppercase">Enviar Proposta</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-[#D2D7DB] hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[#F7F7F7]" style={{ color }}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">{label}</p>
          <p className="text-2xl font-black text-[#2C4156]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AreaChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
        <XAxis dataKey="name" tick={{fill: '#98A7AA', fontWeight: 'bold', fontSize: 10}} />
        <YAxis tick={{fill: '#98A7AA', fontWeight: 'bold', fontSize: 10}} />
        <Tooltip content={<ChartTooltipContent />} />
        <Bar dataKey="valor" fill="#1FA67A" radius={[4, 4, 0, 0]} barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  )
}
