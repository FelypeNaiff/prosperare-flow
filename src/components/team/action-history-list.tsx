
"use client"

import { useState } from "react"
import { 
  Search, 
  FileSpreadsheet, 
  LayoutGrid, 
  Clock, 
  Monitor,
  Calendar,
  X,
  History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const MOCK_LOGS = [
  { id: 1, user: 'Felype Naiff', action: 'Criou', module: 'Clientes', details: 'Cadastrou cliente Padaria Central (CNPJ: 12.345.678/0001-90)', time: '13/03/2026 08:32', ip: '192.168.1.1', avatar: 'https://picsum.photos/seed/felype/40/40' },
  { id: 2, user: 'Marryeth Gizelle', action: 'Concluiu', module: 'Processos', details: 'Concluiu processo PGDAS Março/2026 - Empresa Tech S.A', time: '13/03/2026 09:15', ip: '192.168.1.45', avatar: 'https://picsum.photos/seed/marry/40/40' },
  { id: 3, user: 'Charles Pereira', action: 'Acessou', module: 'Clientes', details: 'Visualizou dados de acesso (cofre de senhas) da Oficina do João', time: '13/03/2026 11:00', ip: '172.16.0.12', avatar: 'https://picsum.photos/seed/charles/40/40' },
  { id: 4, user: 'Thalysson Luiz', action: 'Editou', module: 'Equipe', details: 'Alterou permissões do usuário Bruno Lima', time: '13/03/2026 14:22', ip: '192.168.1.10', avatar: 'https://picsum.photos/seed/thalysson/40/40' },
  { id: 5, user: 'Sistema', action: 'Alerta', module: 'Certidões', details: 'CND Federal da Padaria Central vence em 7 dias', time: '13/03/2026 06:00', ip: 'Localhost', avatar: '' },
  { id: 6, user: 'Felype Naiff', action: 'Login', module: 'Sistema', details: 'Acesso realizado via Google OAuth', time: '13/03/2026 07:58', ip: '192.168.1.1', avatar: 'https://picsum.photos/seed/felype/40/40' },
  { id: 7, user: 'Clara Matos', action: 'Excluiu', module: 'Documentos', details: 'Removeu arquivo Contrato_Social_V3.pdf da Tech S.A', time: '13/03/2026 15:44', ip: '189.12.44.2', avatar: 'https://picsum.photos/seed/clara/40/40' },
]

export function ActionHistoryList() {
  const [searchTerm, setSearchTerm] = useState("")

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Criou': return <Badge className="bg-[#1FA67A] text-white border-none font-bold text-[9px] uppercase">CRIOU</Badge>
      case 'Editou': return <Badge className="bg-[#2574A9] text-white border-none font-bold text-[9px] uppercase">EDITOU</Badge>
      case 'Excluiu': return <Badge className="bg-[#E74C3C] text-white border-none font-bold text-[9px] uppercase">EXCLUIU</Badge>
      case 'Acessou': return <Badge className="bg-[#98A7AA] text-white border-none font-bold text-[9px] uppercase">ACESSOU</Badge>
      case 'Concluiu': return <Badge className="bg-[#2C4156] text-white border-none font-bold text-[9px] uppercase">CONCLUIU</Badge>
      case 'Login': return <Badge className="bg-[#39586D] text-white border-none font-bold text-[9px] uppercase">LOGIN</Badge>
      case 'Alerta': return <Badge className="bg-[#F2B705] text-black border-none font-bold text-[9px] uppercase">ALERTA</Badge>
      default: return <Badge variant="outline">{action}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-[#D2D7DB]">
        <CardHeader className="pb-3 border-b bg-[#F7F7F7]/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-[#2C4156] uppercase tracking-tight flex items-center gap-2">
              <History className="h-4 w-4 text-[#1FA67A]" />
              Auditoria do Sistema
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select defaultValue="todos">
                <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-[#D2D7DB]">
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Usuários</SelectItem>
                  <SelectItem value="felype">Felype Naiff</SelectItem>
                  <SelectItem value="ana">Ana Souza</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="todos">
                <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-[#D2D7DB]">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Módulos</SelectItem>
                  <SelectItem value="clientes">Clientes</SelectItem>
                  <SelectItem value="processos">Processos</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-2 border-[#D2D7DB]">
                <Calendar className="h-3 w-3" /> Últimos 7 dias
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-2 border-[#D2D7DB] text-[#1FA67A]">
                <FileSpreadsheet className="h-3 w-3" /> Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-[#F7F7F7]/30 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input 
                placeholder="Filtrar por descrição da ação ou IP..." 
                className="pl-9 h-9 bg-white border-[#D2D7DB] focus-visible:ring-[#1FA67A]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#98A7AA]" title="Limpar filtros">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-bold uppercase text-[9px] w-[180px]">Usuário</TableHead>
                <TableHead className="text-white font-bold uppercase text-[9px] text-center w-[100px]">Ação</TableHead>
                <TableHead className="text-white font-bold uppercase text-[9px] w-[120px]">Módulo</TableHead>
                <TableHead className="text-white font-bold uppercase text-[9px]">Descrição Detalhada</TableHead>
                <TableHead className="text-white font-bold uppercase text-[9px] w-[150px]">Data e Hora</TableHead>
                <TableHead className="text-white font-bold uppercase text-[9px] w-[120px]">IP Acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LOGS.map((log) => (
                <TableRow key={log.id} className="hover:bg-[#F7F7F7] text-xs">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={log.avatar} />
                        <AvatarFallback className="bg-[#39586D] text-white text-[8px]">
                          {log.user.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-[#2C4156]">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-[#39586D] font-medium uppercase text-[10px]">
                      <LayoutGrid className="h-3 w-3 opacity-50" />
                      {log.module}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#39586D] leading-tight max-w-[400px]">
                    {log.details}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-[#98A7AA] font-bold">
                      <Clock className="h-3 w-3" />
                      {log.time}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-[#98A7AA] font-mono">
                      <Monitor className="h-3 w-3" />
                      {log.ip}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 bg-[#F7F7F7]/50 flex items-center justify-between border-t">
            <span className="text-[10px] font-bold text-[#98A7AA] uppercase">Exibindo 50 de 1.420 registros (Últimos 12 meses)</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase border-[#D2D7DB]" disabled>Anterior</Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase border-[#D2D7DB]">Próxima</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
