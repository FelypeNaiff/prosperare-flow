
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
  Clock,
  Layers
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
import { Switch } from "@/components/ui/switch"
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

const OBLIGATION_GROUPS = [
  { id: '1', name: 'Folha de Pagamento', active: true },
  { id: '2', name: 'Fiscal Serviços', active: true },
  { id: '3', name: 'Contabilidade', active: false },
  { id: '4', name: 'MEI', active: false },
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
        return <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none font-bold text-[10px] uppercase">{status}</Badge>
      case 'Vencendo':
      case 'Expirando':
      case 'A Vencer':
        return <Badge className="bg-[#FEF3C7] text-[#F2B705] border-none font-bold text-[10px] uppercase">{status}</Badge>
      case 'Vencido':
      case 'Expirada':
      case 'Vencida':
        return <Badge className="bg-[#FEE2E2] text-[#E74C3C] border-none font-bold text-[10px] uppercase">{status}</Badge>
      default:
        return <Badge className="bg-[#F3F4F6] text-[#98A7AA] border-none font-bold text-[10px] uppercase">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Gestão de Clientes</h1>
          <p className="text-[#98A7AA] font-medium">Administre sua carteira de clientes e acompanhe a saúde contábil.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D]">Exportar Planilha</Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KpiCard label="Total de Clientes" value="42" icon={Building2} color="primary" />
        <KpiCard label="Certificados Ativos" value="35" icon={ShieldCheck} color="success" />
        <KpiCard label="Vencendo (30 dias)" value="4" icon={Clock} color="warning" />
        <KpiCard label="Procurações Ativas" value="38" icon={FileSignature} color="success" />
        <KpiCard label="Sem Certificado" value="3" icon={AlertTriangle} color="destructive" />
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                className="pl-9 bg-[#F7F7F7] border-[#D2D7DB]"
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
                <TableHead className="text-white font-bold uppercase text-[10px]">Empresa</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Regime</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Responsável</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Certificado Digital</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px]">Procuração e-CAC</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CLIENTS.map((client) => (
                <TableRow key={client.id} className="cursor-pointer hover:bg-[#F7F7F7]" onClick={() => handleOpenDetail(client)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-[#2C4156]">{client.empresa}</span>
                      <span className="text-xs text-[#98A7AA] font-mono">{client.cnpj}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold text-[10px] uppercase border-[#D2D7DB] text-[#39586D]">{client.regime}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-[#39586D]">{client.responsavel}</TableCell>
                  <TableCell>{getStatusBadge(client.certificadoStatus)}</TableCell>
                  <TableCell>{getStatusBadge(client.procuracaoStatus)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-[#D2D7DB]">
                        <DropdownMenuLabel className="text-[10px] uppercase text-[#2C4156]">Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDetail(client)} className="gap-2 text-xs font-bold text-[#2C4156]"><FileText className="h-4 w-4 text-[#1FA67A]" /> Ficha Completa</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs font-bold text-[#2C4156]"><Edit className="h-4 w-4 text-[#2574A9]" /> Editar Dados</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs font-bold text-[#E74C3C]"><Trash2 className="h-4 w-4" /> Desativar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-[#F7F7F7]">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#1FA67A] text-white text-[10px] uppercase font-bold">Empresa Ativa</Badge>
                  <span className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">ID: {selectedClient?.id}</span>
                </div>
                <DialogTitle className="text-2xl font-black text-[#2C4156] flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-[#1FA67A]" />
                  {selectedClient?.empresa}
                </DialogTitle>
                <DialogDescription className="font-bold text-[#39586D]">
                  CNPJ: {selectedClient?.cnpj} • Regime: {selectedClient?.regime}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-4">
                <ClientCommunicationTool client={{ 
                  name: selectedClient?.empresa || '', 
                  email: selectedClient?.email || '', 
                  regime: selectedClient?.regime || '' 
                }} />
                <div className="text-right px-4 py-2 bg-white rounded-lg border border-[#D2D7DB] shadow-sm">
                  <p className="text-[10px] font-black uppercase text-[#98A7AA]">Score Fiscal</p>
                  <p className={`text-xl font-black ${selectedClient?.score > 80 ? 'text-[#1FA67A]' : 'text-[#F2B705]'}`}>
                    {selectedClient?.score}%
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="dados" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="px-6 h-12 bg-white border-b rounded-none justify-start gap-6 overflow-x-auto">
              <TabsTrigger value="dados" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase">Dados Gerais</TabsTrigger>
              <TabsTrigger value="grupos" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase flex gap-2">
                <Layers className="h-4 w-4" /> Grupos de Obrigações
              </TabsTrigger>
              <TabsTrigger value="certidoes" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase flex gap-2">
                <ShieldCheck className="h-4 w-4" /> Certidões
              </TabsTrigger>
              <TabsTrigger value="certificado" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase flex gap-2">
                <Key className="h-4 w-4" /> Certificado
              </TabsTrigger>
              <TabsTrigger value="procuracao" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase flex gap-2">
                <FileSignature className="h-4 w-4" /> Procuração
              </TabsTrigger>
              <TabsTrigger value="acessos" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1FA67A] rounded-none h-full px-0 font-bold text-xs uppercase flex gap-2">
                <Lock className="h-4 w-4" /> Senhas
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="dados" className="m-0 h-full overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-[#2C4156] uppercase tracking-[0.2em] border-b pb-2">Informações Cadastrais</h3>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#98A7AA] uppercase">Razão Social</Label>
                        <p className="font-bold text-[#2C4156]">{selectedClient?.empresa} LTDA</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#98A7AA] uppercase">CNPJ</Label>
                        <p className="font-bold text-[#2C4156]">{selectedClient?.cnpj}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#98A7AA] uppercase">Data Abertura</Label>
                        <p className="font-bold text-[#2C4156]">10/05/2015</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#98A7AA] uppercase">Telefone</Label>
                        <p className="font-bold text-[#2C4156]">(96) 3222-1100</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-[#2C4156] uppercase tracking-[0.2em] border-b pb-2">Configuração Contábil</h3>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#98A7AA] uppercase">Regime Tributário</Label>
                        <Badge variant="outline" className="font-bold border-[#D2D7DB] text-[#1FA67A]">{selectedClient?.regime}</Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#98A7AA] uppercase">Responsável Interno</Label>
                        <p className="font-bold text-[#2C4156]">{selectedClient?.responsavel}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#98A7AA] uppercase">Honorário Mensal</Label>
                        <p className="font-black text-[#1FA67A]">R$ 1.200,00</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#98A7AA] uppercase">Vencimento</Label>
                        <p className="font-bold text-[#2C4156]">Todo dia 10</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="grupos" className="m-0 h-full overflow-y-auto p-6">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-black text-[#2C4156] uppercase tracking-tight">Grupos de Obrigações</h3>
                      <p className="text-xs text-[#98A7AA] font-medium">Selecione quais pacotes de processos esta empresa deve gerar automaticamente.</p>
                    </div>
                    <Button variant="outline" size="sm" className="font-bold border-[#D2D7DB] gap-2">
                      <Plus className="h-4 w-4" /> Novo Grupo
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {OBLIGATION_GROUPS.map((group) => (
                      <div key={group.id} className="flex items-center justify-between p-4 border rounded-xl bg-white hover:bg-[#F7F7F7] transition-colors shadow-sm group">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                            group.active ? "bg-[#1FA67A]" : "bg-[#98A7AA]"
                          )}>
                            <Layers className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#2C4156] uppercase leading-tight">{group.name}</p>
                            <p className="text-[10px] text-[#98A7AA] font-bold uppercase tracking-widest mt-0.5">
                              {group.active ? "Gerando processos" : "Inativo para este cliente"}
                            </p>
                          </div>
                        </div>
                        <Switch checked={group.active} />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="certidoes" className="m-0 h-full overflow-y-auto p-6">
                <ClientCertificatesTable clientId={selectedClient?.id || ''} />
              </TabsContent>

              <TabsContent value="certificado" className="m-0 h-full overflow-y-auto p-6">
                <DigitalCertificateTab clientId={selectedClient?.id || ''} />
              </TabsContent>

              <TabsContent value="procuracao" className="m-0 h-full overflow-y-auto p-6">
                <ProcurationTab clientId={selectedClient?.id || ''} />
              </TabsContent>

              <TabsContent value="acessos" className="m-0 h-full overflow-y-auto p-6">
                <AccessDataTab clientId={selectedClient?.id || ''} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
