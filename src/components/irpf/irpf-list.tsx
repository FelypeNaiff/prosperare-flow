
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
import { Eye, Edit, Trash2, FileText, Copy } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const MOCK_DATA = [
  { id: 'ir1', name: 'João da Silva', cpf: '123.456.789-00', govPass: 'SenhaGov123!', year: '2026', type: 'Completa', status: 'Em Preenchimento', progress: 65, due: '15/04/2026', value: 1250, responsible: 'Ricardo', result: 'Restituição' },
  { id: 'ir2', name: 'Maria Santos', cpf: '456.789.123-11', govPass: 'MariaGov@2026', year: '2026', type: 'Simplificada', status: 'Enviada', progress: 100, due: '20/04/2026', value: 450, responsible: 'Fernanda', result: 'A Pagar' },
  { id: 'ir3', name: 'Carlos Oliveira', cpf: '789.123.456-22', govPass: 'Carlos#Pass', year: '2026', type: 'Completa', status: 'Aguardando Doc', progress: 10, due: '10/04/2026', value: 800, responsible: 'Ana', result: 'Restituição' },
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
            <TableHead className="text-white font-bold uppercase text-[10px]">Ano/Tipo</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px]">Status</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px]">Progresso</TableHead>
            <TableHead className="text-white font-bold uppercase text-[10px] text-right">Honorários</TableHead>
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
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#39586D]">{item.year}</span>
                  <span className="text-[9px] font-bold text-[#98A7AA] uppercase">{item.type}</span>
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
              <TableCell className="text-right font-black text-[#1FA67A]">
                {formatCurrency(item.value)}
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
