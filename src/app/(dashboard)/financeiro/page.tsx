"use client"

import { useState } from "react"
import { DollarSign, TrendingUp, TrendingDown, Calendar, Search, Filter, Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const CASH_FLOW_DATA = [
  { mes: 'Jan', receitas: 32000, despesas: 15000 },
  { mes: 'Fev', receitas: 35000, despesas: 16500 },
  { mes: 'Mar', receitas: 33000, despesas: 14000 },
  { mes: 'Abr', receitas: 38000, despesas: 18000 },
  { mes: 'Mai', receitas: 42000, despesas: 19500 },
  { mes: 'Jun', receitas: 45000, despesas: 21000 },
]

const MOCK_REVENUE = [
  { id: '1', cliente: 'Padaria Central', competencia: '01/2024', valor: 1200, vencimento: '10/02/2024', status: 'Pago' },
  { id: '2', cliente: 'Oficina do João', competencia: '01/2024', valor: 450, vencimento: '15/02/2024', status: 'Pendente' },
  { id: '3', cliente: 'Consultoria Tech', competencia: '01/2024', valor: 2500, vencimento: '05/02/2024', status: 'Atrasado' },
  { id: '4', cliente: 'Agro Vale', competencia: '01/2024', valor: 1800, vencimento: '20/02/2024', status: 'Pendente' },
]

const chartConfig = {
  receitas: { label: "Receitas", color: "hsl(var(--chart-1))" },
  despesas: { label: "Despesas", color: "hsl(var(--chart-4))" },
}

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Gestão Financeira</h1>
          <p className="text-muted-foreground">Controle de honorários, fluxo de caixa e inadimplência.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Relatórios
          </Button>
          <Button className="bg-primary hover:bg-secondary gap-2">
            <Plus className="h-4 w-4" /> Lançamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Receita Estimada" value="R$ 45.200" icon={DollarSign} color="info" trend={8} />
        <KpiCard label="Recebido no Mês" value="R$ 31.850" icon={TrendingUp} color="success" />
        <KpiCard label="Inadimplência" value="12%" icon={TrendingDown} color="destructive" trend={-2} />
        <KpiCard label="Contas a Pagar" value="R$ 8.400" icon={Calendar} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Comparativo de receitas vs despesas nos últimos 6 meses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <BarChart data={CASH_FLOW_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="receitas" fill="var(--color-receitas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="var(--color-despesas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de Honorários</CardTitle>
            <CardDescription>Situação dos pagamentos do mês atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Recebidos</span>
                <span className="font-bold">75%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-chart-1 w-[75%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pendentes</span>
                <span className="font-bold">20%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-chart-2 w-[20%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Em Atraso</span>
                <span className="font-bold">5%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-chart-4 w-[5%]" />
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">Ver Detalhes do Aging</Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="receitas">
        <TabsList>
          <TabsTrigger value="receitas">Honorários (Receber)</TabsTrigger>
          <TabsTrigger value="despesas">Contas a Pagar</TabsTrigger>
        </TabsList>
        <TabsContent value="receitas" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_REVENUE.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.cliente}</TableCell>
                      <TableCell>{item.competencia}</TableCell>
                      <TableCell>R$ {item.valor.toFixed(2)}</TableCell>
                      <TableCell>{item.vencimento}</TableCell>
                      <TableCell>
                        <Badge variant={
                          item.status === 'Pago' ? 'default' : 
                          item.status === 'Atrasado' ? 'destructive' : 'outline'
                        } className={item.status === 'Pago' ? 'bg-chart-1' : ''}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Baixar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
