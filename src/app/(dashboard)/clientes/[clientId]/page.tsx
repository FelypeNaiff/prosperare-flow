
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
  Plus
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
import { ClientCommunicationTool } from "@/components/clients/client-communication-tool"
import { Label } from "@/components/ui/label"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export default function DetalhesClientePage() {
  const params = useParams()
  const router = useRouter()
  const firestore = useFirestore()
  const clientId = params.clientId as string

  const clientRef = useMemoFirebase(() => clientId ? doc(firestore, "clients", clientId) : null, [firestore, clientId])
  const { data: client, isLoading } = useDoc(clientRef)

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#1FA67A]" />
        <p className="text-xs font-black uppercase text-[#98A7AA] tracking-widest animate-pulse">Carregando Ficha 360º...</p>
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
      {/* Header do Cliente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#39586D]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#2C4156]">{client.corporateName}</h1>
              <Badge className="bg-[#7ED6B5] text-[#1FA67A] border-none font-bold text-[10px] uppercase">
                {client.status || 'Ativa'}
              </Badge>
            </div>
            <p className="text-sm text-[#98A7AA] font-bold uppercase tracking-widest">{client.cnpj} • {client.taxRegime}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ClientCommunicationTool 
            client={{ name: client.corporateName, email: client.email, regime: client.taxRegime }}
            trigger={
              <Button variant="outline" className="border-[#D2D7DB] text-[#39586D] gap-2">
                <Mail className="h-4 w-4" /> Mensagem IA
              </Button>
            }
          />
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2">
            <RefreshCw className="h-4 w-4" /> Sincronizar e-CAC
          </Button>
        </div>
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-[#D2D7DB] border-l-4 border-l-[#1FA67A]">
          <CardContent className="p-4 space-y-2">
            <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Saúde Fiscal</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-[#2C4156]">{client.healthScore || 0}%</span>
              <TrendingUp className="h-5 w-5 text-[#1FA67A] mb-1" />
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
            <p className="text-lg font-black text-[#1FA67A]">
              R$ {(client.honorariumValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] font-bold text-[#39586D] uppercase">Vencimento todo dia {client.honorariumDueDateDay || 10}</p>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB] bg-[#FEE2E2]/10 border-l-[#E74C3C]">
          <CardContent className="p-4 space-y-1 text-[#E74C3C]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Pendências</p>
            <p className="text-lg font-black flex items-center gap-2">0 Pendências <CheckCircle2 className="h-5 w-5 text-[#1FA67A]" /></p>
            <p className="text-[10px] font-bold uppercase">Situação Regular</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Gestão */}
      <Tabs defaultValue="dados" className="space-y-6">
        <div className="bg-white p-1 rounded-xl border shadow-sm inline-flex overflow-x-auto w-full max-w-full">
          <TabsList className="bg-transparent h-10">
            <TabsTrigger value="dados" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <Building2 className="h-3.5 w-3.5" /> Ficha Cadastral
            </TabsTrigger>
            <TabsTrigger value="processos" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <Activity className="h-3.5 w-3.5" /> Processos
            </TabsTrigger>
            <TabsTrigger value="certidoes" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 text-xs uppercase px-4 shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" /> Certidões
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
            <Card className="md:col-span-2 border-[#D2D7DB]">
              <CardHeader className="bg-[#F7F7F7]/50 border-b">
                <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Dados Gerais</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-2 gap-6">
                <InfoItem label="Razão Social" value={client.corporateName} />
                <InfoItem label="CNPJ" value={client.cnpj} />
                <InfoItem label="Inscrição Estadual" value={client.stateRegistration || "ISENTO"} />
                <InfoItem label="Inscrição Municipal" value={client.cityRegistration || "--"} />
                <InfoItem label="Regime" value={client.taxRegime} />
                <InfoItem label="Data de Abertura" value={client.openingDate || "--"} />
                <div className="col-span-2 space-y-2 border-t pt-4">
                  <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Endereço Completo</Label>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#39586D]">
                    <MapPin className="h-4 w-4 text-[#1FA67A]" /> {client.city} - {client.state}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#D2D7DB]">
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
                    <Phone className="h-5 w-5 text-[#1FA67A]" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-[#98A7AA] uppercase">Telefone / WhatsApp</span>
                      <span className="text-xs font-bold text-[#2C4156]">{client.phone}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-[#D2D7DB] font-bold text-[#39586D]">
                  Gerenciar Contatos
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="processos" className="m-0">
          <Card className="border-[#D2D7DB]">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-[#F7F7F7]/50">
              <div>
                <CardTitle className="text-sm font-black text-[#2C4156] uppercase">Obrigações e Tarefas do Cliente</CardTitle>
                <CardDescription className="text-xs font-bold text-[#98A7AA]">Fluxo de trabalho específico para {client.corporateName}.</CardDescription>
              </div>
              <Button className="bg-[#1FA67A] gap-2 h-8 text-xs font-bold">
                <Plus className="h-3.5 w-3.5" /> Nova Tarefa
              </Button>
            </CardHeader>
            <CardContent className="p-12 text-center text-[#98A7AA] font-bold italic">
              Nenhum processo em andamento para este cliente.
            </CardContent>
          </Card>
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
    </div>
  )
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">{label}</Label>
      <p className="text-sm font-bold text-[#2C4156]">{value || '--'}</p>
    </div>
  )
}
