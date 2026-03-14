
"use client"

import { useState, useEffect } from "react"
import { Building, Save, Upload, MapPin, Loader2, CheckCircle2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { formatCNPJ, validateCNPJ, cn } from "@/lib/utils"
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"

export default function MeusDadosPage() {
  const firestore = useFirestore()
  const [isDirty, setIsDirty] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)
  const [cnpjError, setCnpjError] = useState(false)
  
  const officeRef = useMemoFirebase(() => doc(firestore, "officeSettings", "main"), [firestore])
  const { data: savedData, isLoading: isFetching } = useDoc(officeRef)

  const [officeData, setOfficeData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    telefone: "",
    email: "",
    cep: "",
    rua: "",
    bairro: "",
    cidade: "",
    uf: ""
  })

  useEffect(() => {
    if (savedData) {
      setOfficeData(prev => ({ ...prev, ...savedData }))
    }
  }, [savedData])

  const handleSave = () => {
    if (cnpjError && officeData.cnpj) {
      toast({ variant: "destructive", title: "Erro", description: "O CNPJ é inválido." })
      return
    }
    
    setDocumentNonBlocking(officeRef, { ...officeData, updatedAt: new Date().toISOString() }, { merge: true })
    toast({ title: "Configurações salvas!", className: "bg-[#1FA67A] text-white border-none" })
    setIsDirty(false)
  }

  const lookupCnpj = async (cnpjValue: string) => {
    const cleanCnpj = cnpjValue.replace(/\D/g, "")
    if (cleanCnpj.length !== 14) return

    if (!validateCNPJ(cleanCnpj)) {
      setCnpjError(true)
      return
    }

    setCnpjError(false)
    setIsLoadingCnpj(true)
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
      if (!response.ok) throw new Error("CNPJ não encontrado")
      const data = await response.json()
      
      setOfficeData(prev => ({
        ...prev,
        razaoSocial: data.razao_social || prev.razaoSocial,
        nomeFantasia: data.nome_fantasia || data.razao_social || prev.nomeFantasia,
        cep: data.cep || prev.cep,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.municipio || prev.cidade,
        uf: data.uf || prev.uf
      }))
      setIsDirty(true)
      toast({ title: "Dados Sincronizados!" })
    } catch (error) {
      toast({ variant: "destructive", title: "Atenção", description: "Busca automática falhou." })
    } finally {
      setIsLoadingCnpj(false)
    }
  }

  if (isFetching) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" /></div>
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Meus Dados</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Informações cadastrais do seu escritório contábil.</p>
        </div>
        {isDirty && (
          <Badge className="bg-[#F2B705] text-black border-none animate-pulse font-black text-[10px] uppercase tracking-widest">
            Alterações não salvas
          </Badge>
        )}
      </div>

      <Card className="border-[#D2D7DB] shadow-sm bg-white">
        <CardHeader className="border-b bg-[#F7F7F7]/50">
          <CardTitle className="text-lg font-black text-[#2C4156] uppercase flex items-center gap-2">
            <Building className="h-5 w-5 text-[#1FA67A]" />
            Perfil do Escritório
          </CardTitle>
          <CardDescription className="font-medium">Dados usados na geração automática de documentos.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">CNPJ / CPF</Label>
                <div className="relative">
                  <Input 
                    placeholder="00.000.000/0000-00"
                    value={officeData.cnpj} 
                    onChange={(e) => { setOfficeData({...officeData, cnpj: formatCNPJ(e.target.value)}); setIsDirty(true); }}
                    onBlur={(e) => lookupCnpj(e.target.value)}
                    className={cn("border-[#D2D7DB] font-mono font-bold pr-10", cnpjError && "border-[#E74C3C]")}
                  />
                  {isLoadingCnpj ? <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#1FA67A]" /> : <Search className="absolute right-3 top-2.5 h-4 w-4 text-[#98A7AA]" />}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Telefone</Label>
                <Input value={officeData.telefone} onChange={(e) => {setOfficeData({...officeData, telefone: e.target.value}); setIsDirty(true)}} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Razão Social</Label>
                <Input value={officeData.razaoSocial} onChange={(e) => {setOfficeData({...officeData, razaoSocial: e.target.value}); setIsDirty(true)}} className="border-[#D2D7DB] font-bold" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#1FA67A] uppercase tracking-[0.2em] flex items-center gap-2">
              <MapPin className="h-3 w-3" /> Endereço Sede
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">CEP</Label>
                <Input value={officeData.cep} onChange={(e) => {setOfficeData({...officeData, cep: e.target.value}); setIsDirty(true)}} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Cidade</Label>
                <Input value={officeData.cidade} onChange={(e) => {setOfficeData({...officeData, cidade: e.target.value}); setIsDirty(true)}} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Estado (UF)</Label>
                <Input value={officeData.uf} onChange={(e) => {setOfficeData({...officeData, uf: e.target.value.toUpperCase()}); setIsDirty(true)}} className="border-[#D2D7DB] font-bold" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-[#F7F7F7] flex justify-end p-4 border-t border-[#D2D7DB]">
          <Button onClick={handleSave} className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs px-8 shadow-lg">
            <Save className="h-4 w-4" /> Salvar Configurações
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
