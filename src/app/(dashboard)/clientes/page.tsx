
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
  Key, 
  FileSignature, 
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { ClientCommunicationTool } from "@/components/clients/client-communication-tool"
import { ClientCertificatesTable } from "@/components/certificates/client-certificates-table"
import { DigitalCertificateTab } from "@/components/clients/digital-certificate-tab"
import { AccessDataTab } from "@/components/clients/access-data-tab"
import { ProcurationTab } from "@/components/clients/procuration-tab"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { useAuth } from "@/hooks/use-auth-mock"

const MOCK_CLIENTS = [
  { 
    id: '1', 
    empresa: 'Padaria Central', 
    cnpj: '12.345.678/0001-90', 
    regime: 'Simples Nacional', 
    responsavel: 'Maria Silva', 
    certidao: 'Válida', 
    score: 95, 
    email: 'maria@padariacentral.com.br',
    certificadoStatus: 'Válido',
    procuracaoStatus: 'Ativa'
  },
  { 
    id: '2', 
    empresa: 'Oficina do João', 
    cnpj: '98.765.432/0001-21', 
    regime: 'MEI', 
    responsavel: 'João Souza', 
    certidao: 'A Vencer', 
    score: 65, 
    email: 'joao@oficina.com.br',
    certificadoStatus: 'Vencendo',
    procuracaoStatus: 'Expirando'
  },
  { 
    id: '3', 
    empresa: 'Consultoria Tech', 
    cnpj: '11.222.333/0001-44', 
    regime: 'Lucro Presumido', 
    responsavel: 'Ana Pereira', 
    certidao: 'Vencida', 
    score: 40, 
    email: 'ana@tech.com.br',
    certificadoStatus: 'Vencido',
    procuracaoStatus: 'Expirada'
  },
  { 
    id: '4', 
    empresa: 'Agro Vale', 
    cnpj: '55.444.333/0001-00', 
    regime: 'Produtor Rural', 
    responsavel: 'Carlos Rocha', 
    certidao: 'Válida', 
    score: 88, 
    email: 'carlos@agro.com.br',
    certificadoStatus: 'Não integrado',
    procuracaoStatus: 'Sem procuração'
  },
]

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const { user } = useAuth()

  const handleOpenDetail = (client: any) => {
    setSelectedClient(client)
    setIsDetailOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Válido':
      case 'Ativa':
      case 'Válida':
        return <Badge className="bg-emerald-500">{status}</Badge>
      case 'Vencendo':
      case 'Expirando':
      case 'A Vencer':
        return <Badge className="bg-yellow-500 text-black">{status}</Badge>
      case 'Vencido':
      case 'Expirada':
      case 'Vencida':
        return <Badge variant="destructive">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground">Administre sua carteira de clientes e acompanhe a saúde contábil.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Exportar Planilha</Button>
          <Button className="bg-primary hover:bg-secondary">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KpiCard label="Total de Clientes" value="42" icon={Building2} color="info" />
        <KpiCard label="Certificados Ativos" value="35" icon={ShieldCheck} color="success" />
        <KpiCard label="Vencendo (30 dias)" value="4" icon={Clock} color="warning" />
        <KpiCard label="Procurações Ativas" value="38" icon={FileSignature} color="success" />
        <KpiCard label="Sem Certificado" value="3" icon={AlertTriangle} color="destructive" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Regime</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Certificado Digital</TableHead>
                <TableHead>Procuração e-CAC</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CLIENTS.map((client) => (
                <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDetail(client)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{client.empresa}</span>
                      <span className="text-xs text-muted-foreground">{client.cnpj}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">{client.regime}</Badge>
                  </TableCell>
                  <TableCell>{client.responsavel}</TableCell>
                  <TableCell>{getStatusBadge(client.certificadoStatus)}</TableCell>
                  <TableCell>{getStatusBadge(client.procuracaoStatus)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDetail(client)}><FileText className="mr-2 h-4 w-4" /> Ver Ficha Completa</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Editar Dados</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Desativar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de Detalhes do Cliente */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-muted/30">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  {selectedClient?.empresa}
                </DialogTitle>
                <DialogDescription>
                  CNPJ: {selectedClient?.cnpj} • Regime: {selectedClient?.regime}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-4">
                <ClientCommunicationTool client={{ 
                  name: selectedClient?.empresa || '', 
                  email: selectedClient?.email || '', 
                  regime: selectedClient?.regime || '' 
                }} />
                <div className="text-right px-4 py-2 bg-background rounded-lg border">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Score Fiscal</p>
                  <p className={`text-xl font-bold ${selectedClient?.score > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {selectedClient?.score}%
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="dados" className="flex-1 flex flex-col">
            <TabsList className="px-6 border-b bg-transparent h-12 gap-6 rounded-none overflow-x-auto justify-start">
              <TabsTrigger value="dados" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Dados Gerais</TabsTrigger>
              <TabsTrigger value="certidoes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 flex gap-2">
                <ShieldCheck className="h-4 w-4" /> Certidões (CNDs)
              </TabsTrigger>
              <TabsTrigger value="certificado" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 flex gap-2">
                <Key className="h-4 w-4" /> Certificado Digital
              </TabsTrigger>
              <TabsTrigger value="procuracao" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 flex gap-2">
                <FileSignature className="h-4 w-4" /> Procuração e-CAC
              </TabsTrigger>
              <TabsTrigger value="acessos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 flex gap-2">
                <ShieldCheck className="h-4 w-4" /> Dados de Acesso
              </TabsTrigger>
              <TabsTrigger value="documentos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Documentos</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="dados" className="m-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2">Informações Cadastrais</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Razão Social</Label>
                        <p className="font-medium">{selectedClient?.empresa} LTDA</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">CNPJ</Label>
                        <p className="font-medium">{selectedClient?.cnpj}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Data Abertura</Label>
                        <p className="font-medium">10/05/2015</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Telefone</Label>
                        <p className="font-medium">(96) 3222-1100</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2">Configuração Contábil</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Regime Tributário</Label>
                        <Badge variant="outline">{selectedClient?.regime}</Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Responsável Interno</Label>
                        <p className="font-medium">{selectedClient?.responsavel}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Honorário</Label>
                        <p className="font-medium">R$ 1.200,00</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Vencimento Honorário</Label>
                        <p className="font-medium">Todo dia 10</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="certidoes" className="m-0">
                <ClientCertificatesTable clientId={selectedClient?.id || ''} />
              </TabsContent>

              <TabsContent value="certificado" className="m-0">
                <DigitalCertificateTab clientId={selectedClient?.id || ''} />
              </TabsContent>

              <TabsContent value="procuracao" className="m-0">
                <ProcurationTab clientId={selectedClient?.id || ''} />
              </TabsContent>

              <TabsContent value="acessos" className="m-0">
                <AccessDataTab clientId={selectedClient?.id || ''} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
