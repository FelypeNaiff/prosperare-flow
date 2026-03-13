
"use client"

import { useState } from "react"
import { 
  Plus, 
  Download, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MoreVertical,
  Repeat,
  ArrowDownRight,
  ListTodo,
  FileSpreadsheet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const MOCK_PAYABLES = [
  { id: '1', descricao: 'Aluguel Escritório', entidade: 'Imobiliária Central', categoria: 'Aluguel', data: '05/10/2024', situacao: 'Pago', valor: 3500.00, recorrente: true },
  { id: '2', descricao: 'Energia Elétrica', entidade: 'Equatorial', categoria: 'Contas Fixas', data: '15/10/2024', situacao: 'Pendente', valor: 450.00, recorrente: true },
  { id: '3', descricao: 'Software Contábil', entidade: 'Domínio Sistemas', categoria: 'Sistemas/Software', data: '20/10/2024', situacao: 'Pendente', valor: 1200.00, recorrente: true },
  { id: '4', descricao: 'Material de Limpeza', entidade: 'Mercado Ideal', categoria: 'Material', data: '02/10/2024', situacao: 'Pago', valor: 150.00, recorrente: false },
  { id: '5', descricao: 'Consultoria TI', entidade: 'Tech Support', categoria: 'Serviços', data: '10/10/2024', situacao: 'Atrasado', valor: 600.00, recorrente: false },
]

export default function ContasAPagarPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pago': return <Badge className="bg-emerald-500">Pago</Badge>
      case 'Atrasado': return <Badge variant="destructive">Atrasado</Badge>
      case 'Pendente': return <Badge className="bg-yellow-500 text-black">Pendente</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gestão de despesas e custos operacionais.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border rounded-lg px-3 py-1 text-sm font-medium">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-4">Outubro 2024</span>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button className="bg-destructive hover:bg-destructive/90 gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button>
            <Button variant="outline" className="gap-2"><ListTodo className="h-4 w-4" /> Contas Fixas</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Mais Ações</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><FileSpreadsheet className="mr-2 h-4 w-4" /> Importar Planilha</DropdownMenuItem>
                <DropdownMenuItem><RefreshCw className="mr-2 h-4 w-4" /> Recorrer Lote</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard label="Vencidos" value="R$ 1.200,00" color="bg-red-500" icon={ArrowDownRight} />
        <SummaryCard label="Vencem Hoje" value="R$ 0,00" color="bg-orange-500" icon={ArrowDownRight} />
        <SummaryCard label="A Vencer" value="R$ 8.400,00" color="bg-slate-500" icon={ArrowDownRight} />
        <SummaryCard label="Pagos" value="R$ 5.850,00" color="bg-emerald-500" icon={ArrowDownRight} />
        <SummaryCard label="Total" value="R$ 15.450,00" color="bg-black" icon={ArrowDownRight} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="todos" className="w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="pendente">Pendente</TabsTrigger>
                <TabsTrigger value="pago">Pago</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar fornecedor..." 
                    className="pl-9 h-9 w-[200px]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="text-sm font-bold">Total Mês: R$ 15.450,00</div>
              </div>
            </div>

            <TabsContent value="todos" className="m-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor/Entidade</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_PAYABLES.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.descricao}
                          {item.recorrente && <Repeat className="h-3 w-3 text-destructive" title="Conta Fixa" />}
                        </div>
                      </TableCell>
                      <TableCell>{item.entidade}</TableCell>
                      <TableCell>{item.categoria}</TableCell>
                      <TableCell>{item.data}</TableCell>
                      <TableCell>{getStatusBadge(item.situacao)}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">R$ {item.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Marcar como Pago</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value, color, icon: Icon }: { label: string, value: string, color: string, icon: any }) {
  return (
    <div className={cn("p-4 rounded-lg text-white flex justify-between items-start shadow-sm", color)}>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
      <div className="p-1.5 bg-white/20 rounded-md">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  )
}
