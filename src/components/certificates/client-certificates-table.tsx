
"use client"

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, FileText, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientCertificatesTableProps {
  clientId: string;
}

const MOCK_CERTIFICATES = [
  { id: '1', tipo: 'Federal (Receita/PGFN)', numero: '8872.A211.C902', emissao: '10/08/2023', validade: '10/02/2025', dias: 141, status: 'Válida' },
  { id: '2', tipo: 'FGTS (CRF)', numero: '20240115082211', emissao: '15/09/2024', validade: '14/10/2024', dias: 22, status: 'A Vencer' },
  { id: '3', tipo: 'Estadual (SEFA-AP)', numero: '9922.881.002', emissao: '01/09/2024', validade: '28/09/2024', dias: 6, status: 'Crítica' },
  { id: '4', tipo: 'Trabalhista (CNDT)', numero: '2211.3344.55', emissao: '20/03/2024', validade: '20/09/2024', dias: -2, status: 'Vencida' },
  { id: '5', tipo: 'Municipal (Macapá)', numero: '-', emissao: '-', validade: '-', dias: 0, status: 'Não emitida' },
]

export function ClientCertificatesTable({ clientId }: ClientCertificatesTableProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Válida': 
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Válida</Badge>;
      case 'A Vencer': 
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">A Vencer</Badge>;
      case 'Crítica': 
        return <Badge className="bg-orange-500 hover:bg-orange-600">Crítica</Badge>;
      case 'Vencida': 
        return <Badge className="bg-red-500 hover:bg-red-600">Vencida</Badge>;
      case 'Não emitida': 
        return <Badge variant="secondary">Não emitida</Badge>;
      default: 
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  const getDaysColor = (dias: number) => {
    if (dias < 0) return "text-red-600 font-bold";
    if (dias <= 7) return "text-orange-600 font-bold";
    if (dias <= 30) return "text-yellow-600 font-bold";
    return "text-emerald-600";
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Tipo de Certidão</TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Emissão</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead className="text-center">Dias Restantes</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_CERTIFICATES.map((cert) => (
            <TableRow key={cert.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{cert.tipo}</TableCell>
              <TableCell className="text-xs font-mono">{cert.numero}</TableCell>
              <TableCell>{cert.emissao}</TableCell>
              <TableCell>{cert.validade}</TableCell>
              <TableCell className={cn("text-center", getDaysColor(cert.dias))}>
                {cert.status === 'Não emitida' ? '-' : cert.dias}
              </TableCell>
              <TableCell>{getStatusBadge(cert.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" title="Consultar Agora">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Ver PDF" disabled={cert.status === 'Não emitida'}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Acessar Portal">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
