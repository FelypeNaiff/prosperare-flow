"use client"

import { useEffect, useMemo, useState } from "react"
import { arrayUnion, doc, runTransaction, updateDoc, type DocumentData, type UpdateData } from "firebase/firestore"
import { CalendarClock, CheckCircle2, History, Loader2, Pencil, RotateCcw, Save, Send, Trash2, X } from "lucide-react"

import { useFirestore, useUser } from "@/firebase"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DeliveryAction = "sent" | "resent"

type DeliveryEvent = {
  id?: string
  action: DeliveryAction
  sentAt: string
  recordedAt?: string
  parcelNumber: number
  deadline?: string
  sentById?: string | null
  sentByName?: string
  updatedAt?: string
  updatedById?: string | null
  updatedByName?: string
}

type EditEventState = {
  index: number
  original: DeliveryEvent
  action: DeliveryAction
  sentDate: string
  parcelNumber: string
} | null

type InstallmentPaymentModalProps = {
  installment: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const todayInputValue = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const toDateInputValue = (value?: string) => {
  if (!value) return ""
  return value.slice(0, 10)
}

const toSentAt = (date: string) => new Date(`${date}T12:00:00`).toISOString()

const formatDate = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR")
}

const formatDateTime = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR")
}

const isAfterMonthlyDeadline = (value?: string) => {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getDate() > 25
}

const findCurrentEventIndex = (events: DeliveryEvent[], expected: DeliveryEvent, fallbackIndex: number) => {
  if (expected.id) return events.findIndex(event => event.id === expected.id)
  const matchedIndex = events.findIndex(event =>
    event.sentAt === expected.sentAt
    && event.parcelNumber === expected.parcelNumber
    && event.action === expected.action
  )
  if (matchedIndex >= 0) return matchedIndex
  const fallback = events[fallbackIndex]
  return fallback?.sentAt === expected.sentAt ? fallbackIndex : -1
}

export function InstallmentPaymentModal({ installment, open, onOpenChange }: InstallmentPaymentModalProps) {
  const firestore = useFirestore()
  const { selectedUser, userData } = useUser()
  const actor = selectedUser || userData
  const actorName = actor?.fullName || actor?.email || "Usuário não identificado"
  const actorId = actor?.id || actor?.uid || null

  const [isSaving, setIsSaving] = useState(false)
  const [history, setHistory] = useState<DeliveryEvent[]>([])
  const [editEvent, setEditEvent] = useState<EditEventState>(null)
  const [formData, setFormData] = useState({
    currentParcel: "1",
    totalParcels: "1",
    value: "",
    dueDay: "",
    sendDate: todayInputValue(),
    deliveryParcelNumber: "1",
  })

  useEffect(() => {
    if (!installment || !open) return
    const currentParcel = String(installment.currentParcel || 1)
    setFormData({
      currentParcel,
      totalParcels: String(installment.totalParcels || 1),
      value: String(installment.value || ""),
      dueDay: String(installment.dueDay || ""),
      sendDate: todayInputValue(),
      deliveryParcelNumber: currentParcel,
    })
    setHistory(Array.isArray(installment.deliveryHistory) ? installment.deliveryHistory : [])
    setEditEvent(null)
  }, [installment, open])

  const recentHistory = useMemo(
    () => history.map((event, index) => ({ event, index })).reverse().slice(0, 10),
    [history]
  )

  if (!installment) return null

  const validateInstallment = () => {
    const currentParcel = Number(formData.currentParcel)
    const totalParcels = Number(formData.totalParcels)
    const value = Number(formData.value)
    const dueDay = Number(formData.dueDay)

    if (!Number.isInteger(currentParcel) || currentParcel < 1) return "Informe uma parcela atual válida."
    if (!Number.isInteger(totalParcels) || totalParcels < 1) return "Informe a quantidade total de parcelas."
    if (currentParcel > totalParcels) return "A parcela atual não pode superar o total de parcelas."
    if (!Number.isFinite(value) || value <= 0) return "Informe um valor de parcela válido."
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return "O vencimento deve estar entre os dias 1 e 31."
    return null
  }

  const validateDelivery = () => {
    const parcelNumber = Number(formData.deliveryParcelNumber)
    const totalParcels = Number(formData.totalParcels)
    if (!formData.sendDate) return "Informe a data de envio."
    if (!Number.isInteger(parcelNumber) || parcelNumber < 1) return "Informe o número da parcela enviada."
    if (parcelNumber > totalParcels) return "A parcela enviada não pode superar o total de parcelas."
    return null
  }

  const persist = async (action?: DeliveryAction) => {
    const validationError = validateInstallment() || (action ? validateDelivery() : null)
    if (validationError) {
      toast({ title: "Revise os dados", description: validationError, variant: "destructive" })
      return
    }

    setIsSaving(true)
    const now = new Date().toISOString()
    const installmentRef = doc(firestore, "installments", installment.id)
    const baseUpdate: UpdateData<DocumentData> = {
      currentParcel: Number(formData.currentParcel),
      totalParcels: Number(formData.totalParcels),
      value: Number(formData.value),
      dueDay: Number(formData.dueDay),
      monthlySendDeadlineDay: 25,
      updatedAt: now,
      updatedById: actorId,
      updatedByName: actorName,
    }

    try {
      if (action) {
        const event: DeliveryEvent = {
          id: crypto.randomUUID(),
          action,
          sentAt: toSentAt(formData.sendDate),
          recordedAt: now,
          parcelNumber: Number(formData.deliveryParcelNumber),
          sentById: actorId,
          sentByName: actorName,
        }
        await runTransaction(firestore, async transaction => {
          const snapshot = await transaction.get(installmentRef)
          if (!snapshot.exists()) throw new Error("Parcelamento não localizado")
          const currentHistory = Array.isArray(snapshot.data().deliveryHistory) ? snapshot.data().deliveryHistory : []
          transaction.update(installmentRef, {
            ...baseUpdate,
            deliveryHistory: [...currentHistory, event],
            deliveryCount: currentHistory.length + 1,
            lastSentAt: event.sentAt,
            lastDeliveryAction: event.action,
            lastSentById: actorId,
            lastSentByName: actorName,
          })
        })
        setHistory(current => [...current, event])
      } else {
        await updateDoc(installmentRef, baseUpdate)
      }

      toast({
        title: action === "resent" ? "Parcela marcada como reenviada" : action === "sent" ? "Parcela marcada como enviada" : "Parcela atualizada",
        description: action ? `A parcela ${formData.deliveryParcelNumber} foi registrada por ${actorName}.` : "As informações foram salvas com sucesso.",
      })
      if (!action) onOpenChange(false)
    } catch (error) {
      console.error("Falha ao salvar controle de envio:", error)
      toast({ title: "Não foi possível salvar", description: "Confira sua conexão e tente novamente.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const saveHistoryEdit = async () => {
    if (!editEvent) return
    const parcelNumber = Number(editEvent.parcelNumber)
    if (!editEvent.sentDate || !Number.isInteger(parcelNumber) || parcelNumber < 1 || parcelNumber > Number(formData.totalParcels)) {
      toast({ title: "Revise os dados do histórico", variant: "destructive" })
      return
    }

    setIsSaving(true)
    const installmentRef = doc(firestore, "installments", installment.id)
    const changedAt = new Date().toISOString()
    try {
      let updatedHistory: DeliveryEvent[] = []
      await runTransaction(firestore, async transaction => {
        const snapshot = await transaction.get(installmentRef)
        if (!snapshot.exists()) throw new Error("Parcelamento não localizado")
        updatedHistory = Array.isArray(snapshot.data().deliveryHistory) ? [...snapshot.data().deliveryHistory] : []
        const currentIndex = findCurrentEventIndex(updatedHistory, editEvent.original, editEvent.index)
        const previous = updatedHistory[currentIndex]
        if (!previous) throw new Error("Registro de envio não localizado")
        const updated: DeliveryEvent = {
          ...previous,
          id: previous.id || crypto.randomUUID(),
          action: editEvent.action,
          sentAt: toSentAt(editEvent.sentDate),
          parcelNumber,
          updatedAt: changedAt,
          updatedById: actorId,
          updatedByName: actorName,
        }
        updatedHistory[currentIndex] = updated
        const latest = updatedHistory.at(-1)
        transaction.update(installmentRef, {
          deliveryHistory: updatedHistory,
          lastSentAt: latest?.sentAt || null,
          lastDeliveryAction: latest?.action || null,
          lastSentById: latest?.sentById || null,
          lastSentByName: latest?.sentByName || "Usuário não registrado",
          deliveryAuditHistory: arrayUnion({
            id: crypto.randomUUID(),
            action: "edited",
            eventId: updated.id,
            before: previous,
            after: updated,
            changedAt,
            changedById: actorId,
            changedByName: actorName,
          }),
          updatedAt: changedAt,
          updatedById: actorId,
          updatedByName: actorName,
        })
      })
      setHistory(updatedHistory)
      setEditEvent(null)
      toast({ title: "Histórico atualizado", description: `Alteração registrada em nome de ${actorName}.` })
    } catch (error) {
      console.error("Falha ao editar histórico de envio:", error)
      toast({ title: "Não foi possível editar o histórico", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteHistoryEvent = async (index: number, expected: DeliveryEvent) => {
    if (!window.confirm("Excluir este registro do histórico? A exclusão continuará registrada na auditoria.")) return
    setIsSaving(true)
    const installmentRef = doc(firestore, "installments", installment.id)
    const changedAt = new Date().toISOString()
    try {
      let updatedHistory: DeliveryEvent[] = []
      await runTransaction(firestore, async transaction => {
        const snapshot = await transaction.get(installmentRef)
        if (!snapshot.exists()) throw new Error("Parcelamento não localizado")
        updatedHistory = Array.isArray(snapshot.data().deliveryHistory) ? [...snapshot.data().deliveryHistory] : []
        const currentIndex = findCurrentEventIndex(updatedHistory, expected, index)
        if (currentIndex < 0) throw new Error("Registro de envio não localizado")
        const [removed] = updatedHistory.splice(currentIndex, 1)
        if (!removed) throw new Error("Registro de envio não localizado")
        const latest = updatedHistory.at(-1)
        transaction.update(installmentRef, {
          deliveryHistory: updatedHistory,
          deliveryCount: updatedHistory.length,
          lastSentAt: latest?.sentAt || null,
          lastDeliveryAction: latest?.action || null,
          lastSentById: latest?.sentById || null,
          lastSentByName: latest?.sentByName || null,
          deliveryAuditHistory: arrayUnion({
            id: crypto.randomUUID(),
            action: "deleted",
            eventId: removed.id || null,
            before: removed,
            changedAt,
            changedById: actorId,
            changedByName: actorName,
          }),
          updatedAt: changedAt,
          updatedById: actorId,
          updatedByName: actorName,
        })
      })
      setHistory(updatedHistory)
      setEditEvent(null)
      toast({ title: "Registro excluído", description: `A exclusão foi auditada em nome de ${actorName}.` })
    } catch (error) {
      console.error("Falha ao excluir histórico de envio:", error)
      toast({ title: "Não foi possível excluir o registro", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const latestEvent = history.at(-1)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="border-b bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#2563EB]/10 p-2.5 text-[#2563EB]"><CalendarClock className="h-5 w-5" /></div>
            <div>
              <DialogTitle className="text-xl font-black text-[#2C4156]">Evolução e envio da parcela</DialogTitle>
              <DialogDescription className="mt-1">{installment.clientName} · {installment.tipo}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#39586D]">Dados da parcela</h3>
              <Badge variant="outline">{installment.status || "Sem status"}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-2"><Label htmlFor="payment-current-parcel">Parcela atual</Label><Input id="payment-current-parcel" type="number" min="1" value={formData.currentParcel} onChange={event => setFormData(current => ({ ...current, currentParcel: event.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="payment-total-parcels">Total</Label><Input id="payment-total-parcels" type="number" min="1" value={formData.totalParcels} onChange={event => setFormData(current => ({ ...current, totalParcels: event.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="payment-value">Valor (R$)</Label><Input id="payment-value" type="number" min="0.01" step="0.01" value={formData.value} onChange={event => setFormData(current => ({ ...current, value: event.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="payment-due-day">Dia do vencimento</Label><Input id="payment-due-day" type="number" min="1" max="31" value={formData.dueDay} onChange={event => setFormData(current => ({ ...current, dueDay: event.target.value }))} /></div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-[#2563EB]/15 bg-[#2563EB]/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-xs font-black uppercase tracking-wider text-[#39586D]">Controle de envio</h3><p className="mt-1 text-xs text-[#71818D]">Registre a parcela e a data em que ela foi encaminhada ao cliente.</p></div>
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Prazo mensal: dia 25</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="payment-delivery-parcel">Número da parcela enviada</Label><Input id="payment-delivery-parcel" type="number" min="1" max={formData.totalParcels} value={formData.deliveryParcelNumber} onChange={event => setFormData(current => ({ ...current, deliveryParcelNumber: event.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="payment-send-date">Data de envio</Label><Input id="payment-send-date" type="date" value={formData.sendDate} onChange={event => setFormData(current => ({ ...current, sendDate: event.target.value }))} /></div>
            </div>
            {isAfterMonthlyDeadline(toSentAt(formData.sendDate)) ? <p className="text-xs font-semibold text-amber-700">Esta data está após o prazo mensal do dia 25.</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" className="bg-[#2563EB]" disabled={isSaving} onClick={() => persist("sent")}><Send className="mr-2 h-4 w-4" /> Enviada</Button>
              <Button type="button" variant="outline" disabled={isSaving} onClick={() => persist("resent")}><RotateCcw className="mr-2 h-4 w-4" /> Reenviada</Button>
            </div>
            {latestEvent ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-[#39586D]">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Último envio em <strong>{formatDate(latestEvent.sentAt)}</strong> por <strong>{latestEvent.sentByName || "Usuário não registrado"}</strong>
              </div>
            ) : null}
          </section>

          {recentHistory.length > 0 ? (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#39586D]"><History className="h-4 w-4" /> Histórico recente</h3>
              <div className="divide-y rounded-xl border bg-white">
                {recentHistory.map(({ event, index }) => {
                  const isEditing = editEvent?.index === index
                  return (
                    <div className="p-3 text-xs" key={event.id || `${event.sentAt}-${index}`}>
                      {isEditing && editEvent ? (
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end">
                          <div className="space-y-1"><Label>Parcela</Label><Input type="number" min="1" max={formData.totalParcels} value={editEvent.parcelNumber} onChange={e => setEditEvent(current => current ? { ...current, parcelNumber: e.target.value } : current)} /></div>
                          <div className="space-y-1"><Label>Data</Label><Input type="date" value={editEvent.sentDate} onChange={e => setEditEvent(current => current ? { ...current, sentDate: e.target.value } : current)} /></div>
                          <div className="space-y-1"><Label>Tipo</Label><Select value={editEvent.action} onValueChange={(value: DeliveryAction) => setEditEvent(current => current ? { ...current, action: value } : current)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sent">Enviada</SelectItem><SelectItem value="resent">Reenviada</SelectItem></SelectContent></Select></div>
                          <div className="flex gap-1"><Button size="icon" disabled={isSaving} onClick={saveHistoryEdit} aria-label="Salvar edição"><Save className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => setEditEvent(null)} aria-label="Cancelar edição"><X className="h-4 w-4" /></Button></div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <strong className="text-[#2C4156]">Parcela {event.parcelNumber}</strong>
                            <p className="text-[#71818D]">{event.action === "resent" ? "Reenviada" : "Enviada"} em {formatDate(event.sentAt)} por {event.sentByName || "Usuário não registrado"}</p>
                            {event.updatedAt ? <p className="mt-1 text-[10px] text-amber-700">Editado por {event.updatedByName || "Usuário não registrado"} em {formatDateTime(event.updatedAt)}</p> : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={isAfterMonthlyDeadline(event.sentAt) ? "border-amber-300 text-amber-700" : "border-emerald-300 text-emerald-700"}>{isAfterMonthlyDeadline(event.sentAt) ? "Após dia 25" : "No prazo"}</Badge>
                            <Button size="icon" variant="ghost" disabled={isSaving} onClick={() => setEditEvent({ index, original: event, action: event.action, sentDate: toDateInputValue(event.sentAt), parcelNumber: String(event.parcelNumber) })} aria-label="Editar registro"><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-red-600" disabled={isSaving} onClick={() => deleteHistoryEvent(index, event)} aria-label="Excluir registro"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}
        </div>

        <DialogFooter className="border-t bg-[#F7F7F7] p-5">
          <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" disabled={isSaving} onClick={() => persist()}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
