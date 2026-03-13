
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
  ArrowUpRight,
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

const INITIAL_RECEIVABLES = [
  { id: '1', descricao: 'Honorário Contábil - Out/24', cliente: 'Padaria Central', pagamento: 'Boleto', data: '10/10/2024', situacao: 'Confirmado', valor: 1250.00, recorrente: true },
  { id: '2', descricao: 'Consultoria Tributária', cliente: 'Oficina do João', pagamento: 'PIX Online', data: '12/10/2024', situacao: 'Pendente', valor: 450.00, recorrente: false },
  { id: '3', descricao: 'Abertura de Empresa', cliente: 'Tech Solutions ME', pagamento: 'Cartão 3x', data: '05/10/2024', situacao: 'Atrasado', valor: 2800.00, recorrente: false },
  { id: '4', descricao: 'Honorário Contábil - Set/24', cliente: 'Agro Vale', pagamento: 'PIX Físico', data: '20/09/2024', situacao: 'Confirmado', valor: 1800.00, recorrente: true },
  { id: '5', descricao: 'Honorário Contábil - Out/24', cliente: 'Consultoria ABC', pagamento: 'Débito', data: '10/10/2024', situacao: 'Cancelado', valor: 900.00, recorrente: true },
]

const STATUS_OPTIONS = [
  { label: 'Confirmado', value: 'Confirmado', color: 'bg-emerald-500' },
  { label: 'Pendente', value: 'Pendente', color: 'bg-yellow-500 text-black' },
  { label: 'Atrasado', value: 'Atrasado', color: 'bg-red-500' },
  { label: 'Cancelado', value: 'Cancelado', color: 'bg-slate-400' },
]

export default function ContasAReceberPage() {
  const [items, setItems] = useState(INITIAL_RECEIVABLES)
  const [searchTerm, setSearchTerm] = useState("")
  const [isImportOpen, setIsImportOpen] = useState(false)

  const handleStatusChange = (id: string, newStatus: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, situacao: newStatus } : item
    ))
    toast({
      title: "Status Atualizado",
      description: `O lançamento foi marcado como ${newStatus}.`
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
          <h1 className="text-3xl font-bold tracking-tight text-primary">Contas a Receber</h1>
          <p className="text-muted-foreground">Gestão de honorários e receitas do escritório.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border rounded-lg px-3 py-1 text-sm font-medium">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-4">Outubro 2024</span>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button className="bg-primary hover:bg-secondary gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button>
            
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Importar Planilha
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Importar Contas a Receber</DialogTitle>
                  <DialogDescription>
                    Suba sua planilha de Excel ou CSV para processamento em lote.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 gap-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Arraste sua planilha ou clique para selecionar</p>
                      <p className="text-xs text-muted-foreground mt-1">Formatos suportados: .xlsx, .xls, .csv</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Recomendação:</p>
                    <Button variant="outline" className="w-full gap-2 border-accent text-accent hover:bg-accent/5">
                      <Download className="h-4 w-4" /> Baixar Planilha Modelo (.xlsx)
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
                  <Button className="bg-primary" onClick={() => {
                    setIsImportOpen(false)
                    toast({ title: "Importação Iniciada", description: "O sistema está processando os dados da planilha." })
                  }}>Iniciar Importação</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Mais Ações</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><RefreshCw className="mr-2 h-4 w-4" /> Gerar Mês</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir em Lote</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard label="Vencidos" value="R$ 3.200,00" color="bg-red-500" icon={ArrowUpRight} />
        <SummaryCard label="Vencem Hoje" value="R$ 1.450,00" color="bg-orange-500" icon={ArrowUpRight} />
        <SummaryCard label="A Vencer" value="R$ 12.800,00" color="bg-slate-500" icon={ArrowUpRight} />
        <SummaryCard label="Recebidos" value="R$ 32.400,00" color="bg-emerald-500" icon={ArrowUpRight} />
        <SummaryCard label="Total" value="R$ 49.850,00" color="bg-black" icon={ArrowUpRight} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="todos" className="w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="pendente">Pendente</TabsTrigger>
                <TabsTrigger value="pago">Pago</TabsTrigger>
                <TabsTrigger value="vencido">Vencido</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar cliente..." 
                    className="pl-9 h-9 w-[200px]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="text-sm font-bold">Total: R$ 49.850,00</div>
              </div>
            </div>

            <TabsContent value="todos" className="m-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Entidade/Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
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
                          {item.recorrente && <Repeat className="h-3 w-3 text-primary" title="Recorrente" />}
                        </div>
                      </TableCell>
                      <TableCell>{item.cliente}</TableCell>
                      <TableCell>{item.pagamento}</TableCell>
                      <TableCell>{item.data}</TableCell>
                      <TableCell>{getStatusBadge(item.situacao, item.id)}</TableCell>
                      <TableCell className="text-right font-bold">R$ {item.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Baixar PDF</DropdownMenuItem>
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
