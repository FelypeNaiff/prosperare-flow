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
  Eye,
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
import { formatCNPJ, validateCNPJ } from "@/lib/utils"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser,
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { lookupCnpjAction } from "@/app/actions/cnpj-lookup"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ClientesPage() {
  const firestore = useFirestore()
  const router = useRouter()
  const { userLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)
  
  // Garantia de query segura: só dispara se userLoaded for true
  const clientsQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "clients") : null, 
    [firestore, userLoaded]
  )
  const { data: clients = [], isLoading } = useCollection(clientsQuery)
  
  const [newClient, setNewClient] = useState({
    corporateName: "",
    nomeFantasia: "",
    cnpj: "",
    taxRegime: "Simples Nacional",
    accountingContactUserId: "Geral",
    status: "ATIVO",
    email: "",
    phone: "",
    city: "",
    state: "",
    zipCode: "",
    address: "",
    neighborhood: "",
    openingDate: "",
    primaryCnae: ""
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
      const data = await lookupCnpjAction(cleanCnpj);
      
      setNewClient(prev => ({
        ...prev,
        ...data,
        taxRegime: data.taxRegime !== "Consultar no Portal" ? data.taxRegime : prev.taxRegime
      }))
      
      toast({ title: "Dados Sincronizados!", description: data.corporateName })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Atenção", description: error.message || "Busca automática falhou." })
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
      companyContactPerson: "Responsável",
      honorariumDueDateDay: 10,
      honorariumValue: 0,
      healthScore: 100,
      obligationGroups: []
    }

    setIsNewClientOpen(false)
    setDocumentNonBlocking(clientRef, clientData, { merge: true })
    
    setNewClient({ 
      corporateName: "", 
      nomeFantasia: "",
      cnpj: "", 
      taxRegime: "Simples Nacional", 
      accountingContactUserId: "Geral", 
      status: "ATIVO", 
      email: "",
      phone: "",
      city: "",
      state: "",
      zipCode: "",
      address: "",
      neighborhood: "",
      openingDate: "",
      primaryCnae: ""
    })
    toast({ title: "Cliente cadastrado!", description: "A empresa foi salva permanentemente." })
  }

  const handleDeleteClient = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "clients", id))
    toast({ title: "Cliente removido", variant: "destructive" })
  }

  const filteredClients = (clients || []).filter(c => 
    c.corporateName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj?.includes(searchTerm)
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão de Clientes</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Administre sua base de empresas e acompanhe a regularidade.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-bold shadow-lg" onClick={() => setIsNewClientOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Total de Clientes" value={clients?.length || 0} icon={Building2} color="primary" />
        <KpiCard label="Certificados OK" value={0} icon={ShieldCheck} color="success" />
        <KpiCard label="Vencendo (30d)" value={0} icon={Clock} color="warning" />
        <KpiCard label="Procurações OK" value={0} icon={FileSignature} color="success" />
        <KpiCard label="Alertas Críticos" value={0} icon={AlertTriangle} color="destructive" />
      </div>

      <Card className="border-[#D2D7DB] shadow-sm">
        <CardHeader className="pb-3 border-b bg-[#F7F7F7]/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
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
                <TableHead className="text-white font-black uppercase text-[10px]">Empresa</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Regime</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Responsável</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Status</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1FA67A]" />
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase mt-2">Sincronizando Base...</p>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-[#F7F7F7]/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2C4156]">{client.corporateName}</span>
                        <span className="text-[10px] text-[#98A7AA] font-mono">{client.cnpj}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-black text-[9px] uppercase border-[#D2D7DB]">{client.taxRegime}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-[#39586D]">{client.accountingContactUserId || "Geral"}</TableCell>
                    <TableCell>
                      <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none text-[9px] font-black uppercase">Ativa</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-[#98A7AA]"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer text-xs font-bold"
                            onSelect={() => router.push(`/clientes/${client.id}`)}
                          >
                            <Eye className="h-3 w-3 text-[#1FA67A]" /> Ver Ficha 360º
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-[#E74C3C] cursor-pointer text-xs font-bold"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            <Trash2 className="h-3 w-3" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-[#98A7AA] font-bold">
                    Nenhum cliente localizado. Clique em Novo Cliente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Novo Cliente (Inteligência API)</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Insira o CNPJ para capturar dados completos da ReceitaWS automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="grid grid-cols-2 gap-5 p-6 bg-white">
              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">CNPJ (Busca Automática)</Label>
                <div className="relative">
                  <Input 
                    placeholder="00.000.000/0000-00" 
                    value={newClient.cnpj}
                    onChange={(e) => setNewClient({...newClient, cnpj: formatCNPJ(e.target.value)})}
                    onBlur={(e) => lookupCnpj(e.target.value)}
                    className="font-mono font-bold border-[#D2D7DB] pr-10"
                  />
                  {isLoadingCnpj && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#1FA67A]" />}
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Regime Tributário</Label>
                <Select value={newClient.taxRegime} onValueChange={(v) => setNewClient({...newClient, taxRegime: v})}>
                  <SelectTrigger className="border-[#D2D7DB]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                    <SelectItem value="MEI">MEI</SelectItem>
                    <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Razão Social</Label>
                <Input 
                  placeholder="Razão Social" 
                  value={newClient.corporateName}
                  onChange={(e) => setNewClient({...newClient, corporateName: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB] font-bold"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Nome Fantasia</Label>
                <Input 
                  placeholder="Nome Fantasia" 
                  value={newClient.nomeFantasia}
                  onChange={(e) => setNewClient({...newClient, nomeFantasia: e.target.value.toUpperCase()})}
                  className="border-[#D2D7DB]"
                />
              </div>

              <div className="col-span-2 md:col-span-1 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Data de Abertura</Label>
                <Input 
                  type="date"
                  value={newClient.openingDate}
                  onChange={(e) => setNewClient({...newClient, openingDate: e.target.value})}
                  className="border-[#D2D7DB]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">E-mail Corporativo</Label>
                <Input 
                  type="email"
                  placeholder="contato@empresa.com" 
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="border-[#D2D7DB]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Telefone / WhatsApp</Label>
                <Input 
                  placeholder="(00) 00000-0000" 
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="border-[#D2D7DB]"
                />
              </div>

              <div className="col-span-2 pt-2 border-t mt-2">
                <h4 className="text-[9px] font-black text-[#1FA67A] uppercase tracking-widest mb-4">Localização e Sede</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Endereço</Label>
                    <Input 
                      placeholder="Rua, Número, Complemento" 
                      value={newClient.address}
                      onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                      className="border-[#D2D7DB]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Bairro</Label>
                    <Input value={newClient.neighborhood} onChange={(e) => setNewClient({...newClient, neighborhood: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">CEP</Label>
                    <Input value={newClient.zipCode} onChange={(e) => setNewClient({...newClient, zipCode: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Cidade</Label>
                    <Input value={newClient.city} onChange={(e) => setNewClient({...newClient, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Estado (UF)</Label>
                    <Input value={newClient.state} onChange={(e) => setNewClient({...newClient, state: e.target.value.toUpperCase()})} />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsNewClientOpen(false)} className="border-[#D2D7DB] font-bold text-xs">Cancelar</Button>
            <Button 
              className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-10 shadow-lg shadow-emerald-500/20" 
              onClick={handleCreateClient}
              disabled={isLoadingCnpj}
            >
              {isLoadingCnpj ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Finalizar Cadastro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
