
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Download, Save, UserPlus, RefreshCw, Calculator, PenTool, FileSpreadsheet, Keyboard, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SignatureDialog } from "./signature-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format, addMonths, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function RevenueDeclarationForm() {
  const [source, setSource] = useState<"manual" | "pgdas">("manual")
  const [isManualClient, setIsManualClient] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  const [clientName, setClientName] = useState("")
  const [startPeriod, setStartPeriod] = useState(format(new Date(), "yyyy-MM"))
  
  const [rows, setRows] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      periodo: "",
      valor: 0
    }))
  )

  // Efeito para preencher automaticamente os períodos quando o mês inicial mudar
  useEffect(() => {
    if (source === "manual" && startPeriod) {
      try {
        const baseDate = parse(startPeriod, "yyyy-MM", new Date())
        const newRows = Array.from({ length: 12 }, (_, i) => {
          const date = addMonths(baseDate, i)
          return {
            periodo: format(date, "MM/yyyy"),
            valor: rows[i]?.valor || 0
          }
        })
        setRows(newRows)
      } catch (e) {
        console.error("Erro ao processar data", e)
      }
    }
  }, [startPeriod, source])

  const total = rows.reduce((acc, row) => acc + (Number(row.valor) || 0), 0)

  const handleUpdateValue = (index: number, val: string) => {
    const newRows = [...rows]
    newRows[index].valor = Number(val)
    setRows(newRows)
  }

  const handleGenerate = () => {
    toast({ title: "Relatório de Faturamento Gerado!", description: "Documento pronto para exportação." })
  }

  const handleFetchPgdas = () => {
    toast({ 
      title: "Sincronizando PGDAS...", 
      description: "Buscando dados de faturamento no portal e-CAC via Extrato PGDAS-D." 
    })
    // Simulação de preenchimento via PGDAS
    const simulatedRows = rows.map(r => ({ ...r, valor: Math.floor(Math.random() * 50000) + 10000 }))
    setRows(simulatedRows)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black text-[#2C4156] uppercase">Relatório de Faturamento 12 Meses</CardTitle>
              <CardDescription>Gere a declaração para bancos e licitações com inteligência de períodos.</CardDescription>
            </div>
            <div className="bg-white p-1 rounded-lg border shadow-sm">
              <RadioGroup 
                value={source} 
                onValueChange={(v: any) => setSource(v)}
                className="flex gap-0"
              >
                <div className="flex items-center">
                  <RadioGroupItem value="manual" id="r-manual" className="sr-only" />
                  <Label
                    htmlFor="r-manual"
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-black uppercase cursor-pointer rounded-md transition-all",
                      source === "manual" ? "bg-[#2C4156] text-white" : "text-[#98A7AA] hover:bg-[#F7F7F7]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Keyboard className="h-3 w-3" /> Manual
                    </div>
                  </Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="pgdas" id="r-pgdas" className="sr-only" />
                  <Label
                    htmlFor="r-pgdas"
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-black uppercase cursor-pointer rounded-md transition-all",
                      source === "pgdas" ? "bg-[#1FA67A] text-white" : "text-[#98A7AA] hover:bg-[#F7F7F7]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-3 w-3" /> Extrato PGDAS
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Empresa de Referência</h4>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold text-[#1FA67A]" onClick={() => setIsManualClient(!isManualClient)}>
              {isManualClient ? "Selecionar da Base" : "Digitar Manual"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#39586D]">Razão Social</Label>
              <Input placeholder="Nome da empresa" readOnly={!isManualClient} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#39586D]">CNPJ</Label>
              <Input placeholder="00.000.000/0000-00" readOnly={!isManualClient} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#39586D]">Mês Inicial do Relatório</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
                <Input 
                  type="month" 
                  className="pl-9 border-[#D2D7DB]" 
                  value={startPeriod}
                  onChange={(e) => setStartPeriod(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Tabela de Valores (Período Gerado)</h4>
              {source === "pgdas" && (
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase border-[#1FA67A] text-[#1FA67A] gap-1" onClick={handleFetchPgdas}>
                  <RefreshCw className="h-3 w-3" /> Puxar Faturamento PGDAS
                </Button>
              )}
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
              <Table>
                <TableHeader className="bg-[#F7F7F7]">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase text-[#2C4156] w-[200px]">Período (Mês/Ano)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-[#2C4156] text-right">Valor Faturado (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className="h-10 hover:bg-slate-50/50">
                      <TableCell className="py-1 text-xs font-bold text-[#39586D]">{row.periodo}</TableCell>
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
              <Printer className="h-4 w-4" /> Gerar Documento
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-[#2574A9] text-[#2574A9] hover:bg-[#2574A9]/5 font-bold gap-2"
              onClick={() => setIsSignatureOpen(true)}
            >
              <PenTool className="h-4 w-4" /> Assinatura Digital
            </Button>
            <Button variant="outline" className="border-[#D2D7DB] font-bold gap-2">
              <Save className="h-4 w-4" /> Salvar Histórico
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
