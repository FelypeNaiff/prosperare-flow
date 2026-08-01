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
  ShieldCheck,
  Edit2,
  Lock
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
import { cn } from "@/lib/utils"

import { useEffect } from "react"

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

  // --- Função utilitária temporária para revogação em massa ---
  useEffect(() => {
    const runFix = async () => {
      try {
        const { getDocs, updateDoc, doc } = await import("firebase/firestore");
        const snap = await getDocs(usersQuery);
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const name = (data.fullName || "").toUpperCase();
          if (name.includes("CHARLES PEREIRA") || name.includes("MARRYETH GIZELLE")) {
            let changed = false;
            let currentDepts = data.departmentIds || [];
            
            // Remover 'Financeiro' ou 'FINANCEIRO' ou 'financeiro' se houver
            const hasFin = currentDepts.some((d: string) => d.toUpperCase() === "FINANCEIRO");
            
            if (hasFin) {
              currentDepts = currentDepts.filter((d: string) => d.toUpperCase() !== "FINANCEIRO");
              changed = true;
            }
            
            if (changed) {
              updateDoc(docSnap.ref, { departmentIds: currentDepts });
              console.log(`[REVOGAÇÃO] Acesso FINANCEIRO removido de: ${name}`);
            }
          }
        });
      } catch (e) {
        console.error("Erro na revogação em massa:", e);
      }
    };
    runFix();
  }, [usersQuery]);
  // -------------------------------------------------------------

  const [newMember, setNewMember] = useState({
    fullName: "",
    email: "",
    profile: "ASSISTENTE",
    departmentIds: [] as string[],
    status: "ATIVO",
    pin: "1234"
  })

  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    profile: "",
    departmentIds: [] as string[],
    pin: ""
  })

  const handleRegister = () => {
    if (!newMember.fullName || !newMember.email || !newMember.profile || !newMember.pin) {
      toast({ title: "Erro", description: "Nome, E-mail, Perfil e PIN são obrigatórios.", variant: "destructive" })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMember.email)) {
      toast({ title: "Erro", description: "Informe um e-mail vÃ¡lido para o colaborador.", variant: "destructive" })
      return
    }

    if (newMember.pin.length !== 4) {
      toast({ title: "Erro", description: "O PIN deve ter exatamente 4 dígitos.", variant: "destructive" })
      return
    }

    const userId = Math.random().toString(36).substr(2, 9)
    const userRef = doc(firestore, "users", userId)
    
    const userData = {
      ...newMember,
      email: newMember.email.trim().toLowerCase(),
      id: userId,
      createdAt: new Date().toISOString()
    }

    setIsInviteOpen(false)
    setDocumentNonBlocking(userRef, userData, { merge: true })
    
    setNewMember({ fullName: "", email: "", profile: "ASSISTENTE", departmentIds: [], status: "ATIVO", pin: "1234" })
    toast({ title: "Colaborador Cadastrado!", description: `Perfil pronto para uso com PIN ${userData.pin}.` })
  }

  const handleOpenEdit = (member: any) => {
    setSelectedMember(member)
    setEditFormData({
      fullName: member.fullName || "",
      email: member.email || "",
      profile: member.profile || "ASSISTENTE",
      departmentIds: member.departmentIds || [],
      pin: member.pin || "1234"
    })
    setIsEditOpen(true)
  }

  const handleUpdateMember = () => {
    if (!selectedMember || !editFormData.email || !editFormData.pin) return
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      toast({ title: "Erro", description: "Informe um e-mail vÃ¡lido para o colaborador.", variant: "destructive" })
      return
    }
    
    if (editFormData.pin.length !== 4) {
      toast({ title: "Erro", description: "O PIN deve ter exatamente 4 dígitos.", variant: "destructive" })
      return
    }

    const userRef = doc(firestore, "users", selectedMember.id)
    updateDocumentNonBlocking(userRef, {
      ...editFormData,
      email: editFormData.email.trim().toLowerCase(),
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
    m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão da Equipe</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Gerencie as identidades operacionais do escritório.</p>
        </div>
        <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-bold shadow-lg h-11" onClick={() => setIsInviteOpen(true)}>
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
                <TableHead className="text-white font-black uppercase text-[10px]">E-mail</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Departamentos</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Perfil</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Status</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
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
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[#2C4156] uppercase">{member.fullName}</span>
                          <span className="text-[9px] text-[#98A7AA] flex items-center gap-1 font-bold">
                            <Lock className="h-2 w-2" /> PIN: {member.pin || "----"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-[#39586D] lowercase">
                      {member.email || "sem e-mail"}
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
                      <Badge className="bg-[#7ED6B5] text-[#2563EB] border-none text-[9px] font-black uppercase">
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
                            <Edit2 className="h-3.5 w-3.5 text-[#2563EB]" /> Editar Regras
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
                  <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhuma identidade localizada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#2C4156] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Nova Identidade</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Defina o nome e o código de acesso (PIN) do novo colaborador.
            </DialogDescription>
          </DialogHeader>
          
          <div className="modal-scroll-content">
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
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">E-mail de Login</Label>
                <Input 
                  type="email"
                  placeholder="colaborador@empresa.com" 
                  value={newMember.email} 
                  onChange={(e) => setNewMember({...newMember, email: e.target.value.trim().toLowerCase()})}
                  className="border-[#D2D7DB] font-bold lowercase h-11"
                />
                <p className="text-[9px] font-bold text-[#98A7AA] uppercase">Este e-mail poderÃ¡ acessar pelo Google se o status estiver ativo.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Senha de Acesso (PIN 4 Dígitos)</Label>
                <Input 
                  placeholder="Ex: 1234" 
                  maxLength={4}
                  value={newMember.pin} 
                  onChange={(e) => setNewMember({...newMember, pin: e.target.value.replace(/\D/g, '')})}
                  className="border-[#D2D7DB] font-mono font-bold h-11 text-center text-lg tracking-widest"
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
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsInviteOpen(false)} className="font-bold text-xs uppercase h-11">Cancelar</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-8 shadow-lg h-11" onClick={handleRegister}>
              <Save className="h-4 w-4 mr-2" /> Salvar Identidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <DialogHeader className="p-6 bg-[#39586D] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Ajustar Regras</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Alterando perfil de: {selectedMember?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="modal-scroll-content">
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
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">E-mail de Login</Label>
                <Input 
                  type="email"
                  value={editFormData.email} 
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value.trim().toLowerCase()})}
                  className="border-[#D2D7DB] font-bold lowercase h-11"
                />
                <p className="text-[9px] font-bold text-[#98A7AA] uppercase">Colaboradores ativos com este e-mail podem entrar pelo Google.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Senha de Acesso (PIN 4 Dígitos)</Label>
                <Input 
                  maxLength={4}
                  value={editFormData.pin} 
                  onChange={(e) => setEditFormData({...editFormData, pin: e.target.value.replace(/\D/g, '')})}
                  className="border-[#D2D7DB] font-mono font-bold h-11 text-center text-lg tracking-widest"
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
          </div>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t shrink-0">
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
