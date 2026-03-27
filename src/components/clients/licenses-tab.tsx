"use client"

import { useState } from "react"
import { 
  Plus, 
  FlameKindling, 
  ShieldAlert, 
  CheckCircle2, 
  FileSearch,
  Loader2,
  Trash2,
  AlertTriangle,
  XCircle,
  PlayCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  useDoc
} from "@/firebase"
import { collection, query, where, doc, getDocs } from "firebase/firestore"
import { format, parseISO, differenceInDays, isBefore, isValid } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LicensesTabProps {
  clientId: string;
}

export function LicensesTab({ clientId }: LicensesTabProps) {
  const firestore = useFirestore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    id: "",
    clienteId: clientId,
    tipo: "Alvará de Funcionamento",
    numero: "",
    orgaoEmissor: "Prefeitura",
    dataEmissao: "",
    validade: "",
    status: "ATIVO",
    observacoes: ""
  })

  const clientRef = useMemoFirebase(() => doc(firestore, "clients", clientId), [firestore, clientId])
  const { data: client } = useDoc(clientRef)

  const alvarasQuery = useMemoFirebase(() => 
    query(collection(firestore, "alvaras"), where("clienteId", "==", clientId)),
    [firestore, clientId]
  )
  const { data: alvaras = [], isLoading } = useCollection(alvarasQuery)

  const handleSave = async () => {
    if (!formData.tipo) {
      toast({ variant: "destructive", title: "Erro", description: "O tipo de documento é obrigatório." })
      return
    }

    setIsSaving(true)
    const id = formData.id || Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "alvaras", id)
    
    const payload = {
      ...formData,
      id,
      clienteId: clientId,
      createdAt: formData.id ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      await setDocumentNonBlocking(docRef, payload, { merge: true })
      setIsModalOpen(false)
      setFormData({
        id: "",
        clienteId: clientId,
        tipo: "Alvará de Funcionamento",
        numero: "",
        orgaoEmissor: "Prefeitura",
        dataEmissao: "",
        validade: "",
        status: "ATIVO",
        observacoes: ""
      })
      toast({ title: "Registrado!", description: "O registro global foi atualizado." })
    } catch (err) {
      toast({ title: "Erro", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateRenewalProcess = async (alvara: any) => {
    if (!client) return

    const processesQuery = query(
      collection(firestore, "processes"),
      where("clienteId", "==", clientId),
      where("nomeProcesso", "==", `RENOVAÇÃO: ${alvara.tipo.toUpperCase()}`),
      where("situacao", "!=", "concluido")
    )
    
    const existing = await getDocs(processesQuery)
    if (!existing.empty) {
      toast({ title: "Processo já existe", description: "Já existe uma renovação em andamento no fluxo." })
      return
    }

    const processId = Math.random().toString(36).substr(2, 9)
    const processRef = doc(firestore, "processes", processId)

    const processData = {
      id: processId,
      clienteId: clientId,
      nomeProcesso: `RENOVAÇÃO: ${alvara.tipo.toUpperCase()}`,
      situacao: "a_fazer",
      departamento: "Legal",
      responsavelId: "Geral",
      prazo: alvara.validade,
      competencia: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
      licenseId: alvara.id,
      descricao: `Processo aberto automaticamente: Vencimento do ${alvara.tipo} em ${alvara.validade ? format(new Date(alvara.validade), 'dd/MM/yyyy') : 'data indefinida'}.`
    }

    setDocumentNonBlocking(processRef, processData, { merge: true })
    toast({ 
      title: "Processo Aberto!", 
      description: "A tarefa de renovação foi enviada para o Legal." 
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Excluir este alvará da base global?")) {
      deleteDocumentNonBlocking(doc(firestore, "alvaras", id))
      toast({ title: "Removido", variant: "destructive" })
    }
  }

  const getStatusInfo = (validade: string, statusText: string) => {
    if (statusText === 'CASSADO') {
      return { label: 'CASSADO', color: 'text-[#E74C3C]', bg: 'bg-[#FEE2E2]/50', border: 'border-[#E74C3C]/20', icon: XCircle, days: 0, critical: true }
    }
    
    if (!validade) {
       return { label: statusText.replace('_', ' '), color: 'text-[#1FA67A]', bg: 'bg-[#7ED6B5]/10', border: 'border-[#1FA67A]/20', icon: CheckCircle2, days: 0 }
    }
    
    const today = new Date()
    const expiry = new Date(validade)
    if (!isValid(expiry)) return { label: 'Erro', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', icon: AlertTriangle, days: 0 }

    const daysLeft = differenceInDays(expiry, today)

    if (isBefore(expiry, today) || statusText === 'VENCIDO') {
      return { label: 'VENCIDO', color: 'text-[#E74C3C]', bg: 'bg-[#FEE2E2]/50', border: 'border-[#E74C3C]/20', icon: XCircle, days: daysLeft }
    }
    
    if (daysLeft <= 45) {
      return { label: 'RENOVAÇÃO NECESSÁRIA', color: 'text-[#F2B705]', bg: 'bg-[#FEF3C7]/50', border: 'border-[#F2B705]/20', icon: ShieldAlert, days: daysLeft, critical: true }
    }

    return { label: 'REGULAR', color: 'text-[#1FA67A]', bg: 'bg-[#7ED6B5]/10', border: 'border-[#1FA67A]/20', icon: CheckCircle2, days: daysLeft }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2C4156]/5 rounded-lg text-[#2C4156]">
            <FlameKindling className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-[#2C4156] uppercase text-sm tracking-widest">Alvarás e Licenças Operacionais</h3>
            <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Monitoramento da base global vinculado a este cliente.</p>
          </div>
        </div>
        <Button size="sm" className="bg-[#1FA67A] gap-2 font-bold shadow-lg uppercase text-[10px]" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Registrar Alvará
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" /></div>
        ) : (alvaras || []).length > 0 ? (
          (alvaras || []).map((alvara: any) => {
            const status = getStatusInfo(alvara.validade, alvara.status)
            return (
              <Card key={alvara.id} className={cn("border-2 shadow-sm transition-all overflow-hidden bg-white", status.border)}>
                <div className={cn("h-1.5 w-full", status.color.replace('text', 'bg'))} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[8px] font-black uppercase border-[#D2D7DB] text-[#39586D]">
                      {alvara.orgaoEmissor || 'ORGÃO'}
                    </Badge>
                    <Badge className={cn("text-[8px] font-black uppercase border-none px-2", status.bg, status.color)}>
                      {alvara.status === 'EM_RENOVACAO' ? 'EM RENOVAÇÃO' : status.label}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-black text-[#2C4156] mt-3 uppercase tracking-tight">
                    {alvara.tipo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-[#98A7AA] uppercase tracking-widest">Registro</p>
                      <p className="text-xs font-mono font-bold text-[#39586D]">{alvara.numero || '---'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-[#98A7AA] uppercase tracking-widest">Vencimento</p>
                      <p className={cn("text-xs font-black", status.color)}>
                        {alvara.validade && isValid(new Date(alvara.validade)) ? format(new Date(alvara.validade), 'dd/MM/yyyy') : '---'}
                      </p>
                    </div>
                  </div>

                  {status.critical && alvara.status !== 'EM_RENOVACAO' && (
                    <div className={cn("p-3 rounded-xl flex items-center justify-between border", status.bg, status.border)}>
                      <div className="flex items-center gap-2">
                        <status.icon className={cn("h-4 w-4", status.color)} />
                        <span className={cn("text-[10px] font-black uppercase", status.color)}>
                          {status.days < 0 ? 'Expirado há' : 'Expira em'} {Math.abs(status.days)} dias
                        </span>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-[#F2B705] hover:bg-[#F2B705]/10 animate-pulse" 
                        title="Abrir Processo de Renovação"
                        onClick={() => handleCreateRenewalProcess(alvara)}
                      >
                        <PlayCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] hover:bg-red-50" onClick={() => handleDelete(alvara.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-16 text-center border-2 border-dashed rounded-[2rem] bg-slate-50/50">
            <FlameKindling className="h-12 w-12 text-[#D2D7DB] mx-auto mb-4" />
            <h4 className="text-sm font-black text-[#2C4156] uppercase">Sem Alvarás na Base Global</h4>
            <p className="text-xs text-[#98A7AA] font-bold mt-1">Nenhum licenciamento localizado para esta empresa.</p>
            <Button className="mt-6 bg-[#1FA67A] font-bold uppercase text-[10px] shadow-lg" onClick={() => setIsModalOpen(true)}>Vincular Novo Alvará</Button>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md border-none shadow-2xl p-0">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Novo Alvará / Licença</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-white/60 uppercase">Registrando no controle global.</DialogDescription>
          </DialogHeader>
          <div className="p-6 grid gap-4 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Tipo do Documento</Label>
              <Input placeholder="Ex: Alvará de Funcionamento" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value.toUpperCase()})} className="border-[#D2D7DB] font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Órgão Emissor</Label>
                <Input placeholder="Corpo de Bombeiros" value={formData.orgaoEmissor} onChange={(e) => setFormData({...formData, orgaoEmissor: e.target.value.toUpperCase()})} className="border-[#D2D7DB]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Nº Registro</Label>
                <Input placeholder="000.000" value={formData.numero} onChange={(e) => setFormData({...formData, numero: e.target.value})} className="border-[#D2D7DB]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Emissão</Label>
                <Input type="date" value={formData.dataEmissao} onChange={(e) => setFormData({...formData, dataEmissao: e.target.value})} className="border-[#D2D7DB]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#1FA67A]">Validade</Label>
                <Input type="date" value={formData.validade} onChange={(e) => setFormData({...formData, validade: e.target.value})} className="border-[#1FA67A] focus-visible:ring-[#1FA67A] font-black" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Situação Atual</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="border-[#D2D7DB] font-bold uppercase text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO" className="uppercase text-[10px] font-bold text-[#1FA67A]">Ativo / Regular</SelectItem>
                  <SelectItem value="EM_RENOVACAO" className="uppercase text-[10px] font-bold text-[#F39C12]">Em Renovação</SelectItem>
                  <SelectItem value="VENCIDO" className="uppercase text-[10px] font-bold text-[#E74C3C]">Vencido</SelectItem>
                  <SelectItem value="CASSADO" className="uppercase text-[10px] font-bold">Cassado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] p-6 border-t flex justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-[10px] text-[#98A7AA]">Cancelar</Button>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-[10px] px-8 shadow-lg shadow-emerald-500/20" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar na Base Global
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
