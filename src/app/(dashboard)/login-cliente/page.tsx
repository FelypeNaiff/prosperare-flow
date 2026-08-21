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
  Key,
  Mail,
  Building,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  RefreshCw,
  Check,
  ChevronsUpDown,
  Pencil
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { firebaseConfig } from "@/firebase/config"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/firebase"
import { formatCNPJ, cn } from "@/lib/utils"

export default function LoginClientePage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  
  // Buscar usuários clientes cadastrados
  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: users = [], isLoading: loadingUsers } = useCollection(usersQuery)

  // Buscar empresas clientes reais para vinculação
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading: loadingClients } = useCollection(clientsQuery)

  const [newLogin, setNewLogin] = useState({
    fullName: "",
    email: "",
    password: "",
    clientIds: [] as string[]
  })

  // Estados para Edição
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    fullName: "",
    clientIds: [] as string[]
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // Estados dos Selects
  const [createSelectOpen, setCreateSelectOpen] = useState(false)
  const [editSelectOpen, setEditSelectOpen] = useState(false)
  const [createCompanySearch, setCreateCompanySearch] = useState("")
  const [editCompanySearch, setEditCompanySearch] = useState("")

  // Filtrar apenas usuários do tipo CLIENTE
  const clientLogins = (users || []).filter(u => u.profile?.toUpperCase() === 'CLIENTE')

  const filteredLogins = clientLogins.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cnpj?.includes(searchTerm)
  )

  const stats = {
    total: clientLogins.length,
    active: clientLogins.filter(u => u.status === 'ATIVO' || !u.status).length,
    inactive: clientLogins.filter(u => u.status === 'INATIVO').length
  }

  const cleanCnpj = (val: string) => (val || "").replace(/\D/g, "")

  const handleRegister = async () => {
    if (!newLogin.fullName || !newLogin.email || !newLogin.password || newLogin.clientIds.length === 0) {
      toast({ title: "Erro", description: "Nome, e-mail, senha e pelo menos uma empresa são obrigatórios.", variant: "destructive" })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLogin.email)) {
      toast({ title: "Erro", description: "Informe um e-mail válido para o cliente.", variant: "destructive" })
      return
    }

    if (newLogin.password.length < 6) {
      toast({ title: "Erro", description: "A senha de acesso deve ter pelo menos 6 caracteres.", variant: "destructive" })
      return
    }

    const selectedClients = (clients || []).filter(c => newLogin.clientIds.includes(c.id))
    if (selectedClients.length === 0) {
      toast({ title: "Erro", description: "Empresas selecionadas inválidas.", variant: "destructive" })
      return
    }

    const firstClient = selectedClients[0]
    const empresasVinculadas = selectedClients.map(c => ({
      cnpj: c.cnpj || "",
      companyName: c.nomeFantasia || c.razaoSocial || "",
      razaoSocial: c.razaoSocial || c.nomeFantasia || ""
    }))

    setIsRegistering(true)
    try {
      // Cria o usuário na autenticação do Firebase através do endpoint REST para não deslogar o admin atual
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newLogin.email.trim().toLowerCase(),
          password: newLogin.password,
          returnSecureToken: false
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        let msg = errData.error?.message || "Erro desconhecido ao registrar credencial."
        if (msg === "EMAIL_EXISTS") {
          msg = "Este endereço de e-mail já está cadastrado no sistema."
        } else if (msg === "WEAK_PASSWORD") {
          msg = "A senha deve ter pelo menos 6 caracteres."
        } else if (msg === "INVALID_EMAIL") {
          msg = "O formato do e-mail informado é inválido."
        }
        throw new Error(msg)
      }

      const resData = await response.json()
      const localId = resData.localId // ID do usuário gerado pelo Firebase Auth

      // Grava no Firestore na coleção de users
      const userRef = doc(firestore, "users", localId)
      const userData = {
        id: localId,
        fullName: newLogin.fullName.toUpperCase(),
        email: newLogin.email.trim().toLowerCase(),
        profile: "CLIENTE",
        status: "ATIVO",
        cnpj: firstClient.cnpj || "",
        companyName: firstClient.nomeFantasia || firstClient.razaoSocial || "",
        empresasVinculadas,
        createdAt: new Date().toISOString()
      }

      setDocumentNonBlocking(userRef, userData, { merge: true })
      
      setIsAddOpen(false)
      setNewLogin({ fullName: "", email: "", password: "", clientIds: [] })
      setCreateCompanySearch("")
      toast({ title: "Login Criado com Sucesso!", description: `Acesso liberado para as empresas do cliente.` })
    } catch (error: any) {
      console.error(error)
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" })
    } finally {
      setIsRegistering(false)
    }
  }

  const handleOpenEdit = (login: any) => {
    let selectedIds: string[] = []
    
    if (login.empresasVinculadas && login.empresasVinculadas.length > 0) {
      const cleanCnpjs = login.empresasVinculadas.map((e: any) => cleanCnpj(e.cnpj))
      selectedIds = (clients || [])
        .filter(c => cleanCnpjs.includes(cleanCnpj(c.cnpj || "")))
        .map(c => c.id)
    } else if (login.cnpj) {
      const cleanTarget = cleanCnpj(login.cnpj)
      selectedIds = (clients || [])
        .filter(c => cleanCnpj(c.cnpj || "") === cleanTarget)
        .map(c => c.id)
    }

    setEditingUser(login)
    setEditForm({
      fullName: login.fullName || "",
      clientIds: selectedIds
    })
    setEditCompanySearch("")
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editForm.fullName || editForm.clientIds.length === 0) {
      toast({ title: "Erro", description: "Nome e pelo menos uma empresa são obrigatórios.", variant: "destructive" })
      return
    }

    if (!editingUser) return

    setIsUpdating(true)
    try {
      const selectedClients = (clients || []).filter(c => editForm.clientIds.includes(c.id))
      if (selectedClients.length === 0) {
        toast({ title: "Erro", description: "Nenhuma empresa selecionada é válida.", variant: "destructive" })
        return
      }

      const firstClient = selectedClients[0]
      const empresasVinculadas = selectedClients.map(c => ({
        cnpj: c.cnpj || "",
        companyName: c.nomeFantasia || c.razaoSocial || "",
        razaoSocial: c.razaoSocial || c.nomeFantasia || ""
      }))

      const userRef = doc(firestore, "users", editingUser.id)
      const updateData = {
        fullName: editForm.fullName.toUpperCase(),
        cnpj: firstClient.cnpj || "",
        companyName: firstClient.nomeFantasia || firstClient.razaoSocial || "",
        empresasVinculadas
      }

      updateDocumentNonBlocking(userRef, updateData)
      
      setIsEditOpen(false)
      setEditingUser(null)
      toast({ title: "Acesso Atualizado!", description: "As credenciais do cliente foram atualizadas com sucesso." })
    } catch (error: any) {
      console.error(error)
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleStatus = (user: any) => {
    const userRef = doc(firestore, "users", user.id)
    const newStatus = user.status === 'INATIVO' ? 'ATIVO' : 'INATIVO'
    
    updateDocumentNonBlocking(userRef, { status: newStatus })
    toast({ title: "Status Atualizado", description: `O acesso de ${user.fullName} está agora ${newStatus}.` })
  }

  const handlePasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast({ title: "E-mail de Redefinição Enviado", description: `As instruções foram enviadas para ${email}.` })
    } catch (error: any) {
      console.error(error)
      toast({ title: "Erro no envio", description: "Não foi possível disparar o e-mail de redefinição de senha.", variant: "destructive" })
    }
  }

  const handleDeleteLogin = (id: string) => {
    if (confirm("Deseja realmente remover esta credencial de acesso do cliente? O usuário não conseguirá mais entrar no portal.")) {
      deleteDocumentNonBlocking(doc(firestore, "users", id))
      toast({ title: "Acesso Removido", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Login Cliente</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Gerencie as credenciais de acesso das empresas clientes ao Portal.</p>
        </div>
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-bold shadow-lg h-11" onClick={() => setIsAddOpen(true)}>
          <UserPlus className="h-4 w-4" /> Novo Login Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[#D2D7DB] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Total de Contas</p>
              <p className="text-3xl font-black text-[#2C4156]">{loadingUsers ? "--" : stats.total}</p>
            </div>
            <Lock className="h-8 w-8 text-[#98A7AA]/30" />
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB] shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Contas Ativas</p>
              <p className="text-3xl font-black text-emerald-600">{loadingUsers ? "--" : stats.active}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500/20" />
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB] shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Suspensas / Inativas</p>
              <p className="text-3xl font-black text-red-600">{loadingUsers ? "--" : stats.inactive}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white">
        <CardHeader className="pb-3 border-b bg-[#F7F7F7]/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input
              placeholder="Buscar por e-mail, nome do responsável ou nome da empresa..."
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
                <TableHead className="text-slate-500 font-medium text-sm">Responsável / E-mail</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Empresa Vinculada</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Status</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                  </TableCell>
                </TableRow>
              ) : filteredLogins.length > 0 ? (
                filteredLogins.map((login) => (
                  <TableRow key={login.id} className="hover:bg-[#F7F7F7]/50 transition-colors group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-[#2C4156]">{login.fullName}</span>
                        <span className="text-[10px] text-[#98A7AA] font-bold flex items-center gap-1 font-mono">
                          <Mail className="h-3 w-3" /> {login.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-blue-600 uppercase">{login.companyName}</span>
                          <span className="text-[9px] text-[#98A7AA] font-semibold font-mono">{formatCNPJ(login.cnpj)}</span>
                        </div>
                        {login.empresasVinculadas && login.empresasVinculadas.length > 1 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0 h-4 bg-slate-50 hover:bg-slate-100 text-[#2C4156] border-[#D2D7DB] cursor-help">
                                  +{login.empresasVinculadas.length - 1} {login.empresasVinculadas.length - 1 === 1 ? "empresa" : "empresas"}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#2C4156] border-[#2C4156] text-white p-3 rounded-lg shadow-xl max-w-xs space-y-1.5 z-[100]">
                                <p className="text-[9px] font-black uppercase text-white/50 tracking-widest">Empresas Vinculadas</p>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {login.empresasVinculadas.map((emp: any, idx: number) => (
                                    <div key={emp.cnpj || idx} className="text-xs font-bold flex flex-col border-b border-white/10 pb-1 last:border-0 last:pb-0">
                                      <span className="uppercase text-[11px]">{emp.companyName || emp.razaoSocial}</span>
                                      <span className="text-[9px] text-white/60 font-medium font-mono">{formatCNPJ(emp.cnpj)}</span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "border-none text-[9px] font-bold tracking-wide uppercase px-2 py-0.5",
                        (login.status === 'ATIVO' || !login.status) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}>
                        {login.status || 'ATIVO'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-[#98A7AA]"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem className="gap-2 text-xs font-bold uppercase cursor-pointer" onClick={() => handleOpenEdit(login)}>
                            <Pencil className="h-3.5 w-3.5 text-[#2563EB]" /> 
                            Editar Acesso
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-xs font-bold uppercase cursor-pointer" onClick={() => handleToggleStatus(login)}>
                            <RefreshCw className="h-3.5 w-3.5 text-[#2563EB]" /> 
                            {login.status === 'INATIVO' ? 'Reativar Acesso' : 'Desativar Acesso'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-xs font-bold uppercase cursor-pointer" onClick={() => handlePasswordReset(login.email)}>
                            <Key className="h-3.5 w-3.5 text-amber-500" /> Redefinir Senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-xs font-bold text-[#E74C3C] cursor-pointer uppercase" 
                            onClick={() => handleDeleteLogin(login.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remover Acesso
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhum login cliente localizado.
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
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Criar Acesso Cliente</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Gere um login e senha seguros para que o cliente acesse o Portal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="modal-scroll-content">
            <div className="p-6 space-y-5 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome do Responsável</Label>
                <Input 
                  placeholder="Ex: CARLOS ALBERTO SILVA" 
                  value={newLogin.fullName} 
                  onChange={(e) => setNewLogin({...newLogin, fullName: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold uppercase h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">E-mail (Será o login)</Label>
                <Input 
                  type="email"
                  placeholder="ex: contato@empresa.com" 
                  value={newLogin.email} 
                  onChange={(e) => setNewLogin({...newLogin, email: e.target.value})}
                  className="border-[#D2D7DB] font-bold h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Senha de Acesso (Mín. 6 Caracteres)</Label>
                <Input 
                  type="password"
                  placeholder="Digite a senha inicial" 
                  value={newLogin.password} 
                  onChange={(e) => setNewLogin({...newLogin, password: e.target.value})}
                  className="border-[#D2D7DB] h-11"
                  required
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest mb-1">Empresas Clientes Vinculadas</Label>
                {loadingClients ? (
                  <div className="h-11 flex items-center justify-center border border-dashed rounded-lg bg-slate-50">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                    <span className="text-xs font-semibold text-slate-400">Carregando empresas...</span>
                  </div>
                ) : (
                  <Popover open={createSelectOpen} onOpenChange={setCreateSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={createSelectOpen}
                        className="w-full justify-between border-[#D2D7DB] h-11 text-xs font-bold text-[#2C4156] px-3 bg-white hover:bg-white active:bg-white text-left"
                      >
                        <span className="truncate">
                          {newLogin.clientIds.length === 0
                            ? "Selecionar empresas..."
                            : `${newLogin.clientIds.length} ${
                                newLogin.clientIds.length === 1
                                  ? "empresa selecionada"
                                  : "empresas selecionadas"
                              }`}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0" align="start">
                      <div className="flex flex-col">
                        <div className="flex items-center border-b p-2 bg-slate-50 gap-2">
                          <Search className="h-4 w-4 text-slate-400 shrink-0" />
                          <Input
                            placeholder="Buscar empresa pelo nome ou CNPJ..."
                            value={createCompanySearch}
                            onChange={(e) => setCreateCompanySearch(e.target.value)}
                            className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between border-b px-3 py-1.5 bg-slate-100/50">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="h-6 px-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            onClick={() => {
                              const allIds = (clients || []).map((c: any) => c.id)
                              setNewLogin(prev => ({ ...prev, clientIds: allIds }))
                            }}
                          >
                            Selecionar Todas
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="h-6 px-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-transparent"
                            onClick={() => {
                              setNewLogin(prev => ({ ...prev, clientIds: [] }))
                            }}
                          >
                            Limpar Seleção
                          </Button>
                        </div>

                        <ScrollArea className="h-60 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {(() => {
                              const filtered = (clients || []).filter((c: any) => {
                                const term = createCompanySearch.toLowerCase()
                                return (
                                  (c.nomeFantasia || "").toLowerCase().includes(term) ||
                                  (c.razaoSocial || "").toLowerCase().includes(term) ||
                                  (c.cnpj || "").includes(term)
                                )
                              })

                              if (filtered.length === 0) {
                                return (
                                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                    Nenhuma empresa encontrada
                                  </div>
                                )
                              }

                              return filtered.map((c: any) => {
                                const isChecked = newLogin.clientIds.includes(c.id)
                                return (
                                  <div
                                    key={c.id}
                                    className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                    onClick={() => {
                                      const nextIds = isChecked
                                        ? newLogin.clientIds.filter(id => id !== c.id)
                                        : [...newLogin.clientIds, c.id]
                                      setNewLogin(prev => ({ ...prev, clientIds: nextIds }))
                                    }}
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() => {}}
                                      className="border-[#D2D7DB] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none"
                                    />
                                    <div className="flex flex-col overflow-hidden">
                                      <span className="text-xs font-bold text-slate-700 truncate uppercase">
                                        {c.nomeFantasia || c.razaoSocial}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                        {formatCNPJ(c.cnpj)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })
                            })()}
                          </div>
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="font-bold text-xs uppercase h-11" disabled={isRegistering}>Cancelar</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-8 shadow-lg h-11 gap-2" onClick={handleRegister} disabled={isRegistering}>
              {isRegistering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Criar Credencial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDIÇÃO */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Editar Acesso Cliente</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Atualize as informações de cadastro e empresas vinculadas do cliente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="modal-scroll-content">
            <div className="p-6 space-y-5 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome do Responsável</Label>
                <Input 
                  placeholder="Ex: CARLOS ALBERTO SILVA" 
                  value={editForm.fullName} 
                  onChange={(e) => setEditForm({...editForm, fullName: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold uppercase h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">E-mail (Login - Não Alterável)</Label>
                <Input 
                  value={editingUser?.email || ""} 
                  className="border-[#D2D7DB] font-bold h-11 bg-slate-50 text-slate-500 cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest mb-1">Empresas Clientes Vinculadas</Label>
                {loadingClients ? (
                  <div className="h-11 flex items-center justify-center border border-dashed rounded-lg bg-slate-50">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                    <span className="text-xs font-semibold text-slate-400">Carregando empresas...</span>
                  </div>
                ) : (
                  <Popover open={editSelectOpen} onOpenChange={setEditSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={editSelectOpen}
                        className="w-full justify-between border-[#D2D7DB] h-11 text-xs font-bold text-[#2C4156] px-3 bg-white hover:bg-white active:bg-white text-left"
                      >
                        <span className="truncate">
                          {editForm.clientIds.length === 0
                            ? "Selecionar empresas..."
                            : `${editForm.clientIds.length} ${
                                editForm.clientIds.length === 1
                                  ? "empresa selecionada"
                                  : "empresas selecionadas"
                              }`}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0" align="start">
                      <div className="flex flex-col">
                        <div className="flex items-center border-b p-2 bg-slate-50 gap-2">
                          <Search className="h-4 w-4 text-slate-400 shrink-0" />
                          <Input
                            placeholder="Buscar empresa pelo nome ou CNPJ..."
                            value={editCompanySearch}
                            onChange={(e) => setEditCompanySearch(e.target.value)}
                            className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between border-b px-3 py-1.5 bg-slate-100/50">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="h-6 px-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            onClick={() => {
                              const allIds = (clients || []).map((c: any) => c.id)
                              setEditForm(prev => ({ ...prev, clientIds: allIds }))
                            }}
                          >
                            Selecionar Todas
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="h-6 px-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-transparent"
                            onClick={() => {
                              setEditForm(prev => ({ ...prev, clientIds: [] }))
                            }}
                          >
                            Limpar Seleção
                          </Button>
                        </div>

                        <ScrollArea className="h-60 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {(() => {
                              const filtered = (clients || []).filter((c: any) => {
                                const term = editCompanySearch.toLowerCase()
                                return (
                                  (c.nomeFantasia || "").toLowerCase().includes(term) ||
                                  (c.razaoSocial || "").toLowerCase().includes(term) ||
                                  (c.cnpj || "").includes(term)
                                )
                              })

                              if (filtered.length === 0) {
                                return (
                                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                    Nenhuma empresa encontrada
                                  </div>
                                )
                              }

                              return filtered.map((c: any) => {
                                const isChecked = editForm.clientIds.includes(c.id)
                                return (
                                  <div
                                    key={c.id}
                                    className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                    onClick={() => {
                                      const nextIds = isChecked
                                        ? editForm.clientIds.filter(id => id !== c.id)
                                        : [...editForm.clientIds, c.id]
                                      setEditForm(prev => ({ ...prev, clientIds: nextIds }))
                                    }}
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() => {}}
                                      className="border-[#D2D7DB] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none"
                                    />
                                    <div className="flex flex-col overflow-hidden">
                                      <span className="text-xs font-bold text-slate-700 truncate uppercase">
                                        {c.nomeFantasia || c.razaoSocial}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                        {formatCNPJ(c.cnpj)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })
                            })()}
                          </div>
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="font-bold text-xs uppercase h-11" disabled={isUpdating}>Cancelar</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-8 shadow-lg h-11 gap-2" onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
