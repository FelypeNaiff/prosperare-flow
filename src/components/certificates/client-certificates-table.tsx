
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
  MoreVertical,
  Loader2,
  Save,
  Trash2,
  AlertTriangle
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
import { format, differenceInDays, parseISO, isBefore } from "date-fns"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

interface Certificate {
  id: string;
  tipo: string;
  numero: string;
  emissao: string;
  validade: string;
  arquivoUrl?: string;
  clientId: string;
}

export function ClientCertificatesTable({ clientId }: { clientId: string }) {
  const firestore = useFirestore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [newCert, setNewCert] = useState({
    tipo: "Federal",
    numero: "",
    emissao: "",
    validade: ""
  })

  const certsQuery = useMemoFirebase(() => 
    query(collection(firestore, "certifications"), where("clientId", "==", clientId)),
    [firestore, clientId]
  )
  const { data: certificates, isLoading } = useCollection<Certificate>(certsQuery)

  const handleSave = () => {
    if (!newCert.validade || !newCert.tipo) {
      toast({ variant: "destructive", title: "Erro", description: "O tipo e a validade são obrigatórios." })
      return
    }

    setIsSaving(true)
    const id = Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "certifications", id)
    
    const certData = {
      ...newCert,
      id,
      clientId,
      createdAt: new Date().toISOString()
    }

    setDocumentNonBlocking(docRef, certData, { merge: true })
    
    setTimeout(() => {
      setIsSaving(false)
      setIsModalOpen(false)
      setNewCert({ tipo: "Federal", numero: "", emissao: "", validade: "" })
      toast({ title: "Certidão Registrada!", description: "O monitoramento de validade está ativo." })
    }, 500)
  }

  const handleDelete = (id: string) => {
    if (confirm("Deseja remover este registro de certidão?")) {
      deleteDocumentNonBlocking(doc(firestore, "certifications", id))
      toast({ title: "Certidão removida", variant: "destructive" })
    }
  }

  const getStatusInfo = (validadeStr: string) => {
    if (!validadeStr) return { label: 'Pendente', color: 'bg-slate-400', days: 0 };
    
    try {
      const hoje = new Date();
      const validade = parseISO(validadeStr);
      const diasRestantes = differenceInDays(validade, hoje);

      if (isBefore(validade, hoje)) {
        return { label: 'Vencida', color: 'bg-[#E74C3C]', days: diasRestantes };
      }
      if (diasRestantes <= 7) {
        return { label: 'Crítica', color: 'bg-[#F2B705] text-black', days: diasRestantes };
      }
      if (diasRestantes <= 30) {
        return { label: 'A Vencer', color: 'bg-amber-400 text-black', days: diasRestantes };
      }
      return { label: 'Válida', color: 'bg-[#1FA67A]', days: diasRestantes };
    } catch (e) {
      return { label: 'Erro Data', color: 'bg-slate-400', days: 0 };
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-[#1FA67A]" /> 
          Histórico de Regularidade
        </h3>
        <Button size="sm" variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] font-bold h-8 text-[10px] uppercase" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-3.5 w-3.5" /> Incluir Manual
        </Button>
      </div>

      <div className="rounded-xl border border-[#D2D7DB] overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-[#F7F7F7]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156]">Tipo de Certidão</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156]">Número / Código</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156]">Emissão</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156]">Validade</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156] text-center">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#2C4156] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1FA67A]" />
                </TableCell>
              </TableRow>
            ) : certificates && certificates.length > 0 ? (
              certificates.map((cert) => {
                const status = getStatusInfo(cert.validade);
                return (
                  <TableRow key={cert.id} className="hover:bg-[#F7F7F7]/50 transition-colors">
                    <TableCell className="font-bold text-[#2C4156] text-xs uppercase">{cert.tipo}</TableCell>
                    <TableCell className="text-[10px] font-mono font-bold text-[#39586D]">{cert.numero || '--'}</TableCell>
                    <TableCell className="text-xs font-medium text-[#98A7AA]">{cert.emissao ? format(parseISO(cert.emissao), 'dd/MM/yyyy') : '--'}</TableCell>
                    <TableCell className="text-xs font-black text-[#39586D]">{cert.validade ? format(parseISO(cert.validade), 'dd/MM/yyyy') : '--'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={status.color + " border-none text-[9px] font-black uppercase px-2"}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] hover:bg-red-50" onClick={() => handleDelete(cert.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA] font-bold text-[10px] uppercase italic">
                  Nenhuma certidão registrada para esta empresa.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md border-none shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-black text-[#2C4156] uppercase tracking-tight">Novo Registro de CND</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-[#98A7AA] uppercase tracking-widest">Lance os dados da certidão obtida manualmente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Tipo / Abrangência</Label>
              <Select value={newCert.tipo} onValueChange={(v) => setNewCert({...newCert, tipo: v})}>
                <SelectTrigger className="border-[#D2D7DB] font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Federal">FEDERAL (RFB/PGFN)</SelectItem>
                  <SelectItem value="Estadual">ESTADUAL (SEFA)</SelectItem>
                  <SelectItem value="Municipal">MUNICIPAL (PREFEITURA)</SelectItem>
                  <SelectItem value="FGTS">FGTS (CRF)</SelectItem>
                  <SelectItem value="Trabalhista">TRABALHISTA (CNDT)</SelectItem>
                  <SelectItem value="Outros">OUTRAS CERTIDÕES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Número da Certidão</Label>
              <Input 
                placeholder="Código de controle ou número" 
                value={newCert.numero} 
                onChange={(e) => setNewCert({...newCert, numero: e.target.value.toUpperCase()})}
                className="border-[#D2D7DB] font-mono font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Emissão</Label>
                <Input type="date" value={newCert.emissao} onChange={(e) => setNewCert({...newCert, emissao: e.target.value})} className="border-[#D2D7DB]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Vencimento</Label>
                <Input type="date" value={newCert.validade} onChange={(e) => setNewCert({...newCert, validade: e.target.value})} className="border-[#D2D7DB] font-black" />
              </div>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-[10px]">Cancelar</Button>
            <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-black uppercase text-[10px] px-8 shadow-lg shadow-emerald-500/20" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
