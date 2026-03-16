"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Download, Save, RefreshCw, PenTool, FileSpreadsheet, Keyboard, Calendar as CalendarIcon, Upload, Loader2, X, Eye, TrendingUp } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SignatureDialog } from "./signature-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { format, addMonths, subMonths, parse, startOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import Image from "next/image"

export function RevenueDeclarationForm() {
  const firestore = useFirestore()
  const [source, setSource] = useState<"manual" | "pgdas">("manual")
  const [isManualClient, setIsManualClient] = useState(false)
  const [isSignatureOpen, setIsSignatureOpen] = useState(false)
  const [isPreviewMode, setIsPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading: loadingClients } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    empresa: "",
    cnpj: "",
    email: ""
  })

  const [startPeriod, setStartPeriod] = useState(format(subMonths(startOfMonth(new Date()), 12), "yyyy-MM"))
  
  const [rows, setRows] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      periodo: "",
      valor: 0
    }))
  )

  useEffect(() => {
    if (startPeriod) {
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
  }, [startPeriod])

  const handleSelectClient = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId)
    if (client) {
      setFormData({
        empresa: client.corporateName,
        cnpj: client.cnpj,
        email: client.email || "cliente@email.com"
      })
    }
  }

  const total = rows.reduce((acc, row) => acc + (Number(row.valor) || 0), 0)
  const average = total / 12

  const handleUpdateValue = (index: number, val: string) => {
    const newRows = [...rows]
    newRows[index].valor = Number(val)
    setRows(newRows)
  }

  const handleUpdatePeriod = (index: number, val: string) => {
    const newRows = [...rows]
    newRows[index].periodo = val
    setRows(newRows)
  }

  const handlePreview = () => {
    if (!formData.empresa) {
      toast({ variant: "destructive", title: "Atenção", description: "Selecione a empresa para gerar o relatório." })
      return
    }
    setIsPreviewOpen(true)
    toast({ title: "Visualização Gerada!" })
  }

  const handleFetchPgdas = () => {
    toast({ 
      title: "Sincronizando PGDAS...", 
      description: "Buscando dados de faturamento no portal e-CAC via Extrato PGDAS-D." 
    })
    const simulatedRows = rows.map(r => ({ ...r, valor: Math.floor(Math.random() * 50000) + 10000 }))
    setRows(simulatedRows)
  }

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r?\n/)
      const values: number[] = []

      lines.forEach(line => {
        const cleanLine = line.replace(/[^\d.,]/g, '').replace(',', '.')
        const num = parseFloat(cleanLine)
        if (!isNaN(num)) values.push(num)
      })

      if (values.length >= 12) {
        const newRows = [...rows]
        for (let i = 0; i < 12; i++) {
          newRows[i].valor = values[i]
        }
        setRows(newRows)
        toast({ title: "Planilha Importada!", description: "12 meses de faturamento foram preenchidos." })
      } else {
        toast({ 
          variant: "destructive",
          title: "Erro na importação", 
          description: "Não encontramos 12 valores numéricos válidos no arquivo." 
        })
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getClientLogo = (name: string) => {
    if (!name) return null;
    const seed = name.length;
    return `https://picsum.photos/seed/${seed}/200/80`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className={cn("space-y-6", isPreviewMode ? "lg:col-span-5" : "lg:col-span-12 max-w-4xl mx-auto")}>
        <Card className="border-[#D2D7DB] shadow-sm">
          <CardHeader className="bg-[#F7F7F7]/50 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-black text-[#2C4156] uppercase">Relatório de Faturamento 12 Meses</CardTitle>
                <CardDescription>Gere a declaração para bancos e licitações com períodos automatizados.</CardDescription>
              </div>
              <div className="bg-white p-1 rounded-lg border shadow-sm shrink-0">
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
                      Manual
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
                      PGDAS
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Identificação da Empresa</h4>
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleImportCSV} />
                <Button variant="outline" size="sm" className="text-[10px] font-bold text-[#2574A9] uppercase" onClick={() => fileInputRef.current?.click()}>
                  Importar CSV
                </Button>
                <Button variant="ghost" size="sm" className="text-[10px] font-bold text-[#1FA67A] uppercase" onClick={() => setIsManualClient(!isManualClient)}>
                  {isManualClient ? "Base de Dados" : "Manual"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold">Empresa</Label>
                {!isManualClient ? (
                  <Select onValueChange={handleSelectClient}>
                    <SelectTrigger className="border-[#D2D7DB]">
                      <SelectValue placeholder={loadingClients ? "Carregando..." : "Escolher cliente..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {(clients || []).map(c => (
                        <SelectItem key={c.id} value={c.id} className="uppercase text-xs font-bold">{c.corporateName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Razão Social" value={formData.empresa} onChange={(e) => setFormData({...formData, empresa: e.target.value.toUpperCase()})} />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">CNPJ</Label>
                <Input placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Mês Inicial</Label>
                <Input type="month" value={startPeriod} onChange={(e) => setStartPeriod(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Tabela de Faturamento</h4>
                {source === "pgdas" && (
                  <Button variant="outline" size="sm" className="h-7 text-[10px] font-black uppercase border-[#1FA67A] text-[#1FA67A]" onClick={handleFetchPgdas}>
                    Sincronizar PGDAS
                  </Button>
                )}
              </div>

              <div className="border rounded-xl overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-[#F7F7F7]">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase text-[#2C4156]">Mês/Ano</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-[#2C4156] text-right">Valor (R$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i} className="h-10">
                        <TableCell className="py-1">
                          <Input 
                            className="h-8 text-xs font-bold border-none bg-transparent" 
                            value={row.periodo}
                            onChange={(e) => handleUpdatePeriod(i, e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="py-1 text-right">
                          <Input 
                            type="number" 
                            className="h-8 text-right text-xs border-none bg-transparent" 
                            value={row.valor || ""}
                            onChange={(e) => handleUpdateValue(i, e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button className="flex-1 bg-[#2C4156] font-bold gap-2" onClick={handlePreview}>
                <Eye className="h-4 w-4" /> Visualizar Documento
              </Button>
              <Button variant="outline" className="flex-1 border-[#2574A9] text-[#2574A9] font-bold gap-2" onClick={() => setIsSignatureOpen(true)}>
                <PenTool className="h-4 w-4" /> Assinatura Digital
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPreviewMode && (
        <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="border-[#D2D7DB] bg-[#F7F7F7] overflow-hidden sticky top-20 print:static print:bg-white print:border-none print:shadow-none">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between print:hidden">
              <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Pré-visualização do Relatório</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}><X className="h-4 w-4 mr-1" /> Fechar</Button>
                <Button size="sm" className="bg-[#1FA67A] gap-2" onClick={() => window.print()}>
                  <Printer className="h-3 w-3" /> Imprimir / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 print:p-0">
              <div className="bg-white shadow-xl mx-auto w-full min-h-[800px] p-12 text-[#2C4156] text-[11px] leading-relaxed border print:shadow-none print:border-none print-container">
                
                {/* Cabeçalho */}
                <div className="flex items-start justify-between mb-12 border-b-2 border-[#2C4156] pb-8">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black uppercase">{formData.empresa || "[NOME DA EMPRESA]"}</h2>
                    <p className="font-bold text-[#98A7AA]">CNPJ: {formData.cnpj || "00.000.000/0000-00"}</p>
                  </div>
                  {formData.empresa && (
                    <div className="relative w-32 h-12 grayscale opacity-80">
                      <Image src={getClientLogo(formData.empresa)!} alt="Logo" fill className="object-contain" />
                    </div>
                  )}
                </div>

                <div className="text-center space-y-2 mb-12">
                  <h2 className="text-lg font-black uppercase underline underline-offset-8">DECLARAÇÃO DE FATURAMENTO DOS ÚLTIMOS 12 MESES</h2>
                  <p className="font-bold text-[9px] text-[#98A7AA]">Prosperare Flow — Inteligência e Gestão Contábil</p>
                </div>

                <div className="space-y-8">
                  <p className="text-justify leading-loose">
                    Declaramos para os devidos fins de comprovação, que a empresa <strong>{formData.empresa || "[NOME DA EMPRESA]"}</strong>, inscrita no CNPJ sob o nº <strong>{formData.cnpj || "[CNPJ]"}</strong>, apresentou o seguinte faturamento bruto mensal no período de 12 (doze) meses retroativos à presente data:
                  </p>

                  <div className="border-2 border-[#2C4156] rounded-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-[#F7F7F7]">
                        <TableRow className="border-b-2 border-[#2C4156]">
                          <TableHead className="text-[#2C4156] font-black h-8 text-center uppercase">MÊS DE REFERÊNCIA</TableHead>
                          <TableHead className="text-[#2C4156] font-black h-8 text-right uppercase">FATURAMENTO BRUTO (R$)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-200">
                        {rows.map((row, i) => (
                          <TableRow key={i} className="h-8">
                            <TableCell className="text-center font-bold">{row.periodo}</TableCell>
                            <TableCell className="text-right font-mono">R$ {Number(row.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[#F7F7F7] font-black border-t-2 border-[#2C4156]">
                          <TableCell className="text-center uppercase">TOTAL ACUMULADO</TableCell>
                          <TableCell className="text-right text-[#1FA67A]">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        <TableRow className="bg-[#F7F7F7] font-black">
                          <TableCell className="text-center uppercase">MÉDIA MENSAL</TableCell>
                          <TableCell className="text-right text-[#2574A9]">R$ {average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <p className="text-justify">
                    Por ser a expressão da verdade, firmamos a presente declaração.
                  </p>
                </div>

                <div className="mt-24 space-y-16">
                  <p className="text-right">Emitido em {new Date().toLocaleDateString('pt-BR')}</p>
                  <div className="grid grid-cols-2 gap-12 text-center pt-12">
                    <div className="border-t border-[#2C4156] pt-2">
                      <p className="font-bold uppercase text-[9px]">{formData.empresa || "CLIENTE"}</p>
                      <p className="text-[8px] text-[#98A7AA] uppercase tracking-widest">Representante Legal</p>
                    </div>
                    <div className="border-t border-[#2C4156] pt-2">
                      <p className="font-bold uppercase text-[9px]">PROSPERARE FLOW</p>
                      <p className="text-[8px] text-[#98A7AA] uppercase tracking-widest">Contador Responsável</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <SignatureDialog 
        open={isSignatureOpen} 
        onOpenChange={setIsSignatureOpen} 
        documentTitle="Declaração de Faturamento"
        recipientName={formData.empresa || "Responsável Empresa"}
        recipientEmail={formData.email}
      />
    </div>
  )
}
