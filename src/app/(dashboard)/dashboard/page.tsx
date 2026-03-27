
"use client"

import { useMemo } from "react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Loader2,
  ShieldAlert,
  FlameKindling,
  DollarSign
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { parseISO, isBefore, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

export default function DashboardPage() {
  const firestore = useFirestore()
  const { userLoaded } = useUser()
  
  // Conexão com Coleções Reais
  const clientsQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "clients") : null, 
    [firestore, userLoaded]
  )
  const { data: clients, isLoading: loadingClients } = useCollection(clientsQuery)
  
  const processesQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "processes") : null, 
    [firestore, userLoaded]
  )
  const { data: processes } = useCollection(processesQuery)

  const receivablesQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "receivables") : null, 
    [firestore, userLoaded]
  )
  const { data: receivables } = useCollection(receivablesQuery)

  const alvarasQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "alvaras") : null, 
    [firestore, userLoaded]
  )
  const { data: alvaras } = useCollection(alvarasQuery)

  const certidoesQuery = useMemoFirebase(() => 
    userLoaded ? collection(firestore, "certidoes") : null, 
    [firestore, userLoaded]
  )
  const { data: certidoes } = useCollection(certidoesQuery)

  // Lógica de Cálculo de Indicadores
  const stats = useMemo(() => {
    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)
    
    // 1. Processos (Filtrados pela competência do mês atual)
    const currentMonthProcesses = (processes || []).filter(p => {
      if (!p.competencia) return false
      const comp = typeof p.competencia === 'string' ? parseISO(p.competencia) : new Date(p.competencia)
      return isWithinInterval(comp, { start: monthStart, end: monthEnd })
    })

    const totalProcesses = currentMonthProcesses.length
    const completedProcesses = currentMonthProcesses.filter(p => p.situacao === 'concluido').length
    const percentOk = totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 100
    const atrasosProd = currentMonthProcesses.filter(p => p.situacao === 'em_multa').length

    // 2. Honorários (Soma do faturamento do mês atual)
    const monthlyHonoraries = (receivables || [])
      .filter(r => {
        if (!r.data) return false
        const rDate = parseISO(r.data)
        return isWithinInterval(rDate, { start: monthStart, end: monthEnd })
      })
      .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

    // 3. Alvarás Críticos (Vencidos ou em Alerta de 30 dias)
    const criticalAlvaras = (alvaras || []).filter((l: any) => {
      if (l.status === 'VENCIDO' || l.status === 'CASSADO') return true;
      if (!l.validade) return false
      try {
        const exp = parseISO(l.validade)
        return isBefore(exp, today) || differenceInDays(exp, today) <= 30
      } catch { return false }
    }).length

    // 4. Certidões Críticas (Vencidas ou em Alerta de 15 dias)
    const criticalCertidoes = (certidoes || []).filter((c: any) => {
      if (c.status === 'VENCIDA' || c.status === 'POSITIVA' || c.status === 'POSITIVA_EFEITO_NEGATIVA') return true;
      if (!c.validade) return false
      try {
        const val = parseISO(c.validade)
        return isBefore(val, today) || differenceInDays(val, today) <= 15
      } catch { return false }
    }).length

    return {
      clientsCount: clients?.length || 0,
      percentOk: `${percentOk}%`,
      atrasos: atrasosProd,
      honorarios: monthlyHonoraries.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      criticalAlvaras,
      criticalCertidoes
    }
  }, [clients, processes, receivables, alvaras, certidoes])

  const isDataLoading = loadingClients

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">
            Painel <span className="text-[#1FA67A]">Estratégico</span>
          </h1>
          <p className="text-[#98A7AA] font-bold text-sm uppercase tracking-widest">Monitoramento de produção e conformidade fiscal.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border rounded-xl px-4 py-2 shadow-sm flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isDataLoading ? "bg-amber-400 animate-pulse" : "bg-[#1FA67A]"
            )} />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-[#98A7AA] leading-none mb-0.5">Sincronização</span>
              <span className="text-xs font-bold text-[#2C4156]">
                {isDataLoading ? "Buscando..." : "Operacional"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loadingClients ? (
          <KpiSkeleton />
        ) : (
          <KpiCard label="Clientes" value={stats.clientsCount} icon={Users} color="primary" />
        )}
        
        <KpiCard label="Processos OK" value={stats.percentOk} icon={CheckCircle2} color="success" />
        
        <KpiCard 
          label="Atrasos" 
          value={stats.atrasos} 
          icon={AlertCircle} 
          color={stats.atrasos > 0 ? "destructive" : "primary"} 
        />
        
        <KpiCard 
          label="Alvarás Alerta" 
          value={stats.criticalAlvaras} 
          icon={FlameKindling} 
          color={stats.criticalAlvaras > 0 ? "warning" : "success"} 
        />
        
        <KpiCard 
          label="Certidões Alerta" 
          value={stats.criticalCertidoes} 
          icon={ShieldAlert} 
          color={stats.criticalCertidoes > 0 ? "destructive" : "success"} 
        />

        <KpiCard label="Honorários" value={stats.honorarios} icon={DollarSign} color="info" />
      </div>

      {/* 
          Os gráficos e o status da operação foram removidos conforme solicitação (X na imagem).
          O Dashboard agora foca na clareza dos indicadores superiores.
      */}
      
      <div className="h-64 flex flex-col items-center justify-center text-center opacity-20 grayscale pointer-events-none">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-black tracking-tighter">PROSPERARE</span>
          <span className="text-xs font-black tracking-tighter text-[#1FA67A]">FLOW</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Inteligência e Gestão Contábil</p>
      </div>
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
