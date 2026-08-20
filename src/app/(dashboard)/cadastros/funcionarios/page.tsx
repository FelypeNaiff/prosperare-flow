'use client';

import { useState } from "react"
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2,
  MoreHorizontal,
  UserPlus,
  Save,
  Edit2,
  Building,
  Briefcase,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { formatCNPJ } from "@/lib/utils"

export default function FuncionariosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<any>(null)
  
  // Buscar funcionários reais cadastrados
  const empsQuery = useMemoFirebase(() => collection(firestore, "funcionarios"), [firestore])
  const { data: emps = [], isLoading } = useCollection(empsQuery)

  // Buscar clientes/empresas reais
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const [newEmp, setNewEmp] = useState({
    nome: "",
    cpf: "",
    clientId: "",
    cargo: "",
    dataAdmissao: "",
    status: "ATIVO"
  })

  const [editFormData, setEditFormData] = useState({
    nome: "",
    cpf: "",
    clientId: "",
    cargo: "",
    dataAdmissao: "",
    status: "ATIVO"
  })

  const handleRegister = () => {
    if (!newEmp.nome || !newEmp.clientId || !newEmp.cpf) {
      toast({ title: "Erro", description: "Nome, CPF e Empresa são obrigatórios.", variant: "destructive" })
      return
    }

    const client = clients.find(c => c.id === newEmp.clientId)
    if (!client) {
      toast({ title: "Erro", description: "Empresa selecionada inválida.", variant: "destructive" })
      return
    }

    const empId = Math.random().toString(36).substr(2, 9)
    const empRef = doc(firestore, "funcionarios", empId)
    
    const empData = {
      ...newEmp,
      id: empId,
      clientName: client.nomeFantasia || client.razaoSocial || "Empresa Vinculada",
      clientCnpj: client.cnpj || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setIsAddOpen(false)
    setDocumentNonBlocking(empRef, empData, { merge: true })
    
    setNewEmp({ nome: "", cpf: "", clientId: "", cargo: "", dataAdmissao: "", status: "ATIVO" })
    toast({ title: "Funcionário Cadastrado!", description: `${empData.nome} foi salvo com sucesso.` })
  }

  const handleOpenEdit = (emp: any) => {
    setSelectedEmp(emp)
    setEditFormData({
      nome: emp.nome || "",
      cpf: emp.cpf || "",
      clientId: emp.clientId || "",
      cargo: emp.cargo || "",
      dataAdmissao: emp.dataAdmissao || "",
      status: emp.status || "ATIVO"
    })
    setIsEditOpen(true)
  }

  const handleUpdateEmp = () => {
    if (!selectedEmp || !editFormData.nome || !editFormData.clientId || !editFormData.cpf) return
    
    const client = clients.find(c => c.id === editFormData.clientId)
    if (!client) {
      toast({ title: "Erro", description: "Empresa selecionada inválida.", variant: "destructive" })
      return
    }

    const empRef = doc(firestore, "funcionarios", selectedEmp.id)
    updateDocumentNonBlocking(empRef, {
      ...editFormData,
      clientName: client.nomeFantasia || client.razaoSocial || "Empresa Vinculada",
      clientCnpj: client.cnpj || "",
      updatedAt: new Date().toISOString()
    })

    setIsEditOpen(false)
    toast({ title: "Cadastro Atualizado!", description: "Dados salvos com sucesso." })
  }

  const handleDeleteEmp = (id: string) => {
    if (confirm("Deseja realmente excluir este funcionário? Isso afetará os relacionamentos ativos.")) {
      deleteDocumentNonBlocking(doc(firestore, "funcionarios", id))
      toast({ title: "Funcionário removido", variant: "destructive" })
    }
  }

  const filteredEmps = (emps || []).filter(e => 
    e.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Cadastro de Funcionários</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Gerencie os funcionários ativos das empresas clientes.</p>
        </div>
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-bold shadow-lg h-11" onClick={() => setIsAddOpen(true)}>
          <UserPlus className="h-4 w-4" /> Cadastrar Funcionário
        </Button>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white">
        <CardHeader className="pb-3 border-b bg-[#F7F7F7]/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input
              placeholder="Buscar por nome do funcionário, empresa ou cargo..."
              className="pl-10 bg-white border-[#D2D7DB]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium text-sm">Nome / Cargo</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">CPF</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Empresa Vinculada</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Admissão</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Status</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                  </TableCell>
                </TableRow>
              ) : filteredEmps.length > 0 ? (
                filteredEmps.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-[#F7F7F7]/50 transition-colors group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-[#2C4156]">{emp.nome}</span>
                        <span className="text-[10px] text-[#98A7AA] font-bold flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {emp.cargo || "Não Informado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-[#39586D]">
                      {emp.cpf}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-600">{emp.clientName}</span>
                        <span className="text-[9px] text-[#98A7AA] font-semibold">{formatCNPJ(emp.clientCnpj)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {emp.dataAdmissao ? new Date(emp.dataAdmissao + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "border-none text-[9px] font-bold tracking-wide uppercase px-2 py-0.5",
                        emp.status === 'ATIVO' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-[#98A7AA]"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="gap-2 text-xs font-bold uppercase cursor-pointer" onClick={() => handleOpenEdit(emp)}>
                            <Edit2 className="h-3.5 w-3.5 text-[#2563EB]" /> Editar Cadastro
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-xs font-bold text-[#E74C3C] cursor-pointer uppercase" 
                            onClick={() => handleDeleteEmp(emp.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhum funcionário localizado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DE CRIAÇÃO */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Cadastrar Funcionário</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Insira as informações do funcionário e vincule-o a uma empresa cliente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="modal-scroll-content">
            <div className="p-6 space-y-5 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-1">
                  Nome Completo
                </Label>
                <Input 
                  placeholder="Ex: JOÃO SILVA DOS SANTOS" 
                  value={newEmp.nome} 
                  onChange={(e) => setNewEmp({...newEmp, nome: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold uppercase h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">CPF</Label>
                  <Input 
                    placeholder="000.000.000-00" 
                    value={newEmp.cpf} 
                    onChange={(e) => setNewEmp({...newEmp, cpf: e.target.value})}
                    className="border-[#D2D7DB] font-bold h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Cargo / Função</Label>
                  <Input 
                    placeholder="Ex: Vendedor" 
                    value={newEmp.cargo} 
                    onChange={(e) => setNewEmp({...newEmp, cargo: e.target.value})}
                    className="border-[#D2D7DB] h-11 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Empresa Cliente Vinculada</Label>
                <Select value={newEmp.clientId} onValueChange={(v) => setNewEmp({...newEmp, clientId: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11">
                    <SelectValue placeholder="Selecione a empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">
                        {c.nomeFantasia || c.razaoSocial} ({formatCNPJ(c.cnpj)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Data de Admissão</Label>
                  <Input 
                    type="date"
                    value={newEmp.dataAdmissao} 
                    onChange={(e) => setNewEmp({...newEmp, dataAdmissao: e.target.value})}
                    className="border-[#D2D7DB] h-11 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Status</Label>
                  <Select value={newEmp.status} onValueChange={(v) => setNewEmp({...newEmp, status: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO" className="text-xs font-bold text-emerald-600">ATIVO</SelectItem>
                      <SelectItem value="INATIVO" className="text-xs font-bold text-red-600">INATIVO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="font-bold text-xs uppercase h-11">Cancelar</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-8 shadow-lg h-11" onClick={handleRegister}>
              <Save className="h-4 w-4 mr-2" /> Salvar Funcionário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDIÇÃO */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#39586D] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Editar Funcionário</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Alterando dados cadastrais de: {selectedEmp?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="modal-scroll-content">
            <div className="p-6 space-y-5 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome Completo</Label>
                <Input 
                  value={editFormData.nome} 
                  onChange={(e) => setEditFormData({...editFormData, nome: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold uppercase h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">CPF</Label>
                  <Input 
                    value={editFormData.cpf} 
                    onChange={(e) => setEditFormData({...editFormData, cpf: e.target.value})}
                    className="border-[#D2D7DB] font-bold h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Cargo / Função</Label>
                  <Input 
                    value={editFormData.cargo} 
                    onChange={(e) => setEditFormData({...editFormData, cargo: e.target.value})}
                    className="border-[#D2D7DB] h-11 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Empresa Cliente Vinculada</Label>
                <Select value={editFormData.clientId} onValueChange={(v) => setEditFormData({...editFormData, clientId: v})}>
                  <SelectTrigger className="border-[#D2D7DB] h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">
                        {c.nomeFantasia || c.razaoSocial} ({formatCNPJ(c.cnpj)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Data de Admissão</Label>
                  <Input 
                    type="date"
                    value={editFormData.dataAdmissao} 
                    onChange={(e) => setEditFormData({...editFormData, dataAdmissao: e.target.value})}
                    className="border-[#D2D7DB] h-11 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Status</Label>
                  <Select value={editFormData.status} onValueChange={(v) => setEditFormData({...editFormData, status: v})}>
                    <SelectTrigger className="border-[#D2D7DB] h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO" className="text-xs font-bold text-emerald-600">ATIVO</SelectItem>
                      <SelectItem value="INATIVO" className="text-xs font-bold text-red-600">INATIVO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="font-bold text-xs uppercase h-11">Cancelar</Button>
            <Button className="bg-[#2C4156] hover:bg-[#2C4156]/90 font-black uppercase text-xs px-8 shadow-lg h-11" onClick={handleUpdateEmp}>
              <Save className="h-4 w-4 mr-2" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
