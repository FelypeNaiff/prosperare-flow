
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

export function IrpfDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
      <KpiCard label="Total" value="156" icon={Users} color="primary" />
      <KpiCard label="Concluídas" value="42" subValue="27%" icon={CheckCircle2} color="success" />
      <KpiCard label="Em Aberto" value="114" icon={BarChart3} color="info" />
      <KpiCard label="Atrasadas" value="8" icon={Clock} color="destructive" />
      <KpiCard label="Aguardando Doc" value="35" icon={AlertTriangle} color="warning" />
      <KpiCard label="Honorários" value="R$ 45k" icon={DollarSign} color="success" />
      <KpiCard label="Restituição" value="R$ 210k" icon={Heart} color="success" />
      <KpiCard label="Malha Fiscal" value="2" icon={TrendingDown} color="destructive" />
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
    <Card className={cn("border-none shadow-sm border-l-4", colors[color as keyof typeof colors])}>
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
