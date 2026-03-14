
"use client"

import { useState } from "react"
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MoreVertical,
  ArrowDownRight,
  Loader2,
  Save
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
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"

export default function ContasAPagarPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false)

  const payablesQuery = useMemoFirebase(() => collection(firestore, "payables"), [firestore])
  const { data: items = [], isLoading } = useCollection(payablesQuery)

  const [newAccount, setNewAccount] = useState({
    descricao: "",
    entidade: "",
    categoria: "Sistemas",
    data: "",
    valor: 0,
    situacao: "Pendente",
    recorrente: false
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
    setNewAccount({ descricao: "", entidade: "", categoria: "Sistemas", data: "", valor: 0, situacao: "Pendente", recorrente: false })
    toast({ title: "Conta lançada!", description: "A despesa foi salva no banco de dados." })
  }

  const filteredItems = (items || []).filter(item => 
    item.entidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalValue = filteredItems.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Contas a Pagar</h1>
          <p className="text-[#98A7AA] font-medium">Gestão de custos e despesas operacionais.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-[#D2D7DB] rounded-lg px-3 py-1 text-sm font-bold text-[#2C4156]">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-4 uppercase">Outubro 2024</span>
            <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <Button className="bg-[#E74C3C] hover:bg-[#E74C3C]/90 gap-2 font-bold" onClick={() => setIsNewAccountOpen(true)}>
              <Plus className="h-4 w-4" /> Nova Conta
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard label="Total Filtrado" value={totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} color="bg-[#E74C3C]" icon={ArrowDownRight} />
      </div>

      <Card className="border-[#D2D7DB] shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b bg-[#F7F7F7]/50 flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input placeholder="Buscar fornecedor..." className="pl-9 h-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-bold uppercase text-[10px]">Descrição</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Fornecedor</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Categoria</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Vencimento</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-center">Situação</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Valor</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1FA67A]" />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F7F7F7]">
                    <TableCell className="font-bold text-[#2C4156]">{item.descricao}</TableCell>
                    <TableCell className="text-[#39586D]">{item.entidade}</TableCell>
                    <TableCell className="text-xs font-bold text-[#98A7AA]">{item.categoria}</TableCell>
                    <TableCell className="text-xs font-mono text-[#39586D]">{item.data || '--'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-[#FEF3C7] text-[#F2B705] border-none text-[9px] font-black uppercase">{item.situacao}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-black text-[#E74C3C]">R$ {Number(item.valor).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-[#98A7AA] font-bold">
                    Nenhuma despesa lançada no sistema.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Lançar Despesa</DialogTitle>
            <DialogDescription>Cadastre um novo compromisso financeiro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Descrição</Label>
              <Input placeholder="Ex: Aluguel Escritório" value={newAccount.descricao} onChange={(e) => setNewAccount({...newAccount, descricao: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Fornecedor / Entidade</Label>
              <Input placeholder="Nome do fornecedor" value={newAccount.entidade} onChange={(e) => setNewAccount({...newAccount, entidade: e.target.value})} />
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
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Categoria</Label>
              <Select defaultValue="Sistemas" onValueChange={(v) => setNewAccount({...newAccount, categoria: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sistemas">Sistemas / Software</SelectItem>
                  <SelectItem value="Aluguel">Aluguel / Infra</SelectItem>
                  <SelectItem value="Salários">Salários / Pró-labore</SelectItem>
                  <SelectItem value="Impostos">Impostos / Taxas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t">
            <Button variant="outline" onClick={() => setIsNewAccountOpen(false)}>Cancelar</Button>
            <Button className="bg-[#E74C3C] text-white font-bold gap-2" onClick={handleCreateAccount}>
              <Save className="h-4 w-4" /> Salvar Despesa
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
