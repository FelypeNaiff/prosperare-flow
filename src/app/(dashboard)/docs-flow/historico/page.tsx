
"use client"

import { useState } from "react"
import { 
  History, 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Filter,
  ArrowLeft,
  Building2,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { useRouter } from "next/navigation"

const MOCK_HISTORY = [
  { id: 'DOC-001', empresa: 'Padaria Central Ltda', doc: 'Termo de Rescisão - Pedro Silva', data: '22/10/2024', tipo: 'Rescisão', status: 'Assinado' },
  { id: 'DOC-002', empresa: 'Oficina do João ME', doc: 'Declaração de Faturamento 12 Meses', data: '20/10/2024', tipo: 'Faturamento', status: 'Enviado' },
  { id: 'DOC-003', empresa: 'Consultoria Tech S.A', doc: 'Pró-labore Avulso - Ana Maria', data: '18/10/2024', tipo: 'Pró-labore', status: 'Pendente' },
  { id: 'DOC-004', empresa: 'Padaria Central Ltda', doc: 'Declaração de Faturamento 12 Meses', data: '15/10/2024', tipo: 'Faturamento', status: 'Assinado' },
]

export default function DocsFlowHistoricoPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#39586D]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Histórico de Documentos</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Rastreabilidade completa de todos os documentos avulsos gerados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#D2D7DB] bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#1FA67A]/10 rounded-xl text-[#1FA67A]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Total Gerado</p>
              <p className="text-2xl font-black text-[#2C4156]">142 Docs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB] bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#2574A9]/10 rounded-xl text-[#2574A9]">
              <History className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Assinados Digitalmente</p>
              <p className="text-2xl font-black text-[#2C4156]">98 Docs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB] bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#F2B705]/10 rounded-xl text-[#F2B705]">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Emitidos este mês</p>
              <p className="text-2xl font-black text-[#2C4156]">24 Docs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input 
                placeholder="Buscar empresa ou documento..." 
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
                <TableHead className="text-white font-black uppercase text-[10px]">ID / Data</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Empresa</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Documento</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Tipo</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Status</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_HISTORY.map((item) => (
                <TableRow key={item.id} className="hover:bg-[#F7F7F7]/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#98A7AA]">{item.id}</span>
                      <span className="text-xs font-bold text-[#39586D]">{item.data}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-[#2C4156]">{item.empresa}</TableCell>
                  <TableCell className="text-xs font-medium text-[#39586D]">{item.doc}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-[#D2D7DB] text-[#39586D]">{item.tipo}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "text-[9px] font-black uppercase border-none",
                      item.status === 'Assinado' ? "bg-[#7ED6B5] text-[#1FA67A]" : 
                      item.status === 'Enviado' ? "bg-[#E3F0F9] text-[#2574A9]" : "bg-[#FEF3C7] text-[#F2B705]"
                    )}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#2C4156]"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1FA67A]"><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
