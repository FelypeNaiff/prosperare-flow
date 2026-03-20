"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Save, Eye, Loader2, X, RefreshCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { format, addMonths, subMonths, parse, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, limit, getDocs, doc } from "firebase/firestore"
import { ClientSearchSelect } from "@/components/clients/client-search-select"

export function RevenueDeclarationForm() {
  const firestore = useFirestore()
  const [isManualClient, setIsManualClient] = useState(false)
  const [isPreviewMode, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)

  const [formData, setFormData] = useState({
    clientId: "",
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

  const handleSelectClient = async (clientId: string) => {
    const client = clients?.find(c => c.id === clientId)
    if (client) {
      setFormData({
        clientId: client.id,
        empresa: client.corporateName,
        cnpj: client.cnpj,
        email: client.email || "cliente@email.com"
      })

      try {
        const q = query(
          collection(firestore, "generated_documents"),
          where("clientId", "==", clientId),
          where("type", "==", "FATURAMENTO 12 MESES"),
          orderBy("createdAt", "desc"),
          limit(1)
        )
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          const lastDoc = snapshot.docs[0].data()
          if (lastDoc.rows) {
            setRows(lastDoc.rows)
            toast({ title: "Histórico Recuperado", description: "Carregamos os valores do último faturamento emitido." })
          }
        }
      } catch (err) {
        console.warn("Sem histórico prévio para esta empresa.")
      }
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
  }

  const handleSaveToHistory = () => {
    if (!formData.empresa) return
    setIsSaving(true)
    
    const id = Math.random().toString(36).substr(2, 9)
    const docData = {
      id,
      clientId: formData.clientId || "manual",
      clientName: formData.empresa,
      type: "FATURAMENTO 12 MESES",
      title: `RELATÓRIO 12 MESES - ${rows[0].periodo} A ${rows[11].periodo}`,
      rows: rows,
      total,
      average,
      createdAt: new Date().toISOString(),
      data: { ...formData, rows, total, average }
    }

    setDocumentNonBlocking(doc(firestore, "generated_documents", id), docData, { merge: true })
    
    setTimeout(() => {
      setIsSaving(false)
      toast({ title: "Documento Salvo!", description: "O registro foi adicionado ao histórico geral." })
    }, 500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className={cn("space-y-6", isPreviewMode ? "lg:col-span-5 no-print" : "lg:col-span-12 max-w-4xl mx-auto")}>
        <Card className="border-[#D2D7DB] shadow-sm">
          <CardHeader className="bg-[#F7F7F7]/50 border-b">
            <CardTitle className="text-lg font-black text-[#2C4156] uppercase">Relatório de Faturamento 12 Meses</CardTitle>
            <CardDescription>Gere a declaração para bancos e licitações com períodos automatizados.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Identificação da Empresa</h4>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold text-[#1FA67A] uppercase gap-1" onClick={() => setIsManualClient(!isManualClient)}>
                <RefreshCcw className="h-4 w-4" /> {isManualClient ? "Base de Dados" : "Digitar Manual"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold">Empresa</Label>
                {!isManualClient ? (
                  <ClientSearchSelect 
                    clients={clients} 
                    value={formData.clientId} 
                    onValueChange={handleSelectClient} 
                  />
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
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Tabela de Faturamento</h4>
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

            <div className="flex gap-3 pt-6">
              <Button className="flex-1 bg-[#2C4156] font-black uppercase text-xs h-12 gap-2 shadow-lg" onClick={handlePreview}>
                <Eye className="h-4 w-4" /> VISUALIZAR DOCUMENTO
              </Button>
              <Button variant="outline" className="flex-1 border-[#D2D7DB] text-[#39586D] font-bold h-12 gap-2" onClick={handleSaveToHistory} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPreviewMode && (
        <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="border-[#D2D7DB] bg-[#F7F7F7] overflow-hidden sticky top-20 print:static print:bg-white print:border-none print:shadow-none">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between no-print">
              <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Pré-visualização do Relatório</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}><X className="h-4 w-4 mr-1" /> Fechar</Button>
                <Button size="sm" className="bg-[#1FA67A] gap-2 font-bold uppercase text-[10px]" onClick={() => window.print()}>
                  <Printer className="h-3 w-3" /> Gerar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 print:p-0">
              <div className="bg-white mx-auto w-full min-h-[297mm] flex flex-col text-black text-[11px] leading-tight border font-serif p-16 print-container relative">
                
                {/* Header Timbrado - Prosperare */}
                <div className="flex flex-col items-start mb-8 border-b pb-4">
                  <span className="text-3xl font-serif italic text-[#003366] tracking-tighter leading-none">Prosperare</span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-slate-500 mt-1">Serviços Contábeis</span>
                </div>

                <div className="flex-1 flex flex-col space-y-6">
                  {/* Título Principal */}
                  <div className="text-center space-y-1 mb-2">
                    <h2 className="text-lg font-black uppercase underline underline-offset-4 text-black">DECLARAÇÃO DE FATURAMENTO DOS ÚLTIMOS 12 MESES</h2>
                    <p className="font-bold text-[8px] text-slate-500 uppercase tracking-widest mt-1">PROSPERARE FLOW — INTELIGÊNCIA E GESTÃO CONTÁBIL</p>
                  </div>

                  {/* Box Identificação Empresa */}
                  <div className="border border-black p-4 flex justify-between items-center text-black">
                    <div className="space-y-1">
                      <p className="text-[7px] font-bold uppercase text-black">RAZÃO SOCIAL</p>
                      <p className="text-xs font-black uppercase">{formData.empresa || "[NOME DA EMPRESA]"}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[7px] font-bold uppercase text-black">CNPJ</p>
                      <p className="text-xs font-black">{formData.cnpj || "00.000.000/0000-00"}</p>
                    </div>
                  </div>

                  {/* Texto Statement */}
                  <p className="text-justify leading-relaxed text-[10px] text-black">
                    Declaramos para os devidos fins de comprovação, que a empresa supra citada apresentou o seguinte faturamento bruto mensal no período de 12 (doze) meses retroativos à presente data:
                  </p>

                  {/* Tabela de Valores */}
                  <div className="border border-black rounded-sm overflow-hidden text-black">
                    <Table>
                      <TableHeader className="bg-slate-100">
                        <TableRow className="border-b border-black">
                          <TableHead className="text-black font-black h-8 text-center uppercase text-[9px] py-0 border-r border-black">MÊS DE REFERÊNCIA</TableHead>
                          <TableHead className="text-black font-black h-8 text-right uppercase text-[9px] py-0 pr-4">FATURAMENTO BRUTO (R$)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-black">
                        {rows.map((row, i) => (
                          <TableRow key={i} className="h-7">
                            <TableCell className="text-center font-bold py-0.5 border-r border-black">{row.periodo}</TableCell>
                            <TableCell className="text-right font-mono py-0.5 pr-4">R$ {Number(row.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50 font-black border-t border-black">
                          <TableCell className="text-center uppercase text-[9px] py-1.5 border-r border-black">TOTAL ACUMULADO</TableCell>
                          <TableCell className="text-right py-1.5 text-[10px] pr-4">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                        <TableRow className="bg-slate-50 font-black">
                          <TableCell className="text-center uppercase text-[9px] py-1.5 border-r border-black">MÉDIA MENSAL</TableCell>
                          <TableCell className="text-right py-1.5 text-[10px] pr-4">R$ {average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <p className="text-justify text-[10px] italic text-black mt-4">
                    Por ser a expressão da verdade, firmamos a presente declaração em Macapá - AP, {new Date().getDate()} de {format(new Date(), 'MMMM', { locale: ptBR })} de {new Date().getFullYear()}.
                  </p>

                  {/* Bloco de Assinatura */}
                  <div className="mt-auto space-y-12 text-black pt-12 flex flex-col items-center">
                    <div className="flex flex-col items-center text-center space-y-1">
                      <div className="w-64 border-t-2 border-black pt-2">
                        <p className="font-black uppercase text-[10px]">FELYPE MACIEL NAIFF</p>
                        <p className="text-[8px] font-bold text-slate-700 uppercase">CONTADOR RESPONSÁVEL</p>
                        <p className="text-[7px] text-slate-500">CRC 002428/O-9 | CPF 917.722.812-04</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}