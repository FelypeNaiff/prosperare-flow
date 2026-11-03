
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
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
import { Calendar, Download, Filter, TrendingUp, TrendingDown, Landmark } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const FLOW_DATA: any[] = []
const MOCK_TRANSACTIONS: any[] = []

const chartConfig = {
  entradas: { label: "Entradas", color: "#2563EB" },
  saidas: { label: "Saídas", color: "#E74C3C" },
  saldo: { label: "Saldo Acumulado", color: "#2C4156" },
} satisfies ChartConfig

export default function FluxoDeCaixaPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Fluxo de Caixa</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Monitoramento cronológico de entradas e saídas do escritório.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] font-bold">
            <Calendar className="h-4 w-4" /> Período
          </Button>
          <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] font-bold">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#2563EB] font-bold">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Saldo Inicial" value="R$ 0,00" color="#39586D" icon={Landmark} />
        <SummaryCard label="Movimentação Líquida" value="R$ 0,00" color="#2563EB" icon={TrendingUp} />
        <Card className="bg-[#2C4156] text-white border-none shadow-lg">
          <CardContent className="p-6 flex justify-between items-center h-full">
            <div>
              <p className="text-[10px] font-black uppercase text-white/60 tracking-widest">Saldo Final (Hoje)</p>
              <p className="text-2xl font-black">R$ 0,00</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <TrendingUp className="h-6 w-6 text-[#2563EB]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#2C4156]">Visualização de Liquidez</CardTitle>
          <CardDescription className="text-xs font-medium text-[#98A7AA]">Saldo acumulado vs. volume diário de transações.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] pt-4">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={FLOW_DATA.length > 0 ? FLOW_DATA : [{dia: '01', saldo: 0, entradas: 0, saidas: 0}]}>
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
              <Area type="monotone" dataKey="entradas" stroke="#2563EB" fill="transparent" strokeWidth={2} dot={true} />
              <Area type="monotone" dataKey="saidas" stroke="#E74C3C" fill="transparent" strokeWidth={2} dot={true} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <CardTitle className="text-sm font-semibold text-[#2C4156]">Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium text-sm">Data</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Descrição do Lançamento</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Tipo</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-right">Valor</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-right">Saldo do Dia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TRANSACTIONS.length > 0 ? (
                MOCK_TRANSACTIONS.map((item, i) => (
                  <TableRow key={i} className="hover:bg-[#F7F7F7]/50">
                    <TableCell className="text-[#98A7AA] font-mono font-bold text-xs">{item.data}</TableCell>
                    <TableCell className="font-bold text-[#39586D] text-sm">{item.descricao}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.tipo === 'Entrada' ? (
                          <TrendingUp className="h-3 w-3 text-[#2563EB]" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-[#E74C3C]" />
                        )}
                        <span className={cn(
                          "text-[10px] font-black uppercase",
                          item.tipo === 'Entrada' ? 'text-[#2563EB]' : 'text-[#E74C3C]'
                        )}>
                          {item.tipo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-black",
                      item.tipo === 'Entrada' ? "text-[#2563EB]" : "text-[#E74C3C]"
                    )}>
                      {item.tipo === 'Entrada' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[10px] font-bold text-[#98A7AA]">
                      R$ {item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-[#98A7AA] font-bold">
                    Nenhum lançamento registrado no fluxo de caixa.
                  </TableCell>
                </TableRow>
              )}
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
