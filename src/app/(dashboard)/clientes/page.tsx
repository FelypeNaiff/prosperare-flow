"use client"

import { useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, FileText, Activity, Trash2, Edit } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const MOCK_CLIENTS = [
  { id: '1', empresa: 'Padaria Central', cnpj: '12.345.678/0001-90', regime: 'Simples Nacional', responsavel: 'Maria Silva', certidao: 'Válida', score: 95 },
  { id: '2', empresa: 'Oficina do João', cnpj: '98.765.432/0001-21', regime: 'MEI', responsavel: 'João Souza', certidao: 'A Vencer', score: 65 },
  { id: '3', empresa: 'Consultoria Tech', cnpj: '11.222.333/0001-44', regime: 'Lucro Presumido', responsavel: 'Ana Pereira', certidao: 'Vencida', score: 40 },
  { id: '4', empresa: 'Agro Vale', cnpj: '55.444.333/0001-00', regime: 'Produtor Rural', responsavel: 'Carlos Rocha', certidao: 'Válida', score: 88 },
]

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("")

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
            <div className="flex gap-2">
              <Select defaultValue="todos">
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Regimes</SelectItem>
                  <SelectItem value="mei">MEI</SelectItem>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="ativo">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
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
                <TableHead>Saúde</TableHead>
                <TableHead>Certidão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CLIENTS.map((client) => (
                <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
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
                  <TableCell className="w-[150px]">
                    <div className="flex items-center gap-2">
                      <Progress value={client.score} className="h-2" />
                      <span className="text-xs font-bold">{client.score}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      client.certidao === 'Válida' ? 'bg-chart-1' : 
                      client.certidao === 'A Vencer' ? 'bg-chart-2' : 'bg-chart-4'
                    }>
                      {client.certidao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> Ver Ficha Completa</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Editar Dados</DropdownMenuItem>
                        <DropdownMenuItem><Activity className="mr-2 h-4 w-4" /> Score de Saúde</DropdownMenuItem>
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
    </div>
  )
}
