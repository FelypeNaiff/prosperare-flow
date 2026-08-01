"use client"

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { obligation: "PGDAS", concluido: 45, pendente: 10, atrasado: 5 },
  { obligation: "DCTFWeb", concluido: 30, pendente: 15, atrasado: 12 },
  { obligation: "FGTS", concluido: 50, pendente: 5, atrasado: 2 },
  { obligation: "eSocial", concluido: 40, pendente: 12, atrasado: 8 },
  { obligation: "Folha", concluido: 35, pendente: 20, atrasado: 3 },
  { obligation: "Certidões", concluido: 55, pendente: 4, atrasado: 1 },
]

const config = {
  concluido: { label: "Concluído", color: "#2563EB" },
  pendente: { label: "Pendente", color: "#F2B705" },
  atrasado: { label: "Atrasado", color: "#E74C3C" },
}

export function ObligationChart() {
  return (
    <div className="h-[350px] w-full">
      <ChartContainer config={config}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="obligation" 
            type="category" 
            tickLine={false} 
            axisLine={false} 
            width={80}
            className="text-[10px] font-bold text-[#39586D] uppercase"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="concluido" stackId="a" fill="var(--color-concluido)" radius={[0, 0, 0, 0]} barSize={24} />
          <Bar dataKey="pendente" stackId="a" fill="var(--color-pendente)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="atrasado" stackId="a" fill="var(--color-atrasado)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
