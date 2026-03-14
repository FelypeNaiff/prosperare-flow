"use client"

import { useState } from "react"
import { 
  Plus, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MoreVertical,
  Repeat,
  ArrowUpRight,
  FileSpreadsheet,
  Upload,
  Check,
  Save
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const STATUS_OPTIONS = [
  { label: 'Confirmado', value: 'Confirmado', bg: 'bg-[#7ED6B5]', text: 'text-[#1FA67A]' },
  { label: 'Pendente', value: 'Pendente', bg: 'bg-[#FEF3C7]', text: 'text-[#F2B705]' },
  { label: 'Atrasado', value: 'Atrasado', bg: 'bg-[#FEE2E2]', text: 'text-[#E74C3C]' },
]

export default function ContasAReceberPage() {
  const [items, setItems] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const [newAccount, setNewAccount] = useState({
    descricao: "",
    cliente: "",
    pagamento: "PIX",
    data: "",
    valor: 0,
    situacao: "Pendente",
    recorrente: false
  })

  const handleCreateAccount = () => {
    if (!newAccount.descricao || !newAccount.cliente || !newAccount.valor) {
      toast({ title: "Erro", description: "Preencha os dados da conta.", variant: "destructive" })
      return
    }
    const entry = { ...newAccount, id: Math.random().toString(36).substr(2, 9) }
    setItems([entry, ...items])
    setIsNewAccountOpen(false)
    setNewAccount({ descricao: "", cliente: "", pagamento: "PIX", data: "", valor: 0, situacao: "Pendente", recorrente: false })
    toast({ title: "Honorário Lançado!", description: "O registro de entrada foi criado." })
  }

  const handleStatusChange = (id: string, newStatus: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, situacao: newStatus } : item))
    toast({ title: "Status Atualizado" })
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
          {STATUS_OPTIONS.map(opt => (
            <DropdownMenuItem key={opt.value} onClick={() => handleStatusChange(id, opt.value)}>
              <div className={cn("w-2 h-2 rounded-full mr-2", opt.bg)} /> {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Contas a Receber</h1>
          <p className="text-[#98A7AA] font-medium">Gestão de honorários e faturamento do escritório.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-[#D2D7DB] rounded-lg px-3 py-1 text-sm font-bold text-[#2C4156]">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-4">Outubro 2024</span>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold" onClick={() => setIsNewAccountOpen(true)}>
              <Plus className="h-4 w-4" /> Nova Conta
            </Button>
            <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D]" onClick={() => setIsImportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" /> Importar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard label="Vencidos" value="R$ 0,00" color="bg-[#E74C3C]" icon={ArrowUpRight} />
        <SummaryCard label="Hoje" value="R$ 0,00" color="bg-[#F2B705]" icon={ArrowUpRight} />
        <SummaryCard label="A Vencer" value="R$ 0,00" color="bg-[#98A7AA]" icon={ArrowUpRight} />
        <SummaryCard label="Recebidos" value="R$ 0,00" color="bg-[#1FA67A]" icon={ArrowUpRight} />
        <SummaryCard label="Total" value="R$ 0,00" color="bg-[#2C4156]" icon={ArrowUpRight} />
      </div>

      <Card className="border-[#D2D7DB] shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b bg-[#F7F7F7]/50 flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input placeholder="Buscar cliente..." className="pl-9 h-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="text-sm font-black text-[#2C4156]">TOTAL: R$ 0,00</div>
          </div>
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-bold uppercase text-[10px]">Descrição</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Cliente</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Pagamento</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Vencimento</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-center">Situação</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Valor</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F7F7F7]">
                    <TableCell className="font-bold text-[#2C4156]">
                      <div className="flex items-center gap-2">
                        {item.descricao} {item.recorrente && <Repeat className="h-3 w-3 text-[#1FA67A]" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#39586D]">{item.cliente}</TableCell>
                    <TableCell className="text-xs font-bold text-[#98A7AA]">{item.pagamento}</TableCell>
                    <TableCell className="text-xs font-mono text-[#39586D]">{item.data}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(item.situacao, item.id)}</TableCell>
                    <TableCell className="text-right font-black text-[#1FA67A]">R$ {item.valor.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-[#98A7AA] font-bold">
                    Nenhum honorário lançado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL NOVA CONTA A RECEBER */}
      <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Lançar Receita</DialogTitle>
            <DialogDescription>Cadastre um novo honorário ou entrada avulsa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Descrição do Lançamento</Label>
              <Input placeholder="Ex: Honorários Outubro/24" value={newAccount.descricao} onChange={(e) => setNewAccount({...newAccount, descricao: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Cliente</Label>
              <Input placeholder="Nome da empresa" value={newAccount.cliente} onChange={(e) => setNewAccount({...newAccount, cliente: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">Valor (R$)</Label>
                <Input type="number" placeholder="0,00" value={newAccount.valor} onChange={(e) => setNewAccount({...newAccount, valor: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">Vencimento</Label>
                <Input type="date" value={newAccount.data} onChange={(e) => setNewAccount({...newAccount, data: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Forma de Pagamento</Label>
              <Select defaultValue="PIX" onValueChange={(v) => setNewAccount({...newAccount, pagamento: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                  <SelectItem value="Transferência">Transferência / TED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t">
            <Button variant="outline" onClick={() => setIsNewAccountOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-bold gap-2" onClick={handleCreateAccount}>
              <Save className="h-4 w-4" /> Salvar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ label, value, color, icon: Icon }: any) {
  return (
    <div className={cn("p-4 rounded-xl text-white flex justify-between items-start shadow-sm", color)}>
      <div>
        <p className="text-[10px] font-black uppercase opacity-80">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
      <div className="p-1.5 bg-white/20 rounded-lg"><Icon className="h-4 w-4" /></div>
    </div>
  )
}
