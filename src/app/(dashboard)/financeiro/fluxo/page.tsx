
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
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
import { Calendar, Download, Filter, TrendingUp, TrendingDown } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const FLOW_DATA = [
  { dia: '01/10', entradas: 12000, saidas: 3500, saldo: 8500 },
  { dia: '05/10', entradas: 5000, saidas: 2000, saldo: 11500 },
  { dia: '10/10', entradas: 18000, saidas: 1200, saldo: 28300 },
  { dia: '15/10', entradas: 2000, saidas: 8000, saldo: 22300 },
  { dia: '20/10', entradas: 10000, saidas: 1500, saldo: 30800 },
  { dia: '25/10', entradas: 4500, saidas: 3000, saldo: 32300 },
  { dia: '30/10', entradas: 2000, saidas: 1200, saldo: 33100 },
]

const MOCK_TRANSACTIONS = [
  { data: '30/10/2024', descricao: 'Honorário Contábil - Padaria Central', tipo: 'Entrada', valor: 1250.00, saldo: 33100.00 },
  { data: '29/10/2024', descricao: 'Pagamento Internet Fibra', tipo: 'Saída', valor: 150.00, saldo: 31850.00 },
  { data: '28/10/2024', descricao: 'Serviço de Limpeza Mensal', tipo: 'Saída', valor: 600.00, saldo: 32000.00 },
  { data: '25/10/2024', descricao: 'Consultoria TI', tipo: 'Entrada', valor: 4500.00, saldo: 32600.00 },
  { data: '20/10/2024', descricao: 'Software Domínio Sistemas', tipo: 'Saída', valor: 1200.00, saldo: 28100.00 },
]

const chartConfig = {
  entradas: { label: "Entradas", color: "hsl(var(--chart-1))" },
  saidas: { label: "Saídas", color: "hsl(var(--chart-4))" },
  saldo: { label: "Saldo Acumulado", color: "hsl(var(--primary))" },
}

export default function FluxoDeCaixaPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Monitoramento cronológico de entradas e saídas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Período</Button>
          <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filtros</Button>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-emerald-800">Saldo Inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">R$ 15.400,00</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-primary">Movimentação Líquida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+ R$ 17.700,00</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-white/70">Saldo Final</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 33.100,00</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldo Acumulado vs Movimentações</CardTitle>
          <CardDescription>Visão diária do comportamento do caixa.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ChartContainer config={chartConfig}>
            <AreaChart data={FLOW_DATA}>
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="dia" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={3} />
              <Line type="monotone" dataKey="entradas" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={true} />
              <Line type="monotone" dataKey="saidas" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={true} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição do Lançamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo do Dia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TRANSACTIONS.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground font-mono">{item.data}</TableCell>
                  <TableCell className="font-medium">{item.descricao}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.tipo === 'Entrada' ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={item.tipo === 'Entrada' ? 'text-emerald-600' : 'text-destructive'}>
                        {item.tipo}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-bold",
                    item.tipo === 'Entrada' ? "text-emerald-600" : "text-destructive"
                  )}>
                    {item.tipo === 'Entrada' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    R$ {item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
