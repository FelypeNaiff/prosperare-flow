"use client"

import { useState } from "react"
import { ShieldCheck, Search, RefreshCw, Eye, Building2, AlertTriangle } from "lucide-react"
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
import { KpiCard } from "@/components/dashboard/kpi-card"
import Link from "next/link"
import { cn } from "@/lib/utils"

const CND_TYPES = [
  "Federal",
  "FGTS",
  "Trabalhista",
  "Estadual",
  "Municipal"
]

export default function CertidoesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const mockData: any[] = []

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Gestão de Certidões (CNDs)</h1>
          <p className="text-[#98A7AA] font-medium">Monitoramento consolidado de regularidade fiscal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar Tudo
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90">
            Nova Verificação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KpiCard label="Empresas" value="0" icon={Building2} color="info" />
        <KpiCard label="Regulares" value="0" icon={ShieldCheck} color="success" />
        <KpiCard label="A Vencer" value="0" icon={AlertTriangle} color="warning" />
        <KpiCard label="Vencidas" value="0" icon={AlertTriangle} color="destructive" />
        <KpiCard label="Alertas" value="0" icon={ShieldCheck} color="destructive" />
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input
                placeholder="Buscar empresa ou CNPJ..."
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
                <TableHead className="text-white font-bold uppercase text-[10px]">CNPJ</TableHead>
                {CND_TYPES.map(type => (
                  <TableHead key={type} className="text-white font-bold uppercase text-[10px] text-center">{type}</TableHead>
                ))}
                <TableHead className="text-white font-bold uppercase text-[10px] text-center">Status Geral</TableHead>
                <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.length > 0 ? (
                mockData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F7F7F7]">
                    <TableCell className="font-bold">{item.empresa}</TableCell>
                    <TableCell className="text-xs font-mono">{item.cnpj}</TableCell>
                    {/* ... celulas de cnd ... */}
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/certidoes/${item.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-[#98A7AA] font-bold">
                    Nenhuma empresa em monitoramento. As certidões aparecerão conforme você cadastrar clientes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
