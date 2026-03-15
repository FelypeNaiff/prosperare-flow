'use client';

import { useState } from "react"
import { 
  Plus, 
  Search, 
  Trash2, 
  Settings, 
  Loader2,
  MoreHorizontal,
  UserPlus,
  Save,
  ShieldCheck,
  X,
  Edit2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { useRouter } from "next/navigation"

const DEPARTMENTS_LIST = [
  "Fiscal", "Pessoal", "Contábil", "Financeiro", "Comercial", "Administrativo"
]

export default function EquipePage() {
  const firestore = useFirestore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  
  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: team = [], isLoading } = useCollection(usersQuery)

  const [newMember, setNewMember] = useState({
    fullName: "",
    profile: "ASSISTENTE",
    departmentIds: [] as string[],
    status: "ATIVO"
  })

  const [editFormData, setEditFormData] = useState({
    fullName: "",
    profile: "",
    departmentIds: [] as string[]
  })

  const handleRegister = () => {
    if (!newMember.fullName || !newMember.profile) {
      toast({ title: "Erro", description: "O nome completo é obrigatório.", variant: "destructive" })
      return
    }

    const userId = Math.random().toString(36).substr(2, 9)
    const userRef = doc(firestore, "users", userId)
    
    const userData = {
      ...newMember,
      id: userId,
      createdAt: new Date().toISOString(),
      pin: "1234"
    }

    setIsInviteOpen(false)
    setDocumentNonBlocking(userRef, userData, { merge: true })
    
    setNewMember({ fullName: "", profile: "ASSISTENTE", departmentIds: [], status: "ATIVO" })
    toast({ title: "Colaborador Cadastrado!", description: "Perfil pronto para uso com PIN 1234." })
  }

  const handleOpenEdit = (member: any) => {
    setSelectedMember(member)
    setEditFormData({
      fullName: member.fullName || "",
      profile: member.profile || "ASSISTENTE",
      departmentIds: member.departmentIds || []
    })
    setIsEditOpen(true)
  }

  const handleUpdateMember = () => {
    if (!selectedMember) return
    
    const userRef = doc(firestore, "users", selectedMember.id)
    updateDocumentNonBlocking(userRef, {
      ...editFormData,
      updatedAt: new Date().toISOString()
    })

    setIsEditOpen(false)
    toast({ title: "Perfil Atualizado!", description: "As regras do colaborador foram salvas." })
  }

  const handleDeleteMember = (id: string) => {
    if (confirm("Deseja realmente remover esta identidade operacional?")) {
      deleteDocumentNonBlocking(doc(firestore, "users", id))
      toast({ title: "Membro removido", variant: "destructive" })
    }
  }

  const toggleDept = (dept: string, isEdit: boolean) => {
    if (isEdit) {
      setEditFormData(prev => ({
        ...prev,
        departmentIds: prev.departmentIds.includes(dept)
          ? prev.departmentIds.filter(d => d !== dept)
          : [...prev.departmentIds, dept]
      }))
    } else {
      setNewMember(prev => ({
        ...prev,
        departmentIds: prev.departmentIds.includes(dept)
          ? prev.departmentIds.filter(d => d !== dept)
          : [...prev.departmentIds, dept]
      }))
    }
  }

  const filteredTeam = (team || []).filter(m => 
    m.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão da Equipe</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Gerencie as identidades operacionais do escritório.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold shadow-lg h-11" onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Novo Colaborador
        </Button>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-[#F7F7F7]/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input
              placeholder="Buscar identidade por nome..."
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
                <TableHead className="text-white font-black uppercase text-[10px]">Identidade</TableHead>
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
                  </TableCell>
                </TableRow>
              ) : filteredTeam.length > 0 ? (
                filteredTeam.map((member) => (
                  <TableRow key={member.id} className="hover:bg-[#F7F7F7]/50 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-[#2C4156] text-white text-xs font-black">
                            {member.fullName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm text-[#2C4156] uppercase">{member.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.departmentIds?.map((dept: string) => (
                          <Badge key={dept} variant="secondary" className="text-[8px] font-black uppercase bg-[#F7F7F7] border-[#D2D7DB] text-[#39586D]">
                            {dept}
                          </Badge>
                        ))}
                        {(!member.departmentIds || member.departmentIds.length === 0) && (
                          <span className="text-[9px] text-[#98A7AA] font-bold italic">Sem Alocação</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "border-none text-[9px] font-black uppercase",
                        member.profile === 'ADMINISTRADOR' ? "bg-amber-100 text-amber-700" : "bg-[#E3F0F9] text-[#2574A9]"
                      )}>
                        {member.profile}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none text-[9px] font-black uppercase">
                        {member.status || 'ATIVO'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-[#98A7AA]"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="gap-2 text-xs font-bold uppercase cursor-pointer" onClick={() => handleOpenEdit(member)}>
                            <Edit2 className="h-3.5 w-3.5 text-[#1FA67A]" /> Editar Regras
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-xs font-bold uppercase cursor-pointer" onClick={() => router.push('/equipe/permissoes')}>
                            <ShieldCheck className="h-3.5 w-3.5 text-[#2574A9]" /> Permissões Avançadas
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-xs font-bold text-[#E74C3C] cursor-pointer uppercase" 
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remover Perfil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhuma identidade localizada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal: Novo Colaborador */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Nova Identidade</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Identidade para uso com acesso mestre pscsucesso@gmail.com.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome Completo</Label>
              <Input 
                placeholder="Ex: FELYPE NAIFF" 
                value={newMember.fullName} 
                onChange={(e) => setNewMember({...newMember, fullName: e.target.value.toUpperCase()})}
                className="border-[#D2D7DB] font-bold uppercase h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Perfil de Privilégios</Label>
              <Select value={newMember.profile} onValueChange={(v) => setNewMember({...newMember, profile: v})}>
                <SelectTrigger className="border-[#D2D7DB] h-11">
                  <SelectValue placeholder="Nível de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SÓCIO" className="text-xs font-bold">SÓCIO / PROPRIETÁRIO</SelectItem>
                  <SelectItem value="ADMINISTRADOR" className="text-xs font-bold">ADMINISTRADOR</SelectItem>
                  <SelectItem value="CONTADOR/GESTOR" className="text-xs font-bold">CONTADOR / GESTOR</SelectItem>
                  <SelectItem value="ASSISTENTE" className="text-xs font-bold">ASSISTENTE / ANALISTA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Departamentos Atuantes</Label>
              <div className="grid grid-cols-2 gap-2 p-4 bg-[#F7F7F7] rounded-xl border border-[#D2D7DB]">
                {DEPARTMENTS_LIST.map((dept) => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`dept-${dept}`} 
                      checked={newMember.departmentIds.includes(dept)}
                      onCheckedChange={() => toggleDept(dept, false)}
                    />
                    <label htmlFor={`dept-${dept}`} className="text-[10px] font-black uppercase cursor-pointer text-[#39586D]">
                      {dept}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsInviteOpen(false)} className="font-bold text-xs uppercase h-11">Cancelar</Button>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-8 shadow-lg h-11" onClick={handleRegister}>
              <Save className="h-4 w-4 mr-2" /> Salvar Identidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Colaborador */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#39586D] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Ajustar Regras</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Alterando perfil de: {selectedMember?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome Completo</Label>
              <Input 
                value={editFormData.fullName} 
                onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value.toUpperCase()})}
                className="border-[#D2D7DB] font-bold uppercase h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nível de Acesso</Label>
              <Select value={editFormData.profile} onValueChange={(v) => setEditFormData({...editFormData, profile: v})}>
                <SelectTrigger className="border-[#D2D7DB] h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SÓCIO" className="text-xs font-bold">SÓCIO / PROPRIETÁRIO</SelectItem>
                  <SelectItem value="ADMINISTRADOR" className="text-xs font-bold">ADMINISTRADOR</SelectItem>
                  <SelectItem value="CONTADOR/GESTOR" className="text-xs font-bold">CONTADOR / GESTOR</SelectItem>
                  <SelectItem value="ASSISTENTE" className="text-xs font-bold">ASSISTENTE / ANALISTA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Departamentos Atuantes</Label>
              <div className="grid grid-cols-2 gap-2 p-4 bg-[#F7F7F7] rounded-xl border border-[#D2D7DB]">
                {DEPARTMENTS_LIST.map((dept) => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`edit-dept-${dept}`} 
                      checked={editFormData.departmentIds.includes(dept)}
                      onCheckedChange={() => toggleDept(dept, true)}
                    />
                    <label htmlFor={`edit-dept-${dept}`} className="text-[10px] font-black uppercase cursor-pointer text-[#39586D]">
                      {dept}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="font-bold text-xs uppercase h-11">Cancelar</Button>
            <Button className="bg-[#2C4156] hover:bg-[#2C4156]/90 font-black uppercase text-xs px-8 shadow-lg h-11" onClick={handleUpdateMember}>
              <Save className="h-4 w-4 mr-2" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
