'use client';

import { useState, useEffect } from "react"
import { 
  Calendar,
  Send,
  Info,
  Loader2,
  Clock,
  Building,
  User,
  ArrowRight,
  FolderOpen
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
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser,
  setDocumentNonBlocking
} from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
import { addDays, format, parseISO, isValid } from "date-fns"
import { cn } from "@/lib/utils"

export default function FeriasPortalPage() {
  const firestore = useFirestore()
  const { selectedUser } = useUser()
  const [cnpj, setCnpj] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Estados do formulário
  const [selectedEmpresa, setSelectedEmpresa] = useState("empresa2") // Default to ELETRO LTDA
  const [lotacaoSetor, setLotacaoSetor] = useState("GERAL")
  const [selectedFuncionario, setSelectedFuncionario] = useState("func1")
  const [dataInicio, setDataInicio] = useState("")
  const [diasGozo, setDiasGozo] = useState(30)
  const [abonoPecuniario, setAbonoPecuniario] = useState(false)
  const [adiantamento13, setAdiantamento13] = useState(false)
  const [observacoes, setObservacoes] = useState("")

  // Lógica de cálculo de datas
  const [dataFinal, setDataFinal] = useState("")
  const [dataRetorno, setDataRetorno] = useState("")

  useEffect(() => {
    if (dataInicio && diasGozo > 0) {
      try {
        const start = parseISO(dataInicio)
        if (isValid(start)) {
          // Data Final = Início + Dias - 1
          const end = addDays(start, diasGozo - 1)
          // Retorno ao Trabalho = Data Final + 1 (Início + Dias)
          const ret = addDays(end, 1)

          setDataFinal(format(end, "dd/MM/yyyy"))
          setDataRetorno(format(ret, "dd/MM/yyyy"))
        } else {
          setDataFinal("")
          setDataRetorno("")
        }
      } catch (e) {
        console.error("Erro ao calcular datas", e)
        setDataFinal("")
        setDataRetorno("")
      }
    } else {
      setDataFinal("")
      setDataRetorno("")
    }
  }, [dataInicio, diasGozo])

  // Auto reset lotacaoSetor when selected company changes
  useEffect(() => {
    const activeCompanyObj = MOCK_EMPRESAS.find(e => e.id === selectedEmpresa)
    if (activeCompanyObj && activeCompanyObj.lotacoes && activeCompanyObj.lotacoes.length > 0) {
      setLotacaoSetor(activeCompanyObj.lotacoes[0])
    } else {
      setLotacaoSetor("GERAL")
    }
  }, [selectedEmpresa])

  // Sincroniza CNPJ da empresa ativa no portal
  useEffect(() => {
    const container = document.getElementById("portal-context-container")
    if (container) {
      setCnpj(container.getAttribute("data-active-cnpj") || "")
      setCompanyName(container.getAttribute("data-active-company") || "")
    }

    const handleCnpjChange = (e: any) => {
      if (e.detail?.cnpj) {
        setCnpj(e.detail.cnpj)
        if (e.detail.client) {
          setCompanyName(e.detail.client.nomeFantasia || e.detail.client.razaoSocial || "")
        }
      }
    }
    window.addEventListener("portalCompanyChanged", handleCnpjChange)
    return () => window.removeEventListener("portalCompanyChanged", handleCnpjChange)
  }, [])

  // Buscar solicitações de férias existentes da empresa ativa
  const tasksQuery = useMemoFirebase(() => 
    cnpj ? query(
      collection(firestore, "tasks"), 
      where("clientId", "==", cnpj), 
      where("origem", "==", "PORTAL_CLIENTE"), 
      where("tipo", "==", "FERIAS")
    ) : null,
    [firestore, cnpj]
  )
  const { data: rawRequests = [], isLoading: loadingTasks } = useCollection(tasksQuery)

  const requests = (rawRequests || []).sort((a: any, b: any) => 
    new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
  )

  // Mocks de dados solicitados
  const MOCK_EMPRESAS = [
    { id: "empresa1", label: "1 - PROSPERARE LTDA (04.536.819/0001-90)", name: "PROSPERARE LTDA", cnpj: "04.536.819/0001-90", lotacoes: ["GERAL", "ADMINISTRATIVO", "PRODUÇÃO"] },
    { id: "empresa2", label: "2 - ELETRO LTDA (12.345.678/0001-90)", name: "ELETRO LTDA", cnpj: "12.345.678/0001-90", lotacoes: ["GERAL", "FINANCEIRO", "TECNOLOGIA"] }
  ]

  const activeCompanyObj = MOCK_EMPRESAS.find(e => e.id === selectedEmpresa)
  const availableLotacoes = activeCompanyObj?.lotacoes || ["GERAL"]

  const MOCK_FUNCIONARIOS = [
    { id: "func1", label: "Matrícula 1 - CARLOS EDUARDO SILVA (01.01 - GERAL)", name: "CARLOS EDUARDO SILVA", matricula: "1", setor: "GERAL" },
    { id: "func2", label: "Matrícula 2 - ANA MARIA DE SOUZA (01.02 - GERÊNCIA)", name: "ANA MARIA DE SOUZA", matricula: "2", setor: "GERÊNCIA" },
    { id: "func3", label: "Matrícula 3 - PEDRO ALVES DE LIMA (01.01 - GERAL)", name: "PEDRO ALVES DE LIMA", matricula: "3", setor: "GERAL" }
  ]

  // Ações rápidos de dias de gozo
  const QUICK_DAYS = [30, 20, 15, 10]

  const handleCreateRequest = async () => {
    if (!dataInicio) {
      toast({ title: "Erro", description: "Informe a Data de Início das Férias.", variant: "destructive" })
      return
    }

    if (diasGozo <= 0) {
      toast({ title: "Erro", description: "A quantidade de dias de gozo deve ser maior que zero.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const selectedCompanyObj = MOCK_EMPRESAS.find(e => e.id === selectedEmpresa)
      const selectedEmpObj = MOCK_FUNCIONARIOS.find(f => f.id === selectedFuncionario)

      const id = Math.random().toString(36).substr(2, 9)
      const taskRef = doc(firestore, "tasks", id)

      const notesHtml = `
        Solicitação de Férias criada via Portal do Cliente.
        Funcionário: ${selectedEmpObj?.name || "Funcionário"}
        Lotação: ${lotacaoSetor}
        Período de Gozo: ${dataInicio ? format(parseISO(dataInicio), "dd/MM/yyyy") : ""} a ${dataFinal}
        Quantidade de Dias: ${diasGozo} dias
        Retorno ao Trabalho: ${dataRetorno}
        Abono Pecuniário (Venda de 1/3): ${abonoPecuniario ? "Sim (10 dias)" : "Não"}
        Adiantamento 13º Salário: ${adiantamento13 ? "Sim" : "Não"}
        Observações: ${observacoes || "-"}
      `.trim()

      const taskData = {
        id,
        clientId: selectedCompanyObj?.cnpj || cnpj || "12.345.678/0001-90",
        clientName: selectedCompanyObj?.name || companyName || "ELETRO LTDA",
        title: `SOLICITAÇÃO DE FÉRIAS - ${selectedEmpObj?.name || "Funcionário"}`,
        responsibleId: "Geral",
        responsibleName: "Departamento Pessoal",
        notes: notesHtml,
        status: "pendente",
        origem: "PORTAL_CLIENTE",
        tipo: "FERIAS",
        departamento: "DP",
        funcionarioNome: selectedEmpObj?.name || "Funcionário",
        dataInicio: dataInicio,
        dias: diasGozo,
        dataFim: dataInicio && diasGozo > 0 ? format(addDays(parseISO(dataInicio), diasGozo - 1), "yyyy-MM-dd") : "",
        dataRetorno: dataInicio && diasGozo > 0 ? format(addDays(parseISO(dataInicio), diasGozo), "yyyy-MM-dd") : "",
        abonoPecuniario: abonoPecuniario,
        diasAbono: abonoPecuniario ? 10 : 0,
        adiantamento13: adiantamento13,
        observacoes: observacoes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setDocumentNonBlocking(taskRef, taskData, { merge: true })
      
      toast({ title: "Solicitação Enviada!", description: `A demanda de férias para ${selectedEmpObj?.name} foi enviada ao Departamento Pessoal.` })
      
      // Reseta formulário pós envio
      setDataInicio("")
      setDiasGozo(30)
      setAbonoPecuniario(false)
      setAdiantamento13(false)
      setObservacoes("")
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao enviar a solicitação.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const isDateValid = dataInicio && isValid(parseISO(dataInicio))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight flex items-center gap-3">
          <Calendar className="h-8 w-8 text-blue-600 shrink-0" />
          Férias de Funcionários
        </h1>
        <p className="text-[#98A7AA] font-bold text-sm">Registre programações de gozo e controle o histórico de solicitações.</p>
      </div>

      {/* Main Form Card with visual Stepper */}
      <Card className="border-[#D2D7DB] shadow-lg bg-white overflow-hidden">
        <CardHeader className="bg-[#2C4156] text-white p-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-[#2563EB] shrink-0" />
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Formulário de Solicitação</CardTitle>
              <CardDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-0.5">
                Preencha os campos abaixo para gerar o lançamento de férias
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          
          {/* STEP 1: Seleciona Empresa */}
          <div className="flex gap-6 relative">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm z-10 shrink-0 shadow-md shadow-blue-500/20">
                1
              </div>
              <div className="w-0.5 bg-slate-100 flex-1 my-2"></div>
            </div>
            
            <div className="flex-1 pb-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">
                  1. Seleciona Empresa *
                </Label>
                <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                  <SelectTrigger className="border-[#D2D7DB] h-11 bg-slate-50/50 focus:ring-blue-600 font-semibold text-slate-700">
                    <SelectValue placeholder="Selecione a empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_EMPRESAS.map(emp => (
                      <SelectItem key={emp.id} value={emp.id} className="text-xs font-bold uppercase">
                        {emp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">
                  Lotação / Setor
                </Label>
                <Select value={lotacaoSetor} onValueChange={setLotacaoSetor}>
                  <SelectTrigger className="border-[#D2D7DB] h-11 bg-slate-50/50 focus:ring-blue-600 font-semibold text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLotacoes.map(lot => (
                      <SelectItem key={lot} value={lot} className="text-xs font-bold uppercase">{lot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* STEP 2: Seleciona Funcionário */}
          <div className="flex gap-6 relative">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm z-10 shrink-0 shadow-md shadow-blue-500/20">
                2
              </div>
              <div className="w-0.5 bg-slate-100 flex-1 my-2"></div>
            </div>
            
            <div className="flex-1 pb-4 space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">
                2. Seleciona Funcionário *
              </Label>
              <Select value={selectedFuncionario} onValueChange={(val) => {
                setSelectedFuncionario(val)
                const f = MOCK_FUNCIONARIOS.find(x => x.id === val)
                if (f) setLotacaoSetor(f.setor)
              }}>
                <SelectTrigger className="border-[#D2D7DB] h-11 bg-slate-50/50 focus:ring-blue-600 font-semibold text-slate-700">
                  <SelectValue placeholder="Selecione o funcionário..." />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_FUNCIONARIOS.map(f => (
                    <SelectItem key={f.id} value={f.id} className="text-xs font-bold uppercase">
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* STEP 3: Data do Gozo */}
          <div className="flex gap-6 relative">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm z-10 shrink-0 shadow-md shadow-blue-500/20">
                3
              </div>
              <div className="w-0.5 bg-slate-100 flex-1 my-2"></div>
            </div>
            
            <div className="flex-1 pb-4 space-y-6">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest block">
                3. Data do Gozo (Início e Duração)
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">
                    Data de Início do Gozo (Início das Férias) *
                  </Label>
                  <Input 
                    type="date"
                    value={dataInicio} 
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="border-[#D2D7DB] h-11 bg-slate-50/50 font-bold focus-visible:ring-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">
                    Quantos Dias de Gozo? *
                  </Label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Input 
                      type="number"
                      min={1}
                      max={30}
                      value={diasGozo} 
                      onChange={(e) => setDiasGozo(parseInt(e.target.value) || 0)}
                      className="border-[#D2D7DB] h-11 bg-slate-50/50 font-bold sm:w-28 focus-visible:ring-blue-600"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {QUICK_DAYS.map((days) => (
                        <Button 
                          key={days} 
                          type="button" 
                          variant={diasGozo === days ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setDiasGozo(days)}
                          className={cn(
                            "h-9 font-bold px-3 text-xs tracking-wider",
                            diasGozo === days 
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                              : "border-[#D2D7DB] text-[#2C4156] hover:bg-slate-50"
                          )}
                        >
                          {days}d
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Info Banner (Teal/Emerald Theme) */}
              {isDateValid && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-800 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                      <Info className="h-5 w-5 shrink-0" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Período de Descanso</span>
                      <p className="text-sm font-extrabold text-[#2C4156]">
                        Data Final do Gozo: <span className="text-blue-600 font-black">{dataFinal}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-100/70 border border-emerald-200/50 px-5 py-3 rounded-xl flex flex-col items-start sm:items-end justify-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Dia de Retorno</span>
                    <span className="text-sm font-black text-emerald-800">
                      Retorno ao trabalho: {dataRetorno}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 4: Vender Férias */}
          <div className="flex gap-6 relative">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm z-10 shrink-0 shadow-md shadow-blue-500/20">
                4
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest block">
                4. Vender Férias (Abono Pecuniário)
              </Label>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 transition-all duration-300">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-amber-950">Abono Pecuniário (Venda de 1/3)</h4>
                  <p className="text-xs text-amber-800/80 font-medium max-w-md">
                    Selecione se deseja converter 1/3 do período de férias a que o trabalhador tem direito em abono em dinheiro.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs font-black uppercase tracking-wider",
                    abonoPecuniario ? "text-amber-700" : "text-slate-400"
                  )}>
                    {abonoPecuniario ? "SIM (Vender)" : "NÃO (Não Vender)"}
                  </span>
                  <Switch 
                    id="abono" 
                    checked={abonoPecuniario} 
                    onCheckedChange={setAbonoPecuniario}
                    className="data-[state=checked]:bg-amber-600 data-[state=unchecked]:bg-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

        </CardContent>

        {/* Form Footer */}
        <div className="bg-slate-50 border-t border-[#D2D7DB] p-8 space-y-6">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="adiantamento" 
              checked={adiantamento13} 
              onCheckedChange={(checked) => setAdiantamento13(!!checked)}
              className="mt-0.5 border-[#D2D7DB] data-[state=checked]:bg-blue-600"
            />
            <div className="grid gap-1.5 leading-none">
              <label 
                htmlFor="adiantamento" 
                className="text-xs font-black text-[#2C4156] uppercase tracking-wide cursor-pointer select-none"
              >
                Solicitar Adiantamento da 1ª Parcela do 13º Salário
              </label>
              <p className="text-[10px] text-[#98A7AA] font-bold uppercase">
                O pagamento do adiantamento do décimo terceiro salário ocorrerá junto com as férias.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">
              Observações adicionais para o DP (opcional)
            </Label>
            <Input 
              id="observacoes"
              placeholder="Digite mensagens ou instruções complementares para o DP contábil..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="border-[#D2D7DB] h-12 bg-white font-medium focus-visible:ring-blue-600"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 font-black uppercase text-xs px-8 shadow-lg shadow-blue-500/20 h-12 gap-2.5 rounded-xl transition-all duration-300"
              onClick={handleCreateRequest}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Cadastrar Solicitação de Férias
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* History List Section (Maintained to prevent data visibility loss) */}
      <Card className="border-[#D2D7DB] shadow-sm overflow-hidden bg-white mt-12">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Histórico de Solicitações de Férias
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Lista de pedidos enviados para o departamento pessoal do escritório contábil.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-500 font-semibold text-xs">Funcionário</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Período de Gozo</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Quantidade de Dias</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Retorno Previsto</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Venda (Abono)</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Data da Solicitação</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Status DP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTasks ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2563EB]" />
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase mt-2">Sincronizando histórico...</p>
                  </TableCell>
                </TableRow>
              ) : requests.length > 0 ? (
                requests.map((req: any) => {
                  const statusLabel = req.status === 'concluido' ? 'GERADA' : 'PENDENTE'
                  return (
                    <TableRow key={req.id} className="hover:bg-slate-50/40 transition-colors">
                      <TableCell className="font-semibold text-sm text-[#2C4156]">
                        {req.funcionarioNome}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{req.dataInicio ? new Date(req.dataInicio + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          <span>{req.dataFim ? new Date(req.dataFim + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">
                        {req.dias} dias
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-700">
                        {req.dataRetorno ? new Date(req.dataRetorno + 'T12:00:00Z').toLocaleDateString('pt-BR') : "-"}
                      </TableCell>
                      <TableCell>
                        {req.abonoPecuniario ? (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-bold">
                            Sim (10 dias)
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('pt-BR') : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-none text-[9px] font-bold tracking-wide uppercase px-2 py-0.5",
                          statusLabel === 'GERADA' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <FolderOpen className="h-8 w-8 text-slate-300 animate-pulse" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nenhuma solicitação de férias registrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
    </div>
  )
}
