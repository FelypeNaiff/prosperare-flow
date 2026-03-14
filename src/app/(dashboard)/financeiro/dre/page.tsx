
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from "recharts"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, ChevronLeft, ChevronRight, PieChart } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const DRE_DATA = [
  { categoria: 'Receita Bruta', valor: 45200.00, subtotal: true },
  { categoria: 'Honorários Contábeis', valor: 38500.00 },
  { categoria: 'Serviços Avulsos (Aberturas/IRPF)', valor: 6700.00 },
  { categoria: '(-) Impostos s/ Faturamento (Simples)', valor: -2712.00 },
  { categoria: 'RECEITA LÍQUIDA', valor: 42488.00, subtotal: true, highlight: true },
  { categoria: '(-) Custos Operacionais', valor: -8500.00, subtotal: true },
  { categoria: 'Salários e Encargos Equipe', valor: -6200.00 },
  { categoria: 'Sistemas e Softwares (Questor/Dominio)', valor: -2300.00 },
  { categoria: '(-) Despesas Administrativas', valor: -4200.00, subtotal: true },
  { categoria: 'Aluguel e Condomínio', valor: -3500.00 },
  { categoria: 'Internet e Energia', valor: -700.00 },
  { categoria: 'RESULTADO LÍQUIDO (LUCRO)', valor: 29788.00, subtotal: true, highlight: true, positive: true },
]

const chartData = [
  { mes: 'Mai', receitas: 38000, despesas: 15000 },
  { mes: 'Jun', receitas: 41000, despesas: 16200 },
  { mes: 'Jul', receitas: 39500, despesas: 14800 },
  { mes: 'Ago', receitas: 42000, despesas: 17000 },
  { mes: 'Set', receitas: 44000, despesas: 18500 },
  { mes: 'Out', receitas: 45200, despesas: 15412 },
]

const chartConfig = {
  receitas: { label: "Receitas", color: "#1FA67A" },
  despesas: { label: "Despesas", color: "#E74C3C" },
}

export default function DreGerencialPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">DRE Gerencial</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Demonstrativo de Resultados do Exercício do Escritório.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-[#D2D7DB] rounded-lg px-3 py-1 text-xs font-black text-[#2C4156]">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-4 uppercase">Outubro 2024</span>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] font-bold">
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] font-bold">
              <FileSpreadsheet className="h-4 w-4" /> Planilha
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[#D2D7DB]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-[#2C4156] uppercase flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#1FA67A]" />
              Evolução de Resultados
            </CardTitle>
            <CardDescription className="text-xs font-bold text-[#98A7AA]">Histórico de faturamento vs custos operacionais.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="mes" tick={{fill: '#98A7AA', fontWeight: 'bold', fontSize: 10}} />
                <YAxis tick={{fill: '#98A7AA', fontWeight: 'bold', fontSize: 10}} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend iconType="circle" />
                <Bar dataKey="receitas" fill="var(--color-receitas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="var(--color-despesas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#2C4156] text-white border-none shadow-xl relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Lucro Líquido do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <div className="text-5xl font-black tracking-tighter">R$ 29.788,00</div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black uppercase text-white/60">Margem de Lucro</p>
                <p className="text-lg font-black text-[#1FA67A]">65.9%</p>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#1FA67A] w-[65.9%] shadow-[0_0_10px_rgba(31,166,122,0.5)]" />
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-medium text-white/70 italic leading-relaxed">
                "Parabéns! O resultado deste mês é 12% superior ao mês de Setembro, impulsionado pela redução nos custos de softwares."
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Detalhamento Analítico</CardTitle>
          <CardDescription className="text-xs font-bold text-[#98A7AA]">Visão por categoria de receita e despesa.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px] w-[400px]">Categoria / Lançamento</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Valor (R$)</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">% Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DRE_DATA.map((item, i) => (
                <TableRow key={i} className={cn(
                  "hover:bg-[#F7F7F7]/50 transition-colors",
                  item.subtotal ? "bg-[#F7F7F7]/30 font-black" : "",
                  item.highlight ? "text-lg bg-[#1FA67A]/5" : ""
                )}>
                  <TableCell className={cn(
                    "py-4",
                    item.highlight ? "text-[#1FA67A]" : "text-[#39586D]",
                    !item.subtotal ? "pl-8 text-xs opacity-80" : "text-sm"
                  )}>
                    {item.categoria}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono font-bold",
                    item.valor < 0 ? "text-[#E74C3C]" : (item.positive ? "text-[#1FA67A]" : "")
                  )}>
                    {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-right text-[10px] font-black text-[#98A7AA]">
                    {item.highlight ? "100%" : (Math.abs(item.valor / 45200 * 100).toFixed(1) + "%")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
