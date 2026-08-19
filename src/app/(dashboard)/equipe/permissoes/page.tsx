"use client"

import { useState, useEffect } from "react"
import { 
  Lock, 
  ShieldCheck, 
  Search, 
  ArrowLeft, 
  Check, 
  X, 
  ShieldAlert,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Layers,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, doc, deleteDoc, setDoc, updateDoc } from "firebase/firestore"

const MODULE_PERMISSIONS = [
  { id: 'relacionamento', label: 'Relacionamento (Clientes, Atendimentos)', desc: 'Acesso à aba de Clientes, Atendimentos e Agenda de Demandas.' },
  { id: 'processos', label: 'Fluxo de Produção (Processos, Kanban)', desc: 'Acesso ao Kanban de Processos, Checklist, Parcelamentos e Certidões.' },
  { id: 'societario', label: 'Societário (Abertura, Alteração, Baixa)', desc: 'Acesso aos fluxos do societário.' },
  { id: 'docs_flow', label: 'Docs Flow (Documentos, Cofre)', desc: 'Acesso ao Gerador de Documentos, Histórico e Cofre de Senhas.' },
  { id: 'financeiro', label: 'Financeiro (Contas a Receber/Pagar, Fluxo)', desc: 'Acesso à gestão financeira completa do escritório.', restricted: true },
  { id: 'equipe', label: 'Gestão de Equipe (Membros, Departamentos)', desc: 'Acesso às configurações de colaboradores, departamentos e privilégios.', restricted: true },
  { id: 'configuracoes', label: 'Configurações (Meus Dados, Integrações)', desc: 'Acesso ao menu de configurações do escritório.', restricted: true },
];

const PERMISSION_GROUPS = [
  {
    id: 'clientes',
    label: 'Ações de Clientes (Relacionamento)',
    description: 'Controle granular para a base de empresas e dados sensíveis.',
    permissions: [
      { id: 'view_clients', label: 'Ver Ficha Completa', desc: 'Acesso aos dados básicos e contatos.' },
      { id: 'edit_clients', label: 'Editar Dados Cadastrais', desc: 'Alterar CNPJ, regime e endereço.' },
      { id: 'delete_clients', label: 'Excluir Cliente', desc: 'Remover empresa do sistema.', sensitive: true },
      { id: 'view_passwords', label: 'Acessar Cofre de Senhas', desc: 'Visualizar senhas de prefeituras e portais.', sensitive: true },
      { id: 'manage_procurations', label: 'Gerenciar Procurações', desc: 'Controlar vigência de procurações e-CAC.' },
    ]
  },
  {
    id: 'processos',
    label: 'Ações de Processos (Fluxo)',
    description: 'Controle granular para tarefas e obrigações fiscais.',
    permissions: [
      { id: 'view_tasks', label: 'Visualizar Tarefas', desc: 'Ver kanban e listas de processos.' },
      { id: 'manage_tasks', label: 'Criar/Editar Processos', desc: 'Cadastrar novas obrigações avulsas.' },
      { id: 'complete_tasks', label: 'Concluir Tarefas', desc: 'Marcar processos como entregues.' },
      { id: 'transfer_tasks', label: 'Mudar Responsável', desc: 'Passagem de bastão entre usuários.' },
      { id: 'manage_groups', label: 'Gerenciar Grupos de Obrigações', desc: 'Configurar automação por tipo de cliente.' },
    ]
  }
];

const DEFAULT_PROFILES = [
  {
    id: "socio",
    name: "SÓCIO",
    description: "Sócio proprietário do escritório. Acesso irrestrito a todos os módulos e configurações.",
    permissions: {
      relacionamento: true,
      processos: true,
      societario: true,
      docs_flow: true,
      financeiro: true,
      equipe: true,
      configuracoes: true,
      view_clients: true,
      edit_clients: true,
      delete_clients: true,
      view_passwords: true,
      manage_procurations: true,
      view_tasks: true,
      manage_tasks: true,
      complete_tasks: true,
      transfer_tasks: true,
      manage_groups: true,
    }
  },
  {
    id: "administrador",
    name: "ADMINISTRADOR",
    description: "Administrador do sistema. Acesso total a todas as áreas administrativas e operacionais.",
    permissions: {
      relacionamento: true,
      processos: true,
      societario: true,
      docs_flow: true,
      financeiro: true,
      equipe: true,
      configuracoes: true,
      view_clients: true,
      edit_clients: true,
      delete_clients: true,
      view_passwords: true,
      manage_procurations: true,
      view_tasks: true,
      manage_tasks: true,
      complete_tasks: true,
      transfer_tasks: true,
      manage_groups: true,
    }
  },
  {
    id: "supervisor",
    name: "SUPERVISOR",
    description: "Supervisor operacional. Acesso total a todos os fluxos e equipe, exceto ao módulo Financeiro.",
    permissions: {
      relacionamento: true,
      processos: true,
      societario: true,
      docs_flow: true,
      financeiro: false,
      equipe: true,
      configuracoes: true,
      view_clients: true,
      edit_clients: true,
      delete_clients: true,
      view_passwords: true,
      manage_procurations: true,
      view_tasks: true,
      manage_tasks: true,
      complete_tasks: true,
      transfer_tasks: true,
      manage_groups: true,
    }
  },
  {
    id: "contador_gestor",
    name: "CONTADOR/GESTOR",
    description: "Gestor contábil. Acesso operacional e ao módulo financeiro do escritório.",
    permissions: {
      relacionamento: true,
      processos: true,
      societario: true,
      docs_flow: true,
      financeiro: true,
      equipe: false,
      configuracoes: false,
      view_clients: true,
      edit_clients: true,
      delete_clients: false,
      view_passwords: true,
      manage_procurations: true,
      view_tasks: true,
      manage_tasks: true,
      complete_tasks: true,
      transfer_tasks: true,
      manage_groups: true,
    }
  },
  {
    id: "assistente",
    name: "ASSISTENTE",
    description: "Assistente / Analista operacional. Acesso restrito a tarefas operacionais e relacionamento.",
    permissions: {
      relacionamento: true,
      processos: true,
      societario: true,
      docs_flow: true,
      financeiro: false,
      equipe: false,
      configuracoes: false,
      view_clients: true,
      edit_clients: true,
      delete_clients: false,
      view_passwords: false,
      manage_procurations: false,
      view_tasks: true,
      manage_tasks: true,
      complete_tasks: true,
      transfer_tasks: false,
      manage_groups: false,
    }
  }
];

export default function PermissoesPage() {
  const router = useRouter()
  const firestore = useFirestore()

  // Estados dos Colaboradores
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedCollabProfile, setSelectedCollabProfile] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados de Perfis de Acesso
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [profileSearchTerm, setProfileSearchTerm] = useState("")
  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    permissions: {} as Record<string, boolean>
  })

  // Queries e Subscrições Firebase
  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: users = [], isLoading: isLoadingUsers } = useCollection(usersQuery)

  const profilesQuery = useMemoFirebase(() => collection(firestore, "accessProfiles"), [firestore])
  const { data: dbProfiles = [], isLoading: isLoadingProfiles } = useCollection(profilesQuery)

  // Auto-seed de perfis padrão se a coleção estiver vazia
  useEffect(() => {
    if (!isLoadingProfiles && (dbProfiles || []).length === 0) {
      DEFAULT_PROFILES.forEach((profile) => {
        const profileRef = doc(firestore, "accessProfiles", profile.id)
        setDocumentNonBlocking(profileRef, profile, { merge: true })
      })
      toast({ 
        title: "Perfis Inicializados!", 
        description: "Os perfis padrão foram criados no banco de dados.",
        className: "bg-[#2563EB] text-white border-none"
      })
    }
  }, [isLoadingProfiles, dbProfiles, firestore])

  // Handlers para colaboradores
  const handleOpenPerms = (user: any) => {
    setSelectedUser(user)
    setSelectedCollabProfile(user.profile || "ASSISTENTE")
    setIsModalOpen(true)
  }

  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return
    
    try {
      const userRef = doc(firestore, "users", selectedUser.id)
      await updateDoc(userRef, { profile: selectedCollabProfile })
      setIsModalOpen(false)
      toast({ 
        title: "Perfil Atualizado!", 
        description: `O perfil de ${selectedUser.fullName} foi alterado para ${selectedCollabProfile}.`,
        className: "bg-[#2563EB] text-white border-none"
      })
    } catch (error) {
      toast({ 
        title: "Erro ao salvar", 
        description: "Ocorreu um erro ao atualizar o perfil do colaborador.", 
        variant: "destructive" 
      })
    }
  }

  // Handlers para perfis de acesso
  const handleOpenNewProfile = () => {
    setSelectedProfile(null)
    const initialPerms = {} as Record<string, boolean>
    MODULE_PERMISSIONS.forEach(m => {
      initialPerms[m.id] = m.id !== 'financeiro' && m.id !== 'equipe' && m.id !== 'configuracoes'
    })
    PERMISSION_GROUPS.forEach(g => {
      g.permissions.forEach(p => {
        initialPerms[p.id] = !p.sensitive
      })
    })

    setProfileForm({
      name: "",
      description: "",
      permissions: initialPerms
    })
    setIsProfileModalOpen(true)
  }

  const handleOpenEditProfile = (profile: any) => {
    setSelectedProfile(profile)
    setProfileForm({
      name: profile.name,
      description: profile.description || "",
      permissions: profile.permissions || {}
    })
    setIsProfileModalOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast({ title: "Erro", description: "O nome do perfil é obrigatório.", variant: "destructive" })
      return
    }

    try {
      const id = selectedProfile ? selectedProfile.id : profileForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")
      const profileRef = doc(firestore, "accessProfiles", id)
      
      const data = {
        id,
        name: profileForm.name.toUpperCase().trim(),
        description: profileForm.description.trim(),
        permissions: profileForm.permissions
      }

      await setDoc(profileRef, data, { merge: true })
      setIsProfileModalOpen(false)
      toast({
        title: selectedProfile ? "Perfil Atualizado!" : "Perfil Criado!",
        description: `As regras para o perfil ${data.name} foram salvas.`,
        className: "bg-[#2563EB] text-white border-none"
      })
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar configurações do perfil.", variant: "destructive" })
    }
  }

  const handleDeleteProfile = async (profile: any) => {
    const protectedIds = ["socio", "administrador", "supervisor", "contador_gestor", "assistente"]
    if (protectedIds.includes(profile.id)) {
      toast({ title: "Acesso Negado", description: "Perfis padrão do sistema não podem ser excluídos.", variant: "destructive" })
      return
    }

    if (confirm(`Deseja realmente excluir o perfil ${profile.name}? Colaboradores vinculados a este perfil perderão os acessos customizados.`)) {
      try {
        const profileRef = doc(firestore, "accessProfiles", profile.id)
        await deleteDoc(profileRef)
        toast({ title: "Perfil removido!", variant: "destructive" })
      } catch (error) {
        toast({ title: "Erro", description: "Erro ao remover perfil de acesso.", variant: "destructive" })
      }
    }
  }

  const handleTogglePermission = (key: string) => {
    setProfileForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }))
  }

  // Filtragem dos dados
  const filteredUsers = (users || []).filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.profile?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeProfilesList = (dbProfiles && dbProfiles.length > 0) ? dbProfiles : DEFAULT_PROFILES
  const filteredProfiles = (activeProfilesList || []).filter(p => 
    p.name?.toLowerCase().includes(profileSearchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(profileSearchTerm.toLowerCase())
  )

  // Auxiliar para pegar o objeto de permissões do perfil selecionado no diálogo do colaborador
  const currentCollabProfileObj = (activeProfilesList || []).find(p => p.name?.toUpperCase() === selectedCollabProfile.toUpperCase())

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header da Página */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#39586D]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Gestão de Permissões</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Configuração granular de privilégios e modelos de perfil de acesso.</p>
        </div>
      </div>

      <Tabs defaultValue="colaboradores" className="w-full space-y-6">
        {/* Controle das Abas */}
        <TabsList className="bg-slate-100 border border-[#D2D7DB] p-1 rounded-xl h-12 flex justify-start w-fit">
          <TabsTrigger 
            value="colaboradores" 
            className="font-bold text-xs uppercase px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2563EB] data-[state=active]:shadow-sm text-[#39586D]"
          >
            Colaboradores
          </TabsTrigger>
          <TabsTrigger 
            value="perfis" 
            className="font-bold text-xs uppercase px-6 h-10 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2563EB] data-[state=active]:shadow-sm text-[#39586D]"
          >
            Perfis de Acesso
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo: Aba Colaboradores */}
        <TabsContent value="colaboradores" className="space-y-6 mt-0">
          <Card className="border-[#D2D7DB] shadow-sm">
            <CardHeader className="bg-[#F7F7F7]/50 border-b">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <CardTitle className="text-lg font-semibold text-[#2C4156] flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#2563EB]" />
                  Colaboradores Autorizados
                </CardTitle>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
                  <Input 
                    placeholder="Buscar colaborador..." 
                    className="pl-9 h-9 bg-white border-[#D2D7DB]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-slate-500 font-medium text-sm">Colaborador</TableHead>
                    <TableHead className="text-slate-500 font-medium text-sm">Perfil de Acesso</TableHead>
                    <TableHead className="text-slate-500 font-medium text-sm">E-mail</TableHead>
                    <TableHead className="text-slate-500 font-medium text-sm text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-[#F7F7F7]">
                        <TableCell className="font-semibold text-[#2C4156]">{user.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-medium border-[#D2D7DB] text-[#39586D]">{user.profile}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-[#98A7AA]">{user.email}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="gap-2 border-[#D2D7DB] text-[#2C4156] font-semibold" onClick={() => handleOpenPerms(user)}>
                            <ShieldCheck className="h-4 w-4 text-[#2563EB]" /> Ajustar Privilégios
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-[#98A7AA] font-bold">
                        Nenhum colaborador encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo: Aba Perfis de Acesso */}
        <TabsContent value="perfis" className="space-y-6 mt-0 animate-in fade-in duration-300">
          <Card className="border-[#D2D7DB] shadow-sm">
            <CardHeader className="bg-[#F7F7F7]/50 border-b">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <CardTitle className="text-lg font-semibold text-[#2C4156] flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#2563EB]" />
                  Modelos de Perfis de Acesso
                </CardTitle>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
                    <Input 
                      placeholder="Buscar perfil..." 
                      className="pl-9 h-9 bg-white border-[#D2D7DB]" 
                      value={profileSearchTerm}
                      onChange={(e) => setProfileSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-bold h-9 shadow-md text-xs uppercase" onClick={handleOpenNewProfile}>
                    <Plus className="h-4 w-4" /> Novo Perfil
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-slate-500 font-medium text-sm">Perfil</TableHead>
                    <TableHead className="text-slate-500 font-medium text-sm">Descrição</TableHead>
                    <TableHead className="text-slate-500 font-medium text-sm">Privilégios</TableHead>
                    <TableHead className="text-slate-500 font-medium text-sm text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProfiles ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                      </TableCell>
                    </TableRow>
                  ) : filteredProfiles.length > 0 ? (
                    filteredProfiles.map((profile) => {
                      const count = Object.values(profile.permissions || {}).filter(Boolean).length
                      const isProtected = ["socio", "administrador", "supervisor", "contador_gestor", "assistente"].includes(profile.id)
                      
                      return (
                        <TableRow key={profile.id} className="hover:bg-[#F7F7F7]">
                          <TableCell className="font-semibold text-[#2C4156] w-48">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#2C4156] text-white border-none text-[10px] font-bold uppercase">{profile.name}</Badge>
                              {isProtected && <Badge variant="outline" className="text-[8px] border-[#D2D7DB] text-[#98A7AA]">PADRÃO</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-[#39586D] font-medium">{profile.description || "Nenhuma descrição fornecida."}</TableCell>
                          <TableCell className="w-36">
                            <Badge className="bg-blue-50 text-blue-700 border-none font-bold text-[10px]">{count} permissões</Badge>
                          </TableCell>
                          <TableCell className="text-right w-48">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="sm" className="gap-1.5 border-[#D2D7DB] text-xs font-semibold" onClick={() => handleOpenEditProfile(profile)}>
                                <Edit2 className="h-3 w-3 text-[#2563EB]" /> Editar
                              </Button>
                              {!isProtected && (
                                <Button variant="outline" size="sm" className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-semibold" onClick={() => handleDeleteProfile(profile)}>
                                  <Trash2 className="h-3 w-3" /> Excluir
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-[#98A7AA] font-bold">
                        Nenhum perfil de acesso encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIÁLOGO: Ajustar privilégios de colaborador (associa Perfil e mostra permissões herdadas) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <ShieldCheck className="h-8 w-8 text-[#2563EB]" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase">Privilégios do Colaborador</DialogTitle>
                <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
                  Colaborador: {selectedUser?.fullName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Campo para escolher o Perfil */}
              <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <Label className="text-[10px] font-black uppercase text-[#39586D] tracking-widest">Modelo de Perfil de Acesso</Label>
                <Select value={selectedCollabProfile} onValueChange={setSelectedCollabProfile}>
                  <SelectTrigger className="border-[#D2D7DB] bg-white h-11">
                    <SelectValue placeholder="Selecione um modelo de perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProfilesList.map((p) => (
                      <SelectItem key={p.id} value={p.name} className="text-xs font-bold">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[9px] font-bold text-[#98A7AA] uppercase mt-1">
                  Os privilégios abaixo são visualizações em tempo real herdados do perfil selecionado. Para fazer mudanças, edite o perfil diretamente na aba "Perfis de Acesso".
                </p>
              </div>

              {/* Pré-visualização das Permissões do Perfil Selecionado */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-[#2C4156] uppercase tracking-wider">Visualização de Acessos</h3>
                
                {/* Módulos do Sistema */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Módulos Permitidos</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {MODULE_PERMISSIONS.map(m => {
                      const hasAccess = !!currentCollabProfileObj?.permissions?.[m.id]
                      return (
                        <div key={m.id} className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border text-left",
                          hasAccess ? "bg-emerald-50/30 border-emerald-100" : "bg-slate-50/50 border-slate-100 opacity-60"
                        )}>
                          <Checkbox checked={hasAccess} disabled className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                          <div>
                            <p className="text-xs font-bold text-[#39586D]">{m.label}</p>
                            <p className="text-[9px] text-[#98A7AA] font-semibold">{m.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Ações Granulares */}
                <Accordion type="multiple" className="w-full mt-4">
                  {PERMISSION_GROUPS.map((group) => (
                    <AccordionItem key={group.id} value={group.id} className="border-[#D2D7DB]">
                      <AccordionTrigger className="hover:no-underline py-3 px-2 hover:bg-[#F7F7F7] rounded-lg">
                        <div className="text-left">
                          <p className="text-xs font-black text-[#2C4156] uppercase">{group.label}</p>
                          <p className="text-[9px] font-bold text-[#98A7AA] uppercase">{group.description}</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-2">
                        {group.permissions.map((perm) => {
                          const hasAccess = !!currentCollabProfileObj?.permissions?.[perm.id]
                          return (
                            <div key={perm.id} className={cn(
                              "flex items-center justify-between p-3 rounded-xl border border-transparent hover:bg-[#F7F7F7] transition-all",
                              hasAccess ? "bg-emerald-50/10" : "opacity-60",
                              perm.sensitive && "bg-amber-50/10"
                            )}>
                              <div className="space-y-0.5 flex-1 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-[#39586D] uppercase">{perm.label}</span>
                                  {perm.sensitive && (
                                    <Badge className="bg-[#FEF3C7] text-[#F2B705] border-none text-[8px] font-black uppercase flex items-center gap-1">
                                      <ShieldAlert className="h-2 w-2" /> Sensível (LGPD)
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[9px] font-bold text-[#98A7AA]">{perm.desc}</p>
                              </div>
                              <Checkbox checked={hasAccess} disabled className="h-5 w-5 border-[#D2D7DB] data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                            </div>
                          )
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-[#D2D7DB] font-bold">Cancelar</Button>
            <Button className="bg-[#2563EB] font-black uppercase text-xs px-10 shadow-lg" onClick={handleSaveUserPermissions}>Salvar Perfil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: Criar / Editar Perfil de Acesso */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#39586D] text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase">
                  {selectedProfile ? "Editar Perfil de Acesso" : "Criar Perfil de Acesso"}
                </DialogTitle>
                <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
                  Configure o nome do perfil e todas as regras de acesso associadas.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 bg-white">
              {/* Form Campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome do Perfil</Label>
                  <Input 
                    placeholder="EX: SUPERVISOR DE TI"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value.toUpperCase() })}
                    disabled={selectedProfile && ["socio", "administrador", "supervisor", "contador_gestor", "assistente"].includes(selectedProfile.id)}
                    className="border-[#D2D7DB] font-bold uppercase h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Descrição do Perfil</Label>
                  <Input 
                    placeholder="EX: Acesso geral ao sistema, exceto financeiro"
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    className="border-[#D2D7DB] font-medium h-11"
                  />
                </div>
              </div>

              {/* Toggles de Permissão */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-[#2C4156] uppercase tracking-wider mb-3">1. Acesso aos Módulos Principais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {MODULE_PERMISSIONS.map(m => {
                      const isChecked = !!profileForm.permissions[m.id]
                      return (
                        <div key={m.id} className={cn(
                          "flex items-start gap-3 p-4 rounded-xl border cursor-pointer hover:bg-slate-50/50 transition-all",
                          isChecked ? "bg-blue-50/20 border-blue-200" : "bg-white border-[#D2D7DB]"
                        )} onClick={() => handleTogglePermission(m.id)}>
                          <Checkbox checked={isChecked} onCheckedChange={() => handleTogglePermission(m.id)} className="mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#39586D]">{m.label}</span>
                              {m.restricted && (
                                <Badge className="bg-amber-100 text-amber-800 text-[7px] font-bold uppercase scale-90 border-none">
                                  ADMINISTRATIVO
                                </Badge>
                              )}
                            </div>
                            <p className="text-[9px] text-[#98A7AA] font-medium">{m.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-[#2C4156] uppercase tracking-wider mb-3">2. Ações Granulares</h3>
                  <Accordion type="multiple" className="w-full">
                    {PERMISSION_GROUPS.map((group) => (
                      <AccordionItem key={group.id} value={group.id} className="border-[#D2D7DB]">
                        <AccordionTrigger className="hover:no-underline py-3 px-2 hover:bg-[#F7F7F7] rounded-lg">
                          <div className="text-left">
                            <p className="text-xs font-black text-[#2C4156] uppercase">{group.label}</p>
                            <p className="text-[9px] font-bold text-[#98A7AA] uppercase">{group.description}</p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-2">
                          {group.permissions.map((perm) => {
                            const isChecked = !!profileForm.permissions[perm.id]
                            return (
                              <div 
                                key={perm.id} 
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-[#D2D7DB] hover:bg-[#F7F7F7] cursor-pointer transition-all",
                                  isChecked && "bg-blue-50/10",
                                  perm.sensitive && "bg-amber-50/10"
                                )}
                                onClick={() => handleTogglePermission(perm.id)}
                              >
                                <div className="space-y-0.5 flex-1 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-[#39586D] uppercase">{perm.label}</span>
                                    {perm.sensitive && (
                                      <Badge className="bg-[#FEF3C7] text-[#F2B705] border-none text-[8px] font-black uppercase flex items-center gap-1">
                                        <ShieldAlert className="h-2 w-2" /> Sensível (LGPD)
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[9px] font-bold text-[#98A7AA]">{perm.desc}</p>
                                </div>
                                <Checkbox checked={isChecked} onCheckedChange={() => handleTogglePermission(perm.id)} className="h-5 w-5 border-[#D2D7DB]" />
                              </div>
                            )
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsProfileModalOpen(false)} className="border-[#D2D7DB] font-bold">Cancelar</Button>
            <Button className="bg-[#39586D] hover:bg-[#39586D]/95 font-black uppercase text-xs px-10 shadow-lg text-white" onClick={handleSaveProfile}>
              Salvar Perfil de Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
