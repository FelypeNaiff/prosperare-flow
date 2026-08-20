'use client';

import { useState } from "react"
import { 
  Plus, 
  Trash2, 
  Loader2,
  Save,
  Building,
  Upload,
  Download,
  AlertCircle,
  FileSpreadsheet,
  X,
  FileDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  useUser
} from "@/firebase"
import { collection, doc, writeBatch } from "firebase/firestore"
import { formatCNPJ } from "@/lib/utils"

interface EmployeeRow {
  nome: string;
  cpf: string;
  rg: string;
  cargo: string;
  dataAdmissao: string;
  salarioBase: number;
  status: "ATIVO" | "INATIVO";
}

export default function LotesPage() {
  const firestore = useFirestore()
  const { selectedUser } = useUser()
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  // Tabela editável em tempo real
  const [gridData, setGridData] = useState<EmployeeRow[]>([])

  // Buscar clientes cadastrados para vincular o lote
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading: loadingClients } = useCollection(clientsQuery)

  // Adicionar linha em branco no Grid
  const handleAddRow = () => {
    setGridData(prev => [
      ...prev,
      {
        nome: "",
        cpf: "",
        rg: "",
        cargo: "",
        dataAdmissao: "",
        salarioBase: 0,
        status: "ATIVO"
      }
    ])
  }

  // Deletar linha do Grid
  const handleDeleteRow = (index: number) => {
    setGridData(prev => prev.filter((_, idx) => idx !== index))
  }

  // Alterar valor em uma célula específica do Grid
  const handleCellChange = (index: number, field: keyof EmployeeRow, value: any) => {
    setGridData(prev => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        [field]: value
      }
      return copy
    })
  }

  // Limpar todo o Grid
  const handleClearGrid = () => {
    if (gridData.length > 0 && confirm("Deseja realmente limpar toda a tabela atual?")) {
      setGridData([])
    }
  }

  // Processa arquivo CSV carregado
  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({ title: "Erro no arquivo", description: "Por favor, envie um arquivo com extensão .csv", variant: "destructive" })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) return

      try {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
        if (lines.length === 0) {
          toast({ title: "Erro na leitura", description: "O arquivo CSV está vazio.", variant: "destructive" })
          return
        }

        // Detectar separador comum no Brasil (vírgula ou ponto e vírgula)
        const firstLine = lines[0]
        const commaCount = (firstLine.match(/,/g) || []).length
        const semicolonCount = (firstLine.match(/;/g) || []).length
        const separator = semicolonCount > commaCount ? ';' : ','

        const headers = firstLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''))
        
        // Mapear cabeçalhos comuns para indexadores
        const normalizedHeaders = headers.map(h => 
          h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        )

        const findIndex = (terms: string[]) => {
          return normalizedHeaders.findIndex(h => terms.some(term => h.includes(term)))
        }

        const nameIdx = findIndex(['nome', 'funcionario', 'completo'])
        const cpfIdx = findIndex(['cpf', 'cadastro'])
        const rgIdx = findIndex(['rg', 'registro'])
        const cargoIdx = findIndex(['cargo', 'funcao', 'ocupacao'])
        const admIdx = findIndex(['admissao', 'data'])
        const salIdx = findIndex(['salario', 'base', 'remuneracao'])
        const statusIdx = findIndex(['status', 'situacao'])

        const parsedRows: EmployeeRow[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''))
          if (values.length < headers.length) continue

          // Normalizar status
          let statusVal: "ATIVO" | "INATIVO" = "ATIVO"
          if (statusIdx !== -1 && values[statusIdx]) {
            const s = values[statusIdx].toUpperCase()
            if (s.includes("INATIVO") || s.includes("DESATIVADO") || s === "I" || s === "N") {
              statusVal = "INATIVO"
            }
          }

          // Normalizar data (DD/MM/YYYY ou YYYY-MM-DD para YYYY-MM-DD)
          let admDate = ""
          if (admIdx !== -1 && values[admIdx]) {
            const rawDate = values[admIdx]
            if (rawDate.includes("/")) {
              const parts = rawDate.split("/")
              if (parts.length === 3) {
                if (parts[0].length === 4) {
                  admDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
                } else {
                  admDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
                }
              }
            } else {
              admDate = rawDate
            }
          }

          // Normalizar salário
          let salBase = 0
          if (salIdx !== -1 && values[salIdx]) {
            salBase = parseFloat(values[salIdx].replace(/[^\d.,]/g, '').replace(',', '.')) || 0
          }

          parsedRows.push({
            nome: nameIdx !== -1 ? values[nameIdx]?.toUpperCase() || "" : "",
            cpf: cpfIdx !== -1 ? values[cpfIdx] || "" : "",
            rg: rgIdx !== -1 ? values[rgIdx] || "" : "",
            cargo: cargoIdx !== -1 ? values[cargoIdx] || "" : "",
            dataAdmissao: admDate,
            salarioBase: salBase,
            status: statusVal
          })
        }

        setGridData(prev => [...prev, ...parsedRows])
        toast({ title: "Importação concluída", description: `${parsedRows.length} linhas carregadas no Grid.` })
      } catch (err) {
        toast({ title: "Erro na planilha", description: "Não foi possível estruturar os dados do CSV.", variant: "destructive" })
      }
    }
    reader.readAsText(file)
  }

  // Upload por clique / Dropzone
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0])
    }
  }

  // Download do CSV modelo
  const handleDownloadTemplate = () => {
    const csvContent = "Nome Completo;CPF;RG;Cargo;Data de Admissao;Salario Base;Status\nMARIO SILVA DOS SANTOS;123.456.789-00;1234567 AP;Vendedor;2026-01-15;1850,50;ATIVO\nANA MARIA SOUZA;987.654.321-11;7654321 PA;Gerente;2025-06-10;3400,00;ATIVO\n"
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "modelo_lote_funcionarios.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Gravar tudo no Firestore usando writeBatch
  const handleSaveBatch = async () => {
    if (!selectedClientId) {
      toast({ title: "Empresa Obrigatória", description: "Selecione uma empresa para alocar o lote de funcionários.", variant: "destructive" })
      return
    }

    const client = (clients || []).find(c => c.id === selectedClientId)
    if (!client) return

    const validRows = gridData.filter(row => row.nome.trim() !== "" && row.cpf.trim() !== "")
    if (validRows.length === 0) {
      toast({ title: "Lote vazio", description: "Preencha o nome e o CPF dos funcionários antes de salvar.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const batch = writeBatch(firestore)

      validRows.forEach(row => {
        const empId = Math.random().toString(36).substr(2, 9)
        const empRef = doc(firestore, "funcionarios", empId)
        
        batch.set(empRef, {
          id: empId,
          nome: row.nome.toUpperCase(),
          cpf: row.cpf.trim(),
          rg: row.rg.trim(),
          cargo: row.cargo.trim(),
          dataAdmissao: row.dataAdmissao,
          salarioBase: Number(row.salarioBase) || 0,
          status: row.status,
          clientId: client.id,
          clientName: client.nomeFantasia || client.razaoSocial,
          clientCnpj: client.cnpj,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      })

      await batch.commit()

      toast({ 
        title: "Lote Gravado com Sucesso!", 
        description: `${validRows.length} novos funcionários adicionados à base da empresa ${client.nomeFantasia || client.razaoSocial}.`
      })
      setGridData([])
    } catch (e) {
      console.error(e)
      toast({ title: "Erro na gravação", description: "Não foi possível gravar o lote no Firestore.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Cadastro de Lotes</h1>
          <p className="text-[#98A7AA] font-medium text-sm">Insira ou importe múltiplos funcionários simultaneamente para as empresas.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-slate-200 text-slate-700 font-bold uppercase text-xs h-11 gap-1.5"
            onClick={handleDownloadTemplate}
          >
            <FileDown className="h-4.5 w-4.5 text-blue-600" />
            Baixar Modelo CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Seletor de Empresa e Upload */}
        <Card className="border-[#D2D7DB] shadow-sm lg:col-span-1 h-fit bg-white">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-blue-600" /> Vincular Lote
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Associe estes cadastros a uma empresa ativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Empresa Cliente *</Label>
              {loadingClients ? (
                <div className="h-11 flex items-center justify-center border border-dashed rounded-lg bg-slate-50">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                  <span className="text-xs font-semibold text-slate-400">Buscando empresas...</span>
                </div>
              ) : (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="border-[#D2D7DB] h-11">
                    <SelectValue placeholder="Selecione a empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients || []).map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">
                        {c.nomeFantasia || c.razaoSocial} ({formatCNPJ(c.cnpj)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Dropzone CSV Area */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Carregar Arquivo CSV</Label>
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl h-44 flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-all duration-200 ${
                  isDragging 
                    ? "border-blue-500 bg-blue-50/40 scale-[0.98]" 
                    : "border-slate-200 hover:border-blue-500 bg-slate-50/40 hover:bg-slate-50"
                }`}
                onClick={() => document.getElementById("csv-file-input")?.click()}
              >
                <input 
                  type="file" 
                  id="csv-file-input" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileSelect} 
                />
                <Upload className="h-8 w-8 text-blue-600 mb-2 shrink-0" />
                <p className="text-xs font-bold text-slate-700">Arraste seu arquivo .csv</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1">ou clique para selecionar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Edição Direta estilo Excel */}
        <Card className="border-[#D2D7DB] shadow-sm lg:col-span-2 bg-white flex flex-col">
          <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-blue-600" /> Planilha de Cadastro
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Edite os valores importados ou digite livremente abaixo.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearGrid}
                disabled={gridData.length === 0}
                className="h-8 border-[#D2D7DB] text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] font-bold uppercase rounded-lg"
              >
                Limpar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddRow}
                className="h-8 border-[#D2D7DB] text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[10px] font-bold uppercase rounded-lg gap-1"
              >
                <Plus className="h-3 w-3" /> Nova Linha
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto min-h-[300px]">
            {gridData.length > 0 ? (
              <Table className="min-w-[800px]">
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-slate-500 font-semibold text-xs"></TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs">Nome Completo *</TableHead>
                    <TableHead className="w-36 text-slate-500 font-semibold text-xs">CPF *</TableHead>
                    <TableHead className="w-32 text-slate-500 font-semibold text-xs">RG</TableHead>
                    <TableHead className="w-36 text-slate-500 font-semibold text-xs">Cargo</TableHead>
                    <TableHead className="w-36 text-slate-500 font-semibold text-xs">Admissão</TableHead>
                    <TableHead className="w-32 text-slate-500 font-semibold text-xs">Salário Base</TableHead>
                    <TableHead className="w-28 text-slate-500 font-semibold text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gridData.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-transparent border-b">
                      <TableCell className="text-center p-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteRow(idx)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          value={row.nome} 
                          onChange={(e) => handleCellChange(idx, 'nome', e.target.value.toUpperCase())}
                          className="h-8 border-[#D2D7DB] text-xs font-bold bg-white"
                          placeholder="EX: MARIA SOUZA"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          value={row.cpf} 
                          onChange={(e) => handleCellChange(idx, 'cpf', e.target.value)}
                          className="h-8 border-[#D2D7DB] text-xs font-semibold bg-white"
                          placeholder="000.000.000-00"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          value={row.rg} 
                          onChange={(e) => handleCellChange(idx, 'rg', e.target.value)}
                          className="h-8 border-[#D2D7DB] text-xs bg-white"
                          placeholder="RG / UF"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          value={row.cargo} 
                          onChange={(e) => handleCellChange(idx, 'cargo', e.target.value)}
                          className="h-8 border-[#D2D7DB] text-xs bg-white"
                          placeholder="EX: Analista"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          type="date"
                          value={row.dataAdmissao} 
                          onChange={(e) => handleCellChange(idx, 'dataAdmissao', e.target.value)}
                          className="h-8 border-[#D2D7DB] text-xs font-bold bg-white"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          type="number"
                          step="0.01"
                          value={row.salarioBase === 0 ? "" : row.salarioBase} 
                          onChange={(e) => handleCellChange(idx, 'salarioBase', parseFloat(e.target.value) || 0)}
                          className="h-8 border-[#D2D7DB] text-xs font-bold bg-white"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Select 
                          value={row.status} 
                          onValueChange={(v) => handleCellChange(idx, 'status', v)}
                        >
                          <SelectTrigger className="h-8 border-[#D2D7DB] text-xs font-bold bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATIVO" className="text-xs font-bold text-emerald-600">ATIVO</SelectItem>
                            <SelectItem value="INATIVO" className="text-xs font-bold text-red-600">INATIVO</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-4 h-full min-h-[300px] border border-dashed rounded-xl m-6 bg-slate-50/50">
                <Upload className="h-10 w-10 text-slate-300 shrink-0" />
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tabela de Importação Vazia</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Carregue um arquivo CSV ao lado ou clique em "+ Nova Linha" para digitar.</p>
                </div>
              </div>
            )}
          </CardContent>
          <div className="bg-[#F7F7F7] p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
              <AlertCircle className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <span>Somente linhas com Nome e CPF preenchidos serão processadas.</span>
            </div>
            <Button 
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-8 shadow-lg shadow-blue-500/20 h-11 w-full sm:w-auto"
              onClick={handleSaveBatch}
              disabled={isSaving || gridData.length === 0}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Lote de Funcionários
            </Button>
          </div>
        </Card>

      </div>
    </div>
  )
}
