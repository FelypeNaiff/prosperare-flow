"use client"

import { useState } from "react"
import { UserCircle, Mail, Shield, Plus, MoreHorizontal, Settings, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
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

const MOCK_TEAM = [
  { id: '1', name: 'Ricardo Santos', email: 'ricardo@contahub.com.br', profile: 'SÓCIO', department: 'Diretoria', status: 'ATIVO' },
  { id: '2', name: 'Fernanda Oliveira', email: 'fernanda@contahub.com.br', profile: 'ADMINISTRADOR', department: 'Operacional', status: 'ATIVO' },
  { id: '3', name: 'Ana Souza', email: 'ana@contahub.com.br', profile: 'CONTADOR/GESTOR', department: 'Fiscal', status: 'ATIVO' },
  { id: '4', name: 'Bruno Lima', email: 'bruno@contahub.com.br', profile: 'ASSISTENTE', department: 'Contábil', status: 'ATIVO' },
  { id: '5', name: 'Carla Dias', email: 'carla@contahub.com.br', profile: 'ASSISTENTE', department: 'DP / RH', status: 'INATIVO' },
]

export default function EquipePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Gestão da Equipe</h1>
          <p className="text-muted-foreground">Controle de usuários, permissões e acessos ao sistema.</p>
        </div>
        <Button className="bg-primary hover:bg-secondary gap-2">
          <Plus className="h-4 w-4" /> Convidar Membro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Activity className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 / 15</div>
            <p className="text-xs text-muted-foreground">3 licenças disponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Níveis de Acesso</CardTitle>
            <Shield className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 Perfis</div>
            <p className="text-xs text-muted-foreground">Políticas de segurança aplicadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Logs de Acesso</CardTitle>
            <Activity className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoje</div>
            <p className="text-xs text-muted-foreground">Último login há 5 min</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros do Escritório</CardTitle>
          <CardDescription>Gerencie quem tem acesso e quais módulos podem visualizar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TEAM.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm">{member.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20">
                      {member.profile}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{member.department}</TableCell>
                  <TableCell>
                    <Badge className={member.status === 'ATIVO' ? 'bg-chart-1' : 'bg-muted text-muted-foreground'}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem className="gap-2"><Settings className="h-4 w-4" /> Editar Acessos</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><Mail className="h-4 w-4" /> Resetar Senha</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive">
                          {member.status === 'ATIVO' ? 'Desativar Usuário' : 'Reativar Usuário'}
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
    </div>
  )
}
