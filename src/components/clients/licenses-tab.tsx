
"use client"

import { useState } from "react"
import { 
  Plus, 
  FlameKindling, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  FileSearch,
  MoreVertical,
  Loader2,
  Trash2,
  AlertTriangle,
  FileCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { format, parseISO, differenceInDays, isBefore } from "date-fns"
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
  const [newLicense, setNewLicense] = useState({
    type: "Prefeitura",
    description: "",
    expiryDate: "",
    issueDate: ""
  })

  const licensesQuery = useMemoFirebase(() => 
    query(collection(firestore, "licenses"), where("clientId", "==", clientId)),
    [firestore, clientId]
  )
  const { data: licenses = [], isLoading } = useCollection(licensesQuery)

  const handleSaveLicense = () => {
    if (!newLicense.expiryDate) {
      toast({ variant: "destructive", title: "Erro", description: "O vencimento é obrigatório." })
      return
    }

    const id = Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "licenses", id)
    
    const licenseData = {
      ...newLicense,
      id,
      clientId,
      status: 'Ativa',
      createdAt: new Date().toISOString()
    }

    setDocumentNonBlocking(docRef, licenseData, { merge: true })
    setIsModalOpen(false)
    setNewLicense({ type: "Prefeitura", description: "", expiryDate: "", issueDate: "" })
    toast({ title: "Licença Cadastrada!", description: "O vencimento agora será monitorado." })
  }

  const handleDelete = (id: string) => {
    if (confirm("Excluir este monitoramento?")) {
      deleteDocumentNonBlocking(doc(firestore, "licenses", id))
      toast({ title: "Licença removida", variant: "destructive" })
    }
  }

  const getStatusInfo = (expiryDate: string) => {
    if (!expiryDate) return { label: 'Erro', color: 'text-slate-400', bg: 'bg-slate-50', icon: AlertTriangle, days: 0 }
    
    const today = new Date()
    const expiry = parseISO(expiryDate)
    const daysLeft = differenceInDays(expiry, today)

    if (isBefore(expiry, today)) {
      return { label: 'VENCIDA', color: 'text-[#E74C3C]', bg: 'bg-[#FEE2E2]/50', border: 'border-[#E74C3C]/20', icon: XCircle, days: daysLeft }
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
            <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Monitoramento de prazos fatais de funcionamento.</p>
          </div>
        </div>
        <Button size="sm" className="bg-[#1FA67A] gap-2 font-bold shadow-lg" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Nova Licença
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" /></div>
        ) : licenses && licenses.length > 0 ? (
          licenses.map((license) => {
            const status = getStatusInfo(license.expiryDate)
            return (
              <Card key={license.id} className={cn("border-2 shadow-sm transition-all overflow-hidden", status.border)}>
                <div className={cn("h-1.5 w-full", status.color.replace('text', 'bg'))} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-[#D2D7DB] text-[#39586D]">
                      {license.type}
                    </Badge>
                    <Badge className={cn("text-[8px] font-black uppercase border-none px-2", status.bg, status.color)}>
                      {status.label}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-black text-[#2C4156] mt-3 uppercase">
                    {license.description || `Alvará de ${license.type}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-[#98A7AA] uppercase tracking-widest">Emissão</p>
                      <p className="text-xs font-bold text-[#39586D]">{license.issueDate ? format(parseISO(license.issueDate), 'dd/MM/yyyy') : '--'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-[#98A7AA] uppercase tracking-widest">Vencimento</p>
                      <p className={cn("text-xs font-black", status.color)}>{format(parseISO(license.expiryDate), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>

                  <div className={cn("p-3 rounded-xl flex items-center justify-between border", status.bg, status.border)}>
                    <div className="flex items-center gap-2">
                      <status.icon className={cn("h-4 w-4", status.color)} />
                      <span className={cn("text-[10px] font-black uppercase", status.color)}>
                        {status.days < 0 ? 'Expirado há' : 'Expira em'} {Math.abs(status.days)} dias
                      </span>
                    </div>
                    {status.critical && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-[#F2B705]" title="Abrir Processo de Renovação">
                        <FileCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase flex-1 border-[#D2D7DB]">
                      <FileSearch className="h-3 w-3 mr-1.5" /> Detalhes
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C] hover:bg-[#FEE2E2]" onClick={() => handleDelete(license.id)}>
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
            <h4 className="text-sm font-black text-[#2C4156] uppercase">Sem Licenças em Monitoramento</h4>
            <p className="text-xs text-[#98A7AA] font-bold mt-1">Cadastre os alvarás da prefeitura e bombeiro para evitar multas.</p>
            <Button className="mt-6 bg-[#1FA67A] font-bold" onClick={() => setIsModalOpen(true)}>Cadastrar Primeira Licença</Button>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#2C4156] uppercase">Nova Licença / Alvará</DialogTitle>
            <DialogDescription className="text-xs font-bold text-[#98A7AA] uppercase">Defina os prazos para monitoramento preventivo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Tipo de Licença</Label>
              <Select value={newLicense.type} onValueChange={(v) => setNewLicense({...newLicense, type: v})}>
                <SelectTrigger className="border-[#D2D7DB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prefeitura">Alvará de Funcionamento (Prefeitura)</SelectItem>
                  <SelectItem value="Bombeiro">AVCB / CLCB (Bombeiro)</SelectItem>
                  <SelectItem value="Sanitário">Vigilância Sanitária</SelectItem>
                  <SelectItem value="Ambiental">Licença Ambiental</SelectItem>
                  <SelectItem value="Outros">Outras Licenças Específicas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Descrição / Identificação</Label>
              <Input placeholder="Ex: Matriz Centro" value={newLicense.description} onChange={(e) => setNewLicense({...newLicense, description: e.target.value.toUpperCase()})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Data de Emissão</Label>
                <Input type="date" value={newLicense.issueDate} onChange={(e) => setNewLicense({...newLicense, issueDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Data de Vencimento</Label>
                <Input type="date" value={newLicense.expiryDate} onChange={(e) => setNewLicense({...newLicense, expiryDate: e.target.value})} className="border-[#E74C3C]/30 focus-visible:ring-[#E74C3C]" />
              </div>
            </div>
          </div>
          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-xs">Cancelar</Button>
            <Button className="bg-[#1FA67A] font-black uppercase text-xs px-8 shadow-lg" onClick={handleSaveLicense}>
              Salvar e Monitorar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function XCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}
