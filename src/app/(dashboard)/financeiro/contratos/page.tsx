"use client"

import { useState, useMemo } from "react"
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
  AlertTriangle,
  Loader2,
  Save,
  Trash2
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
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"

export default function ContratosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Query de contratos reais
  const contractsQuery = useMemoFirebase(() => collection(firestore, "contracts"), [firestore])
  const { data: contracts = [], isLoading } = useCollection(contractsQuery)

  // Query de clientes para o seletor
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const [newContract, setNewContract] = useState({
    clientId: "",
    serviceType: "Contabilidade Geral",
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    dueDay: 10,
    notes: "",
    status: "Ativo"
  })

  const stats = useMemo(() => {
    const active = contracts.filter(c => c.status === 'Ativo').length
    const revenue = contracts.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
    return { active, revenue }
  }, [contracts])

  const handleCreateContract = () => {
    if (!newContract.clientId || !newContract.value) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    const client = clients.find(c => c.id === newContract.clientId)
    const id = Math.random().toString(36).substr(2, 9)
    const contractRef = doc(firestore, "contracts", id)
    
    const contractData = {
      ...newContract,
      id,
      clientName: client?.corporateName || "Empresa não identificada",
      clientCnpj: client?.cnpj || "00.000.000/0000-00",
      clientRegime: client?.taxRegime || "Não informado",
      createdAt: new Date().toISOString()
    }

    setDocumentNonBlocking(contractRef, contractData, { merge: true })
    
    setIsNewModalOpen(false)
    setNewContract({
      clientId: "",
      serviceType: "Contabilidade Geral",
      value: 0,
      startDate: new Date().toISOString().split('T')[0],
      dueDay: 10,
      notes: "",
      status: "Ativo"
    })
    toast({ title: "Contrato Ativado!", description: "O registro foi salvo no banco de dados." })
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "contracts", id))
    toast({ title: "Contrato removido", variant: "destructive" })
  }

  const handleGeneratePDF = (contract: any) => {
    setSelectedContract(contract)
    setIsPreviewOpen(true)
  }

  const filteredContracts = contracts.filter(c => 
    c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.clientCnpj?.includes(searchTerm)
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Gestão de Contratos</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Controle jurídico e faturamento recorrente.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold shadow-lg shadow-emerald-500/20" onClick={() => setIsNewModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Contratos Ativos" value={stats.active} icon={FileText} color="#2C4156" />
        <MetricCard label="Receita Recorrente" value={`R$ ${stats.revenue.toLocaleString('pt-BR')}`} icon={FileCheck} color="#1FA67A" />
        <MetricCard label="A Renovar (30d)" value="0" icon={History} color="#F2B705" />
        <MetricCard label="Suspensos" value="0" icon={AlertTriangle} color="#E74C3C" />
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Contratos Vigentes</CardTitle>
            <CardDescription className="text-xs font-bold text-[#98A7AA]">Listagem completa de honorários recorrentes.</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
            <Input 
              placeholder="Buscar empresa..." 
              className="pl-9 h-9 w-[250px] bg-white border-[#D2D7DB]" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1FA67A]" />
                  </TableCell>
                </TableRow>
              ) : filteredContracts.length > 0 ? (
                filteredContracts.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F7F7F7]/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2C4156]">{item.clientName}</span>
                        <span className="text-[10px] text-[#98A7AA] font-mono">{item.clientCnpj}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-[#39586D]">{item.serviceType}</span>
                        <Badge variant="outline" className="w-fit text-[8px] font-black uppercase border-[#D2D7DB]">{item.clientRegime}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-[#39586D]">{item.startDate}</TableCell>
                    <TableCell className="text-right font-black text-[#1FA67A]">R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase border-none",
                        item.status === 'Ativo' ? 'bg-[#7ED6B5] text-[#1FA67A]' : 'bg-[#F3F4F6] text-[#98A7AA]'
                      )}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#2C4156]" onClick={() => handleGeneratePDF(item)}><Printer className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA] font-bold">
                    Nenhum contrato localizado no banco de dados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Novo Contrato */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Novo Contrato Contábil</DialogTitle>
            <DialogDescription className="font-medium">Vincule um cliente da base para gerar a recorrência.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Empresa (Cliente)</Label>
              <Select value={newContract.clientId} onValueChange={(v) => setNewContract({...newContract, clientId: v})}>
                <SelectTrigger className="border-[#D2D7DB]"><SelectValue placeholder="Selecione o cliente cadastrado" /></SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.corporateName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Tipo de Serviço</Label>
              <Select value={newContract.serviceType} onValueChange={(v) => setNewContract({...newContract, serviceType: v})}>
                <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contabilidade Geral">Contabilidade Geral</SelectItem>
                  <SelectItem value="Abertura de Empresa">Abertura de Empresa</SelectItem>
                  <SelectItem value="Consultoria Tributária">Consultoria Tributária</SelectItem>
                  <SelectItem value="Departamento Pessoal">Departamento Pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Valor Mensal (R$)</Label>
              <Input 
                type="number" 
                placeholder="0,00" 
                className="border-[#D2D7DB]" 
                value={newContract.value}
                onChange={(e) => setNewContract({...newContract, value: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Data de Início</Label>
              <Input 
                type="date" 
                className="border-[#D2D7DB]" 
                value={newContract.startDate}
                onChange={(e) => setNewContract({...newContract, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Dia de Vencimento</Label>
              <Input 
                type="number" 
                min="1" 
                max="28" 
                className="border-[#D2D7DB]" 
                value={newContract.dueDay}
                onChange={(e) => setNewContract({...newContract, dueDay: Number(e.target.value)})}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Observações / Escopo</Label>
              <Textarea 
                placeholder="Descreva clausulas específicas..." 
                className="border-[#D2D7DB]" 
                value={newContract.notes}
                onChange={(e) => setNewContract({...newContract, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
            <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-bold px-8" onClick={handleCreateContract}>
              <Save className="h-4 w-4 mr-2" /> Salvar e Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <p className="text-[10px] font-black text-[#98A7AA]">REF: PROCESSO JURÍDICO Nº 2024/{selectedContract?.id?.substr(0,4).toUpperCase()}</p>
            </div>
            
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="font-black text-xs uppercase text-[#1FA67A]">1. DAS PARTES</h3>
                <p><strong>CONTRATADA:</strong> PROSPERARE FLOW SOLUÇÕES CONTÁBEIS LTDA, inscrita no CNPJ sob o nº 12.345.678/0001-90, com sede administrativa em Macapá - AP.</p>
                <p><strong>CONTRATANTE:</strong> {selectedContract?.clientName?.toUpperCase()}, inscrita no CNPJ sob o nº {selectedContract?.clientCnpj}, sediada em Macapá - AP.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-xs uppercase text-[#1FA67A]">2. DO OBJETO</h3>
                <p>O presente instrumento tem por objeto a prestação de serviços especializados de <strong>{selectedContract?.serviceType}</strong>, abrangendo a escrituração fiscal, contábil e todas as obrigações acessórias inerentes ao regime tributário do <strong>{selectedContract?.clientRegime}</strong>.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-xs uppercase text-[#1FA67A]">3. DOS HONORÁRIOS</h3>
                <p>Pelos serviços ora contratados, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>R$ {Number(selectedContract?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, com vencimento impreterível todo dia {selectedContract?.dueDay} de cada mês subsequente ao serviço prestado.</p>
              </section>

              <section className="space-y-2">
                <h3 className="font-black text-xs uppercase text-[#1FA67A]">4. DA VIGÊNCIA</h3>
                <p>Este contrato inicia seus efeitos em <strong>{selectedContract?.startDate}</strong>, com prazo de validade indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.</p>
              </section>
            </div>

            <div className="mt-32 flex justify-between gap-16 px-12">
              <div className="flex-1 text-center space-y-2">
                <div className="border-t-2 border-[#2C4156] pt-2 font-black text-xs">PROSPERARE FLOW</div>
                <p className="text-[9px] font-bold text-[#98A7AA] uppercase">CONTRATADA</p>
              </div>
              <div className="flex-1 text-center space-y-2">
                <div className="border-t-2 border-[#2C4156] pt-2 font-black text-xs">{selectedContract?.clientName}</div>
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