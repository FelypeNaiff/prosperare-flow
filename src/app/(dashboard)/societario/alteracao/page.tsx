"use client"

import { useState, useMemo } from "react"
import { 
  Building2, 
  FileText, 
  MapPin, 
  DollarSign, 
  FileSignature, 
  Loader2, 
  Download, 
  RefreshCw,
  Plus,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function AlteracaoSocietariaPage() {
  const firestore = useFirestore()
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Checklist states
  const [eventosSelecionados, setEventosSelecionados] = useState<string[]>([])
  
  // Altered data states
  const [novosDados, setNovosDados] = useState({
    corporateName: "",
    objetoSocial: "",
    capitalSocial: 0,
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: ""
  })

  // Load clients
  const clientsQuery = useMemoFirebase(() => collection(firestore, "clients"), [firestore])
  const { data: clients = [], isLoading: loadingClients } = useCollection(clientsQuery)

  // Current client object
  const currentClient = useMemo(() => {
    return (clients || []).find(c => c.id === selectedClientId) || null
  }, [clients, selectedClientId])

  // Partner array state for current client
  const [socios, setSocios] = useState<any[]>([])

  // Load partners when client changes
  useMemo(() => {
    if (currentClient) {
      setSocios(currentClient.qsa || [])
      setNovosDados({
        corporateName: currentClient.corporateName || "",
        objetoSocial: currentClient.objetoSocial || currentClient.naturezaJuridica || "",
        capitalSocial: currentClient.capitalSocial || 0,
        address: currentClient.address || "",
        neighborhood: currentClient.neighborhood || "",
        city: currentClient.city || "",
        state: currentClient.state || "",
        zipCode: currentClient.zipCode || ""
      })
    } else {
      setSocios([])
    }
  }, [currentClient])

  // Toggle events
  const handleToggleEvent = (eventKey: string) => {
    setEventosSelecionados(prev => 
      prev.includes(eventKey) 
        ? prev.filter(k => k !== eventKey) 
        : [...prev, eventKey]
    )
  }

  // Handle partner share edit
  const handlePartnerShareChange = (index: number, val: number) => {
    setSocios(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], participacao: val }
      return copy
    })
  }

  // Action to call API and force download
  const handleGenerateContract = async () => {
    if (!selectedClientId || !currentClient) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione uma empresa primeiro." })
      return
    }

    if (eventosSelecionados.length === 0) {
      toast({ variant: "destructive", title: "Atenção", description: "Selecione ao menos um evento para alteração." })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/societario/gerar-contrato", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresa: {
            corporateName: currentClient.corporateName,
            cnpj: currentClient.cnpj,
            address: currentClient.address,
            neighborhood: currentClient.neighborhood,
            city: currentClient.city,
            state: currentClient.state,
            zipCode: currentClient.zipCode,
            capitalSocial: currentClient.capitalSocial || 0,
            nire: currentClient.nire || "NÃO INFORMADO",
            naturezaJuridica: currentClient.naturezaJuridica
          },
          socios: socios,
          novosDados: novosDados,
          eventosSelecionados: eventosSelecionados
        })
      })

      if (!response.ok) {
        throw new Error("Falha na geração do arquivo do contrato")
      }

      // Convert buffer response to blob
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `alteracao_e_consolidacao_${currentClient.corporateName?.replace(/\s+/g, "_")}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      window.URL.revokeObjectURL(downloadUrl)

      toast({ title: "Contrato Gerado!", description: "O arquivo .docx foi baixado com sucesso." })
    } catch (err: any) {
      console.error(err)
      toast({ variant: "destructive", title: "Erro ao Gerar", description: err.message || "Houve uma falha na geração do contrato." })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alteração Societária</h1>
          <p className="text-xs text-slate-500 font-medium">Gere minutas de alteração contratual e consolidação com padrões DREI de forma modular.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Client selection & Event Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-800">1. Selecionar Empresa</CardTitle>
              <CardDescription className="text-xs text-slate-400">Escolha a empresa cadastrada no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-xs text-slate-500 font-semibold">Buscando empresas...</span>
                </div>
              ) : (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients || []).map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.corporateName} ({client.cnpj})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {selectedClientId && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-800">2. Eventos da Alteração</CardTitle>
                <CardDescription className="text-xs text-slate-400">Marque quais itens serão alterados no contrato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-slate-50/50 cursor-pointer" onClick={() => handleToggleEvent("220")}>
                  <Checkbox id="e220" checked={eventosSelecionados.includes("220")} onCheckedChange={() => handleToggleEvent("220")} />
                  <div className="flex flex-col">
                    <Label htmlFor="e220" className="text-xs font-semibold text-slate-800 cursor-pointer">Denominação Social (Nome)</Label>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Evento 220</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-slate-50/50 cursor-pointer" onClick={() => handleToggleEvent("244")}>
                  <Checkbox id="e244" checked={eventosSelecionados.includes("244")} onCheckedChange={() => handleToggleEvent("244")} />
                  <div className="flex flex-col">
                    <Label htmlFor="e244" className="text-xs font-semibold text-slate-800 cursor-pointer">Objeto Social / Atividades</Label>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Evento 244</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-slate-50/50 cursor-pointer" onClick={() => handleToggleEvent("capital")}>
                  <Checkbox id="ecapital" checked={eventosSelecionados.includes("capital")} onCheckedChange={() => handleToggleEvent("capital")} />
                  <div className="flex flex-col">
                    <Label htmlFor="ecapital" className="text-xs font-semibold text-slate-800 cursor-pointer">Capital Social e Quotas</Label>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Alteração de Capital</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-slate-50/50 cursor-pointer" onClick={() => handleToggleEvent("endereco")}>
                  <Checkbox id="eendereco" checked={eventosSelecionados.includes("endereco")} onCheckedChange={() => handleToggleEvent("endereco")} />
                  <div className="flex flex-col">
                    <Label htmlFor="eendereco" className="text-xs font-semibold text-slate-800 cursor-pointer">Endereço de Sede</Label>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Mudança de Localização</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Conditional Input Fields and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClientId ? (
            <>
              {eventosSelecionados.length > 0 ? (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-800">3. Novos Dados Contratuais</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Preencha as informações que serão alteradas e consolidadas.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Denominação social */}
                    {eventosSelecionados.includes("220") && (
                      <div className="space-y-3 p-4 border border-blue-100 rounded-lg bg-blue-50/10">
                        <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Alteração de Denominação Social
                        </h4>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase">Nova Razão Social</Label>
                          <Input 
                            value={novosDados.corporateName}
                            onChange={(e) => setNovosDados({ ...novosDados, corporateName: e.target.value.toUpperCase() })}
                            className="bg-white border-slate-200 font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Objeto social */}
                    {eventosSelecionados.includes("244") && (
                      <div className="space-y-3 p-4 border border-blue-100 rounded-lg bg-blue-50/10">
                        <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Alteração de Objeto Social
                        </h4>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase">Novo Objeto Social</Label>
                          <Textarea 
                            rows={3}
                            value={novosDados.objetoSocial}
                            onChange={(e) => setNovosDados({ ...novosDados, objetoSocial: e.target.value })}
                            className="bg-white border-slate-200 text-xs"
                            placeholder="Descreva detalhadamente o novo objeto social da empresa..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Endereço */}
                    {eventosSelecionados.includes("endereco") && (
                      <div className="space-y-3 p-4 border border-blue-100 rounded-lg bg-blue-50/10">
                        <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Mudança de Endereço
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Logradouro / Rua</Label>
                            <Input 
                              value={novosDados.address}
                              onChange={(e) => setNovosDados({ ...novosDados, address: e.target.value })}
                              className="bg-white border-slate-200 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Bairro</Label>
                            <Input 
                              value={novosDados.neighborhood}
                              onChange={(e) => setNovosDados({ ...novosDados, neighborhood: e.target.value })}
                              className="bg-white border-slate-200 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">CEP</Label>
                            <Input 
                              value={novosDados.zipCode}
                              onChange={(e) => setNovosDados({ ...novosDados, zipCode: e.target.value })}
                              className="bg-white border-slate-200 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Cidade</Label>
                            <Input 
                              value={novosDados.city}
                              onChange={(e) => setNovosDados({ ...novosDados, city: e.target.value })}
                              className="bg-white border-slate-200 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Estado (UF)</Label>
                            <Input 
                              value={novosDados.state}
                              onChange={(e) => setNovosDados({ ...novosDados, state: e.target.value.toUpperCase() })}
                              className="bg-white border-slate-200 text-xs"
                              maxLength={2}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Capital Social */}
                    {eventosSelecionados.includes("capital") && (
                      <div className="space-y-4 p-4 border border-blue-100 rounded-lg bg-blue-50/10">
                        <h4 className="text-xs font-semibold text-blue-700 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" /> Alteração de Capital Social & Quotas
                        </h4>
                        
                        <div className="space-y-1 max-w-xs">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase">Novo Capital Social (R$)</Label>
                          <Input 
                            type="number"
                            value={novosDados.capitalSocial}
                            onChange={(e) => setNovosDados({ ...novosDados, capitalSocial: Number(e.target.value) })}
                            className="bg-white border-slate-200 font-bold"
                          />
                        </div>

                        <div className="space-y-2 border-t pt-3">
                          <Label className="text-[10px] text-slate-500 font-bold uppercase">Distribuição de Quotas por Sócio</Label>
                          {socios.length > 0 ? (
                            <div className="space-y-2.5">
                              {socios.map((s, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border rounded-lg">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{s.nome}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{s.cpfCnpj}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-[9px] text-slate-400 font-bold uppercase">R$</Label>
                                    <Input 
                                      type="number"
                                      value={s.participacao || 0}
                                      onChange={(e) => handlePartnerShareChange(idx, Number(e.target.value))}
                                      className="w-32 h-8 border-slate-200 text-xs text-right font-semibold"
                                    />
                                    {novosDados.capitalSocial > 0 && (
                                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        {(((s.participacao || 0) / novosDados.capitalSocial) * 100).toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Validation helper */}
                              {novosDados.capitalSocial !== socios.reduce((acc, curr) => acc + (curr.participacao || 0), 0) && (
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider animate-pulse mt-2">
                                  * Atenção: A soma das participações (R$ {socios.reduce((acc, curr) => acc + (curr.participacao || 0), 0).toLocaleString("pt-BR")}) difere do Novo Capital Social (R$ {novosDados.capitalSocial.toLocaleString("pt-BR")})
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">Esta empresa não possui sócios vinculados para distribuição de quotas.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-10 text-center">
                  <FileSignature className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Nenhum evento selecionado</p>
                  <p className="text-[10px] text-slate-400">Escolha os eventos societários no checklist à esquerda para iniciar o preenchimento.</p>
                </div>
              )}

              {/* Action trigger */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleGenerateContract}
                  disabled={isGenerating || eventosSelecionados.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-500/10 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando documento...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Gerar Contrato (Word)
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
              <Building2 className="h-10 w-10 text-blue-600/20 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Aguardando Seleção de Empresa</h3>
              <p className="text-xs text-slate-400">Selecione uma empresa do menu à esquerda para iniciar a emissão contratual.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
