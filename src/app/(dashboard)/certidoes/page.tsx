"use client"

import { useState } from "react"
import { ShieldCheck, Search, Filter, RefreshCw, ExternalLink, Download, AlertTriangle } from "lucide-react"
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

const MOCK_CERTIFICATES = [
  { id: '1', cliente: 'Padaria Central', tipo: 'Federal (Receita/PGFN)', emissao: '10/08/2023', validade: '10/02/2024', status: 'Válida' },
  { id: '2', cliente: 'Oficina do João', tipo: 'FGTS (CRF)', emissao: '15/01/2024', validade: '14/02/2024', status: 'A Vencer' },
  { id: '3', cliente: 'Consultoria Tech', tipo: 'Estadual (Sefaz)', emissao: '01/06/2023', validade: '01/12/2023', status: 'Vencida' },
  { id: '4', cliente: 'Agro Vale', tipo: 'Trabalhista (CNDT)', emissao: '20/09/2023', validade: '20/03/2024', status: 'Válida' },
  { id: '5', cliente: 'Padaria Central', tipo: 'Municipal (ISS)', emissao: '05/01/2024', validade: '05/07/2024', status: 'Válida' },
]

export default function CertidoesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Gestão de Certidões (CNDs)</h1>
          <p className="text-muted-foreground">Monitore a regularidade fiscal de todos os seus clientes em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar Todas
          </Button>
          <Button className="bg-primary hover:bg-secondary">
            Nova Verificação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Certidões Válidas" value="245" icon={ShieldCheck} color="success" />
        <KpiCard label="Próximas ao Vencimento" value="12" icon={AlertTriangle} color="warning" />
        <KpiCard label="Certidões Vencidas" value="5" icon={AlertTriangle} color="destructive" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou tipo de certidão..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="todas">
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos os Tipos</SelectItem>
                  <SelectItem value="federal">Federal</SelectItem>
                  <SelectItem value="fgts">FGTS</SelectItem>
                  <SelectItem value="estadual">Estadual</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="trabalhista">Trabalhista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de Certidão</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CERTIFICATES.map((cert) => (
                <TableRow key={cert.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{cert.cliente}</TableCell>
                  <TableCell>{cert.tipo}</TableCell>
                  <TableCell>{cert.emissao}</TableCell>
                  <TableCell>{cert.validade}</TableCell>
                  <TableCell>
                    <Badge className={
                      cert.status === 'Válida' ? 'bg-chart-1' : 
                      cert.status === 'A Vencer' ? 'bg-chart-2' : 'bg-chart-4'
                    }>
                      {cert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Visualizar">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
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
