"use client"

import { useState } from "react"
import { useUser } from "@/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  ExternalLink, 
  Lock, 
  ShieldCheck,
  Globe,
  Trash2,
  Edit,
  Loader2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AccessDataTabProps {
  clientId: string;
}

export function AccessDataTab({ clientId }: AccessDataTabProps) {
  const { userData, isUserLoading } = useUser()
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
      </div>
    )
  }

  const isRestricted = userData?.profile === 'ASSISTENTE'

  const mockAccesses: any[] = []

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`
    })
  }

  if (isRestricted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">Acesso Restrito</h3>
          <p className="text-muted-foreground max-w-sm">
            Seu perfil de Assistente não possui permissão para visualizar dados sensíveis de acesso. 
            Contate um Administrador ou Contador responsável.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-emerald-50 border-emerald-200">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-emerald-800">Segurança de Dados (LGPD)</AlertTitle>
        <AlertDescription className="text-emerald-700">
          Dados protegidos conforme a LGPD. Garantimos segurança, privacidade e sigilo absoluto. 
          Acessos registrados em log de auditoria.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h3 className="font-bold">Cofre de Senhas e Acessos</h3>
        <Button size="sm" className="gap-2 bg-accent hover:bg-accent/90">
          <Plus className="h-4 w-4" /> Adicionar Acesso
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockAccesses.length > 0 ? (
          mockAccesses.map((access) => (
            <Card key={access.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold flex items-center gap-2">
                      {access.site}
                      <a href={access.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{access.url}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 max-w-lg">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Login / E-mail</Label>
                    <div className="flex gap-1">
                      <Input readOnly value={access.login} className="h-8 text-xs bg-muted" />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(access.login, 'Login')}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Senha</Label>
                    <div className="flex gap-1">
                      <Input 
                        readOnly 
                        type={showPasswords[access.id] ? "text" : "password"} 
                        value={access.pass} 
                        className="h-8 text-xs bg-muted" 
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePassword(access.id)}>
                        {showPasswords[access.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(access.pass, 'Senha')}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground italic font-medium border-2 border-dashed rounded-xl">
            Nenhum acesso registrado para este cliente.
          </div>
        )}
      </div>
    </div>
  )
}
