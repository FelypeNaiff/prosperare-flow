"use client"

import { useState } from "react"
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  AlertTriangle,
  Building2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  History,
  ShieldAlert,
  ArrowRight,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { InstallmentFormModal } from "@/components/installments/installment-form-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const MOCK_DATA = [
  { id: '1', cliente: 'Padaria Central', tipo: 'Simples Nacional (e-CAC)', descricao: 'Dívida Ativa 2022', parcela: '12/60', valor: 450.00, vencimento: 15, status: 'Ativo' },
  { id: '2', cliente: 'Oficina do João', tipo: 'Débitos Receita Federal (PERT)', descricao: 'REFIS Pandemia', parcela: '45/60', valor: 1200.00, vencimento: 20, status: 'Ativo' },
  { id: '3', cliente: 'Consultoria Tech', tipo: 'Simples Nacional (e-CAC)', descricao: 'ISS Retido 2023', parcela: '8/24', valor: 280.00, vencimento: 10, status: 'Cancelado por não pagamento' },
  { id: '4', cliente: 'Agro Vale', tipo: 'FGTS (Caixa)', descricao: 'Acordo Sindical', parcela: '12/12', valor: 3500.00, vencimento: 7, status: 'Quitado' },
]

export default function ParcelamentosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const hasCriticalRisk = MOCK_DATA.some(i => i.tipo.includes('Simples Nacional') && i.status.includes('Cancelado'))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none font-bold text-[10px] uppercase">Ativo</Badge>
      case 'Cancelado por não pagamento':
        return <Badge className="bg-[#FEE2E2] text-[#E74C3C] border-none font-bold text-[10px] uppercase">Cancelado</Badge>
      case 'Quitado':
        return <Badge className="bg-[#E3F0F9] text-[#2574A9] border-none font-bold text-[10px] uppercase">Quitado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-[#1FA67A]" />
            Controle de Parcelamentos
          </h1>
          <p className="text-[#98A7AA] font-bold text-sm">Gestão consolidada de acordos e dívidas parceladas.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold shadow-lg" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Parcelamento
        </Button>
      </div>

      {/* Alerta de Risco de Exclusão */}
      {hasCriticalRisk && (
        <Alert className="bg-[#FEE2E2] border-[#E74C3C]/20 text-[#E74C3C] shadow-lg">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-black uppercase text-xs tracking-widest">Atenção: Risco de Exclusão do Simples</AlertTitle>
          <AlertDescription className="text-xs font-bold mt-1">
            Existem parcelamentos do Simples Nacional cancelados por falta de pagamento. A Receita Federal utiliza este critério para exclusão de ofício do regime. Verifique os clientes afetados imediatamente.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiMini label="Ativos" value="24" icon={CheckCircle2} color="success" />
        <KpiMini label="Gerados este mês" value="18" icon={Clock} color="info" />
        <KpiMini label="Cancelados (Ano)" value="3" icon={XCircle} color="destructive" />
        <KpiMini label="A enviar (Semana)" value="7" icon={AlertTriangle} color="warning" />
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input 
                placeholder="Buscar por cliente ou tipo..." 
                className="pl-9 h-9 bg-white border-[#D2D7DB]" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-[#39586D]">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px]">Cliente</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Tipo / Órgão</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Parcela Atual</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Valor Parcela</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Dia Venc.</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Status</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.map((item) => (
                <TableRow key={item.id} className={cn(
                  "hover:bg-[#F7F7F7]/50 transition-colors",
                  item.status.includes('Cancelado') && "bg-slate-50/50 grayscale opacity-70"
                )}>
                  <TableCell className="font-bold text-[#2C4156]">{item.cliente}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-[#39586D]">{item.tipo}</span>
                        {item.tipo.includes('Simples Nacional') && item.status.includes('Cancelado') && (
                          <ShieldAlert className="h-3 w-3 text-[#E74C3C]" title="Risco de Exclusão" />
                        )}
                      </div>
                      <span className="text-[10px] text-[#98A7AA] uppercase">{item.descricao}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#2C4156]">{item.parcela}</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1FA67A]" 
                          style={{ width: `${(parseInt(item.parcela.split('/')[0]) / parseInt(item.parcela.split('/')[1])) * 100}%` }} 
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-[#1FA67A]">
                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center font-bold text-[#39586D]">Dia {item.vencimento}</TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-[#98A7AA]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 text-xs font-bold"><History className="h-4 w-4" /> Ver Parcelas</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs font-bold"><Edit className="h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs font-bold text-[#E74C3C]"><XCircle className="h-4 w-4" /> Cancelar Acordo</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InstallmentFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}

function KpiMini({ label, value, icon: Icon, color }: any) {
  const colors = {
    success: "bg-[#7ED6B5]/20 text-[#1FA67A]",
    info: "bg-[#E3F0F9]/20 text-[#2574A9]",
    destructive: "bg-[#FEE2E2]/20 text-[#E74C3C]",
    warning: "bg-[#FEF3C7]/20 text-[#F2B705]",
  }
  return (
    <Card className="border-[#D2D7DB]">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">{label}</p>
          <p className="text-xl font-black text-[#2C4156]">{value}</p>
        </div>
        <div className={cn("p-2 rounded-lg", colors[color as keyof typeof colors])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}
