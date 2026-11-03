
"use client"

import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Pessoal", value: 8, color: "#2574A9" },
  { name: "Fiscal", value: 5, color: "#2563EB" },
  { name: "Contábil", value: 3, color: "#C0392B" },
  { name: "Adm", value: 2, color: "#39586D" },
]

const config = {
  value: { label: "Atendimentos" },
}

export function AttendanceChart() {
  return (
    <div className="h-[250px] w-full">
      <ChartContainer config={config}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            formatter={(value) => <span className="text-[10px] font-bold uppercase text-[#98A7AA]">{value}</span>}
          />
        </PieChart>
      </ChartContainer>
    </div>
  )
}
