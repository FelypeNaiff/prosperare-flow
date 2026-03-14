
"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
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
  Loader2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { collection, query, where, doc } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface AccessDataTabProps {
  clientId: string;
}

export function AccessDataTab({ clientId }: AccessDataTabProps) {
  const { userData, isUserLoading } = useUser()
  const firestore = useFirestore()
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [newAccess, setNewAccess] = useState({
    site: "",
    url: "",
    login: "",
    pass: ""
  })

  const accessQuery = useMemoFirebase(() => 
    query(collection(firestore, "clientAccesses"), where("clientId", "==", clientId)),
    [firestore, clientId]
  )
  const { data: accesses = [], isLoading } = useCollection(accessQuery)

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
      </div>
    )
  }

  const isRestricted = userData?.profile === 'ASSISTENTE'

  const handleSaveAccess = () => {
    if (!newAccess.site || !newAccess.login || !newAccess.pass) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" })
      return
    }

    const id = Math.random().toString(36).substr(2, 9)
    const docRef = doc(firestore, "clientAccesses", id)
    
    setDocumentNonBlocking(docRef, { ...newAccess, id, clientId, createdAt: new Date().toISOString() }, { merge: true })
    
    setIsModalOpen(false)
    setNewAccess({ site: "", url: "", login: "", pass: "" })
    toast({ title: "Acesso Salvo!", description: "Os dados foram armazenados no cofre seguro." })
  }

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado!", description: `${label} copiado.` })
  }

  if (isRestricted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">Acesso Restrito ao Cofre</h3>
          <p className="text-muted-foreground max-w-sm">
            Somente Contadores e Administradores podem gerenciar senhas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-emerald-50 border-emerald-200">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-emerald-800 font-bold uppercase text-[10px]">Protocolo de Segurança Prosperare</AlertTitle>
        <AlertDescription className="text-emerald-700 text-xs font-medium">
          Este ambiente é criptografado. Cada visualização de senha é registrada no log de auditoria do sistema.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h3 className="font-black text-[#2C4156] uppercase text-sm tracking-widest">Cofre de Senhas e Acessos</h3>
        <Button size="sm" className="gap-2 bg-[#1FA67A] hover:bg-[#1FA67A]/90 font-bold" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Acesso
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" /></div>
        ) : accesses.length > 0 ? (
          accesses.map((access) => (
            <Card key={access.id} className="hover:shadow-sm transition-shadow border-[#D2D7DB]">
              <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#2C4156]/5 rounded-lg">
                    <Globe className="h-5 w-5 text-[#2C4156]" />
                  </div>
                  <div>
                    <p className="font-bold flex items-center gap-2 text-[#2C4156]">
                      {access.site}
                      {access.url && (
                        <a href={access.url} target="_blank" rel="noreferrer" className="text-[#98A7AA] hover:text-[#1FA67A]">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </p>
                    <p className="text-[10px] text-[#98A7AA] font-mono">{access.url || "URL não informada"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 max-w-lg">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Login / Usuário</Label>
                    <div className="flex gap-1">
                      <Input readOnly value={access.login} className="h-8 text-xs bg-[#F7F7F7] border-[#D2D7DB]" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]" onClick={() => copyToClipboard(access.login, 'Login')}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-[#98A7AA]">Senha Criptografada</Label>
                    <div className="flex gap-1">
                      <Input 
                        readOnly 
                        type={showPasswords[access.id] ? "text" : "password"} 
                        value={access.pass} 
                        className="h-8 text-xs bg-[#F7F7F7] border-[#D2D7DB]" 
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]" onClick={() => togglePassword(access.id)}>
                        {showPasswords[access.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA]" onClick={() => copyToClipboard(access.pass, 'Senha')}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center text-[#98A7AA] text-xs font-black uppercase tracking-widest border-2 border-dashed rounded-xl">
            Nenhum dado de acesso no cofre.
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#2C4156] font-black uppercase tracking-tight">Novo Acesso Seguro</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Nome do Site / Portal</Label>
              <Input placeholder="Ex: e-CAC, Prefeitura Macapá..." value={newAccess.site} onChange={(e) => setNewAccess({...newAccess, site: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">URL de Acesso</Label>
              <Input placeholder="https://..." value={newAccess.url} onChange={(e) => setNewAccess({...newAccess, url: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Login / Usuário</Label>
              <Input value={newAccess.login} onChange={(e) => setNewAccess({...newAccess, login: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-[#98A7AA]">Senha</Label>
              <Input type="password" value={newAccess.pass} onChange={(e) => setNewAccess({...newAccess, pass: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-bold" onClick={handleSaveAccess}>Salvar no Cofre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
