'use client';

import { useState, useMemo, useRef } from "react"
import {
  BrainCircuit, Upload, FileText, X, Loader2, Sparkles, Download, Save, Stamp,
  ShieldCheck, AlertTriangle, CheckCircle2, History, Trash2, Eye, ImagePlus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import {
  useFirestore, useCollection, useDoc, useMemoFirebase, useUser,
  setDocumentNonBlocking, deleteDocumentNonBlocking
} from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { analyzeFiscalDocument, type FiscalAnalysis } from "@/ai/flows/analyze-fiscal-document-flow"
import { generateFiscalReportPdf, compressImage, type Letterhead } from "@/lib/fiscal-report-pdf"

const DOC_TYPES = [
  "Relatório de Situação Fiscal (Receita Federal / PGFN - e-CAC)",
  "Certidão Negativa / Positiva de Débitos (CND / CPEN) Federal",
  "Relatório PGFN / Regularize (Dívida Ativa da União)",
  "Débitos Estaduais (SEFAZ)",
  "Débitos Municipais (Prefeitura)",
  "Certidão FGTS / Trabalhista",
  "Outro documento fiscal",
]

const MAX_MB = 15

const fileToDataUri = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f)
})

const STATUS_UI = {
  REGULAR: { label: "Regular", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  ATENCAO: { label: "Requer atenção", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
  IRREGULAR: { label: "Irregular", cls: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
}

export default function AnaliseFiscalIAPage() {
  const firestore = useFirestore()
  const { user, userData } = useUser() as any

  // ---- Dados ----
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [] } = useCollection(clientsQuery)
  const historyQuery = useMemoFirebase(() => collection(firestore, "analisesFiscais"), [firestore])
  const { data: history = [] } = useCollection(historyQuery)

  const lhRef = useMemoFirebase(() => doc(firestore, "settings", "papelTimbrado"), [firestore])
  const headerRef = useMemoFirebase(() => doc(firestore, "letterheadAssets", "header"), [firestore])
  const footerRef = useMemoFirebase(() => doc(firestore, "letterheadAssets", "footer"), [firestore])
  const fullRef = useMemoFirebase(() => doc(firestore, "letterheadAssets", "fullPage"), [firestore])
  const { data: lhData } = useDoc(lhRef) as any
  const { data: headerDoc } = useDoc(headerRef) as any
  const { data: footerDoc } = useDoc(footerRef) as any
  const { data: fullDoc } = useDoc(fullRef) as any

  const letterhead: Letterhead = useMemo(() => ({
    ...(lhData || {}),
    headerImage: headerDoc?.image || undefined,
    footerImage: footerDoc?.image || undefined,
    fullPageImage: fullDoc?.image || undefined,
  }), [lhData, headerDoc, footerDoc, fullDoc])

  // ---- Estado da análise ----
  const [files, setFiles] = useState<File[]>([])
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const [clientId, setClientId] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<FiscalAnalysis | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [tab, setTab] = useState("nova")
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedClient: any = (clients || []).find((c: any) => c.id === clientId)
  const sortedClients = useMemo(() => [...(clients || [])].sort((a: any, b: any) =>
    (a.corporateName || "").localeCompare(b.corporateName || "")), [clients])

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const ok = Array.from(list).filter(f => /pdf|image\//.test(f.type))
    const total = [...files, ...ok].reduce((s, f) => s + f.size, 0)
    if (total > MAX_MB * 1024 * 1024) {
      toast({ title: "Arquivos muito grandes", description: `Limite total de ${MAX_MB}MB.`, variant: "destructive" }); return
    }
    setFiles(prev => [...prev, ...ok])
  }

  const handleAnalyze = async () => {
    if (!files.length) { toast({ title: "Envie ao menos um PDF", variant: "destructive" }); return }
    setIsAnalyzing(true); setAnalysis(null); setSavedId(null)
    try {
      const payload = await Promise.all(files.map(async f => ({ name: f.name, dataUri: await fileToDataUri(f) })))
      const result = await analyzeFiscalDocument({
        files: payload, documentType: docType,
        clientName: selectedClient?.corporateName, observacoes,
      })
      if (!result.ok) throw new Error(result.error)
      setAnalysis(result.data)
      toast({ title: "Análise concluída!", description: "Revise o conteúdo antes de gerar o PDF." })
    } catch (e: any) {
      console.error(e)
      toast({ title: "Erro na análise", description: e?.message || "Tente novamente.", variant: "destructive" })
    } finally { setIsAnalyzing(false) }
  }

  const handleSave = () => {
    if (!analysis) return
    const id = savedId || Math.random().toString(36).slice(2, 11)
    setDocumentNonBlocking(doc(firestore, "analisesFiscais", id), {
      id, analysis, docType, clientId: clientId || null,
      clientName: selectedClient?.corporateName || analysis.contribuinteNome,
      fileNames: files.map(f => f.name),
      createdAt: new Date().toISOString(),
      createdBy: userData?.fullName || user?.email || "",
    }, { merge: true })
    setSavedId(id)
    toast({ title: "Análise salva no histórico" })
  }

  const handlePdf = async (a: FiscalAnalysis = analysis!, clientName?: string) => {
    try {
      await generateFiscalReportPdf(a, letterhead, {
        clientName: clientName ?? selectedClient?.corporateName,
        preparedBy: letterhead.responsible,
      })
    } catch (e: any) {
      toast({ title: "Erro ao gerar PDF", description: e?.message, variant: "destructive" })
    }
  }

  const upd = (patch: Partial<FiscalAnalysis>) => setAnalysis(prev => prev ? { ...prev, ...patch } : prev)
  const hasLetterhead = !!(letterhead.headerImage || letterhead.fullPageImage || letterhead.companyName)

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#39586D] to-indigo-500 text-white shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Análise Fiscal IA</h1>
            <p className="text-slate-500 font-medium text-sm">Envie o PDF da Receita, PGFN, SEFAZ ou Prefeitura e gere um relatório com seu papel timbrado.</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5 h-8 px-3 border-indigo-200 bg-indigo-50 text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" /> Powered by Gemini
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="nova" className="gap-2"><Sparkles className="h-4 w-4" /> Nova análise</TabsTrigger>
          <TabsTrigger value="historico" className="gap-2"><History className="h-4 w-4" /> Histórico ({history?.length || 0})</TabsTrigger>
          <TabsTrigger value="timbrado" className="gap-2"><Stamp className="h-4 w-4" /> Papel timbrado</TabsTrigger>
        </TabsList>

        {/* ================= NOVA ANÁLISE ================= */}
        <TabsContent value="nova" className="space-y-6 mt-4">
          {!hasLetterhead && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Nenhum papel timbrado cadastrado. Configure na aba "Papel timbrado" para personalizar o relatório.
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2 border-slate-200 shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-base">1. Documento</CardTitle>
                <CardDescription>PDFs ou imagens (até {MAX_MB}MB no total)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">Cliente</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger id="analise-cliente" className="h-10 text-xs"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {sortedClients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">{c.corporateName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">Tipo de documento</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger id="analise-tipo" className="h-10 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div
                  id="analise-dropzone"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                    dragOver ? "border-indigo-500 bg-indigo-50 scale-[1.01]" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  )}
                >
                  <Upload className="h-8 w-8 mx-auto text-indigo-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Arraste o PDF aqui</p>
                  <p className="text-xs text-slate-400">ou clique para selecionar</p>
                  <input ref={inputRef} type="file" accept="application/pdf,image/*" multiple hidden
                    onChange={e => { addFiles(e.target.files); e.target.value = "" }} />
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <FileText className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate flex-1">{f.name}</span>
                        <span className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">Observações para a IA (opcional)</Label>
                  <Textarea id="analise-obs" rows={3} className="text-xs" value={observacoes} onChange={e => setObservacoes(e.target.value)}
                    placeholder="Ex: cliente quer participar de licitação; destacar o que impede a CND." />
                </div>

                <Button id="analise-btn-analisar" onClick={handleAnalyze} disabled={isAnalyzing || !files.length}
                  className="w-full h-11 gap-2 bg-gradient-to-r from-[#39586D] to-indigo-600 hover:opacity-90 text-white font-semibold">
                  {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analisando documento...</> : <><Sparkles className="h-4 w-4" /> Analisar com IA</>}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado */}
            <Card className="lg:col-span-3 border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-base">2. Revisão do relatório</CardTitle>
                  <CardDescription>Edite o texto livremente antes de gerar o PDF.</CardDescription>
                </div>
                {analysis && (
                  <div className="flex gap-2">
                    <Button id="analise-btn-salvar" variant="outline" size="sm" onClick={handleSave} className="gap-1.5"><Save className="h-4 w-4" /> Salvar</Button>
                    <Button id="analise-btn-pdf" size="sm" onClick={() => handlePdf()} className="gap-1.5 bg-[#39586D] hover:bg-[#2d4657] text-white"><Download className="h-4 w-4" /> Gerar PDF</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isAnalyzing && (
                  <div className="py-20 text-center space-y-3">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 rounded-full bg-indigo-400/30 animate-ping" />
                      <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#39586D] to-indigo-500 flex items-center justify-center">
                        <BrainCircuit className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Lendo e interpretando o documento...</p>
                    <p className="text-xs text-slate-400">Pode levar de 15 a 60 segundos.</p>
                  </div>
                )}

                {!isAnalyzing && !analysis && (
                  <div className="py-20 text-center text-slate-400 border-2 border-dashed rounded-xl">
                    <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">O resultado da análise aparecerá aqui.</p>
                  </div>
                )}

                {analysis && !isAnalyzing && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-50 border">
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm font-semibold text-slate-800">{analysis.contribuinteNome}</p>
                        <p className="text-xs text-slate-500 font-mono">{analysis.contribuinteDocumento} • emitido em {analysis.dataEmissao}</p>
                      </div>
                      <Select value={analysis.situacaoGeral} onValueChange={(v: any) => upd({ situacaoGeral: v })}>
                        <SelectTrigger className={cn("w-[170px] h-9 text-xs font-semibold border", STATUS_UI[analysis.situacaoGeral].cls)}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_UI).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <Field label="Resumo" value={analysis.resumo} onChange={v => upd({ resumo: v })} rows={4} />
                    <Field label="Emissão de CND" value={analysis.podeEmitirCND} onChange={v => upd({ podeEmitirCND: v })} rows={2} />

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500">Pendências ({analysis.pendencias.length})</Label>
                      {analysis.pendencias.length === 0 && <p className="text-xs text-emerald-600 font-medium">Nenhuma pendência identificada.</p>}
                      {analysis.pendencias.map((p, i) => (
                        <div key={i} className="p-3 rounded-xl border border-slate-200 space-y-2 hover:border-slate-300 transition-colors">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn("text-[10px]",
                              p.gravidade === "ALTA" ? "bg-red-600" : p.gravidade === "MEDIA" ? "bg-amber-500" : "bg-slate-400")}>{p.gravidade}</Badge>
                            <span className="text-xs font-semibold text-slate-800">{p.tipo}</span>
                            <span className="text-xs text-slate-400">• {p.orgao}</span>
                            {p.periodo && <span className="text-xs text-slate-400">• {p.periodo}</span>}
                            {p.valor > 0 && <span className="ml-auto text-xs font-bold text-slate-700">{p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>}
                            <button className="text-slate-300 hover:text-red-600" title="Remover"
                              onClick={() => upd({ pendencias: analysis.pendencias.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                          <Textarea rows={2} className="text-xs" value={p.descricao}
                            onChange={e => upd({ pendencias: analysis.pendencias.map((x, j) => j === i ? { ...x, descricao: e.target.value } : x) })} />
                          <Textarea rows={2} className="text-xs italic text-indigo-800" value={p.recomendacao}
                            onChange={e => upd({ pendencias: analysis.pendencias.map((x, j) => j === i ? { ...x, recomendacao: e.target.value } : x) })} />
                        </div>
                      ))}
                    </div>

                    <Field label="Plano de ação (um item por linha)" rows={5}
                      value={analysis.recomendacoes.join("\n")}
                      onChange={v => upd({ recomendacoes: v.split("\n").filter(s => s.trim()) })} />
                    <Field label="Conclusão" value={analysis.conclusao} onChange={v => upd({ conclusao: v })} rows={3} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= HISTÓRICO ================= */}
        <TabsContent value="historico" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0 divide-y">
              {(history || []).length === 0 && <p className="p-10 text-center text-sm text-slate-400">Nenhuma análise salva.</p>}
              {[...(history || [])].sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || "")).map((h: any) => {
                const st = STATUS_UI[h.analysis?.situacaoGeral as keyof typeof STATUS_UI] || STATUS_UI.ATENCAO
                return (
                  <div key={h.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{h.clientName}</p>
                      <p className="text-xs text-slate-400 truncate">{h.docType} • {new Date(h.createdAt).toLocaleString("pt-BR")} • {h.createdBy}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", st.cls)}>{st.label}</Badge>
                    <Button variant="ghost" size="icon" title="Abrir" onClick={() => {
                      setAnalysis(h.analysis); setSavedId(h.id); setClientId(h.clientId || ""); setDocType(h.docType || DOC_TYPES[0])
                      setTab("nova")
                    }}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Baixar PDF" onClick={() => handlePdf(h.analysis, h.clientName)}><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Excluir" className="hover:text-red-600" onClick={() => {
                      if (confirm("Excluir esta análise?")) deleteDocumentNonBlocking(doc(firestore, "analisesFiscais", h.id))
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= PAPEL TIMBRADO ================= */}
        <TabsContent value="timbrado" className="mt-4">
          <LetterheadSettings firestore={firestore} data={lhData} header={headerDoc?.image} footer={footerDoc?.image} full={fullDoc?.image} letterhead={letterhead} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500">{label}</Label>
      <Textarea rows={rows} className="text-sm" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function LetterheadSettings({ firestore, data, header, footer, full, letterhead }: any) {
  const [form, setForm] = useState<any>(null)
  const f = form ?? {
    companyName: data?.companyName || "", cnpj: data?.cnpj || "", address: data?.address || "",
    phone: data?.phone || "", email: data?.email || "", responsible: data?.responsible || "",
    crc: data?.crc || "", primaryColor: data?.primaryColor || "#39586D",
  }
  const set = (k: string, v: string) => setForm({ ...f, [k]: v })

  const uploadImg = async (slot: "header" | "footer" | "fullPage", file?: File) => {
    if (!file) return
    try {
      const img = await compressImage(file, slot === "fullPage" ? 1400 : 1700, slot === "fullPage" ? 0.75 : 0.85)
      if (img.length > 950_000) { toast({ title: "Imagem muito grande", description: "Use uma imagem menor.", variant: "destructive" }); return }
      setDocumentNonBlocking(doc(firestore, "letterheadAssets", slot), { image: img, updatedAt: new Date().toISOString() }, {})
      toast({ title: "Imagem salva" })
    } catch { toast({ title: "Erro ao processar imagem", variant: "destructive" }) }
  }
  const removeImg = (slot: string) => deleteDocumentNonBlocking(doc(firestore, "letterheadAssets", slot))

  const save = () => {
    setDocumentNonBlocking(doc(firestore, "settings", "papelTimbrado"), { ...f, updatedAt: new Date().toISOString() }, { merge: true })
    setForm(null)
    toast({ title: "Papel timbrado salvo!" })
  }

  const preview = async () => {
    const demo: FiscalAnalysis = {
      tipoDocumento: "Relatório de Situação Fiscal (exemplo)", contribuinteNome: "EMPRESA EXEMPLO LTDA",
      contribuinteDocumento: "00.000.000/0001-00", dataEmissao: new Date().toLocaleDateString("pt-BR"),
      situacaoGeral: "ATENCAO", podeEmitirCND: "Exemplo de texto sobre emissão de certidão.",
      resumo: "Este é um relatório de demonstração para visualizar o papel timbrado.",
      pendencias: [{ orgao: "Receita Federal", tipo: "Omissão de declaração", descricao: "DCTFWeb não entregue.", periodo: "03/2026", valor: 0, gravidade: "MEDIA", recomendacao: "Transmitir a declaração." }],
      parcelamentos: [], pontosPositivos: ["Sem inscrições em dívida ativa."], recomendacoes: ["Regularizar a omissão."], conclusao: "Exemplo de conclusão.",
    }
    await generateFiscalReportPdf(demo, { ...letterhead, ...f }, {})
  }

  const slots = [
    { key: "header", title: "Cabeçalho", desc: "Faixa do topo (ex: 2480×400 px)", img: header },
    { key: "footer", title: "Rodapé", desc: "Faixa inferior (ex: 2480×250 px)", img: footer },
    { key: "fullPage", title: "Página inteira (A4)", desc: "Opcional: timbre completo como fundo (PNG/JPG)", img: full },
  ] as const

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader><CardTitle className="text-base">Imagens do timbre</CardTitle>
          <CardDescription>Envie PNG/JPG. Se tiver o timbre em PDF, exporte como imagem (ou faça um print em alta resolução).</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {slots.map(s => (
            <div key={s.key} className="p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-semibold text-slate-700">{s.title}</p><p className="text-[11px] text-slate-400">{s.desc}</p></div>
                <div className="flex gap-1">
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-md border cursor-pointer hover:bg-slate-50">
                    <ImagePlus className="h-3.5 w-3.5" /> {s.img ? "Trocar" : "Enviar"}
                    <input id={`timbre-${s.key}`} type="file" accept="image/*" hidden onChange={e => { uploadImg(s.key, e.target.files?.[0]); e.target.value = "" }} />
                  </label>
                  {s.img && <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => removeImg(s.key)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
              {s.img && <img src={s.img} alt={s.title} className={cn("w-full rounded-md border bg-white object-contain", s.key === "fullPage" ? "max-h-64" : "max-h-24")} />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm h-fit">
        <CardHeader><CardTitle className="text-base">Dados do escritório</CardTitle>
          <CardDescription>Usados na assinatura e no timbre padrão (quando não houver imagens).</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {[
            ["companyName", "Razão social / Nome do escritório"], ["cnpj", "CNPJ"], ["address", "Endereço"],
            ["phone", "Telefone"], ["email", "E-mail"], ["responsible", "Contador responsável (assinatura)"], ["crc", "CRC"],
          ].map(([k, l]) => (
            <div key={k} className="space-y-1">
              <Label className="text-xs font-semibold text-slate-500">{l}</Label>
              <Input id={`timbre-${k}`} className="h-9 text-sm" value={f[k]} onChange={e => set(k, e.target.value)} />
            </div>
          ))}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Cor principal</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={f.primaryColor} onChange={e => set("primaryColor", e.target.value)} className="h-9 w-14 rounded border cursor-pointer" />
              <Input className="h-9 text-sm font-mono w-32" value={f.primaryColor} onChange={e => set("primaryColor", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button id="timbre-salvar" onClick={save} className="flex-1 gap-2 bg-[#39586D] hover:bg-[#2d4657] text-white"><Save className="h-4 w-4" /> Salvar</Button>
            <Button id="timbre-preview" variant="outline" onClick={preview} className="gap-2"><Eye className="h-4 w-4" /> PDF de teste</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
