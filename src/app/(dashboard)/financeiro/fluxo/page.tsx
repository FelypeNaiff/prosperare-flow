
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend,
  AreaChart,
  Area,
  Line,
  LineChart
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
import { Calendar, Download, Filter, TrendingUp, TrendingDown, Landmark } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

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
  { data: '25/10/2024', descricao: 'Consultoria TI - Projeto Abertura', tipo: 'Entrada', valor: 4500.00, saldo: 32600.00 },
  { data: '20/10/2024', descricao: 'Software Domínio Sistemas', tipo: 'Saída', valor: 1200.00, saldo: 28100.00 },
]

const chartConfig = {
  entradas: { label: "Entradas", color: "#1FA67A" },
  saidas: { label: "Saídas", color: "#E74C3C" },
  saldo: { label: "Saldo Acumulado", color: "#2C4156" },
} satisfies ChartConfig

export default function FluxoDeCaixaPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Fluxo de Caixa</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Monitoramento cronológico de entradas e saídas do escritório.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] font-bold">
            <Calendar className="h-4 w-4" /> Período
          </Button>
          <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] font-bold">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#1FA67A] font-bold">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Saldo Inicial" value="R$ 15.400,00" color="#39586D" icon={Landmark} />
        <SummaryCard label="Movimentação Líquida" value="+ R$ 17.700,00" color="#1FA67A" icon={TrendingUp} />
        <Card className="bg-[#2C4156] text-white border-none shadow-lg">
          <CardContent className="p-6 flex justify-between items-center h-full">
            <div>
              <p className="text-[10px] font-black uppercase text-white/60 tracking-widest">Saldo Final (Hoje)</p>
              <p className="text-2xl font-black">R$ 33.100,00</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <TrendingUp className="h-6 w-6 text-[#1FA67A]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Visualização de Liquidez</CardTitle>
          <CardDescription className="text-xs font-bold text-[#98A7AA]">Saldo acumulado vs. volume diário de transações.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] pt-4">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={FLOW_DATA}>
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2C4156" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2C4156" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="dia" tick={{fill: '#98A7AA', fontWeight: 'bold', fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: '#98A7AA', fontWeight: 'bold', fontSize: 10}} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend iconType="circle" />
              <Area type="monotone" dataKey="saldo" stroke="#2C4156" fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={3} />
              <Area type="monotone" dataKey="entradas" stroke="#1FA67A" fill="transparent" strokeWidth={2} dot={true} />
              <Area type="monotone" dataKey="saidas" stroke="#E74C3C" fill="transparent" strokeWidth={2} dot={true} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px]">Data</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Descrição do Lançamento</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Tipo</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Valor</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Saldo do Dia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TRANSACTIONS.map((item, i) => (
                <TableRow key={i} className="hover:bg-[#F7F7F7]/50">
                  <TableCell className="text-[#98A7AA] font-mono font-bold text-xs">{item.data}</TableCell>
                  <TableCell className="font-bold text-[#39586D] text-sm">{item.descricao}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.tipo === 'Entrada' ? (
                        <TrendingUp className="h-3 w-3 text-[#1FA67A]" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-[#E74C3C]" />
                      )}
                      <span className={cn(
                        "text-[10px] font-black uppercase",
                        item.tipo === 'Entrada' ? 'text-[#1FA67A]' : 'text-[#E74C3C]'
                      )}>
                        {item.tipo}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-black",
                    item.tipo === 'Entrada' ? "text-[#1FA67A]" : "text-[#E74C3C]"
                  )}>
                    {item.tipo === 'Entrada' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[10px] font-bold text-[#98A7AA]">
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

function SummaryCard({ label, value, color, icon: Icon }: any) {
  return (
    <Card className="border-[#D2D7DB] hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-6 flex justify-between items-center h-full">
        <div>
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">{label}</p>
          <p className="text-xl font-black text-[#2C4156]">{value}</p>
        </div>
        <div className="p-2.5 bg-[#F7F7F7] rounded-lg" style={{ color }}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
