
"use client"

import { useState, useRef } from "react"
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
  Trash2,
  FileDown,
  Upload,
  FileSpreadsheet,
  Copy
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
import * as XLSX from 'xlsx'

export default function ClientesPage() {
  const firestore = useFirestore()
  const router = useRouter()
  const { userLoaded } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
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
    if (confirm("Deseja excluir permanentemente este registro?")) {
      deleteDocumentNonBlocking(doc(firestore, "clients", id))
      toast({ title: "Cliente removido", variant: "destructive" })
    }
  }

  const handleCopyCNPJ = (cnpj: string) => {
    navigator.clipboard.writeText(cnpj)
    toast({ title: "CNPJ Copiado!", description: cnpj })
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handleDownloadModel = () => {
    const data = [
      ["Razão Social", "Nome Fantasia", "CNPJ", "Regime Tributário", "Email", "Telefone", "CEP", "Endereço", "Bairro", "Cidade", "Estado"],
      ["PROSPERARE EXEMPLO LTDA", "PROSPERARE DIGITAL", "00.000.000/0001-00", "Simples Nacional", "contato@exemplo.com", "(96) 98129-6544", "68900-000", "Av. Principal, 100", "Centro", "Macapá", "AP"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Clientes");
    
    // Ajusta larguras das colunas
    const wscols = [
      {wch: 30}, {wch: 25}, {wch: 20}, {wch: 20}, {wch: 25}, {wch: 15}, {wch: 10}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 5}
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, "modelo_importacao_prosperare.xlsx");
    toast({ title: "Modelo Excel Gerado", description: "O arquivo .xlsx foi baixado com sucesso." });
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        
        let count = 0
        rows.forEach((row, index) => {
          if (index === 0 || !row[0]) return // Pula cabeçalho ou linha sem nome
          
          const id = Math.random().toString(36).substr(2, 9)
          const clientRef = doc(firestore, "clients", id)
          
          const clientData = {
            id,
            corporateName: String(row[0] || "").toUpperCase().trim(),
            nomeFantasia: String(row[1] || row[0] || "").toUpperCase().trim(),
            cnpj: String(row[2] || "").trim(),
            taxRegime: String(row[3] || "Simples Nacional").trim(),
            email: String(row[4] || "").trim(),
            phone: String(row[5] || "").trim(),
            zipCode: String(row[6] || "").trim(),
            address: String(row[7] || "").trim(),
            neighborhood: String(row[8] || "").trim(),
            city: String(row[9] || "").trim(),
            state: String(row[10] || "").toUpperCase().trim().substring(0, 2),
            status: "ATIVO",
            createdAt: new Date().toISOString(),
            companyContactPerson: "Responsável",
            honorariumDueDateDay: 10,
            honorariumValue: 0,
            healthScore: 100,
            obligationGroups: []
          }
          
          setDocumentNonBlocking(clientRef, clientData, { merge: true })
          count++
        })

        toast({ title: "Importação Concluída", description: `${count} clientes foram processados e salvos.` })
      } catch (err) {
        console.error(err)
        toast({ variant: "destructive", title: "Erro na Importação", description: "Não foi possível ler a planilha. Verifique o formato." })
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    
    reader.readAsArrayBuffer(file)
  }

  const filteredClients = (clients || []).filter(c => 
    c.corporateName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj?.includes(searchTerm)
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".xlsx,.xls,.csv" 
        onChange={handleImportFile} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão de Clientes</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Administre sua base de empresas e acompanhe a regularidade.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] font-bold gap-2" onClick={handleDownloadModel}>
            <FileSpreadsheet className="h-4 w-4 text-[#1FA67A]" /> Modelo Excel
          </Button>
          <Button 
            variant="outline" 
            className="border-[#D2D7DB] text-[#39586D] font-bold gap-2" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar Planilha
          </Button>
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] font-bold gap-2" onClick={handleExportPDF}>
            <FileDown className="h-4 w-4" /> Exportar PDF
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-bold shadow-lg" onClick={() => setIsNewClientOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 print:hidden">
        <KpiCard label="Total de Clientes" value={clients?.length || 0} icon={Building2} color="primary" />
        <KpiCard label="Certificados OK" value={0} icon={ShieldCheck} color="success" />
        <KpiCard label="Vencendo (30d)" value={0} icon={Clock} color="warning" />
        <KpiCard label="Procurações OK" value={0} icon={FileSignature} color="success" />
        <KpiCard label="Alertas Críticos" value={0} icon={AlertTriangle} color="destructive" />
      </div>

      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden print:border-none print:shadow-none">
        <CardHeader className="pb-3 border-b bg-[#F7F7F7]/50 print:hidden">
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
        
        <div className="hidden print:block p-8 border-b-2 border-[#2C4156] mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-[#2C4156] uppercase tracking-tighter">PROSPERARE <span className="text-[#1FA67A]">FLOW</span></h2>
              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.4em] mt-1">Relatório Oficial de Clientes Cadastrados</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#39586D] uppercase">Documento Interno de Gestão</p>
              <p className="text-[9px] text-[#98A7AA] font-mono mt-1">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Table className="print:w-full">
            <TableHeader className="bg-[#2C4156] print:bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px] print:text-white">Empresa / Razão Social</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] print:text-white">CNPJ</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] print:text-white">Regime Tributário</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] print:text-white">Responsável</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right print:hidden">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="print:hidden">
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1FA67A]" />
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase mt-2">Sincronizando Base...</p>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-[#F7F7F7]/50 transition-colors print:border-b print:border-[#D2D7DB]">
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[#2C4156] uppercase text-xs">
                          {client.corporateName}
                        </span>
                        {client.nomeFantasia && client.nomeFantasia !== client.corporateName && (
                          <span className="text-[9px] text-[#98A7AA] font-bold uppercase italic tracking-wider">
                            {client.nomeFantasia}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-[#39586D]">
                      <div className="flex items-center gap-2 group/cnpj">
                        {client.cnpj}
                        <button 
                          onClick={() => handleCopyCNPJ(client.cnpj)}
                          className="p-1 rounded hover:bg-[#EBEDF0] text-[#98A7AA] hover:text-[#1FA67A] opacity-0 group-hover/cnpj:opacity-100 transition-all print:hidden"
                          title="Copiar CNPJ"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-black text-[9px] uppercase border-[#D2D7DB] text-[#39586D] print:border-[#D2D7DB]">
                        {client.taxRegime}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-[#39586D] uppercase">
                      {client.accountingContactUserId || "Geral"}
                    </TableCell>
                    <TableCell className="text-right print:hidden">
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
                  <TableCell colSpan={5} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                    Nenhum cliente localizado na base de dados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        <div className="hidden print:block p-12 text-center border-t border-[#D2D7DB] mt-8">
          <p className="text-[8px] font-black text-[#98A7AA] uppercase tracking-[0.3em]">
            Prosperare Flow — Inteligência e Gestão Contábil Digital • www.prosperare.flow
          </p>
        </div>
      </Card>

      <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Novo Cliente (Inteligência API)</DialogTitle>
            <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest">
              Insira o CNPJ para capturar dados completos automaticamente.
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
                <h4 className="text-[10px] font-black text-[#1FA67A] uppercase tracking-widest mb-4">Localização e Sede</h4>
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
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Bairro</Label>
                    <Input value={newClient.neighborhood} onChange={(e) => setNewClient({...newClient, neighborhood: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">CEP</Label>
                    <Input value={newClient.zipCode} onChange={(e) => setNewClient({...newClient, zipCode: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Cidade</Label>
                    <Input value={newClient.city} onChange={(e) => setNewClient({...newClient, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Estado (UF)</Label>
                    <Input value={newClient.state} onChange={(e) => setNewClient({...newClient, state: e.target.value.toUpperCase()})} maxLength={2} />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="bg-[#F7F7F7] p-6 border-t">
            <Button variant="outline" onClick={() => setIsNewClientOpen(false)} className="font-bold text-xs uppercase">Cancelar</Button>
            <Button 
              className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-xs px-10 shadow-lg" 
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
