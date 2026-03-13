"use client"

import { useState } from "react"
import { 
  Plus, 
  FileText, 
  Search, 
  Eye, 
  Download, 
  RefreshCw, 
  MoreHorizontal,
  FileCheck,
  Building2,
  Calendar,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

const MOCK_CONTRATOS = [
  { id: '1', empresa: 'Padaria Central Ltda', cnpj: '12.345.678/0001-90', tipo: 'Contabilidade Geral', regime: 'Simples Nacional', inicio: '01/01/2024', valor: 1250.00, status: 'Ativo' },
  { id: '2', empresa: 'Oficina do João ME', cnpj: '98.765.432/0001-21', tipo: 'Consultoria Tributária', regime: 'MEI', inicio: '15/03/2024', valor: 450.00, status: 'Ativo' },
  { id: '3', empresa: 'Tech Solutions S.A', cnpj: '11.222.333/0001-44', tipo: 'Departamento Pessoal', regime: 'Lucro Presumido', inicio: '01/02/2024', valor: 2800.00, status: 'Suspenso' },
]

export default function ContratosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleGeneratePDF = (contract: any) => {
    setSelectedContract(contract)
    setIsPreviewOpen(true)
    toast({
      title: "PDF Gerado",
      description: "O contrato foi gerado com sucesso para visualização."
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Gestão de Contratos</h1>
          <p className="text-muted-foreground">Controle de prestação de serviços e honorários fixos.</p>
        </div>
        <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-secondary gap-2"><Plus className="h-4 w-4" /> Novo Contrato</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Contrato de Prestação de Serviços</DialogTitle>
              <DialogDescription>Preencha os dados para gerar o documento jurídico e o faturamento.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label>Empresa (Cliente)</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Padaria Central Ltda</SelectItem>
                    <SelectItem value="2">Oficina do João ME</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Tipo de serviço" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Contabilidade Geral</SelectItem>
                    <SelectItem value="abertura">Abertura de Empresa</SelectItem>
                    <SelectItem value="consultoria">Consultoria Tributária</SelectItem>
                    <SelectItem value="dp">Departamento Pessoal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor Mensal (R$)</Label>
                <Input type="number" placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Vigência</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                    <SelectItem value="indeterminado">Indeterminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dia de Vencimento</Label>
                <Input type="number" min="1" max="31" placeholder="Ex: 10" />
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações / Escopo dos Serviços</Label>
                <Textarea placeholder="Descreva os serviços incluídos..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => {
                setIsNewModalOpen(false)
                toast({ title: "Contrato Criado", description: "O novo contrato foi cadastrado no sistema." })
              }}>Salvar e Gerar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full"><FileText className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Ativos</p>
              <p className="text-2xl font-bold">38</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-full"><FileCheck className="h-6 w-6 text-emerald-600" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Receita Recorrente</p>
              <p className="text-2xl font-bold">R$ 42.500</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Contratos de Prestação de Serviços</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por empresa..." className="pl-9 h-9 w-[250px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Empresa / CNPJ</TableHead>
                <TableHead>Tipo de Contrato</TableHead>
                <TableHead>Início</TableHead>
                <TableHead className="text-right">Valor Mensal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CONTRATOS.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{item.empresa}</span>
                      <span className="text-xs text-muted-foreground">{item.cnpj}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{item.tipo}</span>
                      <Badge variant="outline" className="w-fit text-[10px]">{item.regime}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{item.inicio}</TableCell>
                  <TableCell className="text-right font-bold">R$ {item.valor.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={item.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-400'}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleGeneratePDF(item)} title="Gerar PDF"><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Editar"><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Preview do PDF */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50">
          <DialogHeader className="bg-white p-4 border-b rounded-t-lg">
            <DialogTitle>Visualização do Contrato</DialogTitle>
          </DialogHeader>
          <div className="p-12 bg-white shadow-lg mx-auto w-full min-h-[800px] text-slate-800 text-sm leading-relaxed space-y-6">
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-8 h-8" />
                <span className="text-xl font-bold uppercase tracking-tighter">Prosperare Flow</span>
              </div>
            </div>
            <div className="text-center space-y-2 border-b pb-6">
              <h2 className="text-xl font-bold uppercase">CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS</h2>
              <p className="text-xs text-muted-foreground">REF: CONTRATO Nº 2024/{selectedContract?.id?.padStart(4, '0')}</p>
            </div>
            
            <div className="space-y-4">
              <p><strong>CONTRATADA:</strong> PROSPERARE FLOW SOLUÇÕES CONTÁBEIS LTDA, inscrita no CNPJ sob o nº 12.345.678/0001-90, com sede em Macapá - AP.</p>
              <p><strong>CONTRATANTE:</strong> {selectedContract?.empresa?.toUpperCase()}, inscrita no CNPJ sob o nº {selectedContract?.cnpj}, sediada em Macapá - AP.</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold border-b pb-1">CLÁUSULA PRIMEIRA - DO OBJETO</h3>
              <p>O presente contrato tem por objeto a prestação de serviços de <strong>{selectedContract?.tipo}</strong>, abrangendo a escrituração fiscal, contábil e obrigações acessórias inerentes ao regime do <strong>{selectedContract?.regime}</strong>.</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold border-b pb-1">CLÁUSULA SEGUNDA - DOS HONORÁRIOS</h3>
              <p>Pelos serviços ora contratados, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>R$ {selectedContract?.valor?.toFixed(2)}</strong>, com vencimento todo dia 10 de cada mês.</p>
            </div>

            <div className="pt-20 flex justify-between gap-12">
              <div className="flex-1 text-center space-y-1">
                <div className="border-t border-slate-400 pt-1">PROSPERARE FLOW</div>
                <p className="text-xs">Contratada</p>
              </div>
              <div className="flex-1 text-center space-y-1">
                <div className="border-t border-slate-400 pt-1">{selectedContract?.empresa}</div>
                <p className="text-xs">Contratante</p>
              </div>
            </div>

            <div className="text-center pt-8">
              <p>Macapá - AP, {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <DialogFooter className="bg-white p-4 border-t rounded-b-lg">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Fechar</Button>
            <Button className="bg-primary gap-2"><Download className="h-4 w-4" /> Baixar PDF Final</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
