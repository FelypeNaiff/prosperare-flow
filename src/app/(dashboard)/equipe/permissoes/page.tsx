
"use client"

import { useState } from "react"
import { Lock, ShieldCheck, ShieldAlert, Search, ArrowLeft, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
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
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

const MOCK_USERS = [
  { id: '1', name: 'Ricardo Santos', profile: 'SÓCIO', department: 'Diretoria' },
  { id: '2', name: 'Ana Souza', profile: 'CONTADOR/GESTOR', department: 'Fiscal' },
  { id: '3', name: 'Bruno Lima', profile: 'ASSISTENTE', department: 'Pessoal' },
]

const MODULES = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'processos', label: 'Processos' },
  { id: 'certidoes', label: 'Certidões' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'configuracoes', label: 'Configurações' },
]

export default function PermissoesPage() {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenPerms = (user: any) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleSave = () => {
    setIsModalOpen(false)
    toast({ title: "Permissões atualizadas!", className: "bg-[#1FA67A] text-white" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Gestão de Permissões</h1>
          <p className="text-[#98A7AA] font-medium">Controle o nível de acesso de cada colaborador por módulo.</p>
        </div>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#1FA67A]" />
              Colaboradores e Acessos
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input placeholder="Buscar colaborador..." className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow>
                <TableHead className="text-white font-bold uppercase text-[10px]">Nome</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Perfil</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Departamento</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_USERS.map((user) => (
                <TableRow key={user.id} className="hover:bg-[#F7F7F7]">
                  <TableCell className="font-bold text-[#2C4156]">{user.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">{user.profile}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#39586D]">{user.department}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="gap-2 border-[#D2D7DB]" onClick={() => handleOpenPerms(user)}>
                      <ShieldCheck className="h-4 w-4 text-[#1FA67A]" /> Gerenciar Permissões
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#1FA67A]" />
              Permissões: {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>Defina o que este usuário pode visualizar, criar, editar ou excluir.</DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 py-2 border-b mb-4">
            <Button size="sm" className="bg-[#1FA67A] gap-2 font-bold"><Check className="h-4 w-4" /> Liberar Todas</Button>
            <Button size="sm" variant="outline" className="text-[#E74C3C] border-[#E74C3C] gap-2 font-bold hover:bg-[#E74C3C]/5"><X className="h-4 w-4" /> Bloquear Todas</Button>
          </div>

          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto pr-2">
            {MODULES.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-[#F7F7F7]">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-[#2C4156]">{module.label}</p>
                  <p className="text-[10px] text-[#98A7AA]">Acesso completo ao módulo de {module.label.toLowerCase()}</p>
                </div>
                <div className="flex gap-6">
                  {['Ver', 'Criar', 'Editar', 'Excluir'].map((action) => (
                    <div key={action} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] uppercase font-bold text-[#98A7AA]">{action}</span>
                      <Checkbox defaultChecked={selectedUser?.profile === 'SÓCIO'} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-bold" onClick={handleSave}>Salvar Permissões</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
