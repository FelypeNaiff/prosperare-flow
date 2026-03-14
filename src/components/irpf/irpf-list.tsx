
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
import { Eye, Edit, Trash2, FileText, Copy, DollarSign, CheckCircle2, XCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const MOCK_DATA = [
  { id: 'ir1', name: 'RUI VALDO', cpf: '123.456.789-00', govPass: 'SenhaGov123!', year: '2026', type: 'Completa', status: 'Em Preenchimento', progress: 65, due: '15/04/2026', value: 250, responsible: 'Ricardo', isPaid: false },
  { id: 'ir2', name: 'MARIA SANTOS', cpf: '456.789.123-11', govPass: 'MariaGov@2026', year: '2026', type: 'Simplificada', status: 'Enviada', progress: 100, due: '20/04/2026', value: 350, responsible: 'Fernanda', isPaid: true },
  { id: 'ir3', name: 'CARLOS OLIVEIRA', cpf: '789.123.456-22', govPass: 'Carlos#Pass', year: '2026', type: 'Completa', status: 'Não Iniciado', progress: 0, due: '10/04/2026', value: 200, responsible: 'Ana', isPaid: false },
]

export function IrpfList({ searchTerm }: { searchTerm: string }) {
  const filtered = MOCK_DATA.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.cpf.includes(searchTerm)
  )

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`
    })
  }

  return (
    <div className="bg-white rounded-lg border border-[#D2D7DB] overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-[#2C4156]">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-white font-bold uppercase text-[10px]">Contribuinte</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px]">Status Etapa</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px]">Progresso</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px] text-right">Honorários</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px] text-center">Pagamento</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
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
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell className="w-[150px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-[#98A7AA]">
                    <span>{item.progress}%</span>
                    <span>{item.responsible}</span>
                  </div>
                  <Progress value={item.progress} className="h-1.5" />
                </div>
              </TableCell>
              <TableCell className="text-right font-black text-[#2C4156]">
                {formatCurrency(item.value)}
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
