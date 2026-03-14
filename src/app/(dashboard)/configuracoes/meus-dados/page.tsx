
"use client"

import { useState } from "react"
import { Building, Save, Upload, Info, MapPin, Loader2, CheckCircle2, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { formatCNPJ, validateCNPJ } from "@/lib/utils"

export default function MeusDadosPage() {
  const [isDirty, setIsDirty] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)
  const [cnpjError, setCnpjError] = useState(false)
  
  const [officeData, setOfficeData] = useState({
    razaoSocial: "Prosperare Flow Soluções Contábeis Ltda",
    nomeFantasia: "Prosperare Flow",
    cnpj: "12.345.678/0001-90",
    telefone: "(96) 98122-3344",
    email: "contato@prosperare.com.br"
  })

  const [address, setAddress] = useState({
    cep: "",
    rua: "Av. FAB, 1000",
    bairro: "Centro",
    cidade: "Macapá",
    uf: "AP"
  })

  const handleSave = () => {
    if (cnpjError) {
      toast({
        variant: "destructive",
        title: "Erro no Cadastro",
        description: "O CNPJ informado é inválido."
      })
      return
    }
    toast({
      title: "Configurações salvas!",
      className: "bg-[#1FA67A] text-white border-none",
    })
    setIsDirty(false)
  }

  const lookupCnpj = async (cnpjValue: string) => {
    const cleanCnpj = cnpjValue.replace(/\D/g, "")
    
    if (cleanCnpj.length !== 14) {
      setCnpjError(true)
      return
    }

    if (!validateCNPJ(cleanCnpj)) {
      setCnpjError(true)
      toast({
        variant: "destructive",
        title: "CNPJ Inválido",
        description: "Verifique os dígitos verificadores."
      })
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
      }))
      
      if (data.cep) {
        setAddress(prev => ({
          ...prev,
          cep: data.cep,
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.municipio || prev.cidade,
          uf: data.uf || prev.uf
        }))
      }

      setIsDirty(true)
      toast({
        title: "Dados Sincronizados!",
        description: "Razão social e endereço atualizados via Brasil API."
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "Não foi possível buscar dados extras, mas o CNPJ é válido."
      })
    } finally {
      setIsLoadingCnpj(false)
    }
  }

  const lookupCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "")
    if (cleanCep.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast({
          variant: "destructive",
          title: "CEP não encontrado",
          description: "Verifique o número digitado."
        })
      } else {
        setAddress({
          ...address,
          cep: cepValue,
          rua: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf
        })
        setIsDirty(true)
        toast({ title: "Endereço Localizado!" })
      }
    } catch (error) {
      console.error("Erro na busca de CEP:", error)
    } finally {
      setIsLoadingCep(false)
    }
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
          <CardDescription className="font-medium">Estes dados são utilizados na geração automática de contratos e documentos (Docs Flow).</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-[#D2D7DB] flex flex-col items-center justify-center bg-[#F7F7F7] hover:bg-white hover:border-[#1FA67A] transition-all cursor-pointer group shadow-inner">
                <Upload className="h-8 w-8 text-[#98A7AA] group-hover:text-[#1FA67A] group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black text-[#98A7AA] uppercase mt-2">Logo Principal</span>
              </div>
              <Button variant="outline" size="sm" className="text-[10px] font-black uppercase border-[#D2D7DB] tracking-widest">Alterar Identidade</Button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest flex items-center justify-between">
                  CNPJ / CPF
                  {cnpjError && <span className="text-[#E74C3C] text-[8px]">Inválido</span>}
                </Label>
                <div className="relative">
                  <Input 
                    value={officeData.cnpj} 
                    onChange={(e) => {
                      const formatted = formatCNPJ(e.target.value)
                      setOfficeData({...officeData, cnpj: formatted});
                      setIsDirty(true);
                      setCnpjError(false);
                    }}
                    onBlur={(e) => lookupCnpj(e.target.value)}
                    className={cn(
                      "border-[#D2D7DB] font-mono font-bold pr-10",
                      cnpjError && "border-[#E74C3C] focus-visible:ring-[#E74C3C]"
                    )}
                  />
                  {isLoadingCnpj ? (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#1FA67A]" />
                  ) : (
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Celular do Responsável</Label>
                <Input value={officeData.telefone} onChange={(e) => {setOfficeData({...officeData, telefone: e.target.value}); setIsDirty(true)}} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Razão Social / Nome</Label>
                <Input value={officeData.razaoSocial} onChange={(e) => {setOfficeData({...officeData, razaoSocial: e.target.value}); setIsDirty(true)}} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Nome Fantasia</Label>
                <Input value={officeData.nomeFantasia} onChange={(e) => {setOfficeData({...officeData, nomeFantasia: e.target.value}); setIsDirty(true)}} className="border-[#D2D7DB] font-bold" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-[#1FA67A] uppercase tracking-[0.2em] flex items-center gap-2">
              <MapPin className="h-3 w-3" /> Localização & Endereço
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">CEP</Label>
                <div className="relative">
                  <Input 
                    placeholder="00000-000" 
                    onBlur={(e) => lookupCep(e.target.value)} 
                    onChange={(e) => {
                      setAddress({...address, cep: e.target.value});
                      setIsDirty(true);
                    }} 
                    value={address.cep}
                    className="border-[#D2D7DB] font-bold" 
                  />
                  {isLoadingCep && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#1FA67A]" />
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Rua + Número</Label>
                <Input value={address.rua} onChange={(e) => setAddress({...address, rua: e.target.value})} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Bairro</Label>
                <Input value={address.bairro} onChange={(e) => setAddress({...address, bairro: e.target.value})} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Município</Label>
                <Input value={address.cidade} onChange={(e) => setAddress({...address, cidade: e.target.value})} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">Estado</Label>
                <Input value={address.uf} onChange={(e) => setAddress({...address, uf: e.target.value})} className="border-[#D2D7DB] font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-[#98A7AA] tracking-widest">E-mail Principal</Label>
                <Input value={officeData.email} onChange={(e) => {setOfficeData({...officeData, email: e.target.value}); setIsDirty(true)}} className="border-[#D2D7DB] font-bold" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-[#F7F7F7] flex justify-end p-4 border-t border-[#D2D7DB]">
          <Button onClick={handleSave} className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-xs px-8 shadow-lg shadow-emerald-500/20">
            <Save className="h-4 w-4" /> Salvar Alterações
          </Button>
        </CardFooter>
      </Card>

      <div className="flex items-center gap-3 p-4 bg-[#E3F0F9] border border-[#2574A9]/20 rounded-xl text-[#2574A9]">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-xs font-bold leading-relaxed">
          Sincronização Ativa: Seus dados de CNPJ e Endereço são validados em tempo real pelas APIs do Brasil API e ViaCEP para garantir conformidade documental.
        </p>
      </div>
    </div>
  )
}
