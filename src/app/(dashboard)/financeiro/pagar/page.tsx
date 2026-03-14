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

const INITIAL_PAYABLES: any[] = []

const STATUS_OPTIONS = [
  { label: 'Pago', value: 'Pago', bg: 'bg-[#7ED6B5]', text: 'text-[#1FA67A]' },
  { label: 'Pendente', value: 'Pendente', bg: 'bg-[#FEF3C7]', text: 'text-[#F2B705]' },
  { label: 'Atrasado', value: 'Atrasado', bg: 'bg-[#FEE2E2]', text: 'text-[#E74C3C]' },
  { label: 'Cancelado', value: 'Cancelado', bg: 'bg-[#F3F4F6]', text: 'text-[#98A7AA]' },
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
          <Badge className={cn("cursor-pointer hover:opacity-80 transition-opacity border-none font-bold text-[10px] uppercase", option.bg, option.text)}>
            {status}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel className="text-[10px] uppercase text-[#98A7AA]">Alterar Situação</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.map(opt => (
            <DropdownMenuItem 
              key={opt.value} 
              onClick={() => handleStatusChange(id, opt.value)}
              className="gap-2"
            >
              <div className={cn("w-2 h-2 rounded-full", opt.bg)} />
              <span className="text-xs font-medium">{opt.label}</span>
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
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Contas a Pagar</h1>
          <p className="text-[#98A7AA] font-medium">Gestão de despesas e custos operacionais.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-[#D2D7DB] rounded-lg px-3 py-1 text-sm font-bold text-[#2C4156]">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#F7F7F7]"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-4">Outubro 2024</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#F7F7F7]"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button className="bg-[#E74C3C] hover:bg-[#E74C3C]/90 gap-2 font-bold"><Plus className="h-4 w-4" /> Nova Conta</Button>
            
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] hover:bg-[#F7F7F7] font-bold">
                  <FileSpreadsheet className="h-4 w-4" /> Importar Planilha
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-[#2C4156]">Importar Despesas</DialogTitle>
                  <DialogDescription>
                    Importe seus compromissos financeiros via Excel ou CSV.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D2D7DB] rounded-lg p-8 gap-4 hover:bg-[#F7F7F7] transition-colors cursor-pointer">
                    <Upload className="h-10 w-10 text-[#98A7AA]" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#2C4156]">Selecione o arquivo de despesas</p>
                      <p className="text-xs text-[#98A7AA] mt-1">Formatos: .xlsx, .csv</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full gap-2 border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C]/5 font-bold">
                    <Download className="h-4 w-4" /> Baixar Modelo de Contas (.xlsx)
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsImportOpen(false)} className="text-[#98A7AA] font-bold">Cancelar</Button>
                  <Button className="bg-[#E74C3C] text-white" onClick={() => {
                    setIsImportOpen(false)
                    toast({ title: "Importação Processando", description: "O sistema está processando os lançamentos de saída." })
                  }}>Processar Planilha</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard label="Vencidos" value="R$ 0,00" color="bg-[#E74C3C]" icon={ArrowDownRight} />
        <SummaryCard label="Vencem Hoje" value="R$ 0,00" color="bg-[#F2B705]" icon={ArrowDownRight} />
        <SummaryCard label="A Vencer" value="R$ 0,00" color="bg-[#98A7AA]" icon={ArrowDownRight} />
        <SummaryCard label="Pagos" value="R$ 0,00" color="bg-[#1FA67A]" icon={ArrowDownRight} />
        <SummaryCard label="Total" value="R$ 0,00" color="bg-[#2C4156]" icon={ArrowDownRight} />
      </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Tabs defaultValue="todos" className="w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#D2D7DB] bg-[#F7F7F7]/50">
              <TabsList className="bg-[#D2D7DB]/30">
                <TabsTrigger value="todos" className="data-[state=active]:bg-white data-[state=active]:text-[#2C4156] font-bold text-xs">Todos</TabsTrigger>
                <TabsTrigger value="pendente" className="data-[state=active]:bg-white data-[state=active]:text-[#2C4156] font-bold text-xs">Pendente</TabsTrigger>
                <TabsTrigger value="pago" className="data-[state=active]:bg-white data-[state=active]:text-[#2C4156] font-bold text-xs">Pago</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
                  <Input 
                    placeholder="Buscar fornecedor..." 
                    className="pl-9 h-9 w-[200px] bg-white border-[#D2D7DB] focus-visible:ring-[#1FA67A]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="text-sm font-extrabold text-[#2C4156]">TOTAL MÊS: R$ 0,00</div>
              </div>
            </div>

            <TabsContent value="todos" className="m-0">
              {items.length > 0 ? (
                <Table>
                  <TableHeader className="bg-[#2C4156]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-white uppercase text-[10px] font-bold">Descrição</TableHead>
                      <TableHead className="text-white uppercase text-[10px] font-bold">Fornecedor/Entidade</TableHead>
                      <TableHead className="text-white uppercase text-[10px] font-bold">Categoria</TableHead>
                      <TableHead className="text-white uppercase text-[10px] font-bold">Data</TableHead>
                      <TableHead className="text-white uppercase text-[10px] font-bold text-center">Situação</TableHead>
                      <TableHead className="text-white uppercase text-[10px] font-bold text-right">Valor</TableHead>
                      <TableHead className="text-white uppercase text-[10px] font-bold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-[#F7F7F7]">
                        <TableCell className="font-bold text-[#2C4156] py-4">
                          <div className="flex items-center gap-2">
                            {item.descricao}
                            {item.recorrente && <Repeat className="h-3 w-3 text-[#E74C3C]" title="Conta Fixa" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-[#39586D]">{item.entidade}</TableCell>
                        <TableCell className="text-[#98A7AA] text-xs font-medium">{item.categoria}</TableCell>
                        <TableCell className="text-[#39586D] font-mono text-xs">{item.data}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(item.situacao, item.id)}</TableCell>
                        <TableCell className="text-right font-extrabold text-[#E74C3C]">R$ {item.valor.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'Pago')} className="text-xs font-bold text-[#1FA67A]">Marcar como Pago</DropdownMenuItem>
                              <DropdownMenuItem className="text-xs font-bold text-[#2C4156]">Editar Despesa</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs font-bold text-[#E74C3C]">Excluir Lançamento</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-20">
                  <p className="text-[#98A7AA] font-bold text-sm">Nenhum lançamento de saída para este período.</p>
                  <Button variant="outline" className="mt-4 border-dashed border-[#D2D7DB] text-[#98A7AA]">
                    <Plus className="h-4 w-4 mr-2" /> Cadastrar primeira despesa
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value, color, icon: Icon }: { label: string, value: string, color: string, icon: any }) {
  return (
    <div className={cn("p-4 rounded-xl text-white flex justify-between items-start shadow-sm border-none", color)}>
      <div className="space-y-1">
        <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">{label}</p>
        <p className="text-xl font-extrabold">{value}</p>
      </div>
      <div className="p-1.5 bg-white/20 rounded-lg">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  )
}
