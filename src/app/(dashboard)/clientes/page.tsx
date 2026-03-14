
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
  Layers,
  Lock,
  CreditCard as InstallmentIcon
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
import { ClientInstallmentsTab } from "@/components/installments/client-installments-tab"
import { cn } from "@/lib/utils"

const MOCK_CLIENTS: any[] = []

const OBLIGATION_GROUPS = [
  { id: '1', name: 'Folha de Pagamento', active: false },
  { id: '2', name: 'Fiscal Serviços', active: false },
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
        <KpiCard label="Total de Clientes" value="0" icon={Building2} color="primary" />
        <KpiCard label="Certificados Ativos" value="0" icon={ShieldCheck} color="success" />
        <KpiCard label="Vencendo (30 dias)" value="0" icon={Clock} color="warning" />
        <KpiCard label="Procurações Ativas" value="0" icon={FileSignature} color="success" />
        <KpiCard label="Sem Certificado" value="0" icon={AlertTriangle} color="destructive" />
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
              {MOCK_CLIENTS.length > 0 ? (
                MOCK_CLIENTS.map((client) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-[#98A7AA] font-bold">
                    Nenhuma empresa cadastrada. Clique em "Novo Cliente" para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
          {/* O conteúdo do modal permanece igual para quando houver dados */}
        </DialogContent>
      </Dialog>
    </div>
  )
}
