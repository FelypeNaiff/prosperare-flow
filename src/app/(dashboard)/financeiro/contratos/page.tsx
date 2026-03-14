
"use client"

import { useState } from "react"
import { 
  Plus, 
  FileText, 
  Search, 
  Download, 
  MoreHorizontal,
  FileCheck,
  TrendingUp,
  Printer,
  History,
  CheckCircle2,
  AlertTriangle
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
import { cn } from "@/lib/utils"

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
      title: "Contrato Gerado!",
      description: "Visualização pronta para impressão."
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão de Contratos</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Controle jurídico e faturamento recorrente.</p>
        </div>
        <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold shadow-lg shadow-emerald-500/20">
              <Plus className="h-4 w-4" /> Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-[#2C4156]">Novo Contrato Contábil</DialogTitle>
              <DialogDescription className="font-medium">O sistema usará os dados do seu escritório cadastrados em Configurações para preencher o documento.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-black text-[#98A7AA] uppercase">Empresa (Cliente)</Label>
                <Select>
                  <SelectTrigger className="border-[#D2D7DB]"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Padaria Central Ltda</SelectItem>
                    <SelectItem value="2">Oficina do João ME</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-[#98A7AA] uppercase">Tipo de Serviço</Label>
                <Select>
                  <SelectTrigger className="border-[#D2D7DB]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Contabilidade Geral</SelectItem>
                    <SelectItem value="abertura">Abertura de Empresa</SelectItem>
                    <SelectItem value="consultoria">Consultoria Tributária</SelectItem>
                    <SelectItem value="dp">Departamento Pessoal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-[#98A7AA] uppercase">Valor Mensal (R$)</Label>
                <Input type="number" placeholder="0,00" className="border-[#D2D7DB]" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-[#98A7AA] uppercase">Data de Início</Label>
                <Input type="date" className="border-[#D2D7DB]" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-[#98A7AA] uppercase">Dia de Vencimento</Label>
                <Input type="number" min="1" max="31" placeholder="Ex: 10" className="border-[#D2D7DB]" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-black text-[#98A7AA] uppercase">Observações / Escopo</Label>
                <Textarea placeholder="Descreva clausulas específicas..." className="border-[#D2D7DB]" />
              </div>
            </div>
            <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
              <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
              <Button className="bg-[#1FA67A] font-bold px-8" onClick={() => {
                setIsNewModalOpen(false)
                toast({ title: "Contrato Criado", description: "O novo registro já está disponível na listagem." })
              }}>Salvar e Gerar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Contratos Ativos" value="38" icon={FileText} color="#2C4156" />
        <MetricCard label="Receita Recorrente" value="R$ 42.500" icon={FileCheck} color="#1FA67A" />
        <MetricCard label="A Renovar (30d)" value="4" icon={History} color="#F2B705" />
        <MetricCard label="Suspensos" value="2" icon={AlertTriangle} color="#E74C3C" />
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Contratos Vigentes</CardTitle>
            <CardDescription className="text-xs font-bold text-[#98A7AA]">Listagem completa de honorários recorrentes.</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input placeholder="Buscar empresa..." className="pl-9 h-9 w-[250px] bg-white border-[#D2D7DB]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px]">Empresa / CNPJ</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Serviço / Regime</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Início</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Honorário</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-center">Status</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CONTRATOS.map((item) => (
                <TableRow key={item.id} className="hover:bg-[#F7F7F7]/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-[#2C4156]">{item.empresa}</span>
                      <span className="text-[10px] text-[#98A7AA] font-mono">{item.cnpj}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-[#39586D]">{item.tipo}</span>
                      <Badge variant="outline" className="w-fit text-[8px] font-black uppercase border-[#D2D7DB]">{item.regime}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-[#39586D]">{item.inicio}</TableCell>
                  <TableCell className="text-right font-black text-[#1FA67A]">R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "text-[9px] font-black uppercase border-none",
                      item.status === 'Ativo' ? 'bg-[#7ED6B5] text-[#1FA67A]' : 'bg-[#F3F4F6] text-[#98A7AA]'
                    )}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#2C4156]" onClick={() => handleGeneratePDF(item)} title="Visualizar Contrato"><Printer className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]"><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Preview do Contrato */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F7F7F7] p-0">
          <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-xl font-black text-[#2C4156]">Visualização do Contrato</DialogTitle>
                <DialogDescription className="text-xs font-bold text-[#98A7AA]">Documento gerado em {new Date().toLocaleDateString('pt-BR')}</DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Fechar</Button>
                <Button className="bg-[#1FA67A] gap-2 font-bold"><Download className="h-4 w-4" /> Baixar PDF</Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-12 bg-white shadow-lg mx-auto my-8 w-[210mm] min-h-[297mm] text-[#2C4156] text-sm leading-relaxed font-body">
            <div className="flex justify-center mb-12 border-b pb-8">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-10 h-10 text-[#1FA67A]" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter">PROSPERARE <span className="text-[#1FA67A]">FLOW</span></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#98A7AA]">Soluções Contábeis</span>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4 mb-12">
              <h2 className="text-2xl font-black uppercase underline decoration-[#1FA67A] decoration-4 underline-offset-8">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
              <p className="text-[10px] font-black text-[#98A7AA]">REF: PROCESSO JURÍDICO Nº 2024/{selectedContract?.id?.padStart(4, '0')}</p>
            </div>
            
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="font-black text-xs uppercase text-[#1FA67A]">1. DAS PARTES</h3>
                <p><strong>CONTRATADA:</strong> PROSPERARE FLOW SOLUÇÕES CONTÁBEIS LTDA, inscrita no CNPJ sob o nº 12.345.678/0001-90, com sede administrativa em Macapá - AP.</p>
                <p><strong>CONTRATANTE:</strong> {selectedContract?.empresa?.toUpperCase()}, inscrita no CNPJ sob o nº {selectedContract?.cnpj}, sediada em Macapá - AP.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-xs uppercase text-[#1FA67A]">2. DO OBJETO</h3>
                <p>O presente instrumento tem por objeto a prestação de serviços especializados de <strong>{selectedContract?.tipo}</strong>, abrangendo a escrituração fiscal, contábil e todas as obrigações acessórias inerentes ao regime tributário do <strong>{selectedContract?.regime}</strong>.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-xs uppercase text-[#1FA67A]">3. DOS HONORÁRIOS</h3>
                <p>Pelos serviços ora contratados, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>R$ {selectedContract?.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, com vencimento impreterível todo dia 10 de cada mês subsequente ao serviço prestado.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-xs uppercase text-[#1FA67A]">4. DA VIGÊNCIA</h3>
                <p>Este contrato inicia seus efeitos em <strong>{selectedContract?.inicio}</strong>, com prazo de validade indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.</p>
              </section>
            </div>

            <div className="mt-32 flex justify-between gap-16 px-12">
              <div className="flex-1 text-center space-y-2">
                <div className="border-t-2 border-[#2C4156] pt-2 font-black text-xs">PROSPERARE FLOW</div>
                <p className="text-[9px] font-bold text-[#98A7AA] uppercase">CONTRATADA</p>
              </div>
              <div className="flex-1 text-center space-y-2">
                <div className="border-t-2 border-[#2C4156] pt-2 font-black text-xs">{selectedContract?.empresa}</div>
                <p className="text-[9px] font-bold text-[#98A7AA] uppercase">CONTRATANTE</p>
              </div>
            </div>

            <div className="text-center mt-20">
              <p className="text-xs font-bold text-[#98A7AA]">Macapá - AP, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-[#D2D7DB] hover:border-[#1FA67A] transition-colors group">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl group-hover:bg-[#F7F7F7] transition-colors" style={{ color }}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest leading-none mb-1">{label}</p>
          <p className="text-xl font-black text-[#2C4156]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
