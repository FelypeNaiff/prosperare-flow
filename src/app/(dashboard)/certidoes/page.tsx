
"use client"

import { useState } from "react"
import { ShieldCheck, Search, Filter, RefreshCw, ExternalLink, Download, AlertTriangle, Eye, Building2 } from "lucide-react"
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KpiCard } from "@/components/dashboard/kpi-card"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Tipos de Certidões principais para a visão de colunas
const CND_TYPES = [
  "Federal",
  "FGTS",
  "Trabalhista",
  "Estadual (SEFA-AP)",
  "Municipal (Macapá)"
]

// Mock de dados agrupados por empresa
const MOCK_COMPANY_CNDS = [
  { 
    id: '1', 
    empresa: 'Padaria Central Ltda', 
    cnpj: '12.345.678/0001-90',
    statusGeral: 'regular',
    cnds: {
      "Federal": { status: 'Válida', validade: '15/12/2024' },
      "FGTS": { status: 'Válida', validade: '20/11/2024' },
      "Trabalhista": { status: 'A Vencer', validade: '15/10/2024' },
      "Estadual (SEFA-AP)": { status: 'Válida', validade: '10/12/2024' },
      "Municipal (Macapá)": { status: 'Válida', validade: '05/01/2025' }
    }
  },
  { 
    id: '2', 
    empresa: 'Oficina do João ME', 
    cnpj: '98.765.432/0001-21',
    statusGeral: 'alerta',
    cnds: {
      "Federal": { status: 'Crítica', validade: '28/09/2024' },
      "FGTS": { status: 'Válida', validade: '14/11/2024' },
      "Trabalhista": { status: 'Válida', validade: '20/12/2024' },
      "Estadual (SEFA-AP)": { status: 'Não emitida', validade: '-' },
      "Municipal (Macapá)": { status: 'Válida', validade: '05/11/2024' }
    }
  },
  { 
    id: '3', 
    empresa: 'Consultoria Tech S.A.', 
    cnpj: '11.222.333/0001-44',
    statusGeral: 'critico',
    cnds: {
      "Federal": { status: 'Vencida', validade: '10/09/2024' },
      "FGTS": { status: 'Válida', validade: '01/12/2024' },
      "Trabalhista": { status: 'Válida', validade: '01/12/2024' },
      "Estadual (SEFA-AP)": { status: 'Válida', validade: '01/12/2024' },
      "Municipal (Macapá)": { status: 'Vencida', validade: '05/09/2024' }
    }
  }
]

export default function CertidoesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Válida': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'A Vencer': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Crítica': return 'bg-orange-500 hover:bg-orange-600';
      case 'Vencida': return 'bg-red-500 hover:bg-red-600';
      case 'Não emitida': return 'bg-slate-400 hover:bg-slate-500';
      default: return 'bg-slate-200';
    }
  }

  const getGeneralStatusBadge = (status: string) => {
    if (status === 'regular') return <Badge className="bg-emerald-500">Regular</Badge>
    if (status === 'alerta') return <Badge className="bg-yellow-500 text-black">Alerta</Badge>
    if (status === 'critico') return <Badge className="bg-red-500">Crítico</Badge>
    return <Badge variant="outline">N/A</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Gestão de Certidões (CNDs)</h1>
          <p className="text-muted-foreground">Monitoramento consolidado por empresa e tipo de obrigação.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar Tudo
          </Button>
          <Button className="bg-primary hover:bg-secondary">
            Nova Verificação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KpiCard label="Empresas Monitoradas" value="48" icon={Building2} color="info" />
        <KpiCard label="100% Regulares" value="32" icon={ShieldCheck} color="success" />
        <KpiCard label="A Vencer (30d)" value="12" icon={AlertTriangle} color="warning" />
        <KpiCard label="Com Vencidas" value="4" icon={AlertTriangle} color="destructive" />
        <KpiCard label="Total CNDs Vencidas" value="7" icon={ShieldCheck} color="destructive" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa ou CNPJ..."
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
                <TableHead className="min-w-[200px]">Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead className="text-center">Federal</TableHead>
                <TableHead className="text-center">FGTS</TableHead>
                <TableHead className="text-center">Trabalhista</TableHead>
                <TableHead className="text-center">Estadual</TableHead>
                <TableHead className="text-center">Municipal</TableHead>
                <TableHead className="text-center">Status Geral</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_COMPANY_CNDS.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell className="font-bold">{item.empresa}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.cnpj}</TableCell>
                  {CND_TYPES.map(type => (
                    <TableCell key={type} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div 
                          className={cn(
                            "w-3 h-3 rounded-full", 
                            getStatusColor(item.cnds[type as keyof typeof item.cnds].status)
                          )} 
                          title={`${type}: ${item.cnds[type as keyof typeof item.cnds].status}`}
                        />
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {item.cnds[type as keyof typeof item.cnds].status === 'Não emitida' ? 'N/E' : item.cnds[type as keyof typeof item.cnds].validade.split('/')[0] + '/' + item.cnds[type as keyof typeof item.cnds].validade.split('/')[1]}
                        </span>
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    {getGeneralStatusBadge(item.statusGeral)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm" className="gap-2">
                      <Link href={`/certidoes/${item.id}`}>
                        <Eye className="h-4 w-4" /> Ver Detalhes
                      </Link>
                    </Button>
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
