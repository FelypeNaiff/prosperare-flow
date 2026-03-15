
"use client"

import { useState, useMemo } from "react"
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MoreVertical,
  Loader2,
  Save,
  Upload,
  RefreshCw,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Repeat,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { format, addMonths, subMonths, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ContasAPagarPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false)
  const [selectedCompetence, setSelectedCompetence] = useState<Date>(startOfMonth(new Date()))
  const [activeFilter, setActiveFilter] = useState("Todos")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const payablesQuery = useMemoFirebase(() => collection(firestore, "payables"), [firestore])
  const { data: items = [], isLoading } = useCollection(payablesQuery)

  const [newAccount, setNewAccount] = useState({
    descricao: "",
    entidade: "",
    categoria: "Sistemas",
    data: "",
    valor: 0,
    situacao: "Pendente",
    recorrente: false,
    tipoValor: "Fixo"
  })

  const handleCreateAccount = () => {
    if (!newAccount.descricao || !newAccount.entidade || !newAccount.valor) {
      toast({ title: "Erro", description: "Preencha os dados da conta.", variant: "destructive" })
      return
    }
    
    const id = Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "payables", id)
    
    setDocumentNonBlocking(docRef, { ...newAccount, id, createdAt: new Date().toISOString() }, { merge: true })
    
    setIsNewAccountOpen(false)
    setNewAccount({ descricao: "", entidade: "", categoria: "Sistemas", data: "", valor: 0, situacao: "Pendente", recorrente: false, tipoValor: "Fixo" })
    toast({ title: "Conta lançada!", description: "A despesa foi salva no banco de dados." })
  }

  const changeMonth = (direction: 'next' | 'prev') => {
    setSelectedCompetence(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const filteredItems = useMemo(() => {
    return (items || []).filter(item => {
      const matchSearch = item.entidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatus = activeFilter === "Todos" || item.situacao === activeFilter
      
      return matchSearch && matchStatus
    })
  }, [items, searchTerm, activeFilter])

  const totalValue = filteredItems.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

  const handleBatchDelete = () => {
    if (confirm(`Deseja excluir permanentemente ${selectedIds.length} contas?`)) {
      selectedIds.forEach(id => deleteDocumentNonBlocking(doc(firestore, "payables", id)))
      toast({ title: "Contas excluídas", variant: "destructive" })
      setSelectedIds([])
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-[#2C4156] tracking-tight">Contas A Pagar</h1>
        
        <div className="flex items-center gap-3 bg-white border border-[#D2D7DB] rounded-xl px-2 py-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => changeMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 min-w-[140px] text-center">
            <span className="text-sm font-black text-[#2C4156] uppercase">
              {format(selectedCompetence, "MMMM yyyy", { locale: ptBR })}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => changeMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          className="bg-[#E74C3C] hover:bg-[#E74C3C]/90 gap-2 font-black uppercase text-xs h-11 px-6 shadow-lg shadow-red-500/10" 
          onClick={() => setIsNewAccountOpen(true)}
        >
          <Plus className="h-4 w-4" /> Nova Conta
        </Button>
        
        <Button variant="outline" className="h-11 border-[#D2D7DB] gap-2 font-bold text-[#39586D] text-xs uppercase px-5">
          <Upload className="h-4 w-4" /> Importar Planilha
        </Button>
        
        <Button variant="outline" className="h-11 border-[#D2D7DB] gap-2 font-bold text-[#39586D] text-xs uppercase px-5">
          <RefreshCw className="h-4 w-4" /> Gerar Mês
        </Button>

        {selectedIds.length > 0 && (
          <Button 
            variant="outline" 
            className="h-11 border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C]/5 gap-2 font-bold text-xs uppercase px-5 animate-in slide-in-from-left-2"
            onClick={handleBatchDelete}
          >
            <Trash2 className="h-4 w-4" /> Excluir em Lote
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#98A7AA]" />
          <Input 
            placeholder="Buscar por título ou contato..." 
            className="pl-10 h-12 bg-[#F7F7F7] border-[#D2D7DB] focus-visible:ring-[#E74C3C]" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 p-1 bg-[#EBEDF0] rounded-lg w-fit">
            {["Todos", "Pendente", "Pago", "Vencido"].map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-4 text-[10px] font-black uppercase tracking-wider rounded-md transition-all",
                  activeFilter === filter 
                    ? "bg-[#E74C3C] text-white shadow-md" 
                    : "text-[#98A7AA] hover:bg-white/50"
                )}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>

          <div className="bg-white border border-[#D2D7DB] rounded-lg px-6 py-2 shadow-sm">
            <span className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest mr-2">Total:</span>
            <span className="text-sm font-black text-[#2C4156]">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center pl-4">
                  <Checkbox 
                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedIds(filteredItems.map(i => i.id))
                      else setSelectedIds([])
                    }}
                    className="border-white/30 data-[state=checked]:bg-[#E74C3C] data-[state=checked]:border-[#E74C3C]"
                  />
                </TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Descrição</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Fornecedor</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Categoria</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Vencimento</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Situação</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Valor</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right pr-4">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#E74C3C]" />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className={cn(
                    "hover:bg-[#F7F7F7] transition-colors",
                    selectedIds.includes(item.id) && "bg-red-50/50"
                  )}>
                    <TableCell className="text-center pl-4">
                      <Checkbox 
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                        className="data-[state=checked]:bg-[#E74C3C]"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#2C4156]">{item.descricao}</span>
                        {item.recorrente && <Repeat className="h-3 w-3 text-[#1FA67A]" title={`Recorrência ${item.tipoValor}`} />}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#39586D] font-medium">{item.entidade}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase border-[#D2D7DB] text-[#98A7AA]">
                        {item.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-[#39586D]">
                      {item.data ? format(new Date(item.data), "dd/MM/yyyy") : '--'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase border-none px-3 py-1",
                        item.situacao === 'Pago' ? "bg-[#7ED6B5] text-[#1FA67A]" :
                        item.situacao === 'Vencido' ? "bg-[#FEE2E2] text-[#E74C3C]" :
                        "bg-[#FEF3C7] text-[#F2B705]"
                      )}>
                        {item.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-black",
                      item.situacao === 'Pago' ? "text-[#1FA67A]" : "text-[#E74C3C]"
                    )}>
                      {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhuma conta localizada para este filtro.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
        <DialogContent className="max-w-md border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156] uppercase tracking-tight">Lançar Despesa</DialogTitle>
            <DialogDescription className="font-bold text-[#98A7AA] uppercase text-[10px] tracking-widest">
              Cadastre um novo compromisso financeiro no escritório.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Descrição do Pagamento</Label>
              <Input placeholder="Ex: Aluguel Escritório" value={newAccount.descricao} onChange={(e) => setNewAccount({...newAccount, descricao: e.target.value.toUpperCase()})} className="border-[#D2D7DB] font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Fornecedor / Beneficiário</Label>
              <Input placeholder="Nome da empresa ou contato" value={newAccount.entidade} onChange={(e) => setNewAccount({...newAccount, entidade: e.target.value.toUpperCase()})} className="border-[#D2D7DB]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Valor (R$)</Label>
                <Input type="number" placeholder="0,00" value={newAccount.valor} onChange={(e) => setNewAccount({...newAccount, valor: Number(e.target.value)})} className="border-[#D2D7DB] font-black text-[#E74C3C]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Data de Vencimento</Label>
                <Input type="date" value={newAccount.data} onChange={(e) => setNewAccount({...newAccount, data: e.target.value})} className="border-[#D2D7DB]" />
              </div>
            </div>
            
            <div className="p-4 bg-[#F7F7F7] rounded-xl border border-[#D2D7DB] space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-black uppercase text-[#2C4156]">Conta Recorrente</Label>
                  <p className="text-[9px] text-[#98A7AA] font-bold uppercase">Repetir todo mês</p>
                </div>
                <Switch 
                  checked={newAccount.recorrente} 
                  onCheckedChange={(checked) => setNewAccount({...newAccount, recorrente: checked})} 
                />
              </div>

              {newAccount.recorrente && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] mb-2 block">Tipo de Recorrência</Label>
                  <Select value={newAccount.tipoValor} onValueChange={(v) => setNewAccount({...newAccount, tipoValor: v})}>
                    <SelectTrigger className="bg-white border-[#D2D7DB]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixo" className="text-xs font-bold uppercase">Valor Fixo</SelectItem>
                      <SelectItem value="Variavel" className="text-xs font-bold uppercase">Valor Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Categoria Contábil</Label>
              <Select value={newAccount.categoria} onValueChange={(v) => setNewAccount({...newAccount, categoria: v})}>
                <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sistemas">Sistemas / Software</SelectItem>
                  <SelectItem value="Aluguel">Aluguel / Infraestrutura</SelectItem>
                  <SelectItem value="Salários">Salários / Benefícios</SelectItem>
                  <SelectItem value="Impostos">Impostos / Taxas</SelectItem>
                  <SelectItem value="Marketing">Marketing / Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t">
            <Button variant="outline" onClick={() => setIsNewAccountOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
            <Button className="bg-[#E74C3C] text-white font-black uppercase text-xs px-8 shadow-lg" onClick={handleCreateAccount}>
              <Save className="h-4 w-4 mr-2" /> Salvar Despesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
