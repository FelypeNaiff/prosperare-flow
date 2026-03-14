
"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  PenTool, 
  Mail, 
  CheckCircle2, 
  Loader2, 
  Smartphone,
  ShieldCheck
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  recipientName: string;
  recipientEmail: string;
}

export function SignatureDialog({ 
  open, 
  onOpenChange, 
  documentTitle, 
  recipientName, 
  recipientEmail 
}: SignatureDialogProps) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    setLoading(true)
    // Simulando integração com ZapSign/Clicksign
    setTimeout(() => {
      setLoading(false)
      setSent(true)
      toast({
        title: "Documento enviado!",
        description: "O link de assinatura foi encaminhado para o e-mail informado.",
      })
    }, 2000)
  }

  const reset = () => {
    setSent(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        {!sent ? (
          <>
            <DialogHeader>
              <div className="w-12 h-12 rounded-full bg-[#1FA67A]/10 flex items-center justify-center mb-2">
                <PenTool className="h-6 w-6 text-[#1FA67A]" />
              </div>
              <DialogTitle className="text-xl font-black text-[#2C4156]">Assinatura Digital</DialogTitle>
              <DialogDescription>
                Enviar <strong>{documentTitle}</strong> para assinatura eletrônica via ZapSign.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">Nome do Signatário</Label>
                <Input defaultValue={recipientName} className="border-[#D2D7DB]" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">E-mail de Destino</Label>
                <Input defaultValue={recipientEmail} className="border-[#D2D7DB]" />
              </div>
              <div className="p-3 bg-[#F7F7F7] rounded-lg flex items-start gap-3 border">
                <ShieldCheck className="h-5 w-5 text-[#1FA67A] mt-0.5" />
                <p className="text-[10px] text-[#39586D] leading-relaxed">
                  Este documento terá validade jurídica garantida por autenticação via IP, e-mail e carimbo de tempo, conforme a MP 2.200-2/2001.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button 
                className="bg-[#1FA67A] font-bold gap-2" 
                onClick={handleSend}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Enviar para Assinatura
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center space-y-6">
            <div className="w-20 h-20 bg-[#7ED6B5]/20 rounded-full flex items-center justify-center mx-auto animate-in zoom-in">
              <CheckCircle2 className="h-10 w-10 text-[#1FA67A]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#2C4156]">Sucesso!</h3>
              <p className="text-sm text-[#98A7AA]">
                O processo foi iniciado. Você poderá acompanhar o status da assinatura no histórico do cliente.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="gap-2 border-[#D2D7DB]" onClick={() => {
                navigator.clipboard.writeText("https://zapsign.com/s/sample-link")
                toast({ title: "Link copiado!" })
              }}>
                <Smartphone className="h-4 w-4" /> Copiar Link para WhatsApp
              </Button>
              <Button className="bg-[#2C4156] font-bold" onClick={reset}>Fechar Janela</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
