
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
  Trash2,
  Edit2
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"

const SERVICE_OPTIONS = [
  { id: "pessoal", label: "Departamento Pessoal" },
  { id: "tributario", label: "Departamento Tributário" },
  { id: "contabil", label: "Departamento Contábil" },
  { id: "legalizacao", label: "Abertura e Legalização" },
]

export default function ContratosPage() {
  const firestore = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const contractsQuery = useMemoFirebase(() => collection(firestore, "contracts"), [firestore])
  const { data: contracts = [], isLoading } = useCollection(contractsQuery)

  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    clientId: "",
    services: [] as string[],
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    dueDay: 10,
    notes: "",
    status: "Ativo"
  })

  const stats = useMemo(() => {
    const list = contracts || []
    const active = list.filter(c => c.status === 'Ativo').length
    const revenue = list.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
    return { active, revenue }
  }, [contracts])

  const handleOpenNew = () => {
    setEditingId(null)
    setFormData({
      clientId: "",
      services: [],
      value: 0,
      startDate: new Date().toISOString().split('T')[0],
      dueDay: 10,
      notes: "",
      status: "Ativo"
    })
    setIsModalOpen(true)
  }

  const handleEdit = (contract: any) => {
    setEditingId(contract.id)
    setFormData({
      clientId: contract.clientId,
      services: contract.services || [],
      value: contract.value,
      startDate: contract.startDate,
      dueDay: contract.dueDay,
      notes: contract.notes || "",
      status: contract.status
    })
    setIsModalOpen(true)
  }

  const toggleService = (serviceLabel: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceLabel)
        ? prev.services.filter(s => s !== serviceLabel)
        : [...prev.services, serviceLabel]
    }))
  }

  const handleSaveContract = () => {
    if (!formData.clientId || !formData.value || formData.services.length === 0) {
      toast({ title: "Erro", description: "Preencha cliente, valor e ao menos um serviço.", variant: "destructive" })
      return
    }

    const client = (clients || []).find(c => c.id === formData.clientId)
    const id = editingId || Math.random().toString(36).substr(2, 9)
    const contractRef = doc(firestore, "contracts", id)
    
    const contractData = {
      ...formData,
      id,
      clientName: client?.corporateName || "Empresa não identificada",
      clientCnpj: client?.cnpj || "00.000.000/0000-00",
      clientRegime: client?.taxRegime || "Não informado",
      updatedAt: new Date().toISOString(),
      createdAt: editingId ? (contracts.find(c => c.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    }

    setDocumentNonBlocking(contractRef, contractData, { merge: true })

    // Se for novo contrato, gera o primeiro contas a receber
    if (!editingId) {
      const receivableId = Math.random().toString(36).substr(2, 9)
      const receivableRef = doc(firestore, "receivables", receivableId)
      const today = new Date()
      const vencimentoStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${formData.dueDay.toString().padStart(2, '0')}`

      const receivableData = {
        id: receivableId,
        descricao: `HONORÁRIO - ${formData.services.join(", ")}`.toUpperCase(),
        cliente: client?.corporateName || "Cliente Avulso",
        clientId: formData.clientId,
        pagamento: "PIX",
        data: vencimentoStr,
        valor: Number(formData.value),
        situacao: "Pendente",
        recorrente: true,
        tipoValue: "Fixo",
        createdAt: new Date().toISOString()
      }
      setDocumentNonBlocking(receivableRef, receivableData, { merge: true })
    }
    
    setIsModalOpen(false)
    toast({ 
      title: editingId ? "Contrato Atualizado!" : "Contrato Ativado!", 
      description: editingId ? "As alterações foram salvas." : "O contrato foi salvo e o honorário lançado." 
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Excluir permanentemente este contrato?")) {
      deleteDocumentNonBlocking(doc(firestore, "contracts", id))
      toast({ title: "Contrato removido", variant: "destructive" })
    }
  }

  const handleGeneratePDF = (contract: any) => {
    setSelectedContract(contract)
    setIsPreviewOpen(true)
  }

  const filteredContracts = (contracts || []).filter(c => 
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
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-bold shadow-lg shadow-emerald-500/20" onClick={handleOpenNew}>
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
                <TableHead className="text-white font-black uppercase text-[10px]">Serviços Contratados</TableHead>
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
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {(item.services || []).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-[8px] font-black uppercase bg-white border">
                            {s}
                          </Badge>
                        ))}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#2574A9]" onClick={() => handleEdit(item)}><Edit2 className="h-4 w-4" /></Button>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156] uppercase">
              {editingId ? "Editar Contrato" : "Novo Contrato Contábil"}
            </DialogTitle>
            <DialogDescription className="font-medium">Defina o escopo de serviços e os parâmetros de faturamento.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Empresa (Cliente)</Label>
              <Select 
                value={formData.clientId} 
                onValueChange={(v) => setFormData({...formData, clientId: v})}
                disabled={!!editingId}
              >
                <SelectTrigger className="border-[#D2D7DB]"><SelectValue placeholder="Selecione o cliente cadastrado" /></SelectTrigger>
                <SelectContent>
                  {(clients || []).map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.corporateName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-3">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Serviços Contratados (Múltipla Escolha)</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#F7F7F7] rounded-xl border">
                {SERVICE_OPTIONS.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={service.id} 
                      checked={formData.services.includes(service.label)}
                      onCheckedChange={() => toggleService(service.label)}
                    />
                    <label htmlFor={service.id} className="text-xs font-bold uppercase text-[#39586D] cursor-pointer">
                      {service.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Valor Mensal (R$)</Label>
              <Input 
                type="number" 
                placeholder="0,00" 
                className="border-[#D2D7DB]" 
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Início da Vigência</Label>
              <Input 
                type="date" 
                className="border-[#D2D7DB]" 
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Dia de Vencimento</Label>
              <Input 
                type="number" 
                min="1" 
                max="28" 
                className="border-[#D2D7DB]" 
                value={formData.dueDay}
                onChange={(e) => setFormData({...formData, dueDay: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Status do Contrato</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">ATIVO</SelectItem>
                  <SelectItem value="Suspenso">SUSPENSO</SelectItem>
                  <SelectItem value="Cancelado">CANCELADO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-xs font-black text-[#98A7AA] uppercase">Observações Internas</Label>
              <Textarea 
                placeholder="Detalhes sobre fidelidade, bonificações, etc..." 
                className="border-[#D2D7DB]" 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-bold px-8" onClick={handleSaveContract}>
              <Save className="h-4 w-4 mr-2" /> {editingId ? "Salvar Alterações" : "Ativar Contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F7F7F7] p-0 border-none">
          <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10 no-print">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-xl font-black text-[#2C4156]">Visualização do Contrato</DialogTitle>
                <DialogDescription className="text-xs font-bold text-[#98A7AA]">Ref: {selectedContract?.id?.toUpperCase()}</DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Fechar</Button>
                <Button className="bg-[#1FA67A] gap-2 font-bold" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Imprimir / PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-16 bg-white shadow-xl mx-auto my-8 w-full min-h-[297mm] text-[#2C4156] text-[12px] leading-relaxed font-serif border print-container">
            {/* Header Timbrado */}
            <div className="flex justify-between items-start mb-12 border-b-2 border-[#003366] pb-8">
              <div className="flex items-start gap-4">
                <div className="border-2 border-[#003366] p-2 w-16 h-16 flex flex-col items-center justify-center leading-none">
                  <span className="text-3xl font-serif italic text-[#003366]">P</span>
                  <span className="text-[10px] font-bold text-[#003366] -mt-1">sc</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-serif italic text-[#003366] tracking-tighter">Prosperare</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#98A7AA]">Serviços Contábeis</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-[#98A7AA]">Contrato de Prestação de Serviços</p>
                <p className="text-[9px] font-bold">Nº {selectedContract?.id?.substr(0,8).toUpperCase()}</p>
              </div>
            </div>

            <div className="text-center space-y-4 mb-12">
              <h2 className="text-xl font-black uppercase underline underline-offset-8">INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS</h2>
            </div>
            
            <div className="space-y-8 text-justify">
              <section className="space-y-3">
                <h3 className="font-black text-[11px] uppercase text-[#003366] border-b">1. DAS PARTES</h3>
                <p><strong>CONTRATADA:</strong> PROSPERARE FLOW SERVIÇOS CONTÁBEIS LTDA, inscrita no CNPJ sob o nº 12.345.678/0001-90, com sede administrativa em Macapá - AP.</p>
                <p><strong>CONTRATANTE:</strong> {selectedContract?.clientName?.toUpperCase()}, inscrita no CNPJ sob o nº {selectedContract?.clientCnpj}, com sede no endereço cadastrado em nossa base de dados.</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-black text-[11px] uppercase text-[#003366] border-b">2. DO OBJETO</h3>
                <p>O presente instrumento tem por objeto a prestação de serviços especializados abrangendo as seguintes áreas:</p>
                <ul className="list-disc pl-8 space-y-1 font-bold">
                  {(selectedContract?.services || []).map((s: string) => (
                    <li key={s}>{s.toUpperCase()}</li>
                  ))}
                </ul>
                <p>Os serviços serão executados em conformidade com o regime tributário <strong>{selectedContract?.clientRegime}</strong> da CONTRATANTE.</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-black text-[11px] uppercase text-[#003366] border-b">3. DOS HONORÁRIOS</h3>
                <p>Pelos serviços ora contratados, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>R$ {Number(selectedContract?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.</p>
                <p>O vencimento ocorrerá impreterivelmente todo <strong>dia {selectedContract?.dueDay}</strong> de cada mês subsequente ao serviço prestado, através de boleto bancário ou PIX.</p>
              </section>

              <section className="space-y-3">
                <h3 className="font-black text-[11px] uppercase text-[#003366] border-b">4. DA VIGÊNCIA</h3>
                <p>Este contrato inicia seus efeitos em <strong>{selectedContract?.startDate ? new Date(selectedContract.startDate).toLocaleDateString('pt-BR') : '--'}</strong>, com prazo de validade indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.</p>
              </section>
            </div>

            <div className="mt-32 flex justify-between gap-16 px-12">
              <div className="flex-1 text-center space-y-2">
                <div className="border-t-2 border-[#2C4156] pt-2 font-black text-[10px]">PROSPERARE FLOW</div>
                <p className="text-[8px] font-bold text-[#98A7AA] uppercase">CONTRATADA</p>
              </div>
              <div className="flex-1 text-center space-y-2">
                <div className="border-t-2 border-[#2C4156] pt-2 font-black text-[10px]">{selectedContract?.clientName}</div>
                <p className="text-[8px] font-bold text-[#98A7AA] uppercase">CONTRATANTE</p>
              </div>
            </div>

            {/* Footer Timbrado */}
            <div className="mt-auto pt-12">
              <div className="bg-[#003366] p-4 flex justify-between items-center text-white text-[9px] font-bold rounded-sm">
                <span className="uppercase">PROSPERARE SERVIÇOS CONTÁBEIS LTDA</span>
                <span className="font-normal italic">Emitido via Prosperare Flow em {new Date().toLocaleDateString('pt-BR')}</span>
              </div>
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
