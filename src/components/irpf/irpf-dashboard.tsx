
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Heart,
  TrendingDown,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

export function IrpfDashboard() {
  const { selectedUser } = useUser()
  const firestore = useFirestore()
  
  // Consulta filtrada pelo ID do colaborador operacional (selectedUser)
  const irpfQuery = useMemoFirebase(() => 
    selectedUser?.id ? query(collection(firestore, "irpf_declarations"), where("responsibleId", "==", selectedUser.id)) : null,
    [firestore, selectedUser?.id]
  )
  
  const { data: declarations = [] } = useCollection(irpfQuery)

  const stats = {
    total: declarations?.length || 0,
    completed: declarations?.filter(d => d.status === 'completed' || d.status === 'Enviada').length || 0,
    open: declarations?.filter(d => d.status !== 'completed' && d.status !== 'Enviada').length || 0,
    waitingDoc: declarations?.filter(d => d.tags?.includes('AGUARDANDO RETORNO...')).length || 0,
    honoraries: declarations?.reduce((acc, d) => acc + (Number(d.value) || 0), 0) || 0,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
      <KpiCard label="Minhas" value={stats.total} icon={Users} color="primary" />
      <KpiCard label="Concluídas" value={stats.completed} subValue={stats.total > 0 ? `${Math.round((stats.completed/stats.total)*100)}%` : '0%'} icon={CheckCircle2} color="success" />
      <KpiCard label="Em Aberto" value={stats.open} icon={BarChart3} color="info" />
      <KpiCard label="Atrasadas" value="0" icon={Clock} color="destructive" />
      <KpiCard label="Aguardando Doc" value={stats.waitingDoc} icon={AlertTriangle} color="warning" />
      <KpiCard label="Honorários" value={`R$ ${stats.honoraries.toLocaleString('pt-BR')}`} icon={DollarSign} color="success" />
      <KpiCard label="Restituição" value="R$ 0" icon={Heart} color="success" />
      <KpiCard label="Malha Fiscal" value="0" icon={TrendingDown} color="destructive" />
    </div>
  )
}

function KpiCard({ label, value, subValue, icon: Icon, color }: any) {
  const colors = {
    primary: "border-l-[#2C4156] bg-white",
    success: "border-l-[#1FA67A] bg-white",
    destructive: "border-l-[#E74C3C] bg-white",
    warning: "border-l-[#F2B705] bg-white",
    info: "border-l-[#2574A9] bg-white",
  }

  const iconColors = {
    primary: "bg-[#2C4156]/10 text-[#2C4156]",
    success: "bg-[#1FA67A]/10 text-[#1FA67A]",
    destructive: "bg-[#E74C3C]/10 text-[#E74C3C]",
    warning: "bg-[#F2B705]/10 text-[#F2B705]",
    info: "bg-[#2574A9]/10 text-[#2574A9]",
  }

  return (
    <Card className={cn("border-none shadow-sm border-l-4 h-full", colors[color as keyof typeof colors])}>
      <CardContent className="p-4 space-y-1">
        <div className="flex justify-between items-start">
          <div className={cn("p-1.5 rounded-lg", iconColors[color as keyof typeof iconColors])}>
            <Icon className="h-4 w-4" />
          </div>
          {subValue && <span className="text-[10px] font-bold text-[#1FA67A]">{subValue}</span>}
        </div>
        <div>
          <p className="text-[10px] font-extrabold text-[#98A7AA] uppercase tracking-widest truncate">{label}</p>
          <p className="text-xl font-black text-[#2C4156]">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
