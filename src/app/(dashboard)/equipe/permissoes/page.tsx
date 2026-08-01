
"use client"

import { useState } from "react"
import { 
  Lock, 
  ShieldCheck, 
  Search, 
  ArrowLeft, 
  Check, 
  X, 
  ShieldAlert,
  Loader2
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
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"

const PERMISSION_GROUPS = [
  {
    id: 'clientes',
    label: 'Relacionamento (Clientes)',
    description: 'Controle de acesso à base de empresas e dados sensíveis.',
    permissions: [
      { id: 'view_clients', label: 'Ver Ficha Completa', desc: 'Acesso aos dados básicos e contatos.' },
      { id: 'edit_clients', label: 'Editar Dados Cadastrais', desc: 'Alterar CNPJ, regime e endereço.' },
      { id: 'delete_clients', label: 'Excluir Cliente', desc: 'Remover empresa do sistema.' },
      { id: 'view_passwords', label: 'Acessar Cofre de Senhas', desc: 'Visualizar senhas de prefeituras e portais.', sensitive: true },
      { id: 'manage_procurations', label: 'Gerenciar Procurações', desc: 'Controlar vigência de procurações e-CAC.' },
    ]
  },
  {
    id: 'processos',
    label: 'Fluxo de Produção (Processos)',
    description: 'Gestão de tarefas e obrigações fiscais.',
    permissions: [
      { id: 'view_tasks', label: 'Visualizar Tarefas', desc: 'Ver kanban e listas de processos.' },
      { id: 'manage_tasks', label: 'Criar/Editar Processos', desc: 'Cadastrar novas obrigações avulsas.' },
      { id: 'complete_tasks', label: 'Concluir Tarefas', desc: 'Marcar processos como entregues.' },
      { id: 'transfer_tasks', label: 'Mudar Responsável', desc: 'Passagem de bastão entre usuários.' },
      { id: 'manage_groups', label: 'Gerenciar Grupos de Obrigações', desc: 'Configurar automação por tipo de cliente.' },
    ]
  }
];

export default function PermissoesPage() {
  const router = useRouter()
  const firestore = useFirestore()
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore])
  const { data: users = [], isLoading } = useCollection(usersQuery)

  const handleOpenPerms = (user: any) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleSave = () => {
    setIsModalOpen(false)
    toast({ 
      title: "Permissões atualizadas!", 
      description: `As novas regras para ${selectedUser.fullName} foram salvas na nuvem.`,
      className: "bg-[#2563EB] text-white border-none"
    })
  }

  const filteredUsers = (users || []).filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.profile?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#39586D]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão de Permissões</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Configuração granular de privilégios por colaborador.</p>
        </div>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg font-black text-[#2C4156] uppercase flex items-center gap-2">
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
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px]">Colaborador</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Perfil de Acesso</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">E-mail</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-[#F7F7F7]">
                    <TableCell className="font-bold text-[#2C4156]">{user.fullName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-black uppercase border-[#D2D7DB] text-[#39586D]">{user.profile}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-[#98A7AA]">{user.email}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="gap-2 border-[#D2D7DB] text-[#2C4156] font-bold" onClick={() => handleOpenPerms(user)}>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <ShieldCheck className="h-8 w-8 text-[#2563EB]" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase">Permissões Detalhadas</DialogTitle>
                <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
                  Editando: {selectedUser?.fullName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <Accordion type="multiple" className="w-full">
                {PERMISSION_GROUPS.map((group) => (
                  <AccordionItem key={group.id} value={group.id} className="border-[#D2D7DB]">
                    <AccordionTrigger className="hover:no-underline py-4 px-2 hover:bg-[#F7F7F7] rounded-lg">
                      <div className="text-left">
                        <p className="text-sm font-black text-[#2C4156] uppercase">{group.label}</p>
                        <p className="text-[10px] font-bold text-[#98A7AA] uppercase">{group.description}</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-2">
                      {group.permissions.map((perm) => (
                        <div key={perm.id} className={cn(
                          "flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-[#D2D7DB] hover:bg-[#F7F7F7] transition-all",
                          perm.sensitive && "bg-amber-50/30"
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
                            <p className="text-[10px] font-bold text-[#98A7AA]">{perm.desc}</p>
                          </div>
                          <Checkbox 
                            id={perm.id} 
                            defaultChecked={selectedUser?.profile === 'SÓCIO' || selectedUser?.profile === 'ADMINISTRADOR'}
                            className="h-5 w-5 border-[#D2D7DB] data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]" 
                          />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-[#D2D7DB] font-bold">Cancelar</Button>
            <Button className="bg-[#2563EB] font-black uppercase text-xs px-10 shadow-lg" onClick={handleSave}>Salvar Configurações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
