"use client"

import { useMemo } from "react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  MessageSquare,
  Clock,
  Mail,
  Heart,
  Activity,
  Zap,
  Loader2
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const firestore = useFirestore()
  const { userLoaded } = useUser()
  
  const clientsQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "clients") : null, 
    [firestore, userLoaded]
  )
  const { data: clients, isLoading: loadingClients } = useCollection(clientsQuery)
  
  const tasksQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "tasks") : null, 
    [firestore, userLoaded]
  )
  const { data: tasks, isLoading: loadingTasks } = useCollection(tasksQuery)

  const stats = useMemo(() => ({
    clientsCount: clients?.length || 0,
    tasksCount: tasks?.length || 0,
  }), [clients, tasks])

  const isDataLoading = loadingClients || loadingTasks

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">
            Painel <span className="text-[#1FA67A]">Prosperare Flow</span>
          </h1>
          <p className="text-[#98A7AA] font-medium">Monitoramento estratégico em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border rounded-lg px-4 py-2 shadow-sm flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isDataLoading ? "bg-amber-400 animate-pulse" : "bg-[#1FA67A]"
            )} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-[#98A7AA]">Sincronização</span>
              <span className="text-xs font-bold text-[#2C4156]">
                {isDataLoading ? "Buscando..." : "Ativa"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loadingClients ? <KpiSkeleton /> : <KpiCard label="Clientes" value={stats.clientsCount} icon={Users} color="primary" />}
        <KpiCard label="Processos OK" value="0%" icon={CheckCircle2} color="success" />
        <KpiCard label="Atrasos" value="0" icon={AlertCircle} color="destructive" />
        {loadingTasks ? <KpiSkeleton /> : <KpiCard label="Tickets" value={stats.tasksCount} icon={MessageSquare} color="info" />}
        <KpiCard label="Honorários" value="0" icon={Clock} color="warning" />
        <KpiCard label="NPS" value="--" icon={Heart} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 border-[#D2D7DB] shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-[#F7F7F7]/30 border-b">
            <CardTitle className="text-sm font-black uppercase text-[#2C4156] tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#1FA67A]" />
              Obrigações Fiscais por Status
            </CardTitle>
            <CardDescription className="text-xs font-bold text-[#98A7AA]">Os gráficos serão atualizados conforme a produção.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="h-[300px] flex items-center justify-center text-[#98A7AA] font-bold italic">
              {isDataLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : "Sem dados para exibir"}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-[#D2D7DB] bg-[#2C4156] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#1FA67A]/20 rounded-full blur-3xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Status da Operação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusRow icon={Zap} label="Conexões Cloud" status="Ativo" />
              <StatusRow icon={Mail} label="Servidor de E-mail" status="Conectado" />
              <StatusRow icon={Zap} label="Banco de Dados" status="Sincronizado" />
              <Button asChild variant="outline" className="w-full mt-4 bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-[10px] uppercase">
                <Link href="/configuracoes/integracoes">Ver Todas Conexões</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#D2D7DB] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-black uppercase text-[#2C4156]">Agenda de Hoje</CardTitle>
                <CardDescription className="text-[10px] font-bold">Nenhum compromisso.</CardDescription>
              </div>
              <div className="p-2 bg-[#E3F0F9] rounded-full">
                <Calendar className="h-4 w-4 text-[#2574A9]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-xs text-[#98A7AA] font-bold">
                Agenda vazia para hoje.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ icon: Icon, label, status, warning }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5", warning ? "text-[#F2B705]" : "text-[#1FA67A]")} />
        <span className="text-[11px] font-bold text-white/80">{label}</span>
      </div>
      <span className={cn("text-[9px] font-black uppercase", warning ? "text-[#F2B705]" : "text-[#1FA67A]")}>{status}</span>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <Card className="border-l-4 border-l-[#D2D7DB] bg-white h-[100px]">
      <CardContent className="p-6">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-12" />
      </CardContent>
    </Card>
  )
}