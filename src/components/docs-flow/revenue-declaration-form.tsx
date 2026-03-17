"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Save, Eye, Loader2, X, Phone, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { format, addMonths, subMonths, parse, startOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, query, where, orderBy, limit, getDocs, doc } from "firebase/firestore"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import Image from "next/image"
import { ClientSearchSelect } from "@/components/clients/client-search-select"

export function RevenueDeclarationForm() {
  const firestore = useFirestore()
  const [isManualClient, setIsManualClient] = useState(false)
  const [isPreviewMode, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading: loadingClients } = useCollection(clientsQuery)

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

      // Puxar histórico do último faturamento emitido
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
      createdAt: new Date().toISOString()
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-black text-[#2C4156] uppercase">Relatório de Faturamento 12 Meses</CardTitle>
                <CardDescription>Gere a declaração para bancos e licitações com períodos automatizados.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.2em]">Identificação da Empresa</h4>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-[10px] font-bold text-[#1FA67A] uppercase" onClick={() => setIsManualClient(!isManualClient)}>
                  {isManualClient ? "Base de Dados" : "Manual"}
                </Button>
              </div>
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

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button className="flex-1 bg-[#2C4156] font-bold gap-2" onClick={handlePreview}>
                <Eye className="h-4 w-4" /> Visualizar Relatório
              </Button>
              <Button variant="outline" className="flex-1 border-[#D2D7DB] text-[#39586D] font-bold gap-2" onClick={handleSaveToHistory} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar no Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPreviewMode && (
        <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-4 duration-500 print-container">
          <Card className="border-[#D2D7DB] bg-[#F7F7F7] overflow-hidden sticky top-20 print:static print:bg-white print:border-none print:shadow-none">
            <CardHeader className="bg-white border-b py-3 px-6 flex flex-row items-center justify-between no-print">
              <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Pré-visualização do Relatório</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}><X className="h-4 w-4 mr-1" /> Fechar</Button>
                <Button size="sm" className="bg-[#1FA67A] gap-2 font-bold" onClick={() => window.print()}>
                  <Printer className="h-3 w-3" /> Imprimir / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 print:p-0">
              <div className="bg-white mx-auto w-full min-h-[297mm] flex flex-col text-[#2C4156] text-[11px] leading-relaxed border font-serif relative">
                
                {/* Papel Timbrado - Header */}
                <div className="p-12 pb-0 flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="border-2 border-[#003366] p-2 w-16 h-16 flex flex-col items-center justify-center leading-none">
                      <span className="text-3xl font-serif italic text-[#003366]">P</span>
                      <span className="text-[10px] font-bold text-[#003366] -mt-1">sc</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-serif italic text-[#003366] tracking-tighter">Prosperare</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#98A7AA]">Serviços Contábeis</span>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-[#003366] rounded-sm skew-x-[-20deg]" />
                </div>

                {/* Conteúdo do Documento */}
                <div className="px-16 py-12 flex-1 space-y-8">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-lg font-black uppercase underline underline-offset-8">DECLARAÇÃO DE FATURAMENTO DOS ÚLTIMOS 12 MESES</h2>
                    <p className="font-bold text-[9px] text-[#98A7AA]">Prosperare Flow — Inteligência e Gestão Contábil</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase text-[#98A7AA]">Razão Social</p>
                        <p className="text-sm font-black uppercase">{formData.empresa || "[NOME DA EMPRESA]"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-[#98A7AA]">CNPJ</p>
                        <p className="text-sm font-black">{formData.cnpj || "00.000.000/0000-00"}</p>
                      </div>
                    </div>

                    <p className="text-justify leading-relaxed text-xs">
                      Declaramos para os devidos fins de comprovação, que a empresa supra citada apresentou o seguinte faturamento bruto mensal no período de 12 (doze) meses retroativos à presente data:
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
                            <TableCell className="text-center uppercase text-[10px]">TOTAL ACUMULADO</TableCell>
                            <TableCell className="text-right text-[#1FA67A]">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                          <TableRow className="bg-[#F7F7F7] font-black">
                            <TableCell className="text-center uppercase text-[10px]">MÉDIA MENSAL</TableCell>
                            <TableCell className="text-right text-[#2574A9]">R$ {average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <p className="text-justify text-xs italic">
                      Por ser a expressão da verdade, firmamos a presente declaração.
                    </p>
                  </div>

                  <div className="mt-16 space-y-12">
                    <p className="text-right">Macapá - AP, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    
                    <div className="flex flex-col items-center text-center pt-8 space-y-1">
                      <div className="w-64 border-t border-[#2C4156] pt-2">
                        <p className="font-black uppercase text-[11px]">FELYPE MACIEL NAIFF</p>
                        <p className="text-[9px] font-bold text-[#39586D] uppercase">CONTADOR RESPONSAVEL</p>
                        <p className="text-[8px] text-[#98A7AA]">CRC 002428/O-9</p>
                        <p className="text-[8px] text-[#98A7AA]">CPF 917.722.812-04</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Papel Timbrado - Footer */}
                <div className="mt-auto">
                  <div className="flex justify-end pr-12 mb-4">
                    <div className="bg-[#98A7AA] p-4 text-white text-[9px] font-bold space-y-1 relative rounded-tl-3xl">
                      <div className="absolute top-0 right-0 w-4 h-full bg-[#003366]" />
                      <div className="flex items-center gap-2 pr-6">
                        <Phone className="h-3 w-3" /> (96) 98129-6544 | (96) 98133-4568
                      </div>
                      <div className="flex items-center gap-2 pr-6">
                        <Mail className="h-3 w-3" /> pscsucesso@gmail.com
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#003366] p-4 flex justify-between items-center text-white text-[10px] font-bold">
                    <span className="pl-8 uppercase">PROSPERARE <span className="font-normal">Serviços Contábeis LTDA</span></span>
                    <span className="pr-8 font-normal">Av. Acelino de Leão, nº 1046 – Trem, Macapá - Amapá</span>
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
