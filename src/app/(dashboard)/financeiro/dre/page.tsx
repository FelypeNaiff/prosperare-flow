
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
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
import { Download, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const DRE_DATA = [
  { categoria: 'Receita Bruta', valor: 45200.00, subtotal: true },
  { categoria: 'Honorários Contábeis', valor: 38500.00 },
  { categoria: 'Serviços Avulsos', valor: 6700.00 },
  { categoria: '(-) Impostos s/ Faturamento', valor: -2712.00 },
  { categoria: 'RECEITA LÍQUIDA', valor: 42488.00, subtotal: true, highlight: true },
  { categoria: '(-) Custos Operacionais', valor: -8500.00, subtotal: true },
  { categoria: 'Salários e Encargos', valor: -6200.00 },
  { categoria: 'Sistemas e Softwares', valor: -2300.00 },
  { categoria: '(-) Despesas Administrativas', valor: -4200.00, subtotal: true },
  { categoria: 'Aluguel e Condomínio', valor: -3500.00 },
  { categoria: 'Internet e Energia', valor: -700.00 },
  { categoria: 'RESULTADO LÍQUIDO', valor: 29788.00, subtotal: true, highlight: true, positive: true },
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
  receitas: { label: "Receitas", color: "hsl(var(--chart-1))" },
  despesas: { label: "Despesas", color: "hsl(var(--chart-4))" },
}

export default function DreGerencialPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">DRE Gerencial</h1>
          <p className="text-muted-foreground">Demonstrativo de Resultados do Exercício - Visão Gerencial.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border rounded-lg px-3 py-1 text-sm font-medium">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-4">Outubro 2024</span>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> PDF</Button>
            <Button variant="outline" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Planilha</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Resultados</CardTitle>
            <CardDescription>Evolução de receitas vs despesas nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="mes" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="receitas" fill="var(--color-receitas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="var(--color-despesas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-primary text-white border-none">
          <CardHeader>
            <CardTitle className="text-white/80 text-sm font-bold uppercase tracking-widest">Lucro Líquido do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-4xl font-bold">R$ 29.788,00</div>
            <div className="space-y-2">
              <p className="text-sm opacity-80">Margem de Lucro: <strong>65.9%</strong></p>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[65.9%]" />
              </div>
            </div>
            <p className="text-xs opacity-70">O resultado deste mês é 12% superior ao mês de Setembro.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento do Resultado</CardTitle>
          <CardDescription>Visão analítica por categoria de receita e despesa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[400px]">Categoria / Lançamento</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead className="text-right">% Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DRE_DATA.map((item, i) => (
                <TableRow key={i} className={cn(
                  item.subtotal ? "bg-muted/30 font-bold" : "",
                  item.highlight ? "text-lg bg-primary/5" : ""
                )}>
                  <TableCell className={cn(item.highlight ? "text-primary" : "")}>
                    {item.categoria}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono",
                    item.valor < 0 ? "text-destructive" : (item.positive ? "text-emerald-600" : "")
                  )}>
                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
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
