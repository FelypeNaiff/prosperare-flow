"use client"

import { useState } from "react"
import { 
  Users, 
  Plus, 
  Search, 
  Activity, 
  Building2, 
  History, 
  Trash2, 
  Settings, 
  Mail, 
  Save,
  Edit,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    status: "Active"
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
      departmentId: newMember.departmentIds[0] || "Geral",
      createdByUserId: "admin"
    }

    setDocumentNonBlocking(userRef, userData, { merge: true })
    
    setIsInviteOpen(false)
    setNewMember({ fullName: "", email: "", profile: "", departmentIds: [], status: "Active" })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Gestão da Equipe</h1>
          <p className="text-[#98A7AA] font-medium">Controle de membros e acessos do sistema.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold" onClick={() => setIsInviteOpen(true)}>
          <Plus className="h-4 w-4" /> Convidar Membro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#D2D7DB]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[#2C4156]/10 rounded-lg"><Users className="h-6 w-6 text-[#2C4156]" /></div>
            <div>
              <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Membros Ativos</p>
              <p className="text-2xl font-black text-[#2C4156]">{team?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input
              placeholder="Buscar membro..."
              className="pl-9 bg-[#F7F7F7] border-[#D2D7DB]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-bold uppercase text-[10px]">Membro</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Perfil</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Status</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1FA67A]" />
                  </TableCell>
                </TableRow>
              ) : team?.length > 0 ? (
                team.filter(m => m.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).map((member) => (
                  <TableRow key={member.id} className="hover:bg-[#F7F7F7]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border">
                          <AvatarFallback className="bg-[#2C4156] text-white text-[10px] font-black">{member.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[#2C4156]">{member.fullName}</span>
                          <span className="text-[10px] text-[#98A7AA]">{member.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase">{member.profile}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none text-[9px] font-black">{member.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-[#E74C3C]" onClick={() => handleDeleteMember(member.id)}>
                            <Trash2 className="h-3 w-3 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-[#98A7AA] font-bold">
                    Nenhum colaborador cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Convidar Membro</DialogTitle>
            <DialogDescription>O cadastro será sincronizado com o banco de dados real.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Nome Completo</Label>
              <Input placeholder="Ex: João da Silva" value={newMember.fullName} onChange={(e) => setNewMember({...newMember, fullName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">E-mail</Label>
              <Input type="email" placeholder="nome@gmail.com" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Perfil</Label>
              <Select onValueChange={(v) => setNewMember({...newMember, profile: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione o nível" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SÓCIO">Sócio</SelectItem>
                  <SelectItem value="CONTADOR/GESTOR">Contador / Gestor</SelectItem>
                  <SelectItem value="ASSISTENTE">Assistente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Departamentos</Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#F7F7F7] rounded-lg border">
                {DEPARTMENTS_LIST.map((dept) => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`dept-${dept}`} 
                      checked={newMember.departmentIds.includes(dept)}
                      onCheckedChange={() => toggleDepartment(dept)}
                    />
                    <label htmlFor={`dept-${dept}`} className="text-xs font-bold uppercase cursor-pointer">{dept}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-bold gap-2" onClick={handleInvite}>
              <Mail className="h-4 w-4" /> Enviar Convite Real
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
