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
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, doc, serverTimestamp } from "firebase/firestore"

export default function ClientesPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)
  
  const clientsQuery = useMemoFirebase(() => {
    return collection(firestore, "clients")
  }, [firestore])

  const { data: clients = [], isLoading } = useCollection(clientsQuery)
  
  const [newClient, setNewClient] = useState({
    corporateName: "",
    cnpj: "",
    taxRegime: "",
    accountingContactUserId: "",
    status: "Active",
    email: "",
    phone: "",
    city: "",
    state: ""
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
        corporateName: data.razao_social || prev.corporateName,
        taxRegime: regimeSugerido,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 || prev.phone,
        city: data.municipio || prev.city,
        state: data.uf || prev.state
      }))
      
      toast({ 
        title: "Dados Localizados!", 
        description: `Empresa: ${data.razao_social}.`,
        className: "bg-[#1FA67A] text-white border-none"
      })
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Atenção", 
        description: "Não foi possível buscar os dados automaticamente." 
      })
    } finally {
      setIsLoadingCnpj(false)
    }
  }

  const handleCreateClient = () => {
    if (!newClient.corporateName || !newClient.cnpj || !newClient.taxRegime) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    const clientId = Math.random().toString(36).substr(2, 9)
    const clientRef = doc(firestore, "clients", clientId)
    
    const clientData = {
      ...newClient,
      id: clientId,
      createdAt: new Date().toISOString(),
      openingDate: new Date().toISOString().split('T')[0], // Default
      primaryCnae: "0000-0/00",
      companyContactPerson: "Titular",
      address: "Preencher",
      neighborhood: "Centro",
      zipCode: "00000-000",
      honorariumDueDateDay: 10,
      honorariumValue: 0
    }

    setDocumentNonBlocking(clientRef, clientData, { merge: true })
    
    setIsNewClientOpen(false)
    setNewClient({ 
      corporateName: "", 
      cnpj: "", 
      taxRegime: "", 
      accountingContactUserId: "", 
      status: "Active", 
      email: "",
      phone: "",
      city: "",
      state: ""
    })
    toast({ title: "Cliente cadastrado!", description: "A empresa foi salva no banco de dados." })
  }

  const handleDeleteClient = (id: string) => {
    const clientRef = doc(firestore, "clients", id)
    deleteDocumentNonBlocking(clientRef)
    toast({ title: "Cliente removido", variant: "destructive" })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': case 'Ativa':
        return <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none font-bold text-[10px] uppercase">Ativa</Badge>
      default:
        return <Badge className="bg-[#FEE2E2] text-[#E74C3C] border-none font-bold text-[10px] uppercase">Inativa</Badge>
    }
  }

  const filteredClients = (clients || []).filter(c => 
    c.corporateName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj?.includes(searchTerm)
  )

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
        <KpiCard label="Total de Clientes" value={clients?.length || 0} icon={Building2} color="primary" />
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
                <TableHead className="text-white font-bold uppercase text-[10px]">Status</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1FA67A]" />
                  </TableCell>
                </TableRow>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-[#F7F7F7]">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2C4156]">{client.corporateName}</span>
                        <span className="text-[10px] text-[#98A7AA] font-mono">{client.cnpj}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold text-[10px] uppercase">{client.taxRegime}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-[#39586D]">{client.accountingContactUserId || "Não atribuído"}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-[#98A7AA]">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/clientes/${client.id}`} className="flex items-center gap-2 cursor-pointer">
                              <Eye className="h-4 w-4 text-[#1FA67A]" /> Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-[#E74C3C] cursor-pointer"
                            onClick={() => handleDeleteClient(client.id)}
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
                  <TableCell colSpan={5} className="h-24 text-center text-[#98A7AA] font-bold">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Novo Cliente</DialogTitle>
            <DialogDescription>O sistema salvará os dados permanentemente no banco de dados.</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">CNPJ</Label>
              <div className="relative">
                <Input 
                  placeholder="00.000.000/0000-00" 
                  value={newClient.cnpj}
                  onChange={(e) => setNewClient({...newClient, cnpj: formatCNPJ(e.target.value)})}
                  onBlur={(e) => lookupCnpj(e.target.value)}
                  className="font-mono font-bold"
                />
                {isLoadingCnpj && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#1FA67A]" />}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Regime Tributário</Label>
              <Select value={newClient.taxRegime} onValueChange={(v) => setNewClient({...newClient, taxRegime: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Razão Social</Label>
              <Input 
                placeholder="Ex: Padaria Silva Ltda" 
                value={newClient.corporateName}
                onChange={(e) => setNewClient({...newClient, corporateName: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">E-mail</Label>
              <Input 
                type="email"
                placeholder="cliente@email.com" 
                value={newClient.email}
                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-[#98A7AA]">Telefone</Label>
              <Input 
                placeholder="(00) 00000-0000" 
                value={newClient.phone}
                onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
            <Button variant="outline" onClick={() => setIsNewClientOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-[#1FA67A] font-bold gap-2" 
              onClick={handleCreateClient}
              disabled={isLoadingCnpj}
            >
              {isLoadingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar no Banco de Dados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
