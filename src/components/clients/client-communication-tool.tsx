
"use client"

import { useState } from "react"
import { draftClientCommunication, DraftClientCommunicationInput, DraftClientCommunicationOutput } from "@/ai/flows/draft-client-communication-flow"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Sparkles, Mail, Copy, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ClientCommunicationToolProps {
  client: {
    name: string;
    email: string;
    regime: string;
  };
  trigger?: React.ReactNode;
  initialPurpose?: string;
}

export function ClientCommunicationTool({ client, trigger, initialPurpose }: ClientCommunicationToolProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [purpose, setPurpose] = useState(initialPurpose || "")
  const [result, setResult] = useState<DraftClientCommunicationOutput | null>(null)
  const [copied, setCopied] = useState(false)

  const handleDraft = async () => {
    if (!purpose) return;
    setLoading(true);
    try {
      const input: DraftClientCommunicationInput = {
        clientName: client.name,
        clientEmail: client.email,
        communicationPurpose: purpose,
        clientRegime: client.regime
      };
      const response = await draftClientCommunication(input);
      setResult(response);
    } catch (error) {
      toast({
        title: "Erro ao gerar rascunho",
        description: "Não foi possível conectar ao assistente de IA.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Assunto: ${result.subject}\n\n${result.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado!",
      description: "O rascunho foi copiado para sua área de transferência."
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Redigir com IA
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setResult(null);
          if (!initialPurpose) setPurpose("");
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Assistente de Comunicação ContaHub
            </DialogTitle>
            <DialogDescription>
              Crie rascunhos de e-mails profissionais para {client.name} em segundos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!result ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Qual o objetivo da mensagem?</Label>
                  <Textarea 
                    placeholder="Ex: Enviar certidão federal, avisar sobre prazo do PGDAS, etc."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90" 
                  onClick={handleDraft}
                  disabled={loading || !purpose}
                >
                  {loading ? "Gerando rascunho..." : "Gerar Rascunho Profissional"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <Label>Assunto Sugerido</Label>
                  <Input readOnly value={result.subject} />
                </div>
                <div className="space-y-2">
                  <Label>Corpo do E-mail</Label>
                  <Textarea readOnly value={result.body} rows={10} className="text-sm bg-muted/50" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                    Refinar rascunho
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar E-mail"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
