"use client"

import { useState } from "react"
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
import { 
  PlusCircle, 
  FileSearch, 
  Loader2,
  Trash2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { format, parseISO, isBefore, isValid } from "date-fns"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking
} from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export function ClientCertificatesTable({ clientId }: { clientId: string }) {
  const firestore = useFirestore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    id: "",
    clienteId: clientId,
    tipo: "Federal",
    emissao: "",
    validade: "",
    numero: "",
    codigoAutenticacao: "",
    status: "REGULAR",
    observacoes: ""
  })

  const certsQuery = useMemoFirebase(() => 
    query(collection(firestore, "certidoes"), where("clienteId", "==", clientId)),
    [firestore, clientId]
  )
  const { data: certidoes, isLoading } = useCollection(certsQuery)

  const handleSave = async () => {
    if (!formData.tipo) {
      toast({ variant: "destructive", title: "Erro", description: "O tipo de certidão é obrigatório." })
      return
    }

    setIsSaving(true)
    const id = formData.id || Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "certidoes", id)
    
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
        tipo: "Federal",
        emissao: "",
        validade: "",
        numero: "",
        codigoAutenticacao: "",
        status: "REGULAR",
        observacoes: ""
      })
      toast({ title: "Registrado!", description: "Certidão atualizada na base global." })
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja remover este registro da base global de certidões?")) {
      deleteDocumentNonBlocking(doc(firestore, "certidoes", id))
      toast({ title: "Removida", variant: "destructive" })
    }
  }

  const getStatusInfo = (cert: any) => {
    const validade = cert.validade ? new Date(cert.validade) : null;
    const isLate = cert.status === 'VENCIDA' || cert.status === 'POSITIVA' || 
                   (validade && isValid(validade) && isBefore(validade, new Date()));
                   
    const isWarning = cert.status === 'POSITIVA_EFEITO_NEGATIVA';

    if (isWarning) return { label: 'P. EFEITO NEGATIVA', color: 'bg-[#FFF4E5] text-[#F39C12]' }
    if (isLate) return { label: cert.status === 'POSITIVA' ? 'POSITIVA' : 'VENCIDA', color: 'bg-[#FEE2E2] text-[#E74C3C]' }
    return { label: 'REGULAR', color: 'bg-[#E6F6F0] text-[#2563EB]' }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-[#2563EB]" /> 
          Histórico de Regularidade Fiscal
        </h3>
        <Button size="sm" className="bg-[#2563EB] gap-2 font-bold shadow-lg uppercase text-[10px]" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-3.5 w-3.5" /> Registrar CND
        </Button>
      </div>

      <div className="rounded-xl border border-[#D2D7DB] overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-[#F7F7F7]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156] pl-6">Tipo</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156]">Controle / Número</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156]">Recibos</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156] text-center">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156] text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#2563EB]" />
                </TableCell>
              </TableRow>
            ) : certidoes && certidoes.length > 0 ? (
              certidoes.map((cert: any) => {
                const status = getStatusInfo(cert);
                return (
                  <TableRow key={cert.id} className="hover:bg-[#F7F7F7]/50 transition-colors">
                    <TableCell className="font-bold text-[#2C4156] text-xs uppercase pl-6">
                      {cert.tipo}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-bold text-[#39586D]">{cert.numero || 'S/N'}</span>
                        <span className="text-[8px] font-mono text-[#98A7AA]">{cert.codigoAutenticacao || '--'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-[#98A7AA]">E: {cert.emissao ? format(parseISO(cert.emissao), 'dd/MM/yyyy') : '--'}</span>
                        <span className="text-[9px] font-black text-[#2C4156]">V: {cert.validade ? format(parseISO(cert.validade), 'dd/MM/yyyy') : '--'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={status.color + " border-none text-[9px] font-black uppercase px-2 shadow-sm"}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] hover:bg-red-50" onClick={() => handleDelete(cert.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-[#98A7AA] font-bold text-[10px] uppercase italic">
                  Nenhuma certidão registrada na base global.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[450px] p-0 border-none shadow-2xl overflow-hidden">
          <DialogHeader className="p-6 bg-[#2C4156] text-white">
            <DialogTitle className="text-xl font-black text-white uppercase tracking-tight">Nova Certidão</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Registre uma nova CND para a base global.</DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white space-y-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Tipo / Abrangência</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                  <SelectTrigger className="border-[#D2D7DB] font-bold uppercase text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Federal" className="font-bold text-[10px] uppercase">FEDERAL (RFB/PGFN)</SelectItem>
                    <SelectItem value="Estadual" className="font-bold text-[10px] uppercase">ESTADUAL (SEFA)</SelectItem>
                    <SelectItem value="Municipal" className="font-bold text-[10px] uppercase">MUNICIPAL (PREFEITURA)</SelectItem>
                    <SelectItem value="FGTS" className="font-bold text-[10px] uppercase">FGTS (CRF) / CAIXA</SelectItem>
                    <SelectItem value="Trabalhista" className="font-bold text-[10px] uppercase">TRABALHISTA (CNDT)</SelectItem>
                    <SelectItem value="Outros" className="font-bold text-[10px] uppercase">OUTRAS CERTIDÕES</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Status Atual</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="border-[#D2D7DB] font-bold uppercase text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR" className="font-bold text-[10px] uppercase text-[#2563EB]">Regular (Negativa)</SelectItem>
                    <SelectItem value="POSITIVA_EFEITO_NEGATIVA" className="font-bold text-[10px] uppercase text-[#F39C12]">Positiva c/ Efeito Negativa</SelectItem>
                    <SelectItem value="VENCIDA" className="font-bold text-[10px] uppercase text-[#E74C3C]">Vencido</SelectItem>
                    <SelectItem value="POSITIVA" className="font-bold text-[10px] uppercase text-[#000000]">Positiva (Irregular)</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Nº Certidão</Label>
                  <Input value={formData.numero} onChange={(e) => setFormData({...formData, numero: e.target.value.toUpperCase()})} className="border-[#D2D7DB] font-mono text-[10px] font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Código Autenticação</Label>
                  <Input value={formData.codigoAutenticacao} onChange={(e) => setFormData({...formData, codigoAutenticacao: e.target.value.toUpperCase()})} className="border-[#D2D7DB] font-mono text-[10px] font-bold" />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Emissão</Label>
                  <Input type="date" value={formData.emissao} onChange={(e) => setFormData({...formData, emissao: e.target.value})} className="border-[#D2D7DB] font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#2563EB]">Validade</Label>
                  <Input type="date" value={formData.validade} onChange={(e) => setFormData({...formData, validade: e.target.value})} className="border-[#2563EB] focus-visible:ring-[#2563EB] font-black text-[#2C4156]" />
                </div>
             </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] p-6 border-t flex justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-[10px] text-[#98A7AA]">Cancelar</Button>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-[10px] px-8 shadow-lg shadow-blue-500/20" onClick={handleSave} disabled={isSaving}>
              Salvar na Base Global
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
