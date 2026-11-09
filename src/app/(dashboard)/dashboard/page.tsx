
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
  DollarSign,
  ShieldCheck
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { parseISO, isBefore, differenceInDays, startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from "recharts"
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

    // 4. Certidões Críticas (Vencidas ou em Alerta de 15 a 30 dias)
    const criticalCertidoesList = (certidoes || []).filter((c: any) => {
      if (c.status === 'VENCIDA' || c.status === 'POSITIVA' || c.status === 'POSITIVA_EFEITO_NEGATIVA') return true;
      if (!c.validade) return false
      try {
        const val = parseISO(c.validade)
        return isBefore(val, today) || differenceInDays(val, today) <= 30
      } catch { return false }
    }).map((c: any) => {
      let days = Infinity;
      try {
        if (c.validade) days = differenceInDays(parseISO(c.validade), today);
      } catch {}
      const client = (clients || []).find((cl: any) => cl.id === c.clientId || cl.id === c.clienteId)
      return { 
        ...c, 
        days, 
        clientName: c.clientName || client?.corporateName || client?.nomeFantasia,
        document: client?.cnpj || client?.cpf 
      }
    }).sort((a: any, b: any) => a.days - b.days)

    const criticalCertidoes = criticalCertidoesList.length

    // 5. Histórico e Alertas Críticos para a UI
    const chartData = []
    for (let i = 5; i >= 0; i--) {
      const targetMonthStart = startOfMonth(subMonths(today, i))
      const targetMonthEnd = endOfMonth(subMonths(today, i))
      
      const monthProcs = (processes || []).filter(p => {
        if (!p.competencia && !p.prazo) return false
        const dateRaw = p.competencia || p.prazo
        let parsed = new Date()
        try { parsed = typeof dateRaw === 'string' ? parseISO(dateRaw) : new Date(dateRaw) } catch {}
        return isWithinInterval(parsed, { start: targetMonthStart, end: targetMonthEnd })
      })

      const concluido = monthProcs.filter(p => p.situacao === 'concluido' || p.situacao === 'dispensado').length
      const em_progresso = monthProcs.filter(p => p.situacao === 'em_progresso').length
      const a_fazer = monthProcs.filter(p => p.situacao === 'a_fazer' || p.situacao === 'em_multa').length
      const total = monthProcs.length

      chartData.push({
        name: format(targetMonthStart, "MMM/yy", { locale: ptBR }).toUpperCase(),
        concluido,
        em_progresso,
        a_fazer,
        total
      })
    }

    const urgentList = (processes || [])
      .filter(p => p.situacao !== 'concluido' && p.situacao !== 'dispensado' && !!p.prazo)
      .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
      .slice(0, 5)

    return {
      clientsCount: clients?.length || 0,
      percentOk: `${percentOk}%`,
      atrasos: atrasosProd,
      honorarios: monthlyHonoraries.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      criticalAlvaras,
      criticalCertidoes,
      chartData,
      urgentList,
      criticalCertidoesList
    }
  }, [clients, processes, receivables, alvaras, certidoes])

  const isDataLoading = loadingClients
  const { chartData, urgentList: topUrgentProcesses, criticalCertidoesList } = stats

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">
            Painel
          </h1>
          <p className="text-[#98A7AA] font-medium text-sm">Monitoramento de produção e conformidade fiscal.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border rounded-xl px-4 py-2 shadow-sm flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isDataLoading ? "bg-amber-400 animate-pulse" : "bg-[#2563EB]"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#D2D7DB] shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="mb-6 flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#2C4156] tracking-tight">Visão Geral de Desempenho</h2>
                  <p className="text-[#98A7AA] font-bold text-xs">Processos por Status e Evolução Mensal</p>
                </div>
              </div>
              <div className="h-72 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                     <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" stroke="#98A7AA" />
                     <YAxis fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" stroke="#98A7AA" />
                     <Tooltip 
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                     />
                     <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                     <Bar dataKey="concluido" stackId="a" fill="#2563EB" name="Concluídos" radius={[0, 0, 4, 4]} />
                     <Bar dataKey="em_progresso" stackId="a" fill="#2574A9" name="Em Progresso" />
                     <Bar dataKey="a_fazer" stackId="a" fill="#F2B705" name="Pendente" radius={[4, 4, 0, 0]} />
                     <Line type="monotone" dataKey="total" stroke="#2C4156" name="Total Demandado" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                   </ComposedChart>
                 </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border-[#D2D7DB]">
            <CardContent className="p-6">
              <div className="mb-4 pb-4 border-b">
                <h2 className="text-lg font-semibold text-[#2C4156] tracking-tight flex items-center gap-2">
                  ⚠️ Alerta de Certidões
                </h2>
                <p className="text-[#98A7AA] font-bold text-xs uppercase pt-1">Gestão de Vencimentos (Vencidas e A Vencer em até 30 dias)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="border-b">
                      <th className="pb-3 pt-3 pl-4 text-sm font-medium text-slate-500">Cliente / Documento</th>
                      <th className="pb-3 pt-3 text-sm font-medium text-slate-500">Tipo</th>
                      <th className="pb-3 pt-3 text-sm font-medium text-slate-500 text-center">Vencimento</th>
                      <th className="pb-3 pt-3 pr-4 text-sm font-medium text-slate-500 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalCertidoesList?.length > 0 ? (
                      criticalCertidoesList.map((c: any) => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-[#F7F7F7] transition-colors">
                          <td className="py-3">
                            <p className="text-xs font-black text-[#2C4156] uppercase leading-tight">{c.clientName || 'Cliente Indefinido'}</p>
                            <p className="text-[10px] font-bold text-[#98A7AA] uppercase">{c.document || c.cnpj || '---'}</p>
                          </td>
                          <td className="py-3 text-[10px] font-black text-[#39586D] uppercase">{c.tipo || '---'}</td>
                          <td className="py-3 text-center text-xs font-bold text-[#E74C3C]">
                            {c.validade ? new Date(c.validade).toLocaleDateString('pt-BR') : '--'}
                          </td>
                          <td className="py-3 text-right">
                            {c.days < 0 ? (
                              <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-none text-[9px] font-black uppercase px-2 py-1">Vencida</Badge>
                            ) : (
                              <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50 border-none text-[9px] font-black uppercase px-2 py-1">A Vencer</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center bg-white">
                          <EmptyState
                            icon={ShieldCheck}
                            title="Tudo em dia"
                            description="Nao ha certidoes vencidas ou em alerta para os proximos dias."
                            className="border-none bg-white py-8"
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="border-[#D2D7DB] shadow-sm bg-white border-t-4 border-t-[#E74C3C] h-full flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
               <div className="mb-4">
                  <h2 className="text-sm font-semibold text-[#2C4156] tracking-tight flex items-center gap-2">
                    <FlameKindling className="h-4 w-4 text-[#E74C3C]" />
                    Alertas Críticos
                  </h2>
                  <p className="text-[#98A7AA] font-bold text-[10px] uppercase">Atenção Imediata Necessária</p>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                 {topUrgentProcesses.length > 0 ? topUrgentProcesses.map((process: any) => (
                    <div key={process.id} className="p-3 bg-[#F7F7F7] border border-[#D2D7DB] rounded-lg relative overflow-hidden group hover:border-[#E74C3C]/50 transition-colors cursor-pointer" onClick={() => window.location.href='/processos'}>
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E74C3C]" />
                       <div className="pl-2">
                         <div className="flex justify-between items-start mb-1">
                           <span className="text-[9px] font-black uppercase text-[#E74C3C] bg-[#FEE2E2] px-1.5 py-0.5 rounded">
                             Urgente
                           </span>
                           <span className="text-[10px] font-bold text-[#E74C3C]">
                             Prazo: {process.prazo ? parseISO(process.prazo).toLocaleDateString('pt-BR') : 'Sem Prazo'}
                           </span>
                         </div>
                         <h4 className="text-xs font-black text-[#2C4156] uppercase tracking-tight leading-none mb-1 line-clamp-1">{process.nomeProcesso || 'Processo'}</h4>
                         <p className="text-[10px] font-bold text-[#98A7AA] truncate">Cliente ID: {process.clienteId?.slice(0,8)} | Resp: {process.responsavelId}</p>
                       </div>
                    </div>
                 )) : (
                   <div className="h-full flex flex-col items-center justify-center py-8">
                     <EmptyState
                       icon={CheckCircle2}
                       title="Nenhum processo critico"
                       description="Nao ha processos exigindo atencao imediata neste momento."
                       className="border-none bg-white py-8"
                     />
                   </div>
                 )}
               </div>
            </CardContent>
          </Card>
        </div>
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
