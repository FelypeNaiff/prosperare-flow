
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Download, Save, UserPlus, RefreshCw, Calculator, PenTool } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SignatureDialog } from "./signature-dialog"

export function RevenueDeclarationForm() {
  const [isManual, setIsManual] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  const [clientName, setClientName] = useState("")
  const [rows, setRows] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      mes: `Mês ${12 - i}`,
      ano: "2024",
      valor: 0
    }))
  )

  const total = rows.reduce((acc, row) => acc + (Number(row.valor) || 0), 0)

  const handleUpdateValue = (index: number, val: string) => {
    const newRows = [...rows]
    newRows[index].valor = Number(val)
    setRows(newRows)
  }

  const handleGenerate = () => {
    toast({ title: "Relatório de Faturamento Gerado!" })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <CardTitle className="text-lg font-black text-[#2C4156] uppercase">Relatório de Faturamento 12 Meses</CardTitle>
          <CardDescription>Gere a declaração para bancos e licitações com base no histórico.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Empresa de Referência</h4>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold text-[#1FA67A]" onClick={() => setIsManual(!isManual)}>
              {isManual ? "Selecionar da Base" : "Digitar Manual"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#39586D]">Razão Social</Label>
              <Input placeholder="Nome da empresa" readOnly={!isManual} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#39586D]">CNPJ</Label>
              <Input placeholder="00.000.000/0000-00" readOnly={!isManual} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Tabela de Valores (Últimos 12 Meses)</h4>
              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase border-[#D2D7DB] gap-1">
                <RefreshCw className="h-3 w-3" /> Puxar dados do sistema
              </Button>
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
              <Table>
                <TableHeader className="bg-[#F7F7F7]">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase text-[#2C4156]">Período (Mês/Ano)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-[#2C4156] text-right">Valor Faturado (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className="h-10">
                      <TableCell className="py-1 text-xs font-bold text-[#39586D]">{row.mes} / {row.ano}</TableCell>
                      <TableCell className="py-1 text-right">
                        <Input 
                          type="number" 
                          className="h-8 text-right text-xs border-none bg-transparent hover:bg-[#F7F7F7] focus:bg-white focus:ring-1 focus:ring-[#1FA67A]" 
                          placeholder="0,00"
                          value={row.valor || ""}
                          onChange={(e) => handleUpdateValue(i, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[#2C4156] hover:bg-[#2C4156]">
                    <TableCell className="text-white font-black text-xs uppercase">Total Acumulado (12 meses)</TableCell>
                    <TableCell className="text-white text-right font-black text-sm">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button className="flex-1 bg-[#1FA67A] font-bold gap-2" onClick={handleGenerate}>
              <Printer className="h-4 w-4" /> Gerar Documento Assinado
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-[#2574A9] text-[#2574A9] hover:bg-[#2574A9]/5 font-bold gap-2"
              onClick={() => setIsSignatureOpen(true)}
            >
              <PenTool className="h-4 w-4" /> Enviar p/ Assinatura Digital
            </Button>
            <Button variant="outline" className="border-[#D2D7DB] font-bold gap-2">
              <Save className="h-4 w-4" /> Salvar Valores
            </Button>
          </div>
        </CardContent>
      </Card>

      <SignatureDialog 
        open={isSignatureOpen} 
        onOpenChange={setIsSignatureOpen} 
        documentTitle="Declaração de Faturamento"
        recipientName={clientName || "Responsável Empresa"}
        recipientEmail="cliente@email.com"
      />
    </div>
  )
}
