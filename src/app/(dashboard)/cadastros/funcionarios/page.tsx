'use client';

import * as React from "react"
import { useState } from "react"
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2,
  UserPlus,
  Save,
  Edit2,
  Building,
  Briefcase,
  Calendar,
  CheckCircle2,
  Upload,
  Download,
  UploadCloud,
  Info,
  ChevronDown
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ClientSearchSelect } from "@/components/clients/client-search-select"
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
import { formatCNPJ, cn } from "@/lib/utils"

interface EmployeeForm {
  matricula: string
  nome: string
  cpf: string
  clientId: string
  cargo: string
  dataAdmissao: string
  codLotacao: string
  nomeLotacao: string
  salario: string
  statusFerias: boolean
  statusAfastado: boolean
  statusAviso: boolean
  statusDemissao: boolean
  dataInicioRescisao: string
  dataEfetivaDemissao: string
  status: string
}

const initialFormState: EmployeeForm = {
  matricula: "",
  nome: "",
  cpf: "",
  clientId: "",
  cargo: "",
  dataAdmissao: "",
  codLotacao: "",
  nomeLotacao: "",
  salario: "",
  statusFerias: false,
  statusAfastado: false,
  statusAviso: false,
  statusDemissao: false,
  dataInicioRescisao: "",
  dataEfetivaDemissao: "",
  status: "ATIVO"
}

export default function FuncionariosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  

  // Estados para linha e seleção de checkbox
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedEmp, setSelectedEmp] = useState<any>(null)

  // Estados dos modais de formulário
  const [newEmp, setNewEmp] = useState<EmployeeForm>({ ...initialFormState })
  const [editFormData, setEditFormData] = useState<EmployeeForm>({ ...initialFormState })

  // Estados do Drag & Drop de Importação
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importCompanyId, setImportCompanyId] = useState("detect")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Buscar funcionários cadastrados do banco real
  const empsQuery = useMemoFirebase(() => collection(firestore, "funcionarios"), [firestore])
  const { data: emps = [], isLoading } = useCollection(empsQuery)

  // Buscar clientes do banco real
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const selectedClientInfo = (clients || []).find((c: any) => c.id === newEmp.clientId)
  const editClientInfo = (clients || []).find((c: any) => c.id === editFormData.clientId)

  // Handlers para seleção na tabela
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredEmps.map(e => e.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id))
    }
  }

  // Cadastro de Novo Funcionário
  const handleRegister = () => {
    if (!newEmp.nome || !newEmp.clientId || !newEmp.matricula) {
      toast({ title: "Erro", description: "Empresa, Matrícula e Nome Completo são obrigatórios.", variant: "destructive" })
      return
    }

    const client = (clients || []).find(c => c.id === newEmp.clientId)
    if (!client) {
      toast({ title: "Erro", description: "Empresa selecionada inválida.", variant: "destructive" })
      return
    }

    // Calcula status geral
    let calculatedStatus = "ATIVO"
    if (newEmp.statusDemissao) calculatedStatus = "DEMITIDO"
    else if (newEmp.statusAviso) calculatedStatus = "AVISO PREVIO"
    else if (newEmp.statusAfastado) calculatedStatus = "AFASTADO"
    else if (newEmp.statusFerias) calculatedStatus = "DE FERIAS"

    const empId = Math.random().toString(36).substr(2, 9)
    const empRef = doc(firestore, "funcionarios", empId)
    
    const empData = {
      ...newEmp,
      id: empId,
      status: calculatedStatus,
      clientName: client.nomeFantasia || client.razaoSocial || "Empresa Vinculada",
      clientCnpj: client.cnpj || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setIsAddOpen(false)
    setDocumentNonBlocking(empRef, empData, { merge: true })
    
    setNewEmp({ ...initialFormState })
    toast({ title: "Funcionário Cadastrado!", description: `${empData.nome} foi salvo com sucesso.` })
  }

  // Carrega e abre Edição
  const handleOpenEdit = (emp: any) => {
    setSelectedEmp(emp)
    setEditFormData({
      matricula: emp.matricula || "",
      nome: emp.nome || "",
      cpf: emp.cpf || "",
      clientId: emp.clientId || "",
      cargo: emp.cargo || "",
      dataAdmissao: emp.dataAdmissao || "",
      codLotacao: emp.codLotacao || "",
      nomeLotacao: emp.nomeLotacao || "",
      salario: emp.salario || "",
      statusFerias: emp.statusFerias || false,
      statusAfastado: emp.statusAfastado || false,
      statusAviso: emp.statusAviso || false,
      statusDemissao: emp.statusDemissao || false,
      dataInicioRescisao: emp.dataInicioRescisao || "",
      dataEfetivaDemissao: emp.dataEfetivaDemissao || "",
      status: emp.status || "ATIVO"
    })
    setIsEditOpen(true)
  }

  // Grava Alteração de Funcionário
  const handleUpdateEmp = () => {
    if (!selectedEmp || !editFormData.nome || !editFormData.clientId || !editFormData.matricula) {
      toast({ title: "Erro", description: "Empresa, Matrícula e Nome Completo são obrigatórios.", variant: "destructive" })
      return
    }
    
    const client = (clients || []).find(c => c.id === editFormData.clientId)
    if (!client) {
      toast({ title: "Erro", description: "Empresa selecionada inválida.", variant: "destructive" })
      return
    }

    // Calcula status geral
    let calculatedStatus = "ATIVO"
    if (editFormData.statusDemissao) calculatedStatus = "DEMITIDO"
    else if (editFormData.statusAviso) calculatedStatus = "AVISO PREVIO"
    else if (editFormData.statusAfastado) calculatedStatus = "AFASTADO"
    else if (editFormData.statusFerias) calculatedStatus = "DE FERIAS"

    const empRef = doc(firestore, "funcionarios", selectedEmp.id)
    updateDocumentNonBlocking(empRef, {
      ...editFormData,
      status: calculatedStatus,
      clientName: client.nomeFantasia || client.razaoSocial || "Empresa Vinculada",
      clientCnpj: client.cnpj || "",
      updatedAt: new Date().toISOString()
    })

    setIsEditOpen(false)
    toast({ title: "Cadastro Atualizado!", description: "Dados salvos com sucesso." })
  }

  // Deleta Funcionário
  const handleDeleteEmp = (id: string) => {
    if (confirm("Deseja realmente excluir este funcionário? Isso afetará os lançamentos de férias e rescisões ativos.")) {
      deleteDocumentNonBlocking(doc(firestore, "funcionarios", id))
      toast({ title: "Funcionário removido", variant: "destructive" })
    }
  }

  // Lógica Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      toast({ title: "Arquivo Carregado", description: `Planilha ${e.dataTransfer.files[0].name} anexada com sucesso.` })
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      toast({ title: "Arquivo Selecionado", description: `Planilha ${e.target.files[0].name} anexada.` })
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleUploadPlanilha = () => {
    if (!selectedFile) return
    toast({ 
      title: "Planilha Importada!", 
      description: `Importação dos funcionários simulada com sucesso para o arquivo ${selectedFile.name}.` 
    })
    setIsImportOpen(false)
    setSelectedFile(null)
  }

  // Filtros aplicados na listagem
  const filteredEmps = (emps || []).filter(e => {
    const matchesSearch = 
      !searchTerm ||
      e.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.codLotacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.nomeLotacao?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = 
      selectedClientId === "all" || 
      e.clientId === selectedClientId

    return matchesSearch && matchesClient
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-8">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black text-[#2C4156] tracking-tight uppercase">Cadastrar Funcionários</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Vincule e gerencie as matrículas ativas de colaboradores nas empresas clientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-11 px-5 rounded-xl gap-2 transition-all"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload className="h-4 w-4 shrink-0" /> Importar Planilha
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 px-5 rounded-xl shadow-md transition-all gap-2" 
            onClick={() => setIsAddOpen(true)}
          >
            <UserPlus className="h-4 w-4 shrink-0" /> + Novo Funcionário
          </Button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#98A7AA]" />
          <Input
            placeholder="Buscar por nome, matrícula, lotação ou cargo..."
            className="pl-10 h-11 bg-white border-slate-200 text-xs font-semibold text-slate-700 focus-visible:ring-purple-600 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="border-slate-200 h-11 bg-white focus:ring-purple-600 text-xs font-bold text-slate-700 rounded-xl">
              <SelectValue placeholder="Filtrar por Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold text-blue-600">
                🏢 Todas as Empresas
              </SelectItem>
              {(clients || []).map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">
                  {c.nomeFantasia || c.razaoSocial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DATA TABLE */}
      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6">
                  <Checkbox 
                    checked={filteredEmps.length > 0 && selectedIds.length === filteredEmps.length} 
                    onCheckedChange={(checked) => handleSelectAll(!!checked)} 
                  />
                </TableHead>
                <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Matrícula</TableHead>
                <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Nome</TableHead>
                <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Empresa</TableHead>
                <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Lotação (Cód)</TableHead>
                <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Admissão</TableHead>
                <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider">Cargo</TableHead>
                <TableHead className="text-slate-500 font-bold text-xs uppercase tracking-wider text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase mt-2">Carregando lista...</p>
                  </TableCell>
                </TableRow>
              ) : filteredEmps.length > 0 ? (
                filteredEmps.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-[#F7F7F7]/50 transition-colors group">
                    <TableCell className="pl-6">
                      <Checkbox 
                        checked={selectedIds.includes(emp.id)} 
                        onCheckedChange={(checked) => handleSelectRow(emp.id, !!checked)} 
                      />
                    </TableCell>
                    <TableCell className="text-xs font-bold text-[#2C4156]">{emp.matricula || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-left">
                        <span className="font-semibold text-sm text-[#2C4156]">{emp.nome}</span>
                        {emp.status && emp.status !== "ATIVO" && (
                          <Badge className={cn(
                            "border-none text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                            emp.status === "DE FERIAS" && "bg-emerald-50 text-emerald-700",
                            emp.status === "AFASTADO" && "bg-amber-50 text-amber-700",
                            emp.status === "AVISO PREVIO" && "bg-orange-50 text-orange-700",
                            emp.status === "DEMITIDO" && "bg-red-50 text-red-700"
                          )}>
                            {emp.status}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-600">{emp.clientName}</span>
                        <span className="text-[9px] text-[#98A7AA] font-semibold">{formatCNPJ(emp.clientCnpj)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      {emp.codLotacao ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 font-bold border border-slate-200 text-[10px] px-2 py-0.5 rounded-md">
                            {emp.codLotacao}
                          </Badge>
                          <span className="text-xs text-slate-600 font-semibold truncate max-w-[120px]">
                            {emp.nomeLotacao || "Geral"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-semibold text-left">
                      {emp.dataAdmissao ? new Date(emp.dataAdmissao + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-[#2C4156] font-semibold text-left">{emp.cargo || "-"}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" 
                          onClick={() => handleOpenEdit(emp)}
                          title="Editar Cadastro"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" 
                          onClick={() => handleDeleteEmp(emp.id)}
                          title="Excluir Registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhum funcionário localizado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DE CRIAÇÃO (NovoFuncionarioModal) */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-purple-400" />
              Novo Funcionário
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Insira as informações cadastrais obrigatórias para vincular o colaborador à empresa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6 bg-white overflow-y-auto max-h-[500px]">
            {/* Empresa Select */}
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">
                Empresa Cadastrada *
              </Label>
              <ClientSearchSelect
                clients={clients}
                value={newEmp.clientId}
                onValueChange={(v: string) => setNewEmp({...newEmp, clientId: v})}
                placeholder="SELECIONE A EMPRESA..."
              />
            </div>

            {/* Matrícula e Nome */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Matrícula *</Label>
                <Input 
                  placeholder="Ex: 0041" 
                  value={newEmp.matricula} 
                  onChange={(e) => setNewEmp({...newEmp, matricula: e.target.value})}
                  className="border-slate-200 font-bold h-11"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome Completo *</Label>
                <Input 
                  placeholder="Ex: SILVIO SANTOS DA SILVA" 
                  value={newEmp.nome} 
                  onChange={(e) => setNewEmp({...newEmp, nome: e.target.value.toUpperCase()})}
                  className="border-slate-200 font-bold uppercase h-11"
                />
              </div>
            </div>

            {/* CPF */}
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">CPF</Label>
              <Input 
                placeholder="000.000.000-00" 
                value={newEmp.cpf} 
                onChange={(e) => setNewEmp({...newEmp, cpf: e.target.value})}
                className="border-slate-200 font-bold h-11"
              />
            </div>

            {/* Lotação (Cód + Nome) */}
            {selectedClientInfo?.hasDepartments && selectedClientInfo?.departments && selectedClientInfo.departments.length > 0 ? (
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Lotação / Departamento *</Label>
                <Select 
                  value={newEmp.nomeLotacao} 
                  onValueChange={(v) => setNewEmp({...newEmp, nomeLotacao: v, codLotacao: v})}
                >
                  <SelectTrigger className="border-slate-200 h-11 text-xs font-semibold text-slate-700">
                    <SelectValue placeholder="Selecione o departamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedClientInfo.departments.map((dept: string) => (
                      <SelectItem key={dept} value={dept} className="text-xs font-bold uppercase">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Código Lotação</Label>
                  <Input 
                    placeholder="Ex: 01.01" 
                    value={newEmp.codLotacao} 
                    onChange={(e) => setNewEmp({...newEmp, codLotacao: e.target.value})}
                    className="border-slate-200 h-11 font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome Lotação</Label>
                  <Input 
                    placeholder="Ex: Setor Geral" 
                    value={newEmp.nomeLotacao} 
                    onChange={(e) => setNewEmp({...newEmp, nomeLotacao: e.target.value})}
                    className="border-slate-200 h-11 font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Admissão e Cargo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Data de Admissão</Label>
                <Input 
                  type="date"
                  value={newEmp.dataAdmissao} 
                  onChange={(e) => setNewEmp({...newEmp, dataAdmissao: e.target.value})}
                  className="border-slate-200 h-11 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Cargo / Função</Label>
                <Input 
                  placeholder="Ex: Assistente de Operações" 
                  value={newEmp.cargo} 
                  onChange={(e) => setNewEmp({...newEmp, cargo: e.target.value})}
                  className="border-slate-200 h-11 font-semibold"
                />
              </div>
            </div>

            {/* Salário */}
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Salário Base (R$)</Label>
              <Input 
                placeholder="Ex: 1850.00" 
                value={newEmp.salario} 
                onChange={(e) => setNewEmp({...newEmp, salario: e.target.value})}
                className="border-slate-200 h-11 font-semibold"
              />
            </div>

            {/* Seção de Status (Lançamentos e Status) */}
            <div className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50 space-y-4">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest block text-left">Lançamentos & Status</Label>
              
              <div className="space-y-3">
                {/* De Férias */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <Label htmlFor="addStatusFerias" className="text-xs font-bold text-slate-700 cursor-pointer select-none">De Férias</Label>
                  </div>
                  <Checkbox 
                    id="addStatusFerias" 
                    checked={newEmp.statusFerias} 
                    onCheckedChange={(checked) => setNewEmp({...newEmp, statusFerias: !!checked})} 
                  />
                </div>

                {/* Afastado */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <Label htmlFor="addStatusAfastado" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Afastado por Benefício</Label>
                  </div>
                  <Checkbox 
                    id="addStatusAfastado" 
                    checked={newEmp.statusAfastado} 
                    onCheckedChange={(checked) => setNewEmp({...newEmp, statusAfastado: !!checked})} 
                  />
                </div>

                {/* Aviso Prévio */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                    <Label htmlFor="addStatusAviso" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Em Aviso Prévio</Label>
                  </div>
                  <Checkbox 
                    id="addStatusAviso" 
                    checked={newEmp.statusAviso} 
                    onCheckedChange={(checked) => setNewEmp({...newEmp, statusAviso: !!checked})} 
                  />
                </div>

                {/* Demissão */}
                <div className="flex flex-col gap-3 p-2.5 bg-white border border-slate-200/60 rounded-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                      <Label htmlFor="addStatusDemissao" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Demissão</Label>
                    </div>
                    <Checkbox 
                      id="addStatusDemissao" 
                      checked={newEmp.statusDemissao} 
                      onCheckedChange={(checked) => setNewEmp({...newEmp, statusDemissao: !!checked})} 
                    />
                  </div>

                  {/* Condicional de Demissão */}
                  {newEmp.statusDemissao && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1.5 text-left">
                        <Label htmlFor="addRescisaoInicio" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data Início Rescisão</Label>
                        <Input 
                          id="addRescisaoInicio" 
                          type="date" 
                          value={newEmp.dataInicioRescisao} 
                          onChange={(e) => setNewEmp({...newEmp, dataInicioRescisao: e.target.value})} 
                          className="border-slate-200 h-9 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <Label htmlFor="addRescisaoFim" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data Efetiva Demissão</Label>
                        <Input 
                          id="addRescisaoFim" 
                          type="date" 
                          value={newEmp.dataEfetivaDemissao} 
                          onChange={(e) => setNewEmp({...newEmp, dataEfetivaDemissao: e.target.value})} 
                          className="border-slate-200 h-9 text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="font-bold text-xs uppercase h-11">Cancelar</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs px-8 shadow-lg h-11 gap-1.5" onClick={handleRegister}>
              <Save className="h-4 w-4" /> Salvar Funcionário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDIÇÃO */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#39586D] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Edit2 className="h-6 w-6 text-blue-300" />
              Editar Cadastro do Funcionário
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Alterando dados cadastrais de: {selectedEmp?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6 bg-white overflow-y-auto max-h-[500px]">
            {/* Empresa Select */}
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">
                Empresa Cadastrada *
              </Label>
              <ClientSearchSelect
                clients={clients}
                value={editFormData.clientId}
                onValueChange={(v: string) => setEditFormData({...editFormData, clientId: v})}
                placeholder="SELECIONE A EMPRESA..."
              />
            </div>

            {/* Matrícula e Nome */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Matrícula *</Label>
                <Input 
                  value={editFormData.matricula} 
                  onChange={(e) => setEditFormData({...editFormData, matricula: e.target.value})}
                  className="border-slate-200 font-bold h-11"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome Completo *</Label>
                <Input 
                  value={editFormData.nome} 
                  onChange={(e) => setEditFormData({...editFormData, nome: e.target.value.toUpperCase()})}
                  className="border-slate-200 font-bold uppercase h-11"
                />
              </div>
            </div>

            {/* CPF */}
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">CPF</Label>
              <Input 
                value={editFormData.cpf} 
                onChange={(e) => setEditFormData({...editFormData, cpf: e.target.value})}
                className="border-slate-200 font-bold h-11"
              />
            </div>

            {/* Lotação (Cód + Nome) */}
            {editClientInfo?.hasDepartments && editClientInfo?.departments && editClientInfo.departments.length > 0 ? (
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Lotação / Departamento *</Label>
                <Select 
                  value={editFormData.nomeLotacao} 
                  onValueChange={(v) => setEditFormData({...editFormData, nomeLotacao: v, codLotacao: v})}
                >
                  <SelectTrigger className="border-slate-200 h-11 text-xs font-semibold text-slate-700">
                    <SelectValue placeholder="Selecione o departamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {editClientInfo.departments.map((dept: string) => (
                      <SelectItem key={dept} value={dept} className="text-xs font-bold uppercase">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Código Lotação</Label>
                  <Input 
                    value={editFormData.codLotacao} 
                    onChange={(e) => setEditFormData({...editFormData, codLotacao: e.target.value})}
                    className="border-slate-200 h-11 font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome Lotação</Label>
                  <Input 
                    value={editFormData.nomeLotacao} 
                    onChange={(e) => setEditFormData({...editFormData, nomeLotacao: e.target.value})}
                    className="border-slate-200 h-11 font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Admissão e Cargo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Data de Admissão</Label>
                <Input 
                  type="date"
                  value={editFormData.dataAdmissao} 
                  onChange={(e) => setEditFormData({...editFormData, dataAdmissao: e.target.value})}
                  className="border-slate-200 h-11 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Cargo / Função</Label>
                <Input 
                  value={editFormData.cargo} 
                  onChange={(e) => setEditFormData({...editFormData, cargo: e.target.value})}
                  className="border-slate-200 h-11 font-semibold"
                />
              </div>
            </div>

            {/* Salário */}
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Salário Base (R$)</Label>
              <Input 
                value={editFormData.salario} 
                onChange={(e) => setEditFormData({...editFormData, salario: e.target.value})}
                className="border-slate-200 h-11 font-semibold"
              />
            </div>

            {/* Seção de Status (Lançamentos e Status) */}
            <div className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50 space-y-4">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest block text-left">Lançamentos & Status</Label>
              
              <div className="space-y-3">
                {/* De Férias */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <Label htmlFor="editStatusFerias" className="text-xs font-bold text-slate-700 cursor-pointer select-none">De Férias</Label>
                  </div>
                  <Checkbox 
                    id="editStatusFerias" 
                    checked={editFormData.statusFerias} 
                    onCheckedChange={(checked) => setEditFormData({...editFormData, statusFerias: !!checked})} 
                  />
                </div>

                {/* Afastado */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <Label htmlFor="editStatusAfastado" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Afastado por Benefício</Label>
                  </div>
                  <Checkbox 
                    id="editStatusAfastado" 
                    checked={editFormData.statusAfastado} 
                    onCheckedChange={(checked) => setEditFormData({...editFormData, statusAfastado: !!checked})} 
                  />
                </div>

                {/* Aviso Prévio */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                    <Label htmlFor="editStatusAviso" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Em Aviso Prévio</Label>
                  </div>
                  <Checkbox 
                    id="editStatusAviso" 
                    checked={editFormData.statusAviso} 
                    onCheckedChange={(checked) => setEditFormData({...editFormData, statusAviso: !!checked})} 
                  />
                </div>

                {/* Demissão */}
                <div className="flex flex-col gap-3 p-2.5 bg-white border border-slate-200/60 rounded-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                      <Label htmlFor="editStatusDemissao" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Demissão</Label>
                    </div>
                    <Checkbox 
                      id="editStatusDemissao" 
                      checked={editFormData.statusDemissao} 
                      onCheckedChange={(checked) => setEditFormData({...editFormData, statusDemissao: !!checked})} 
                    />
                  </div>

                  {/* Condicional de Demissão */}
                  {editFormData.statusDemissao && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1.5 text-left">
                        <Label htmlFor="editRescisaoInicio" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data Início Rescisão</Label>
                        <Input 
                          id="editRescisaoInicio" 
                          type="date" 
                          value={editFormData.dataInicioRescisao} 
                          onChange={(e) => setEditFormData({...editFormData, dataInicioRescisao: e.target.value})} 
                          className="border-slate-200 h-9 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <Label htmlFor="editRescisaoFim" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data Efetiva Demissão</Label>
                        <Input 
                          id="editRescisaoFim" 
                          type="date" 
                          value={editFormData.dataEfetivaDemissao} 
                          onChange={(e) => setEditFormData({...editFormData, dataEfetivaDemissao: e.target.value})} 
                          className="border-slate-200 h-9 text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="font-bold text-xs uppercase h-11">Cancelar</Button>
            <Button className="bg-[#2C4156] hover:bg-[#2C4156]/90 font-black uppercase text-xs px-8 shadow-lg h-11 gap-1.5" onClick={handleUpdateEmp}>
              <Save className="h-4 w-4" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE IMPORTAÇÃO EM LOTE */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Upload className="h-6 w-6 text-purple-400" />
              Importar Planilha
            </DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Insira múltiplos colaboradores de uma só vez vinculados à empresa destino.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-white overflow-y-auto max-h-[450px]">
            {/* Empresa Destino Select */}
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Empresa Destino dos Funcionários</Label>
              <Select value={importCompanyId} onValueChange={setImportCompanyId}>
                <SelectTrigger className="border-slate-200 h-11 text-xs font-bold text-slate-700">
                  <SelectValue placeholder="Selecione a empresa ou detecção..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detect" className="text-xs font-bold text-indigo-600">
                    🔍 Detectar Empresa pela Coluna Código Empresa na Planilha
                  </SelectItem>
                  {(clients || []).map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">
                      {c.nomeFantasia || c.razaoSocial} ({formatCNPJ(c.cnpj)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-5 text-left text-blue-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Info className="h-4.5 w-4.5 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider">Colunas Suportadas</span>
              </div>
              <p className="text-[11px] font-semibold leading-relaxed text-blue-800/80">
                Certifique-se de que sua planilha contenha os cabeçalhos correspondentes abaixo:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["MATRÍCULA", "NOME", "CPF", "ADMISSÃO", "CARGO", "SALÁRIO", "CÓDIGO LOTAÇÃO", "NOME LOTAÇÃO"].map(col => (
                  <Badge key={col} className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 text-[8px] font-bold">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              className={cn(
                "border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:bg-slate-50/50 hover:border-indigo-400 group",
                dragActive && "border-indigo-500 bg-indigo-50/30"
              )}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInputChange} 
                accept=".xlsx,.csv" 
                className="hidden" 
              />
              <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                <UploadCloud className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">Arraste e solte sua planilha aqui</p>
                <p className="text-[10px] text-slate-400 font-semibold">ou clique para selecionar arquivo (.xlsx ou .csv)</p>
              </div>
              {selectedFile && (
                <div className="mt-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 animate-in zoom-in duration-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0 flex flex-row items-center justify-between w-full">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); toast({ title: "Download Iniciado", description: "O download do modelo Excel foi iniciado com sucesso." }) }} 
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" /> Baixar Modelo Excel
            </a>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(false)} className="font-bold text-xs uppercase h-11">Cancelar</Button>
              <Button 
                onClick={handleUploadPlanilha}
                className="bg-[#2C4156] hover:bg-[#2C4156]/90 font-black uppercase text-xs px-6 h-11 gap-1.5 shadow-md"
                disabled={!selectedFile}
              >
                Confirmar Importação
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  )
}
