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
  ChevronRight,
  PieChart as PieIcon
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartData: any[] = []

const growthConfig = {
  valor: {
    label: "Faturamento",
    color: "#1FA67A",
  },
} satisfies ChartConfig

export default function InteligenciaPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
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
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-bold shadow-lg shadow-emerald-500/20">Relatório Executivo</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Ticket Médio" value="R$ 0,00" icon={DollarSign} color="#1FA67A" />
        <MetricCard label="Churn Rate" value="0%" icon={Users} color="#E74C3C" />
        <MetricCard label="Saúde Média" value="0%" icon={ShieldCheck} color="#2574A9" />
        <MetricCard label="Meta Global" value="0%" icon={Target} color="#F2B705" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#D2D7DB] shadow-sm bg-white">
          <CardHeader className="bg-[#F7F7F7]/30 border-b">
            <CardTitle className="text-xs font-black text-[#2C4156] uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#1FA67A]" />
              Projeção de Crescimento
            </CardTitle>
            <CardDescription className="text-xs font-bold text-[#98A7AA]">Os dados serão povoados conforme o faturamento do escritório.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center pt-6">
             <p className="text-[#98A7AA] font-bold italic">Sem dados históricos para projeção</p>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB] shadow-sm bg-white">
          <CardHeader className="bg-[#F7F7F7]/30 border-b">
            <CardTitle className="text-xs font-black text-[#2C4156] uppercase tracking-widest flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-[#2574A9]" />
              Ranking de Saúde Fiscal
            </CardTitle>
            <CardDescription className="text-xs font-bold text-[#98A7AA]">Melhores scores de regularidade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 flex items-center justify-center min-h-[300px]">
            <p className="text-[#98A7AA] font-bold italic">Nenhum cliente processado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#D2D7DB] bg-[#FEE2E2]/10 shadow-sm border-l-4 border-l-[#E74C3C]">
          <CardHeader>
            <CardTitle className="text-[#2C4156] text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#E74C3C]" />
              Risco de Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-xl border border-[#D2D7DB] flex items-center justify-center shadow-sm h-24">
              <p className="text-[#98A7AA] font-bold text-xs uppercase tracking-widest">Tudo em dia</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB] bg-[#7ED6B5]/10 shadow-sm border-l-4 border-l-[#1FA67A]">
          <CardHeader>
            <CardTitle className="text-[#2C4156] text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-[#1FA67A]" />
              Oportunidades de Up-sell
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-xl border border-[#D2D7DB] flex items-center justify-center shadow-sm h-24">
              <p className="text-[#98A7AA] font-bold text-xs uppercase tracking-widest">Nenhuma sugestão no momento</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-[#D2D7DB] hover:shadow-md transition-all hover:-translate-y-1 bg-white">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[#F7F7F7]" style={{ color }}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest mb-1 leading-none">{label}</p>
          <p className="text-2xl font-black text-[#2C4156]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
