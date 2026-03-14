"use client"

import { useState } from "react"
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Settings, 
  Mail, 
  Loader2,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, doc } from "firebase/firestore"

const DEPARTMENTS_LIST = [
  "Fiscal", "Pessoal", "Contábil", "Financeiro", "Comercial", "Administrativo"
]

export default function EquipePage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  
  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: team = [], isLoading } = useCollection(usersQuery)

  const [newMember, setNewMember] = useState({
    fullName: "",
    email: "",
    profile: "",
    departmentIds: [] as string[],
    status: "ATIVO"
  })

  const handleInvite = () => {
    if (!newMember.fullName || !newMember.email || !newMember.profile) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    const userId = Math.random().toString(36).substr(2, 9)
    const userRef = doc(firestore, "users", userId)
    
    const userData = {
      ...newMember,
      id: userId,
      createdAt: new Date().toISOString(),
      departmentId: newMember.departmentIds[0] || "Geral", // Legacy field for schema support
      createdByUserId: "admin"
    }

    // Fecha o modal imediatamente para melhor UX
    setIsInviteOpen(false)
    
    // Salva no Firestore
    setDocumentNonBlocking(userRef, userData, { merge: true })
    
    // Reseta o formulário
    setNewMember({ fullName: "", email: "", profile: "", departmentIds: [], status: "ATIVO" })
    toast({ title: "Membro Convidado!", description: "O cadastro foi salvo no banco de dados." })
  }

  const handleDeleteMember = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "users", id))
    toast({ title: "Membro removido", variant: "destructive" })
  }

  const toggleDepartment = (dept: string) => {
    setNewMember(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(dept)
        ? prev.departmentIds.filter(d => d !== dept)
        : [...prev.departmentIds, dept]
    }))
  }

  const filteredTeam = (team || []).filter(m => 
    m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão da Equipe</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Controle de colaboradores e níveis de acesso.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold shadow-lg shadow-emerald-500/20" onClick={() => setIsInviteOpen(true)}>
          <Plus className="h-4 w-4" /> Convidar Colaborador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#D2D7DB] bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[#2C4156]/10 rounded-xl text-[#2C4156]"><Users className="h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest leading-none mb-1">Membros Ativos</p>
              <p className="text-2xl font-black text-[#2C4156]">{team?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm">
        <CardHeader className="pb-3 border-b bg-[#F7F7F7]/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              className="pl-10 bg-white border-[#D2D7DB]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px]">Colaborador</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Departamentos</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Perfil</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Status</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1FA67A]" />
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase mt-2">Carregando Equipe...</p>
                  </TableCell>
                </TableRow>
              ) : filteredTeam.length > 0 ? (
                filteredTeam.map((member) => (
                  <TableRow key={member.id} className="hover:bg-[#F7F7F7]/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-[#2C4156] text-white text-xs font-black">
                            {member.fullName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[#2C4156]">{member.fullName}</span>
                          <span className="text-[10px] font-bold text-[#98A7AA]">{member.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.departmentIds?.length > 0 ? (
                          member.departmentIds.map((dept: string) => (
                            <Badge key={dept} variant="secondary" className="text-[8px] font-black uppercase bg-[#F7F7F7] border-[#D2D7DB] text-[#39586D]">
                              {dept}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-[#98A7AA] italic">Geral</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#E3F0F9] text-[#2574A9] border-none text-[9px] font-black uppercase">
                        {member.profile}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none text-[9px] font-black uppercase">
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-[#98A7AA]"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2 text-xs font-bold"><Settings className="h-3 w-3" /> Editar Permissões</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-xs font-bold text-[#E74C3C] cursor-pointer" 
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            <Trash2 className="h-3 w-3" /> Excluir Colaborador
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-[#98A7AA] font-bold">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    Nenhum colaborador cadastrado. Comece convidando sua equipe.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Convidar Membro</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              O colaborador receberá acesso imediato via Google OAuth.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome Completo</Label>
              <Input 
                placeholder="Ex: João da Silva" 
                value={newMember.fullName} 
                onChange={(e) => setNewMember({...newMember, fullName: e.target.value})}
                className="border-[#D2D7DB]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">E-mail (Gmail corporativo)</Label>
              <Input 
                type="email" 
                placeholder="nome@empresa.com.br" 
                value={newMember.email} 
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                className="border-[#D2D7DB]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Perfil de Acesso</Label>
              <Select onValueChange={(v) => setNewMember({...newMember, profile: v})}>
                <SelectTrigger className="border-[#D2D7DB]">
                  <SelectValue placeholder="Selecione o nível de privilégio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SÓCIO">Sócio / Proprietário</SelectItem>
                  <SelectItem value="ADMINISTRADOR">Administrador do Sistema</SelectItem>
                  <SelectItem value="CONTADOR/GESTOR">Contador / Gestor</SelectItem>
                  <SelectItem value="ASSISTENTE">Assistente / Analista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Departamentos (Múltiplos)</Label>
              <div className="grid grid-cols-2 gap-2 p-4 bg-[#F7F7F7] rounded-xl border border-[#D2D7DB] shadow-inner">
                {DEPARTMENTS_LIST.map((dept) => (
                  <div key={dept} className="flex items-center space-x-2 group">
                    <Checkbox 
                      id={`dept-${dept}`} 
                      checked={newMember.departmentIds.includes(dept)}
                      onCheckedChange={() => toggleDepartment(dept)}
                      className="data-[state=checked]:bg-[#1FA67A] data-[state=checked]:border-[#1FA67A]"
                    />
                    <label 
                      htmlFor={`dept-${dept}`} 
                      className="text-[10px] font-black uppercase cursor-pointer text-[#39586D] group-hover:text-[#1FA67A] transition-colors"
                    >
                      {dept}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsInviteOpen(false)} className="border-[#D2D7DB] font-bold text-xs">Cancelar</Button>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-8 shadow-lg shadow-emerald-500/20" onClick={handleInvite}>
              <Mail className="h-4 w-4 mr-2" /> Enviar Convite Real
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}