"use client"

import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  CreditCard, 
  Lock, 
  FileSignature, 
  Activity,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Plus,
  Edit2,
  PlayCircle,
  Layers,
  Copy,
  FlameKindling,
  PowerOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ClientCertificatesTable } from "@/components/certificates/client-certificates-table"
import { AccessDataTab } from "@/components/clients/access-data-tab"
import { ProcurationTab } from "@/components/clients/procuration-tab"
import { ClientInstallmentsTab } from "@/components/installments/client-installments-tab"
import { LicensesTab } from "@/components/clients/licenses-tab"
import { ClientCommunicationTool } from "@/components/clients/client-communication-tool"
import { CndFederalCard } from "@/components/clients/cnd-federal-card"
import { Label } from "@/components/ui/label"
import { useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { useState } from "react"
import { EditClientModal } from "@/components/clients/edit-client-modal"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function DetalhesClientePage() {
  const params = useParams()
  const router = useRouter()
  const firestore = useFirestore()
  const clientId = params.clientId as string
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isInactivating, setIsInactivating] = useState(false)

  const clientRef = useMemoFirebase(() => clientId ? doc(firestore, "clients", clientId) : null, [firestore, clientId])
  const { data: client, isLoading: loadingClient } = useDoc(clientRef)

  const groupsQuery = useMemoFirebase(() => collection(firestore, "obligation_groups"), [firestore])
  const { data: dbGroups = [] } = useCollection(groupsQuery)

  const handleToggleGroup = (groupId: string) => {
    if (!client || !clientRef) return
    const currentGroups = client.obligationGroups || []
    const newGroups = currentGroups.includes(groupId)
      ? currentGroups.filter((id: string) => id !== groupId)
      : [...currentGroups, groupId]
    
    updateDocumentNonBlocking(clientRef, { obligationGroups: newGroups })
  }

  const handleCopyCNPJ = (cnpj: string) => {
    navigator.clipboard.writeText(cnpj)
    toast({ title: "CNPJ Copiado!", description: cnpj })
  }

  const handleGenerateTasks = async () => {
    if (!client || !client.obligationGroups?.length) {
      toast({ variant: "destructive", title: "Erro", description: "Vincule ao menos um grupo de obrigações primeiro." })
      return
    }

    setIsGenerating(true)
    try {
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()
      const monthYearLabel = `${currentMonth.toString().padStart(2, '0')}/${currentYear}`

      let tasksCreated = 0

      for (const groupId of client.obligationGroups) {
        const groupInfo = dbGroups?.find((g: any) => g.id === groupId)
        if (!groupInfo || !groupInfo.processes) continue

        for (const process of groupInfo.processes) {
          const newTask = {
            clientId: client.id,
            clientName: client.corporateName,
            title: `${process.title} - Competência ${monthYearLabel}`,
            status: 'todo',
            groupId: groupId,
            groupName: groupInfo.name,
            createdAt: new Date().toISOString(),
            dueDate: new Date(currentYear, currentMonth - 1, parseInt(process.dueDay) || 20).toISOString(),
            responsibleId: client.accountingContactUserId || "Geral"
          }

          addDocumentNonBlocking(collection(firestore, "tasks"), newTask)
          tasksCreated++
        }
      }

      if (tasksCreated > 0) {
        toast({ title: "Processos Gerados!", description: `${tasksCreated} tarefas de ${monthYearLabel} criadas.` })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao gerar", description: "Houve uma falha na criação das tarefas." })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInactivateCompany = async () => {
    if (!confirm("Tem certeza que deseja inativar esta empresa? Esta ação irá suspender contratos e processos recorrentes(dispensados) e as tarefas pendentes.")) return;

    setIsInactivating(true)
    try {
      if (clientRef) {
        updateDocumentNonBlocking(clientRef, { status: 'Inativa' })
      }

      const contractsSnap = await getDocs(query(collection(firestore, "contracts"), where("clientId", "==", clientId)))
      contractsSnap.forEach(docSnap => {
        updateDocumentNonBlocking(doc(firestore, "contracts", docSnap.id), { status: 'Suspenso' })
      })

      const processesSnap = await getDocs(query(collection(firestore, "processes"), where("clienteId", "==", clientId)))
      processesSnap.forEach(docSnap => {
        const data = docSnap.data()
        if (data.situacao !== 'concluido' && data.situacao !== 'dispensado') {
          updateDocumentNonBlocking(doc(firestore, "processes", docSnap.id), { situacao: 'dispensado' })
        }
      })

      const tasksSnap = await getDocs(query(collection(firestore, "tasks"), where("clientId", "==", clientId)))
      tasksSnap.forEach(docSnap => {
        const data = docSnap.data()
        if (data.status !== 'done' && data.status !== 'cancelled') {
          updateDocumentNonBlocking(doc(firestore, "tasks", docSnap.id), { status: 'cancelled' })
        }
      })

      toast({ title: "Empresa Inativada", description: "Operação realizada com sucesso." })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível inativar a empresa." })
    } finally {
      setIsInactivating(false)
    }
  }

  if (loadingClient) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#2563EB]" />
        <p className="text-xs font-black uppercase text-[#98A7AA] tracking-widest animate-pulse">Sincronizando Ficha 360º...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-[#E74C3C]" />
        <h2 className="text-xl font-black text-[#2C4156]">Empresa não localizada</h2>
        <Button onClick={() => router.back()} variant="outline">Voltar para Clientes</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#39586D]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#2C4156]">{client.corporateName}</h1>
              <Badge className={cn("border-none font-bold text-[10px] uppercase", client.status === 'Inativa' ? "bg-[#F3F4F6] text-[#98A7AA]" : "bg-[#7ED6B5] text-[#2563EB]")}>
                {client.status || 'Ativa'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-[#98A7AA] font-bold uppercase tracking-widest">{client.cnpj} • {client.taxRegime}</p>
              <button 
                onClick={() => handleCopyCNPJ(client.cnpj)}
                className="p-1 rounded hover:bg-[#EBEDF0] text-[#98A7AA] hover:text-[#2563EB] transition-all"
                title="Copiar CNPJ"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {client.status !== 'Inativa' && (
            <Button variant="outline" className="border-[#E74C3C] text-[#E74C3C] hover:bg-[#FEE2E2] gap-2 font-black uppercase text-xs" onClick={handleInactivateCompany} disabled={isInactivating}>
              {isInactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />} Inativar Empresa
            </Button>
          )}
          <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] gap-2 font-black uppercase text-xs" onClick={() => setIsEditOpen(true)}>
            <Edit2 className="h-4 w-4" /> Editar Dados
          </Button>
          <ClientCommunicationTool 
            client={{ name: client.corporateName, email: client.email, regime: client.taxRegime }}
            trigger={
              <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] gap-2 font-black uppercase text-xs">
                <Mail className="h-4 w-4" /> Mensagem IA
              </Button>
            }
          />
          <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 shadow-lg shadow-blue-500/20 font-black uppercase text-xs" onClick={handleGenerateTasks} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            GERAR TAREFAS DO MÊS
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-[#D2D7DB] border-l-4 border-l-[#2563EB]">
          <CardContent className="p-4 space-y-2">
            <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Saúde Fiscal</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-[#2C4156]">{client.healthScore || 0}%</span>
              <TrendingUp className="h-5 w-5 text-[#2563EB] mb-1" />
            </div>
            <Progress value={client.healthScore || 0} className="h-1.5 bg-[#F7F7F7]" />
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Responsável</p>
            <p className="text-lg font-black text-[#2C4156]">{client.accountingContactUserId || "Geral"}</p>
            <p className="text-[10px] font-bold text-[#39586D] uppercase">Contador/Gestor</p>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Honorário</p>
            <p className="text-lg font-black text-[#2563EB]">
              R$ {(Number(client.honorariumValue) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] font-bold text-[#39586D] uppercase">Vencimento dia {client.honorariumDueDateDay || 10}</p>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB] bg-white">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Grupos Ativos</p>
            <div className="flex flex-wrap gap-1">
              {client.obligationGroups?.length > 0 ? client.obligationGroups.map((gId: string) => (
                <Badge key={gId} variant="secondary" className="bg-[#E3F0F9] text-[#2574A9] text-[8px] font-black uppercase border-none">
                  {dbGroups?.find((g: any) => g.id === gId)?.name || gId}
                </Badge>
              )) : <span className="text-[10px] font-bold text-[#E74C3C] uppercase">Nenhum Grupo</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dados" className="space-y-6">
        <div className="bg-white p-1 rounded-xl border shadow-sm inline-flex overflow-x-auto w-full max-w-full">
          <TabsList className="bg-transparent h-10">
            <TabsTrigger value="dados" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <Building2 className="h-3.5 w-3.5" /> Ficha Cadastral
            </TabsTrigger>
            <TabsTrigger value="processos" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <Layers className="h-3.5 w-3.5" /> Grupo de Obrigações
            </TabsTrigger>
            <TabsTrigger value="alvaras" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <FlameKindling className="h-3.5 w-3.5" /> Alvarás e Licenças
            </TabsTrigger>
            <TabsTrigger value="certidoes" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" /> Certidões (CND)
            </TabsTrigger>
            <TabsTrigger value="parcelamentos" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <CreditCard className="h-3.5 w-3.5" /> Parcelamentos
            </TabsTrigger>
            <TabsTrigger value="acessos" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <Lock className="h-3.5 w-3.5" /> Cofre de Senhas
            </TabsTrigger>
            <TabsTrigger value="procuracao" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <FileSignature className="h-3.5 w-3.5" /> Procurações
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dados" className="m-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-[#D2D7DB]">
                <CardHeader className="bg-[#F7F7F7]/50 border-b">
                  <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Dados Gerais</CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-2 gap-6">
                  <InfoItem label="Razão Social" value={client.corporateName} />
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">CNPJ</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#2C4156]">{client.cnpj}</p>
                      <button 
                        onClick={() => handleCopyCNPJ(client.cnpj)}
                        className="p-1 rounded hover:bg-[#EBEDF0] text-[#98A7AA] transition-all"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <InfoItem label="Inscrição Estadual" value={client.stateRegistration || "ISENTO"} />
                  <InfoItem label="Inscrição Municipal" value={client.cityRegistration || "--"} />
                  <InfoItem label="Regime" value={client.taxRegime} />
                  <InfoItem label="Data de Abertura" value={client.openingDate || "--"} />
                  <div className="col-span-2 space-y-2 border-t pt-4">
                    <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Endereço Completo</Label>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#39586D]">
                      <MapPin className="h-4 w-4 text-[#2563EB]" /> {client.address}, {client.neighborhood} - {client.city}/{client.state}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações Societárias */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Informações Societárias</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Capital Social</p>
                    <p className="text-sm text-slate-800 font-semibold mt-1">
                      {formatBRL(client.capitalSocial)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Início das Atividades</p>
                    <p className="text-sm text-slate-800 font-semibold mt-1">
                      {client.dataInicioAtividade ? formatDate(client.dataInicioAtividade) : "--"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Número do NIRE</p>
                    <p className="text-sm text-slate-800 font-semibold mt-1">
                      {client.nire || "--"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Natureza Jurídica</p>
                    <p className="text-sm text-slate-800 font-semibold mt-1 truncate" title={client.naturezaJuridica}>
                      {client.naturezaJuridica || "--"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quadro de Sócios e Administradores (QSA) */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Quadro de Sócios e Administradores (QSA)</h3>
                
                {client.qsa && client.qsa.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {client.qsa.map((partner: any, idx: number) => (
                      <div key={idx} className="border border-slate-100 rounded-lg p-4 bg-slate-50/30 hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 mb-3 gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800">{partner.nome || "--"}</h4>
                            <p className="text-xs text-slate-500 font-medium">{partner.qualificacao || "Sócio"}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {partner.participacao !== undefined && partner.participacao !== null && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                Part.: {formatBRL(partner.participacao)}
                              </span>
                            )}
                            {((partner.percentualQuota !== undefined && partner.percentualQuota !== null && partner.percentualQuota > 0) || (client.capitalSocial > 0 && partner.participacao > 0)) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Quota: {partner.percentualQuota ?? Number(((partner.participacao / client.capitalSocial) * 100).toFixed(2))}%
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                          <div>
                            <p className="text-slate-500 font-medium">CPF/CNPJ</p>
                            <p className="text-slate-800 font-semibold">{partner.cpfCnpj || "--"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 font-medium">Data de Ingresso</p>
                            <p className="text-slate-800 font-semibold">{formatDate(partner.dataIngresso)}</p>
                          </div>
                          
                          {partner.rg && (
                            <div>
                              <p className="text-slate-500 font-medium">RG</p>
                              <p className="text-slate-800 font-semibold">
                                {partner.rg}
                                {partner.rgOrgaoEmissor ? ` / ${partner.rgOrgaoEmissor}` : ""}
                                {partner.rgUf ? `-${partner.rgUf}` : ""}
                              </p>
                            </div>
                          )}
                          
                          {partner.dataNascimento && (
                            <div>
                              <p className="text-slate-500 font-medium">Data de Nascimento</p>
                              <p className="text-slate-800 font-semibold">{formatDate(partner.dataNascimento)}</p>
                            </div>
                          )}
                          
                          {partner.estadoCivil && (
                            <div>
                              <p className="text-slate-500 font-medium">Estado Civil</p>
                              <p className="text-slate-800 font-semibold">{partner.estadoCivil}</p>
                            </div>
                          )}

                          {partner.regimeBens && (
                            <div>
                              <p className="text-slate-500 font-medium">Regime de Bens</p>
                              <p className="text-slate-800 font-semibold">{partner.regimeBens}</p>
                            </div>
                          )}

                          {partner.profissao && (
                            <div>
                              <p className="text-slate-500 font-medium">Profissão</p>
                              <p className="text-slate-800 font-semibold">{partner.profissao}</p>
                            </div>
                          )}

                          {partner.nacionalidade && (
                            <div>
                              <p className="text-slate-500 font-medium">Nacionalidade</p>
                              <p className="text-slate-800 font-semibold">{partner.nacionalidade}</p>
                            </div>
                          )}

                          {partner.email && (
                            <div className="col-span-2">
                              <p className="text-slate-500 font-medium">E-mail</p>
                              <p className="text-slate-800 font-semibold truncate" title={partner.email}>{partner.email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">Nenhum sócio cadastrado.</p>
                )}
              </div>

              <Card className="border-[#D2D7DB]">
                <CardHeader className="bg-[#F7F7F7]/50 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Vincular Grupos de Obrigações</CardTitle>
                  <Layers className="h-4 w-4 text-[#2563EB]" />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dbGroups && dbGroups.length > 0 ? dbGroups.map((group: any) => (
                      <div key={group.id} className={cn(
                        "flex items-center space-x-3 p-3 rounded-xl border bg-white hover:bg-[#F7F7F7] transition-colors cursor-pointer",
                        client.obligationGroups?.includes(group.id) && "border-[#2563EB] bg-[#2563EB]/5"
                      )} onClick={() => handleToggleGroup(group.id)}>
                        <Checkbox 
                          id={group.id} 
                          checked={client.obligationGroups?.includes(group.id)} 
                          onCheckedChange={() => handleToggleGroup(group.id)}
                        />
                        <div className="flex flex-col">
                          <Label htmlFor={group.id} className="text-xs font-black text-[#39586D] cursor-pointer uppercase">
                            {group.name}
                          </Label>
                          <span className="text-[8px] font-bold text-[#98A7AA] uppercase">{group.processes?.length || 0} processos definidos</span>
                        </div>
                      </div>
                    )) : (
                      <p className="col-span-2 text-center py-4 text-[10px] font-bold text-[#98A7AA] uppercase italic">
                        Nenhum grupo cadastrado no sistema. Vá em Processos &gt; Grupos para criar.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-[#D2D7DB] h-fit">
                <CardHeader className="bg-[#F7F7F7]/50 border-b">
                  <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Contatos Principais</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F7F7] border">
                      <Mail className="h-5 w-5 text-[#2574A9]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[#98A7AA] uppercase">E-mail</span>
                        <span className="text-xs font-bold text-[#2C4156]">{client.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F7F7] border">
                      <Phone className="h-5 w-5 text-[#2563EB]" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[#98A7AA] uppercase">Telefone / WhatsApp</span>
                        <span className="text-xs font-bold text-[#2C4156]">{client.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-[10px] font-black text-[#98A7AA] uppercase mb-2">Pessoa de Contato</p>
                    <p className="text-sm font-bold text-[#2C4156]">{client.companyContactPerson || "Não informado"}</p>
                  </div>
                </CardContent>
              </Card>

              <CndFederalCard 
                clientId={clientId}
                clientRef={clientRef}
                cnpj={client.cnpj}
                initialCnd={client.cndFederal}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="processos" className="m-0">
          <Card className="border-[#D2D7DB]">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-[#F7F7F7]/50">
              <div>
                <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Obrigações e Tarefas do Cliente</CardTitle>
                <CardDescription className="text-xs font-bold text-[#98A7AA]">Fluxo de trabalho específico para {client.corporateName}.</CardDescription>
              </div>
              <Button className="bg-[#2563EB] gap-2 h-8 text-xs font-black uppercase" onClick={handleGenerateTasks} disabled={isGenerating}>
                <Plus className="h-3.5 w-3.5" /> Adicionar Tarefa
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ClientTasksList clientId={clientId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alvaras" className="m-0">
          <LicensesTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="certidoes" className="m-0">
          <Card className="border-[#D2D7DB]">
            <CardContent className="p-6">
              <ClientCertificatesTable clientId={clientId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parcelamentos" className="m-0">
          <ClientInstallmentsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="acessos" className="m-0">
          <AccessDataTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="procuracao" className="m-0">
          <ProcurationTab clientId={clientId} />
        </TabsContent>
      </Tabs>

      <EditClientModal 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        client={client} 
      />
    </div>
  )
}

function InfoItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">{label}</Label>
      <p className="text-sm font-bold text-[#2C4156]">{value || '--'}</p>
    </div>
  )
}

function ClientTasksList({ clientId }: { clientId: string }) {
  const firestore = useFirestore()
  const tasksQuery = useMemoFirebase(() => 
    query(collection(firestore, "tasks"), where("clientId", "==", clientId), orderBy("createdAt", "desc")),
    [firestore, clientId]
  )
  const { data: tasks, isLoading } = useCollection(tasksQuery)

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" /></div>

  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-12 text-center text-[#98A7AA] font-bold italic">
        Nenhuma tarefa vinculada. Clique em "GERAR TAREFAS DO MÊS" no topo para carregar o modelo.
      </div>
    )
  }

  return (
    <div className="divide-y">
      {tasks.map((task: any) => (
        <div key={task.id} className="p-4 flex items-center justify-between hover:bg-[#F7F7F7] transition-colors">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-2 h-2 rounded-full",
              task.status === 'done' ? 'bg-[#2563EB]' : task.status === 'cancelled' ? 'bg-[#98A7AA]' : 'bg-[#F2B705]'
            )} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#2C4156]">{task.title}</p>
                {task.groupName && <Badge variant="secondary" className="text-[7px] font-black uppercase h-4">{task.groupName}</Badge>}
              </div>
              <p className="text-[10px] text-[#98A7AA] font-black uppercase">Vencimento: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '--'}</p>
            </div>
          </div>
          <Badge className={cn(
            "text-[9px] font-black uppercase border-none",
            task.status === 'done' ? 'bg-[#7ED6B5] text-[#2563EB]' : task.status === 'cancelled' ? 'bg-[#EBEDF0] text-[#98A7AA]' : 'bg-[#FEF3C7] text-[#F2B705]'
          )}>
            {task.status === 'done' ? 'Concluído' : task.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
          </Badge>
        </div>
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  if (!dateStr) return "--"
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (regex.test(dateStr)) {
    const [year, month, day] = dateStr.split("-")
    return `${day}/${month}/${year}`
  }
  return dateStr
}

function formatBRL(value: any) {
  if (value === undefined || value === null) return "--"
  const valNum = Number(value)
  if (isNaN(valNum)) return String(value)
  return valNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
