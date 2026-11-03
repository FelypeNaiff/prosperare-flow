"use client"

import { useEffect, useState } from "react"
import { arrayUnion, doc, updateDoc, type DocumentData, type UpdateData } from "firebase/firestore"
import { CalendarClock, CheckCircle2, History, Loader2, RotateCcw, Save, Send } from "lucide-react"

import { useFirestore } from "@/firebase"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type DeliveryAction = "sent" | "resent"

type DeliveryEvent = {
  action: DeliveryAction
  sentAt: string
  parcelNumber: number
  deadline: string
}

type InstallmentPaymentModalProps = {
  installment: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formatDateTime = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR")
}

export function InstallmentPaymentModal({ installment, open, onOpenChange }: InstallmentPaymentModalProps) {
  const firestore = useFirestore()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    currentParcel: "1",
    totalParcels: "1",
    value: "",
    dueDay: "",
    sendDeadline: "",
  })

  useEffect(() => {
    if (!installment || !open) return
    setFormData({
      currentParcel: String(installment.currentParcel || 1),
      totalParcels: String(installment.totalParcels || 1),
      value: String(installment.value || ""),
      dueDay: String(installment.dueDay || ""),
      sendDeadline: installment.sendDeadline || "",
    })
  }, [installment, open])

  if (!installment) return null

  const validate = () => {
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

  const persist = async (action?: DeliveryAction) => {
    const validationError = validate()
    if (validationError) {
      toast({ title: "Revise os dados", description: validationError, variant: "destructive" })
      return
    }

    setIsSaving(true)
    const now = new Date().toISOString()
    const currentParcel = Number(formData.currentParcel)
    const baseUpdate: UpdateData<DocumentData> = {
      currentParcel,
      totalParcels: Number(formData.totalParcels),
      value: Number(formData.value),
      dueDay: Number(formData.dueDay),
      sendDeadline: formData.sendDeadline,
      updatedAt: now,
    }

    if (action) {
      const event: DeliveryEvent = {
        action,
        sentAt: now,
        parcelNumber: currentParcel,
        deadline: formData.sendDeadline,
      }
      baseUpdate.lastSentAt = now
      baseUpdate.lastDeliveryAction = action
      baseUpdate.deliveryCount = Number(installment.deliveryCount || 0) + 1
      baseUpdate.deliveryHistory = arrayUnion(event)
    }

    try {
      await updateDoc(doc(firestore, "installments", installment.id), baseUpdate)
      toast({
        title: action === "resent" ? "Parcela marcada como reenviada" : action === "sent" ? "Parcela marcada como enviada" : "Parcela atualizada",
        description: action ? `O registro da parcela ${currentParcel} foi incluído no histórico.` : "As informações foram salvas com sucesso.",
      })
      onOpenChange(false)
    } catch {
      toast({ title: "Não foi possível salvar", description: "Confira sua conexão e tente novamente.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const deliveryHistory = Array.isArray(installment.deliveryHistory)
    ? ([...installment.deliveryHistory] as DeliveryEvent[]).reverse().slice(0, 5)
    : []

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="border-b bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#2563EB]/10 p-2.5 text-[#2563EB]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-[#2C4156]">Evolução e envio da parcela</DialogTitle>
              <DialogDescription className="mt-1">
                {installment.clientName} · {installment.tipo}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-6 overflow-y-auto p-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#39586D]">Dados da parcela</h3>
              <Badge variant="outline">{installment.status || "Sem status"}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="payment-current-parcel">Parcela atual</Label>
                <Input id="payment-current-parcel" type="number" min="1" value={formData.currentParcel} onChange={(event) => setFormData((current) => ({ ...current, currentParcel: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-total-parcels">Total</Label>
                <Input id="payment-total-parcels" type="number" min="1" value={formData.totalParcels} onChange={(event) => setFormData((current) => ({ ...current, totalParcels: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-value">Valor (R$)</Label>
                <Input id="payment-value" type="number" min="0.01" step="0.01" value={formData.value} onChange={(event) => setFormData((current) => ({ ...current, value: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-due-day">Dia do vencimento</Label>
                <Input id="payment-due-day" type="number" min="1" max="31" value={formData.dueDay} onChange={(event) => setFormData((current) => ({ ...current, dueDay: event.target.value }))} />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-[#2563EB]/15 bg-[#2563EB]/5 p-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#39586D]">Controle de envio</h3>
              <p className="mt-1 text-xs text-[#71818D]">Defina o prazo e registre quando a parcela for encaminhada ao cliente.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="payment-send-deadline">Prazo para envio</Label>
                <Input id="payment-send-deadline" type="date" value={formData.sendDeadline} onChange={(event) => setFormData((current) => ({ ...current, sendDeadline: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" className="bg-[#2563EB]" disabled={isSaving} onClick={() => persist("sent")}>
                  <Send className="mr-2 h-4 w-4" /> Enviada
                </Button>
                <Button type="button" variant="outline" disabled={isSaving} onClick={() => persist("resent")}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reenviada
                </Button>
              </div>
            </div>
            {installment.lastSentAt ? (
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-[#39586D]">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Último envio em <strong>{formatDateTime(installment.lastSentAt)}</strong>
              </div>
            ) : null}
          </section>

          {deliveryHistory.length > 0 ? (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#39586D]"><History className="h-4 w-4" /> Histórico recente</h3>
              <div className="divide-y rounded-xl border bg-white">
                {deliveryHistory.map((event, index) => (
                  <div className="flex items-center justify-between gap-3 p-3 text-xs" key={`${event.sentAt}-${index}`}>
                    <div>
                      <strong className="text-[#2C4156]">Parcela {event.parcelNumber}</strong>
                      <p className="text-[#71818D]">{event.action === "resent" ? "Reenviada" : "Enviada"} em {formatDateTime(event.sentAt)}</p>
                    </div>
                    <span className="text-right text-[#71818D]">Prazo: {event.deadline ? new Date(`${event.deadline}T12:00:00`).toLocaleDateString("pt-BR") : "não definido"}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <DialogFooter className="border-t bg-[#F7F7F7] p-5">
          <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" disabled={isSaving} onClick={() => persist()}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
