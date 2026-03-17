
"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, TrendingUp, History, Mail, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientCertificatesTable } from "@/components/certificates/client-certificates-table"
import { Progress } from "@/components/ui/progress"
import { ClientCommunicationTool } from "@/components/clients/client-communication-tool"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { useMemo } from "react"
import { isBefore, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

export default function DetalhesEmpresaCertidoesPage() {
  const params = useParams()
  const router = useRouter()
  const firestore = useFirestore()
  const clientId = params.clientId as string

  const clientRef = useMemoFirebase(() => clientId ? doc(firestore, "clients", clientId) : null, [firestore, clientId])
  const { data: client, isLoading } = useDoc(clientRef)

  const certsQuery = useMemoFirebase(() => 
    clientId ? query(collection(firestore, "certifications"), where("clientId", "==", clientId)) : null,
    [firestore, clientId]
  )
  const { data: certificates = [] } = useCollection(certsQuery)

  const stats = useMemo(() => {
    const today = new Date()
    const valid = (certificates || []).filter(c => c.validade && !isBefore(parseISO(c.validade), today)).length
    const expired = (certificates || []).filter(c => c.validade && isBefore(parseISO(c.validade), today)).length
    return { valid, expired }
  }, [certificates])

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#1FA67A]" />
        <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Sincronizando Auditoria...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-8 w-8 text-[#E74C3C]" />
        <p className="font-black text-[#2C4156] uppercase">Empresa não localizada.</p>
        <Button variant="outline" onClick={() => router.back()} className="font-bold">Voltar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#39586D]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#2C4156] uppercase tracking-tight">{client.corporateName}</h1>
            <Badge variant="outline" className="border-[#D2D7DB] text-[#39586D] uppercase text-[9px] font-black">{client.taxRegime}</Badge>
          </div>
          <p className="text-xs text-[#98A7AA] font-bold">CNPJ: {client.cnpj}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <ClientCommunicationTool 
            client={{ name: client.corporateName, email: client.email, regime: client.taxRegime }}
            trigger={
              <Button variant="outline" className="gap-2 border-[#D2D7DB] text-[#39586D] font-black uppercase text-[10px] h-10 px-6">
                <Mail className="h-4 w-4" /> Enviar Relatório
              </Button>
            }
          />
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2 font-black uppercase text-[10px] h-10 px-6 shadow-lg shadow-emerald-500/20">
            <RefreshCw className="h-4 w-4" /> Atualizar CNDs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-[#D2D7DB] overflow-hidden bg-white shadow-sm">
          <div className="h-1.5 bg-[#1FA67A]" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Score de Saúde Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black text-[#2C4156]">{client.healthScore || 0}%</span>
              <TrendingUp className="h-6 w-6 text-[#1FA67A] mb-1" />
            </div>
            <Progress value={client.healthScore || 0} className="h-1.5 bg-[#F7F7F7]" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-[#D2D7DB] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Resumo de Status das CNDs</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-around py-4">
            <StatusMetric label="Válidas" value={stats.valid} color="#1FA67A" />
            <StatusMetric label="Vencidas / Alerta" value={stats.expired} color="#E74C3C" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm">
        <CardHeader className="bg-[#F7F7F7]/50 border-b">
          <CardTitle className="text-sm font-black text-[#2C4156] uppercase tracking-tight">Certidões Negativas de Débito (CNDs)</CardTitle>
          <CardDescription className="text-xs font-bold text-[#98A7AA] uppercase">Acompanhamento em tempo real para regularidade da empresa.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6">
            <ClientCertificatesTable clientId={clientId} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusMetric({ label, value, color }: any) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-4xl font-black" style={{ color }}>{value}</span>
      <span className={cn("text-[10px] uppercase font-black text-[#98A7AA] tracking-widest")}>{label}</span>
    </div>
  )
}
