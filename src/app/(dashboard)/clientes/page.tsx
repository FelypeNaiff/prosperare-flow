"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  FileText, 
  Trash2, 
  Edit, 
  ShieldCheck, 
  Building2, 
  Clock,
  FileSignature,
  AlertTriangle,
  Save,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
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
import { KpiCard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"
import { formatCNPJ } from "@/lib/utils"

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  
  const [newClient, setNewClient] = useState({
    empresa: "",
    cnpj: "",
    regime: "",
    responsavel: "",
    status: "Ativa",
    certificadoStatus: "Pendente",
    procuracaoStatus: "Pendente"
  })

  const handleCreateClient = () => {
    if (!newClient.empresa || !newClient.cnpj) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }
    const client = { ...newClient, id: Math.random().toString(36).substr(2, 9) }
    setClients([client, ...clients])
    setIsNewClientOpen(false)
    setNewClient({ empresa: "", cnpj: "", regime: "", responsavel: "", status: "Ativa", certificadoStatus: "Pendente", procuracaoStatus: "Pendente" })
    toast({ title: "Cliente cadastrado!", description: "A empresa foi adicionada à sua base." })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Válido': case 'Ativa': case 'Válida':
        return <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none font-bold text-[10px] uppercase">{status}</Badge>
      case 'Pendente': case 'A Vencer':
        return <Badge className="bg-[#FEF3C7] text-[#F2B705] border-none font-bold text-[10px] uppercase">{status}</Badge>
      case 'Vencido': case 'Inativa':
        return <Badge className="bg-[#FEE2E2] text-[#E74C3C] border-none font-bold text-[10px] uppercase">{status}</Badge>
      default:
        return <Badge className="bg-[#F3F4F6] text-[#98A7AA] border-none font-bold text-[10px] uppercase">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Gestão de Clientes</h1>
          <p className="text-[#98A7AA] font-medium">Administre sua base de empresas e acompanhe a regularidade.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D]">Exportar Planilha</Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90" onClick={() => setIsNewClientOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total de Clientes" value={clients.length} icon={Building2} color="primary" />
        <KpiCard label="Certificados Ativos" value={0} icon={ShieldCheck} color="success" />
        <KpiCard label="Vencendo (30 dias)" value={0} icon={Clock} color="warning" />
        <KpiCard label="Procurações Ativas" value={0} icon={FileSignature} color="success" />
        <KpiCard label="Inativos" value={0} icon={AlertTriangle} color="destructive" />
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              className="pl-9 bg-[#F7F7F7] border-[#D2D7DB]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-bold uppercase text-[10px]">Empresa</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Regime</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Responsável</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Certificado</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Procuração</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-[#F7F7F7]">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2C4156]">{client.empresa}</span>
                        <span className="text-[10px] text-[#98A7AA] font-mono">{client.cnpj}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold text-[10px] uppercase">{client.regime}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-[#39586D]">{client.responsavel}</TableCell>
                    <TableCell>{getStatusBadge(client.certificadoStatus)}</TableCell>
                    <TableCell>{getStatusBadge(client.procuracaoStatus)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-[#98A7AA]">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-[#98A7AA] font-bold">
                    Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL NOVO CLIENTE */}
      <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Cadastrar Novo Cliente</DialogTitle>
            <DialogDescription>Insira os dados cadastrais da empresa para iniciar a gestão.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Razão Social / Nome</Label>
              <Input 
                placeholder="Ex: Padaria Silva Ltda" 
                value={newClient.empresa}
                onChange={(e) => setNewClient({...newClient, empresa: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">CNPJ / CPF</Label>
              <Input 
                placeholder="00.000.000/0000-00" 
                value={newClient.cnpj}
                onChange={(e) => setNewClient({...newClient, cnpj: formatCNPJ(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Regime Tributário</Label>
              <Select onValueChange={(v) => setNewClient({...newClient, regime: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Responsável Interno</Label>
              <Select onValueChange={(v) => setNewClient({...newClient, responsavel: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ricardo Santos">Ricardo Santos</SelectItem>
                  <SelectItem value="Fernanda Oliveira">Fernanda Oliveira</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Situação Cadastral</Label>
              <Select defaultValue="Ativa" onValueChange={(v) => setNewClient({...newClient, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Inativa">Inativa</SelectItem>
                  <SelectItem value="Em Processo">Em Processo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t">
            <Button variant="outline" onClick={() => setIsNewClientOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-bold gap-2" onClick={handleCreateClient}>
              <Save className="h-4 w-4" /> Salvar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
