
"use client"

import { useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, FileText, Activity, Trash2, Edit, ShieldCheck, CreditCard, Database, Building2 } from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientCertificatesTable } from "@/components/certificates/client-certificates-table"
import { Label } from "@/components/ui/label"
import { ClientCommunicationTool } from "@/components/clients/client-communication-tool"

const MOCK_CLIENTS = [
  { id: '1', empresa: 'Padaria Central', cnpj: '12.345.678/0001-90', regime: 'Simples Nacional', responsavel: 'Maria Silva', certidao: 'Válida', score: 95, email: 'maria@padariacentral.com.br' },
  { id: '2', empresa: 'Oficina do João', cnpj: '98.765.432/0001-21', regime: 'MEI', responsavel: 'João Souza', certidao: 'A Vencer', score: 65, email: 'joao@oficina.com.br' },
  { id: '3', empresa: 'Consultoria Tech', cnpj: '11.222.333/0001-44', regime: 'Lucro Presumido', responsavel: 'Ana Pereira', certidao: 'Vencida', score: 40, email: 'ana@tech.com.br' },
  { id: '4', empresa: 'Agro Vale', cnpj: '55.444.333/0001-00', regime: 'Produtor Rural', responsavel: 'Carlos Rocha', certidao: 'Válida', score: 88, email: 'carlos@agro.com.br' },
]

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleOpenDetail = (client: any) => {
    setSelectedClient(client)
    setIsDetailOpen(true)
  }

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
                <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDetail(client)}>
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
                      client.certidao === 'Válida' ? 'bg-emerald-500' : 
                      client.certidao === 'A Vencer' ? 'bg-yellow-500 text-black' : 'bg-red-500'
                    }>
                      {client.certidao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDetail(client)}><FileText className="mr-2 h-4 w-4" /> Ver Ficha Completa</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Editar Dados</DropdownMenuItem>
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

      {/* Diálogo de Detalhes do Cliente */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-muted/30">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  {selectedClient?.empresa}
                </DialogTitle>
                <DialogDescription>
                  CNPJ: {selectedClient?.cnpj} • Regime: {selectedClient?.regime}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-4">
                <ClientCommunicationTool client={{ 
                  name: selectedClient?.empresa || '', 
                  email: selectedClient?.email || '', 
                  regime: selectedClient?.regime || '' 
                }} />
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Score de Saúde</p>
                  <p className={`text-2xl font-bold ${selectedClient?.score > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {selectedClient?.score}%
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="dados" className="flex-1 flex flex-col">
            <TabsList className="px-6 border-b bg-transparent h-12 gap-6 rounded-none">
              <TabsTrigger value="dados" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Dados Gerais</TabsTrigger>
              <TabsTrigger value="certidoes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 flex gap-2">
                <ShieldCheck className="h-4 w-4" /> Certidões (CNDs)
              </TabsTrigger>
              <TabsTrigger value="senhas" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 flex gap-2">
                <Database className="h-4 w-4" /> Banco de Dados/Senhas
              </TabsTrigger>
              <TabsTrigger value="documentos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">Documentos</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="dados" className="m-0 space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2">Informações Cadastrais</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Razão Social</Label>
                        <p className="font-medium">{selectedClient?.empresa} LTDA</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">CNPJ</Label>
                        <p className="font-medium">{selectedClient?.cnpj}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Data Abertura</Label>
                        <p className="font-medium">10/05/2015</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Telefone</Label>
                        <p className="font-medium">(96) 3222-1100</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2">Configuração Contábil</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Regime Tributário</Label>
                        <Badge variant="outline">{selectedClient?.regime}</Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Responsável Interno</Label>
                        <p className="font-medium">{selectedClient?.responsavel}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Honorário</Label>
                        <p className="font-medium">R$ 1.200,00</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Vencimento Honorário</Label>
                        <p className="font-medium">Todo dia 10</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="certidoes" className="m-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">Painel de Regularidade</h3>
                    <Button size="sm" className="bg-accent gap-2">
                      <RefreshCw className="h-4 w-4" /> Atualizar Todas
                    </Button>
                  </div>
                  <ClientCertificatesTable clientId={selectedClient?.id || ''} />
                </div>
              </TabsContent>

              <TabsContent value="senhas" className="m-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">Acessos e Senhas</h3>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" /> Novo Acesso
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { site: 'e-CAC (RFB)', user: '12.345.678/0001-90', pass: '********' },
                      { site: 'SEFAZ - AP', user: '22911002', pass: '********' },
                      { site: 'Prefeitura Macapá', user: 'macapa_cont', pass: '********' },
                      { site: 'Conectividade Social', user: 'certificado_padaria', pass: '********' },
                    ].map((acesso, i) => (
                      <Card key={i}>
                        <CardContent className="p-4 flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="font-bold text-sm">{acesso.site}</p>
                            <p className="text-xs text-muted-foreground">User: {acesso.user}</p>
                          </div>
                          <Button variant="ghost" size="sm">Copiar Senha</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
