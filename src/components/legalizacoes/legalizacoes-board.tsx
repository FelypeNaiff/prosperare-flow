"use client"

import { useState, useMemo, useEffect } from "react"
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from "firebase/firestore"
import { firestore as db } from "@/firebase/init"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Building2,
  FileSignature,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Pencil,
  Copy,
  User,
  Calendar,
  Search,
  RotateCcw,
  Archive,
  BookOpen,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ChecklistItem = { id: string; label: string; done: boolean }
type Tag = { name: string; color: string }
type Process = {
  id: string
  title: string
  company: string // Selected from dropdown or typed manually
  clientId?: string // ID of selected client, if any
  type: string
  priority: "Alta" | "Média" | "Baixa"
  status: string // current column
  startDate: string
  deadline: string
  notes: string
  tags: string[]
  checklist: ChecklistItem[]
  responsibleId: string
  isModelo: boolean
  arquivado: boolean
}

type Client = {
  id: string
  name: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: "abertura", title: "🏢 Abertura de CNPJ", color: "border-t-blue-400" },
  { id: "alteracao", title: "📝 Alteração Contratual", color: "border-t-amber-400" },
  { id: "baixa", title: "🔴 Baixa de CNPJ", color: "border-t-red-400" },
  { id: "inscricao", title: "📋 Inscrição Est./Municipal", color: "border-t-purple-400" },
  { id: "alvaras", title: "🛡️ Alvarás e Licenças", color: "border-t-emerald-400" },
]

const AVAILABLE_TAGS: Tag[] = [
  { name: "Urgente", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  { name: "Bombeiros", color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  { name: "Prefeitura", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  { name: "Receita Federal", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { name: "Cliente Pendente", color: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" },
  { name: "Vigilância Sanitária", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  { name: "Junta Comercial", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
  { name: "SEFAZ", color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
]

// Mock Team Members
const TEAM_MEMBERS = [
  { id: "u1", name: "Felype Naiff", initials: "FN", color: "bg-blue-600" },
  { id: "u2", name: "Charles Pereira", initials: "CP", color: "bg-emerald-600" },
  { id: "u3", name: "Marryeth Gizelle", initials: "MG", color: "bg-purple-600" },
  { id: "u4", name: "Rodrigo Santos", initials: "RS", color: "bg-orange-600" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcProgress(checklist: ChecklistItem[]) {
  if (!checklist.length) return 0
  return Math.round((checklist.filter((i) => i.done).length / checklist.length) * 100)
}

function isOverdue(deadline: string) {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ProcessModal({
  process,
  open,
  onClose,
  onSave,
  onClone,
  templates = [],
  clientes,
}: {
  process: Process | null
  open: boolean
  onClose: () => void
  onSave: (p: Process) => Promise<void>
  onClone?: (p: Process) => void
  templates?: Process[]
  clientes: Client[]
}) {
  const empty: Process = {
    id: crypto.randomUUID(),
    title: "",
    company: "",
    type: "abertura",
    priority: "Média",
    status: "abertura",
    startDate: "",
    deadline: "",
    notes: "",
    tags: [],
    checklist: [],
    responsibleId: "u1",
    isModelo: false,
    arquivado: false,
  }

  const [form, setForm] = useState<Process>(empty)
  const [newItem, setNewItem] = useState("")
  const [isManualCompany, setIsManualCompany] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")

  // Sync state when process is loaded/changed
  useEffect(() => {
    if (open) {
      if (process) {
        setForm(process)
        setIsManualCompany(!process.clientId)
      } else {
        setForm(empty)
        setIsManualCompany(false)
      }
      setSelectedTemplateId("")
    }
  }, [process, open])

  const progress = calcProgress(form.checklist)

  const toggleTag = (name: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(name) ? f.tags.filter((t) => t !== name) : [...f.tags, name],
    }))
  }

  const toggleCheckItem = (id: string) => {
    setForm((f) => ({
      ...f,
      checklist: f.checklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    }))
  }

  const addCheckItem = () => {
    if (!newItem.trim()) return
    setForm((f) => ({
      ...f,
      checklist: [...f.checklist, { id: crypto.randomUUID(), label: newItem.trim(), done: false }],
    }))
    setNewItem("")
  }

  const removeCheckItem = (id: string) => {
    setForm((f) => ({ ...f, checklist: f.checklist.filter((i) => i.id !== id) }))
  }

  const handleClientSelect = (clientId: string) => {
    const selected = clientes.find((c) => c.id === clientId)
    setForm((f) => ({
      ...f,
      clientId: clientId,
      company: selected ? selected.name : "",
    }))
  }

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const t = templates.find((x) => x.id === templateId)
    if (t) {
      setForm((f) => ({
        ...f,
        title: t.title,
        type: t.type,
        status: t.status,
        priority: t.priority,
        tags: [...t.tags],
        checklist: t.checklist.map((item) => ({ ...item, id: crypto.randomUUID(), done: false })),
        notes: t.notes,
        // Kept blank as requested
        company: "",
        clientId: undefined,
        startDate: "",
        deadline: "",
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-0 shadow-2xl bg-white">
        {/* Top Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 pt-6 pb-4 z-10">
          {/* Começar a partir de um Modelo Dropdown */}
          {!process?.id.startsWith("p") && templates.length > 0 && (
            <div className="mb-4 bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex flex-col gap-1.5">
              <Label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                Começar a partir de um Modelo (Template)
              </Label>
              <Select value={selectedTemplateId} onValueChange={handleApplyTemplate}>
                <SelectTrigger className="h-9 border-blue-200 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 transition-colors">
                  <SelectValue placeholder="Selecione um modelo para auto-preencher..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs font-semibold">
                      {t.title} ({t.checklist.length} itens)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 mb-2">
            <DialogHeader className="w-full">
              <DialogTitle asChild>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Título do processo (ex: Abertura - Padaria Silva)"
                  className="text-lg font-bold text-slate-800 border-0 border-b-2 border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 bg-transparent placeholder:text-slate-300"
                />
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Model existing flag */}
          {form.isModelo && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                Modelo / Template
              </span>
              {onClone && (
                <Button
                  onClick={() => {
                    onClone(form)
                    onClose()
                  }}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-bold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 gap-1.5 rounded-lg"
                >
                  <Copy className="h-3.5 w-3.5" /> Criar Processo a partir deste Modelo (Duplicar)
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Toggle / Switch to save as model */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-800 cursor-pointer block" htmlFor="save-model">
                Salvar como Modelo (Template)
              </Label>
              <span className="text-[10px] text-slate-400">Poderá ser selecionado como base para novos processos</span>
            </div>
            <Switch
              id="save-model"
              checked={form.isModelo}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, isModelo: checked }))}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Etiquetas</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const active = form.tags.includes(tag.name)
                return (
                  <button
                    key={tag.name}
                    onClick={() => toggleTag(tag.name)}
                    className={cn(
                      "px-3 py-1 text-[11px] font-bold rounded-full border transition-all",
                      active ? tag.color + " shadow-sm scale-105" : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick settings: Tipo, Prioridade, Responsavel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, status: v })}>
                <SelectTrigger className="h-10 border-slate-200 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Process["priority"] })}>
                <SelectTrigger className="h-10 border-slate-200 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Alta", "Média", "Baixa"].map((p) => (
                    <SelectItem key={p} value={p} className="text-xs font-semibold">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsável</Label>
              <Select value={form.responsibleId} onValueChange={(v) => setForm({ ...form, responsibleId: v })}>
                <SelectTrigger className="h-10 border-slate-200 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_MEMBERS.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs font-semibold">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Híbrido: Empresa Cliente */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Empresa Cliente</Label>
              <button
                type="button"
                onClick={() => {
                  setIsManualCompany(!isManualCompany)
                  setForm((f) => ({ ...f, clientId: undefined, company: "" }))
                }}
                className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider transition-colors"
              >
                {isManualCompany ? "Selecionar Cliente Existente" : "Digitar Nome Manualmente"}
              </button>
            </div>

            {isManualCompany ? (
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="h-10 border-slate-200 text-xs font-semibold rounded-xl"
                placeholder="Ex: Padaria Silva, Cliente Teste..."
              />
            ) : (
              <Select value={form.clientId || ""} onValueChange={handleClientSelect}>
                <SelectTrigger className="h-10 border-slate-200 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <SelectValue placeholder="Selecione um cliente cadastrado..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.length > 0 ? (
                    clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">
                        {c.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled className="text-xs text-slate-400">
                      Nenhum cliente cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Início</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="h-10 border-slate-200 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prazo Limite</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="h-10 border-slate-200 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Checklist</Label>
            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                placeholder="Adicionar item ao checklist..."
                className="h-10 border-slate-200 text-xs rounded-xl flex-1 focus-visible:ring-emerald-500"
              />
              <Button
                onClick={addCheckItem}
                size="icon"
                className="h-10 w-10 bg-emerald-500 hover:bg-emerald-600 rounded-xl shrink-0 shadow-sm"
              >
                <Plus className="h-4 w-4 text-white" />
              </Button>
            </div>
            {form.checklist.length > 0 && (
              <div className="space-y-2 bg-slate-50 rounded-xl p-3.5 border border-slate-100 max-h-48 overflow-y-auto">
                {form.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 group">
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={() => toggleCheckItem(item.id)}
                      className="border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <span className={cn("text-xs flex-1 text-slate-700", item.done && "line-through text-slate-400")}>
                      {item.label}
                    </span>
                    <button
                      onClick={() => removeCheckItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes + Progress */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Anotações e Histórico</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Registre observações, histórico e contatos relevantes..."
              className="border-slate-200 text-xs rounded-xl resize-none h-28 focus-visible:ring-emerald-500"
            />
            <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progresso Geral</span>
                <span className="text-sm font-black text-emerald-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5 bg-slate-200" />
              <p className="text-[10px] text-slate-400">
                {form.checklist.filter((i) => i.done).length} de {form.checklist.length} itens concluídos
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3 z-10">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200 text-xs font-semibold h-10 px-4">
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              try {
                await onSave(form)
                onClose()
              } catch (error) {
                console.error("Erro ao salvar no modal:", error)
              }
            }}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-10 px-5 gap-2 shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" /> Salvar Processo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function ProcessCard({
  process,
  onClick,
  onEdit,
  onDelete,
  onComplete,
  onArchive,
  onUseTemplate,
}: {
  process: Process
  onClick: () => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  onComplete: (e: React.MouseEvent) => void
  onArchive?: (e: React.MouseEvent) => void
  onUseTemplate?: (e: React.MouseEvent) => void
}) {
  const progress = calcProgress(process.checklist)
  const done = process.checklist.filter((i) => i.done).length
  const total = process.checklist.length
  const overdue = isOverdue(process.deadline)
  const isCompleted = progress === 100

  const responsible = TEAM_MEMBERS.find((u) => u.id === process.responsibleId) || TEAM_MEMBERS[0]

  return (
    <Card
      onClick={onClick}
      className={cn(
        "bg-white border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 rounded-xl group relative overflow-hidden",
        isCompleted && "opacity-75 border-emerald-200 bg-emerald-50/20",
        process.isModelo && "border-blue-200 bg-blue-50/15"
      )}
    >
      {/* Action buttons – visible on hover */}
      <div
        className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          title="Editar"
          onClick={onEdit}
          className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          title="Concluir"
          onClick={onComplete}
          className={cn(
            "p-1 rounded bg-white border shadow-sm transition-all",
            isCompleted
              ? "border-emerald-300 text-emerald-600 bg-emerald-50"
              : "border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300"
          )}
        >
          <CheckCircle2 className="h-3 w-3" />
        </button>
        {onArchive && (
          <button
            title={process.arquivado ? "Desarquivar" : "Arquivar"}
            onClick={onArchive}
            className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 shadow-sm transition-all"
          >
            <Archive className="h-3 w-3" />
          </button>
        )}
        <button
          title="Apagar"
          onClick={onDelete}
          className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 shadow-sm transition-all"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Badges / Tags row */}
        <div className="flex flex-wrap items-center gap-1 pr-24">
          {process.isModelo && (
            <span className="px-2 py-0.5 text-[8px] font-black rounded bg-blue-600 text-white uppercase tracking-wider shadow-sm animate-pulse">
              MODELO
            </span>
          )}
          {process.tags.slice(0, 2).map((tagName) => {
            const t = AVAILABLE_TAGS.find((x) => x.name === tagName)
            return (
              <span key={tagName} className={cn("px-2 py-0.5 text-[9px] font-bold rounded-full border", t?.color || "bg-slate-100 text-slate-500")}>
                {tagName}
              </span>
            )
          })}
          {process.tags.length > 2 && (
            <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 text-slate-500">+{process.tags.length - 2}</span>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <p className={cn("text-xs font-bold leading-snug", isCompleted ? "text-slate-400 line-through" : "text-slate-800")}>
            {process.title}
          </p>
          {!process.isModelo && (
            <p className="text-[10px] text-slate-400 font-medium truncate">{process.company || "Sem Empresa Vinculada"}</p>
          )}
        </div>

        {/* Action button inside card if it is a template */}
        {process.isModelo && onUseTemplate && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              onClick={onUseTemplate}
              className="w-full h-7 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Copy className="h-3 w-3" /> Usar Modelo <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Footer: Responsável + Prazo (only if not a pure model) */}
        {!process.isModelo && (
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-2">
            {/* Responsible visual */}
            <div className="flex items-center gap-1.5">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-sm", responsible.color)}>
                {responsible.initials}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[70px]">
                {responsible.name.split(" ")[0]}
              </span>
            </div>

            {/* Progress or Deadline alert */}
            <div className="flex flex-col items-end gap-1">
              {process.deadline && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border",
                  isCompleted 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : overdue 
                      ? "bg-red-50 text-red-600 border-red-200 animate-pulse font-extrabold" 
                      : "bg-slate-50 text-slate-500 border-slate-100"
                )}>
                  {overdue && !isCompleted && <AlertTriangle className="h-2.5 w-2.5" />}
                  {isCompleted ? "Concluído" : `Até ${new Date(process.deadline + "T12:00:00Z").toLocaleDateString("pt-BR")}`}
                </span>
              )}
              
              <div className="flex items-center gap-1">
                {total > 0 && <span className="text-[9px] font-black text-slate-400">{done}/{total}</span>}
                <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", isCompleted ? "bg-emerald-400" : "bg-emerald-500")}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export function LegalizacoesBoard() {
  const { toast } = useToast()
  const [processes, setProcesses] = useState<Process[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Process | null>(null)
  const [clientes, setClientes] = useState<Client[]>([])

  useEffect(() => {
    const collectionRef = collection(db, "legalizacoes")
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        console.debug("onSnapshot legalizacoes carregados:", snapshot.docs.length)
        const loadedProcesses: Process[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Partial<Process>
          return {
            id: docSnap.id,
            title: data.title ?? "",
            company: data.company ?? "",
            clientId: data.clientId,
            type: data.type ?? "abertura",
            priority: data.priority ?? "Média",
            status: data.status ?? "abertura",
            startDate: data.startDate ?? "",
            deadline: data.deadline ?? "",
            notes: data.notes ?? "",
            tags: data.tags ?? [],
            checklist: data.checklist ?? [],
            responsibleId: data.responsibleId ?? "u1",
            isModelo: data.isModelo ?? false,
            arquivado: data.arquivado ?? false,
          }
        })
        setProcesses(loadedProcesses)
      },
      (error) => {
        console.error("Erro ao carregar legalizações:", error)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    async function loadClientes() {
      try {
        const collectionNames = ["clients", "clientes"]
        for (const collectionName of collectionNames) {
          const snapshot = await getDocs(collection(db, collectionName))
          if (!snapshot.empty) {
            const loadedClients = snapshot.docs.map((docSnap) => {
              const data = docSnap.data() as Record<string, any>
              return {
                id: docSnap.id,
                name:
                  data.nomeFantasia ||
                  data.razaoSocial ||
                  data.name ||
                  data.company ||
                  data.empresa ||
                  docSnap.id,
              }
            })
            setClientes(loadedClients)
            return
          }
        }
        setClientes([])
      } catch (error) {
        console.error("Erro ao carregar clientes:", error)
      }
    }

    loadClientes()
  }, [])

  // Filters State
  const [searchTerm, setSearchTerm] = useState("")
  const [filterResponsible, setFilterResponsible] = useState("todos")
  const [filterDeadline, setFilterDeadline] = useState("todos")
  const [activeTab, setActiveTab] = useState<"ativos" | "historico" | "arquivados" | "modelos">("ativos")

  const openNew = (defaultStatus?: string) => {
    setSelected(defaultStatus ? {
      id: "",
      title: "",
      company: "",
      type: defaultStatus,
      priority: "Média",
      status: defaultStatus,
      startDate: "",
      deadline: "",
      notes: "",
      tags: [],
      checklist: [],
      responsibleId: "u1",
      isModelo: false,
      arquivado: false,
    } : null)
    setModalOpen(true)
  }

  const openEdit = (p: Process) => {
    setSelected(p)
    setModalOpen(true)
  }

  const handleSave = async (p: Process) => {
    console.debug("LegalizacoesBoard handleSave init", p)
    try {
      if (!p.id) {
        const docRef = await addDoc(collection(db, "legalizacoes"), {
          title: p.title,
          company: p.company,
          clientId: p.clientId ?? null,
          type: p.type,
          priority: p.priority,
          status: p.status,
          startDate: p.startDate,
          deadline: p.deadline,
          notes: p.notes,
          tags: p.tags,
          checklist: p.checklist,
          responsibleId: p.responsibleId,
          isModelo: p.isModelo,
          arquivado: p.arquivado,
        })
        console.debug("Documento criado em legalizacoes:", docRef.id)
        setProcesses((prev) => [...prev, { ...p, id: docRef.id }])
        toast({
          title: "Processo Criado!",
          description: `"${p.title}" foi salvo com sucesso.`,
        })
      } else {
        await updateDoc(doc(db, "legalizacoes", p.id), {
          title: p.title,
          company: p.company,
          clientId: p.clientId ?? null,
          type: p.type,
          priority: p.priority,
          status: p.status,
          startDate: p.startDate,
          deadline: p.deadline,
          notes: p.notes,
          tags: p.tags,
          checklist: p.checklist,
          responsibleId: p.responsibleId,
          isModelo: p.isModelo,
          arquivado: p.arquivado,
        })
        console.debug("Documento atualizado em legalizacoes:", p.id)
        setProcesses((prev) => prev.map((x) => (x.id === p.id ? p : x)))
        toast({
          title: "Processo Atualizado!",
          description: `"${p.title}" foi atualizado com sucesso.`,
        })
      }
    } catch (error) {
      console.error("Erro ao salvar processo:", error)
      console.error("Erro detalhado do Firebase:", error)
      toast({
        title: "Erro ao Salvar",
        description: "Ocorreu um erro ao salvar o processo. Verifique o console.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    const process = processes.find((p) => p.id === id)
    try {
      await deleteDoc(doc(db, "legalizacoes", id))
      toast({
        title: "Processo Removido",
        description: `"${process?.title}" foi deletado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao deletar processo:", error)
      toast({
        title: "Erro ao Deletar",
        description: "Ocorreu um erro ao deletar o processo.",
        variant: "destructive",
      })
    }
  }

  const handleComplete = async (id: string) => {
    const process = processes.find((p) => p.id === id)
    if (!process) return

    const progress = calcProgress(process.checklist)
    const allDone = progress === 100
    const updated = {
      ...process,
      checklist: process.checklist.map((item) => ({ ...item, done: !allDone })),
    }

    setProcesses((prev) => prev.map((p) => (p.id === id ? updated : p)))

    try {
      await updateDoc(doc(db, "legalizacoes", id), updated)
      toast({
        title: allDone ? "Processo Reaberto" : "Processo Concluído",
        description: `"${process.title}" foi ${allDone ? "reaberto" : "marcado como concluído"}.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar conclusão do processo:", error)
      toast({
        title: "Erro ao Atualizar",
        description: "Ocorreu um erro ao atualizar o processo.",
        variant: "destructive",
      })
    }
  }

  const handleToggleArchive = async (id: string) => {
    const process = processes.find((p) => p.id === id)
    if (!process) return

    const updated = { ...process, arquivado: !process.arquivado }
    setProcesses((prev) => prev.map((p) => (p.id === id ? updated : p)))

    try {
      await updateDoc(doc(db, "legalizacoes", id), updated)
      toast({
        title: process.arquivado ? "Processo Restaurado" : "Processo Arquivado",
        description: `"${process.title}" foi ${process.arquivado ? "restaurado" : "arquivado"} com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar arquivo do processo:", error)
      toast({
        title: "Erro ao Arquivar",
        description: "Ocorreu um erro ao arquivar o processo.",
        variant: "destructive",
      })
    }
  }

  const handleCloneFromTemplate = (template: Process) => {
    // Clone process without dates and company names
    const cloned: Process = {
      ...template,
      id: "",
      title: `${template.title} (Novo)`,
      company: "",
      clientId: undefined,
      startDate: "",
      deadline: "",
      checklist: template.checklist.map((item) => ({ ...item, id: crypto.randomUUID(), done: false })),
      isModelo: false,
      arquivado: false,
    }
    setSelected(cloned)
    setModalOpen(true)
  }

  // Get templates only list for modal dropdown
  const allTemplates = useMemo(() => {
    return processes.filter((p) => p.isModelo)
  }, [processes])

  // Filtered Cards base logic
  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      // 1. Tab check
      if (activeTab === "arquivados") {
        if (!p.arquivado) return false
      } else if (activeTab === "historico") {
        // Concluded: checklist progress is 100% and not archived
        if (calcProgress(p.checklist) !== 100 || p.arquivado || p.isModelo) return false
      } else if (activeTab === "modelos") {
        // Only library templates
        if (!p.isModelo) return false
      } else {
        // Ativos: not concluded (or active board), not archived, not templates
        if (calcProgress(p.checklist) === 100 || p.arquivado || p.isModelo) return false
      }

      // 2. Search term check
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.company.toLowerCase().includes(searchTerm.toLowerCase())

      // 3. Responsible filter check
      const matchesResponsible =
        filterResponsible === "todos" || p.responsibleId === filterResponsible

      // 4. Deadline filter check
      let matchesDeadline = true
      const todayStr = new Date().toISOString().split("T")[0]
      
      if (filterDeadline === "hoje") {
        matchesDeadline = p.deadline === todayStr
      } else if (filterDeadline === "atrasado") {
        matchesDeadline = isOverdue(p.deadline) && calcProgress(p.checklist) < 100
      } else if (filterDeadline === "prazo") {
        matchesDeadline = !isOverdue(p.deadline) && !!p.deadline
      }

      return matchesSearch && matchesResponsible && matchesDeadline
    })
  }, [processes, activeTab, searchTerm, filterResponsible, filterDeadline])

  // Summary stats (Based on active, non-archived, non-template items)
  const nonArchived = processes.filter((p) => !p.arquivado && !p.isModelo)
  const total = nonArchived.length
  const inProgress = nonArchived.filter((p) => {
    const prog = calcProgress(p.checklist)
    return prog > 0 && prog < 100
  }).length
  const concluded = nonArchived.filter((p) => calcProgress(p.checklist) === 100).length
  const overdue = nonArchived.filter((p) => isOverdue(p.deadline) && calcProgress(p.checklist) < 100).length

  const stats = [
    { label: "Total de Processos", value: total, icon: FileSignature, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { label: "Em Andamento", value: inProgress, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Concluídos", value: concluded, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { label: "Atrasados", value: overdue, icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500 rounded-xl shadow-sm">
            <Building2 className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Legalizações</h1>
            <p className="text-xs text-slate-400 font-medium">Aberturas · Alterações · Baixas · Alvarás</p>
          </div>
        </div>
        <Button
          onClick={() => openNew()}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl gap-2 shadow-sm h-11 px-5"
        >
          <Plus className="h-4 w-4" /> Novo Processo
        </Button>
      </div>

      {/* Abas de Visualização (Ativos, Histórico, Arquivados, Modelos) */}
      <div className="flex border-b border-slate-200 gap-1.5 pb-px overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab("ativos")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "ativos"
              ? "border-emerald-500 text-emerald-600 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Clock className="h-4 w-4" /> Ativos
        </button>
        <button
          onClick={() => setActiveTab("historico")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "historico"
              ? "border-emerald-500 text-emerald-600 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <CheckCircle2 className="h-4 w-4" /> Histórico Concluídos
        </button>
        <button
          onClick={() => setActiveTab("modelos")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "modelos"
              ? "border-emerald-500 text-emerald-600 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <BookOpen className="h-4 w-4" /> Modelos (Biblioteca)
        </button>
        <button
          onClick={() => setActiveTab("arquivados")}
          className={cn(
            "px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "arquivados"
              ? "border-emerald-500 text-emerald-600 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Archive className="h-4 w-4" /> Arquivados
        </button>
      </div>

      {/* Summary KPI Cards */}
      {activeTab !== "modelos" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
          {stats.map((s) => (
            <div key={s.label} className={cn("flex items-center gap-4 p-4 rounded-2xl border bg-white shadow-sm transition-transform hover:scale-[1.01]", s.color.split(" ").slice(1).join(" "))}>
              <div className={cn("p-2.5 rounded-xl shrink-0", s.color.split(" ")[1])}>
                <s.icon className={cn("h-5 w-5", s.color.split(" ")[0])} />
              </div>
              <div>
                <p className={cn("text-2xl font-black leading-none mb-1", s.color.split(" ")[0])}>{s.value}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros Dropdown e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por título..."
            className="pl-9 h-10 border-slate-200 text-xs rounded-xl focus-visible:ring-emerald-500 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Responsável Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterResponsible}
              onChange={(e) => setFilterResponsible(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 outline-none pr-1"
            >
              <option value="todos">Todos Responsáveis</option>
              {TEAM_MEMBERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prazo Dropdown */}
          {activeTab !== "modelos" && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={filterDeadline}
                onChange={(e) => setFilterDeadline(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 outline-none pr-1"
              >
                <option value="todos">Todos os Prazos</option>
                <option value="hoje">Vencendo Hoje</option>
                <option value="atrasado">Atrasados</option>
                <option value="prazo">No Prazo</option>
              </select>
            </div>
          )}

          {/* Reset Filters button */}
          {(searchTerm || filterResponsible !== "todos" || filterDeadline !== "todos") && (
            <Button
              onClick={() => {
                setSearchTerm("")
                setFilterResponsible("todos")
                setFilterDeadline("todos")
              }}
              variant="ghost"
              className="text-xs font-bold text-red-500 hover:text-red-600 gap-1.5 h-8 px-2.5 rounded-lg"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Board Container */}
      <ScrollArea className="w-full whitespace-nowrap rounded-xl pb-4">
        <div className="flex gap-4 p-1">
          {COLUMNS.map((col) => {
            const cards = filteredProcesses.filter((p) => p.status === col.id)
            return (
              <div
                key={col.id}
                className={cn(
                  "w-[290px] flex-shrink-0 flex flex-col gap-3 bg-slate-50 rounded-2xl p-3 min-h-[520px] border-t-4 shadow-sm border border-slate-100 transition-all",
                  col.color
                )}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wider whitespace-normal leading-snug flex-1">
                    {col.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-black text-slate-500 bg-white rounded-full px-2 py-0.5 border border-slate-200 shadow-sm">
                      {cards.length}
                    </span>
                    <button
                      title="Novo processo nesta coluna"
                      onClick={() => openNew(col.id)}
                      className="h-6 w-6 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-400 shadow-sm transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Column Cards list */}
                <div className="flex flex-col gap-2.5 flex-1 whitespace-normal">
                  {cards.map((p) => (
                    <ProcessCard
                      key={p.id}
                      process={p}
                      onClick={() => openEdit(p)}
                      onEdit={(e) => { e.stopPropagation(); openEdit(p) }}
                      onDelete={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                      onComplete={(e) => { e.stopPropagation(); handleComplete(p.id) }}
                      onArchive={(e) => { e.stopPropagation(); handleToggleArchive(p.id) }}
                      onUseTemplate={(e) => { e.stopPropagation(); handleCloneFromTemplate(p) }}
                    />
                  ))}
                  {cards.length === 0 && (
                    <button
                      onClick={() => openNew(col.id)}
                      className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-300 min-h-[140px] hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/5 transition-all group/empty"
                    >
                      <Plus className="h-5 w-5 group-hover/empty:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Adicionar</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Detail Dialog Modal */}
      <ProcessModal
        open={modalOpen}
        process={selected}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onClone={handleCloneFromTemplate}
        templates={allTemplates}
        clientes={clientes}
      />
    </div>
  )
}
