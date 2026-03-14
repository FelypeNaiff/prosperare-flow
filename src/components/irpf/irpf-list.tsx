
"use client"

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, FileText, Copy, DollarSign, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { useState } from "react"
import { IrpfDetailsDrawer } from "./irpf-details-drawer"

export function IrpfList({ searchTerm }: { searchTerm: string }) {
  const { user } = useUser()
  const firestore = useFirestore()
  const [selectedDeclaration, setSelectedDeclaration] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const irpfQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, "irpf_declarations"), where("responsibleId", "==", user.uid)) : null,
    [firestore, user]
  )
  
  const { data: declarations = [], isLoading } = useCollection(irpfQuery)

  const filtered = (declarations || []).filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || d.cpf?.includes(searchTerm)
  )

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`
    })
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(firestore, "irpf_declarations", id))
    toast({ title: "Registro removido", variant: "destructive" })
  }

  if (isLoading) {
    return (
      <div className="h-32 flex items-center justify-center bg-white border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-[#1FA67A]" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-[#D2D7DB] overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-[#2C4156]">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-white font-bold uppercase text-[10px]">Contribuinte</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px]">Etapa</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px]">Progresso</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px] text-right">Honorários</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px] text-center">Pagamento</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length > 0 ? filtered.map((item) => (
            <TableRow key={item.id} className="hover:bg-[#F7F7F7]">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-[#2C4156]">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#98A7AA] font-mono">{item.cpf}</span>
                    <button onClick={() => copyToClipboard(item.cpf, "CPF")} className="text-[#98A7AA] hover:text-[#1FA67A]">
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className="bg-[#E3F0F9] text-[#2574A9] border-none text-[9px] font-black uppercase">
                  {item.status?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="w-[150px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-[#98A7AA]">
                    <span>{item.progress || 0}%</span>
                  </div>
                  <Progress value={item.progress || 0} className="h-1.5" />
                </div>
              </TableCell>
              <TableCell className="text-right font-black text-[#2C4156]">
                {formatCurrency(Number(item.value) || 0)}
              </TableCell>
              <TableCell className="text-center">
                {item.isPaid ? (
                  <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none text-[9px] font-black uppercase">Pago</Badge>
                ) : (
                  <Badge className="bg-[#FEE2E2] text-[#E74C3C] border-none text-[9px] font-black uppercase">Pendente</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]" onClick={() => { setSelectedDeclaration(item); setIsDrawerOpen(true); }}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA] font-bold uppercase text-xs">
                Nenhuma declaração localizada para sua conta.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <IrpfDetailsDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
        declaration={selectedDeclaration} 
      />
    </div>
  )
}
