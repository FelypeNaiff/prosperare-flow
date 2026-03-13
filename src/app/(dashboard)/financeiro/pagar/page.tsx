
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
  FileSpreadsheet,
  Upload,
  Check
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
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const INITIAL_PAYABLES = [
  { id: '1', descricao: 'Aluguel Escritório', entidade: 'Imobiliária Central', categoria: 'Aluguel', data: '05/10/2024', situacao: 'Pago', valor: 3500.00, recorrente: true },
  { id: '2', descricao: 'Energia Elétrica', entidade: 'Equatorial', categoria: 'Contas Fixas', data: '15/10/2024', situacao: 'Pendente', valor: 450.00, recorrente: true },
  { id: '3', descricao: 'Software Contábil', entidade: 'Domínio Sistemas', categoria: 'Sistemas/Software', data: '20/10/2024', situacao: 'Pendente', valor: 1200.00, recorrente: true },
  { id: '4', descricao: 'Material de Limpeza', entidade: 'Mercado Ideal', categoria: 'Material', data: '02/10/2024', situacao: 'Pago', valor: 150.00, recorrente: false },
  { id: '5', descricao: 'Consultoria TI', entidade: 'Tech Support', categoria: 'Serviços', data: '10/10/2024', situacao: 'Atrasado', valor: 600.00, recorrente: false },
]

const STATUS_OPTIONS = [
  { label: 'Pago', value: 'Pago', color: 'bg-emerald-500' },
  { label: 'Pendente', value: 'Pendente', color: 'bg-yellow-500 text-black' },
  { label: 'Atrasado', value: 'Atrasado', color: 'bg-red-500' },
  { label: 'Cancelado', value: 'Cancelado', color: 'bg-slate-400' },
]

export default function ContasAPagarPage() {
  const [items, setItems] = useState(INITIAL_PAYABLES)
  const [searchTerm, setSearchTerm] = useState("")
  const [isImportOpen, setIsImportOpen] = useState(false)

  const handleStatusChange = (id: string, newStatus: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, situacao: newStatus } : item
    ))
    toast({
      title: "Status Atualizado",
      description: `A despesa foi marcada como ${newStatus}.`
    })
  }

  const getStatusBadge = (status: string, id: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[1]
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge className={cn("cursor-pointer hover:opacity-80 transition-opacity", option.color)}>
            {status}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Alterar Situação</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.map(opt => (
            <DropdownMenuItem 
              key={opt.value} 
              onClick={() => handleStatusChange(id, opt.value)}
              className="gap-2"
            >
              <div className={cn("w-2 h-2 rounded-full", opt.color.split(' ')[0])} />
              {opt.label}
              {status === opt.value && <Check className="ml-auto h-3 w-3" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
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
            
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Importar Planilha
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Importar Contas a Pagar</DialogTitle>
                  <DialogDescription>
                    Importe despesas e fornecedores via arquivo Excel.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 gap-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Selecione o arquivo de despesas</p>
                      <p className="text-xs text-muted-foreground mt-1">.xlsx ou .csv</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Modelo de Importação:</p>
                    <Button variant="outline" className="w-full gap-2 border-primary text-primary hover:bg-primary/5">
                      <Download className="h-4 w-4" /> Baixar Modelo de Contas (.xlsx)
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
                  <Button className="bg-primary" onClick={() => {
                    setIsImportOpen(false)
                    toast({ title: "Importação Processando", description: "Estamos lendo os lançamentos de saída da sua planilha." })
                  }}>Processar Planilha</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="gap-2"><ListTodo className="h-4 w-4" /> Contas Fixas</Button>
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
                  {items.map((item) => (
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
                      <TableCell>{getStatusBadge(item.situacao, item.id)}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">R$ {item.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'Pago')}>Marcar como Pago</DropdownMenuItem>
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
