
"use client"

import { useState } from "react"
import { 
  Users, 
  Plus, 
  Search, 
  Shield, 
  Activity, 
  Filter,
  Building2,
  History,
  ArrowRight,
  Trash2,
  Edit,
  MoreHorizontal,
  Settings,
  Mail,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
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

const MOCK_TEAM = [
  { id: '1', name: 'Ricardo Santos', email: 'ricardo@prosperare.com.br', profile: 'SÓCIO', department: 'Diretoria', status: 'ATIVO' },
  { id: '2', name: 'Fernanda Oliveira', email: 'fernanda@prosperare.com.br', profile: 'ADMINISTRADOR', department: 'Administrativo', status: 'ATIVO' },
  { id: '3', name: 'Ana Souza', email: 'ana@prosperare.com.br', profile: 'CONTADOR/GESTOR', department: 'Fiscal', status: 'ATIVO' },
  { id: '4', name: 'Bruno Lima', email: 'bruno@prosperare.com.br', profile: 'ASSISTENTE', department: 'Pessoal', status: 'ATIVO' },
  { id: '5', name: 'Carla Dias', email: 'carla@prosperare.com.br', profile: 'ASSISTENTE', department: 'Comercial', status: 'INATIVO' },
]

export default function EquipePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [team, setTeam] = useState(MOCK_TEAM)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<any>(null)

  const handleDeleteMember = () => {
    if (memberToDelete) {
      setTeam(prev => prev.filter(m => m.id !== memberToDelete.id))
      setIsDeleteDialogOpen(false)
      setMemberToDelete(null)
      toast({
        title: "Membro excluído",
        description: "O acesso do colaborador foi removido permanentemente.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Gestão da Equipe</h1>
          <p className="text-[#98A7AA] font-medium">Controle de membros, departamentos e auditoria do sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2">
            <Plus className="h-4 w-4" /> Convidar Membro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#D2D7DB]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[#2C4156]/10 rounded-lg"><Users className="h-6 w-6 text-[#2C4156]" /></div>
            <div>
              <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Membros Ativos</p>
              <p className="text-2xl font-black text-[#2C4156]">{team.filter(m => m.status === 'ATIVO').length} / {team.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[#1FA67A]/10 rounded-lg"><Building2 className="h-6 w-6 text-[#1FA67A]" /></div>
            <div>
              <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Departamentos</p>
              <p className="text-2xl font-black text-[#2C4156]">5 Estruturas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[#F2B705]/10 rounded-lg"><Activity className="h-6 w-6 text-[#F2B705]" /></div>
            <div>
              <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Ações Hoje</p>
              <p className="text-2xl font-black text-[#2C4156]">142 Logs</p>
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
            <History className="h-4 w-4" /> Histórico de Ações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="membros" className="space-y-4 m-0">
          <Card className="border-[#D2D7DB]">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
                  <Input
                    placeholder="Buscar membro por nome, e-mail ou departamento..."
                    className="pl-9 bg-[#F7F7F7] border-[#D2D7DB]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="border-[#D2D7DB] gap-2">
                  <Filter className="h-4 w-4" /> Filtros
                </Button>
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
                  {team.map((member) => (
                    <TableRow key={member.id} className="hover:bg-[#F7F7F7]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-[#D2D7DB]">
                            <AvatarFallback className="bg-[#2C4156] text-white font-bold">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-[#2C4156]">{member.name}</span>
                            <span className="text-xs text-[#98A7AA] truncate">{member.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-[#39586D]/5 text-[#39586D] border-[#39586D]/20 font-bold text-[10px]">
                          {member.profile}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[#39586D]">{member.department}</TableCell>
                      <TableCell>
                        <Badge className={member.status === 'ATIVO' ? 'bg-[#7ED6B5] text-[#1FA67A] border-none' : 'bg-[#D2D7DB] text-[#98A7AA] border-none'}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-[#D2D7DB]">
                            <DropdownMenuLabel className="text-[#2C4156] text-[10px] uppercase">Gerenciar Membro</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2 text-xs font-bold text-[#2C4156]"><Settings className="h-4 w-4 text-[#1FA67A]" /> Editar Acessos</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-xs font-bold text-[#2C4156]"><Mail className="h-4 w-4 text-[#2574A9]" /> Resetar Senha</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2 text-xs font-bold text-[#E74C3C]"
                              onClick={() => {
                                setMemberToDelete(member);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" /> Excluir Colaborador
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departamentos" className="m-0">
          <DepartmentManagement />
        </TabsContent>

        <TabsContent value="historico" className="m-0">
          <ActionHistoryList />
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#E74C3C]">
              <AlertTriangle className="h-6 w-6" />
              Confirmar Exclusão de Colaborador?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{memberToDelete?.name}</strong>. Esta ação é irreversível e removerá todo o acesso deste usuário ao sistema imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMember}
              className="bg-[#E74C3C] text-white hover:bg-[#E74C3C]/90"
            >
              Sim, Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
