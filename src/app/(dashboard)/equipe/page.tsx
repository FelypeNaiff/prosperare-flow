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
  AlertTriangle,
  Save,
  ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { DepartmentManagement } from "@/components/team/department-management"
import { ActionHistoryList } from "@/components/team/action-history-list"
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
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"

export default function EquipePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [team, setTeam] = useState<any[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<any>(null)

  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    profile: "",
    department: "",
    status: "ATIVO"
  })

  const handleInvite = () => {
    if (!newMember.name || !newMember.email) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }
    const member = { ...newMember, id: Math.random().toString(36).substr(2, 9) }
    setTeam([...team, member])
    setIsInviteOpen(false)
    setNewMember({ name: "", email: "", profile: "", department: "", status: "ATIVO" })
    toast({ title: "Convite Enviado!", description: "O colaborador recebeu as instruções por e-mail." })
  }

  const handleDeleteMember = () => {
    if (memberToDelete) {
      setTeam(prev => prev.filter(m => m.id !== memberToDelete.id))
      setIsDeleteDialogOpen(false)
      setMemberToDelete(null)
      toast({ title: "Membro excluído", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Gestão da Equipe</h1>
          <p className="text-[#98A7AA] font-medium">Controle de membros e acessos do sistema.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2" onClick={() => setIsInviteOpen(true)}>
          <Plus className="h-4 w-4" /> Convidar Membro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#D2D7DB]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[#2C4156]/10 rounded-lg"><Users className="h-6 w-6 text-[#2C4156]" /></div>
            <div>
              <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Membros Ativos</p>
              <p className="text-2xl font-black text-[#2C4156]">{team.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[#1FA67A]/10 rounded-lg"><Building2 className="h-6 w-6 text-[#1FA67A]" /></div>
            <div>
              <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Departamentos</p>
              <p className="text-2xl font-black text-[#2C4156]">5</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[#F2B705]/10 rounded-lg"><Activity className="h-6 w-6 text-[#F2B705]" /></div>
            <div>
              <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Logs Hoje</p>
              <p className="text-2xl font-black text-[#2C4156]">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="membros" className="space-y-6">
        <TabsList className="bg-[#D2D7DB]/30 p-1">
          <TabsTrigger value="membros" className="data-[state=active]:bg-white font-bold gap-2">
            <Users className="h-4 w-4" /> Membros
          </TabsTrigger>
          <TabsTrigger value="departamentos" className="data-[state=active]:bg-white font-bold gap-2">
            <Building2 className="h-4 w-4" /> Departamentos
          </TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:bg-white font-bold gap-2">
            <History className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="membros" className="m-0">
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
                    <TableHead className="text-white font-bold uppercase text-[10px]">Departamento</TableHead>
                    <TableHead className="text-white font-bold uppercase text-[10px]">Status</TableHead>
                    <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.length > 0 ? (
                    team.map((member) => (
                      <TableRow key={member.id} className="hover:bg-[#F7F7F7]">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-[#2C4156] text-white text-[10px]">{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-[#2C4156]">{member.name}</span>
                              <span className="text-[10px] text-[#98A7AA]">{member.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] font-black uppercase">{member.profile}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-[#39586D]">{member.department}</TableCell>
                        <TableCell>
                          <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none text-[9px] font-black">ATIVO</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-xs font-bold"><Edit className="h-3 w-3 mr-2" /> Editar</DropdownMenuItem>
                              <DropdownMenuItem className="text-xs font-bold text-[#E74C3C]" onClick={() => {
                                setMemberToDelete(member);
                                setIsDeleteDialogOpen(true);
                              }}>
                                <Trash2 className="h-3 w-3 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-[#98A7AA] font-bold">
                        Nenhum colaborador convidado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departamentos" className="m-0"><DepartmentManagement /></TabsContent>
        <TabsContent value="historico" className="m-0"><ActionHistoryList /></TabsContent>
      </Tabs>

      {/* MODAL CONVIDAR MEMBRO */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Convidar Colaborador</DialogTitle>
            <DialogDescription>Envie um convite para o e-mail corporativo do novo membro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Nome Completo</Label>
              <Input placeholder="Ex: João da Silva" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">E-mail (Gmail)</Label>
              <Input type="email" placeholder="nome@gmail.com" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">Perfil de Acesso</Label>
                <Select onValueChange={(v) => setNewMember({...newMember, profile: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SÓCIO">Sócio</SelectItem>
                    <SelectItem value="CONTADOR/GESTOR">Contador / Gestor</SelectItem>
                    <SelectItem value="ASSISTENTE">Assistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">Departamento</Label>
                <Select onValueChange={(v) => setNewMember({...newMember, department: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fiscal">Fiscal</SelectItem>
                    <SelectItem value="Pessoal">Pessoal</SelectItem>
                    <SelectItem value="Contábil">Contábil</SelectItem>
                    <SelectItem value="Diretoria">Diretoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t">
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-bold gap-2" onClick={handleInvite}>
              <Mail className="h-4 w-4" /> Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#E74C3C]">Excluir Colaborador?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá o acesso de <strong>{memberToDelete?.name}</strong> permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-[#E74C3C]" onClick={handleDeleteMember}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
