
"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Building2, 
  Clock,
  FileSignature,
  AlertTriangle,
  Save,
  Loader2,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2
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
import { Card, CardHeader, CardContent } from "@/components/ui/card"
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
import { formatCNPJ, validateCNPJ, cn } from "@/lib/utils"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  
  const [newClient, setNewClient] = useState({
    empresa: "",
    cnpj: "",
    regime: "",
    responsavel: "",
    status: "Ativa",
    certificadoStatus: "Pendente",
    procuracaoStatus: "Pendente",
    email: "",
    telefone: "",
    cidade: "",
    uf: ""
  })

  const lookupCnpj = async (cnpjValue: string) => {
    const cleanCnpj = cnpjValue.replace(/\D/g, "")
    if (cleanCnpj.length !== 14) return

    if (!validateCNPJ(cleanCnpj)) {
      toast({ variant: "destructive", title: "CNPJ Inválido", description: "Verifique os dígitos informados." })
      return
    }

    setIsLoadingCnpj(true)
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
      if (!response.ok) throw new Error("CNPJ não encontrado")
      const data = await response.json()
      
      let regimeSugerido = "Outros"
      if (data.opcao_pelo_mei) {
        regimeSugerido = "MEI"
      } else if (data.opcao_pelo_simples) {
        regimeSugerido = "Simples Nacional"
      }

      setNewClient(prev => ({
        ...prev,
        empresa: data.razao_social || prev.empresa,
        regime: regimeSugerido,
        email: data.email || prev.email,
        telefone: data.ddd_telefone_1 || prev.telefone,
        cidade: data.municipio || prev.cidade,
        uf: data.uf || prev.uf
      }))
      
      toast({ 
        title: "Dados Localizados!", 
        description: `Empresa: ${data.razao_social}. Regime identificado: ${regimeSugerido}`,
        className: "bg-[#1FA67A] text-white border-none"
      })
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Atenção", 
        description: "Não foi possível buscar os dados automaticamente. Preencha manualmente." 
      })
    } finally {
      setIsLoadingCnpj(false)
    }
  }

  const handleCreateClient = () => {
    if (!newClient.empresa || !newClient.cnpj || !newClient.regime) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios (CNPJ, Razão Social e Regime).", variant: "destructive" })
      return
    }
    const client = { ...newClient, id: Math.random().toString(36).substr(2, 9) }
    setClients([client, ...clients])
    setIsNewClientOpen(false)
    setNewClient({ 
      empresa: "", 
      cnpj: "", 
      regime: "", 
      responsavel: "", 
      status: "Ativa", 
      certificadoStatus: "Pendente", 
      procuracaoStatus: "Pendente",
      email: "",
      telefone: "",
      cidade: "",
      uf: ""
    })
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
                clients.filter(c => c.empresa.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm)).map((client) => (
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
                    <TableCell className="text-sm font-medium text-[#39586D]">{client.responsavel || "Não atribuído"}</TableCell>
                    <TableCell>{getStatusBadge(client.certificadoStatus)}</TableCell>
                    <TableCell>{getStatusBadge(client.procuracaoStatus)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-[#98A7AA]">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-[10px] uppercase font-black text-[#98A7AA]">Ações do Cliente</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/clientes/${client.id}`} className="flex items-center gap-2 cursor-pointer">
                              <Eye className="h-4 w-4 text-[#1FA67A]" /> Ver Ficha Completa
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                            <Edit className="h-4 w-4 text-[#2574A9]" /> Editar Dados
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-[#E74C3C] cursor-pointer"
                            onClick={() => {
                              setClients(clients.filter(c => c.id !== client.id))
                              toast({ title: "Cliente Removido", variant: "destructive" })
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Excluir Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-[#1FA67A]/10 rounded-lg">
                <Building2 className="h-6 w-6 text-[#1FA67A]" />
              </div>
              <DialogTitle className="text-2xl font-black text-[#2C4156]">Cadastrar Novo Cliente</DialogTitle>
            </div>
            <DialogDescription>
              Insira o CNPJ para preenchimento automático via Brasil API.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA] flex items-center justify-between">
                CNPJ / CPF
                {isLoadingCnpj && <Loader2 className="h-3 w-3 animate-spin text-[#1FA67A]" />}
              </Label>
              <div className="relative">
                <Input 
                  placeholder="00.000.000/0000-00" 
                  value={newClient.cnpj}
                  onChange={(e) => setNewClient({...newClient, cnpj: formatCNPJ(e.target.value)})}
                  onBlur={(e) => lookupCnpj(e.target.value)}
                  className="font-mono font-bold border-[#D2D7DB]"
                />
                {!isLoadingCnpj && <Search className="absolute right-3 top-2.5 h-4 w-4 text-[#98A7AA] opacity-50" />}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Regime Tributário</Label>
              <Select value={newClient.regime} onValueChange={(v) => setNewClient({...newClient, regime: v})}>
                <SelectTrigger className="border-[#D2D7DB] font-bold">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                  <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Razão Social / Nome</Label>
              <Input 
                placeholder="Ex: Padaria Silva Ltda" 
                value={newClient.empresa}
                onChange={(e) => setNewClient({...newClient, empresa: e.target.value})}
                className="font-bold border-[#D2D7DB]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">E-mail Contato</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                <Input 
                  type="email"
                  placeholder="cliente@email.com" 
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="pl-9 border-[#D2D7DB]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                <Input 
                  placeholder="(00) 00000-0000" 
                  value={newClient.telefone}
                  onChange={(e) => setNewClient({...newClient, telefone: e.target.value})}
                  className="pl-9 border-[#D2D7DB]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Responsável Interno</Label>
              <Select onValueChange={(v) => setNewClient({...newClient, responsavel: v})}>
                <SelectTrigger className="border-[#D2D7DB]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ricardo Santos">Ricardo Santos</SelectItem>
                  <SelectItem value="Fernanda Oliveira">Fernanda Oliveira</SelectItem>
                  <SelectItem value="Ana Souza">Ana Souza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Cidade/UF</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                <Input 
                  placeholder="Município - UF" 
                  value={newClient.cidade ? `${newClient.cidade} - ${newClient.uf}` : ""}
                  readOnly
                  className="pl-9 bg-[#F7F7F7] border-[#D2D7DB] text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
            <Button variant="outline" onClick={() => setIsNewClientOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-[#1FA67A] font-bold gap-2 shadow-lg shadow-emerald-500/20" 
              onClick={handleCreateClient}
              disabled={isLoadingCnpj}
            >
              {isLoadingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
