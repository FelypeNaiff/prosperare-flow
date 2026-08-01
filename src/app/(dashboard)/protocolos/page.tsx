
"use client"

import { useState } from "react"
import { 
  FileSignature, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Mail, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const MOCK_PROTOCOLS = [
  { id: 'PR-2024-001', client: 'Padaria Central', doc: 'Folha de Pagamento 09/2024', sentAt: '22/10/2024 14:30', status: 'Visualizado', viewAt: '22/10/2024 16:15', channel: 'E-mail' },
  { id: 'PR-2024-002', client: 'Oficina do João', doc: 'Guia DAS Simples Nacional', sentAt: '22/10/2024 15:00', status: 'Enviado', viewAt: null, channel: 'E-mail' },
  { id: 'PR-2024-003', client: 'Consultoria Tech', doc: 'Contrato Social Registrado', sentAt: '21/10/2024 10:00', status: 'Visualizado', viewAt: '21/10/2024 11:20', channel: 'E-mail' },
  { id: 'PR-2024-004', client: 'Agro Vale', doc: 'Balancete Trimestral', sentAt: '20/10/2024 09:00', status: 'Pendente', viewAt: null, channel: 'E-mail' },
]

export default function ProtocolosPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://prosperare.flow/protocolo/verify/TK-8821-X")
    toast({
      title: "Link Copiado!",
      description: "Anexe este link no corpo do seu e-mail para rastrear a leitura."
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2C4156]">Protocolos Digitais</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Gestão e rastreabilidade de documentos enviados por e-mail.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2" onClick={handleCopyLink}>
            <Plus className="h-4 w-4" /> Novo Registro de Protocolo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#E3F0F9]/30 border-[#2574A9]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#2574A9] uppercase">Total Enviado (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-[#2C4156]">142</p>
          </CardContent>
        </Card>
        <Card className="bg-[#7ED6B5]/20 border-[#2563EB]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#2563EB] uppercase">Visualizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-[#2563EB]">128 <span className="text-xs font-bold opacity-60">(90%)</span></p>
          </CardContent>
        </Card>
        <Card className="bg-[#FEE2E2]/30 border-[#E74C3C]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#E74C3C] uppercase">Pendentes de Leitura</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-[#E74C3C]">14</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input 
                placeholder="Buscar por protocolo, cliente ou documento..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-[#D2D7DB] gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium text-sm">Protocolo</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Cliente</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Documento</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Enviado em</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-center">Status</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm">Visualizado em</TableHead>
                <TableHead className="text-slate-500 font-medium text-sm text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PROTOCOLS.map((protocol) => (
                <TableRow key={protocol.id} className="hover:bg-[#F7F7F7]">
                  <TableCell className="font-mono text-[10px] font-bold text-[#39586D]">{protocol.id}</TableCell>
                  <TableCell className="font-bold text-[#2C4156]">{protocol.client}</TableCell>
                  <TableCell className="text-xs font-medium text-[#39586D]">{protocol.doc}</TableCell>
                  <TableCell className="text-xs text-[#98A7AA]">{protocol.sentAt}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "text-[10px] font-medium border-none",
                      protocol.status === 'Visualizado' ? "bg-emerald-50 text-emerald-700" : 
                      protocol.status === 'Enviado' ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {protocol.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#98A7AA]">{protocol.viewAt || '--'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Ver Comprovante" className="h-8 w-8 text-[#98A7AA]"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Copia link do protocolo" className="h-8 w-8 text-[#2563EB]" onClick={handleCopyLink}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-[#2C4156] text-white border-none">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-full">
              <Mail className="h-6 w-6 text-[#2563EB]" />
            </div>
            <div>
              <h4 className="font-bold text-lg">Envio Manual via E-mail</h4>
              <p className="text-sm text-white/70">O sistema gera o link de protocolo. Basta copiar e colar no seu e-mail pessoal/office.</p>
            </div>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold">
            Ver tutorial de envios
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
