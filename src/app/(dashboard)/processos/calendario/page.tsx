
"use client"

import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CalendarioPrazosPage() {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Calendário de Prazos</h1>
          <p className="text-[#98A7AA] font-medium">Visualize suas obrigações em uma linha do tempo mensal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-[#D2D7DB]">
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-none"
            />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-lg">Eventos para {date?.toLocaleDateString('pt-BR')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-[#FEE2E2]/30 border-l-4 border-l-[#E74C3C] rounded-r-lg">
                <p className="font-bold text-[#E74C3C] text-sm">PGDAS-D Simples Nacional</p>
                <p className="text-xs text-[#39586D]">Vencimento fatal hoje. 12 pendências restantes.</p>
              </div>
              <div className="p-4 bg-[#E3F0F9]/30 border-l-4 border-l-[#2574A9] rounded-r-lg">
                <p className="font-bold text-[#2574A9] text-sm">FGTS Digital</p>
                <p className="text-xs text-[#39586D]">Previsão de processamento automático às 14:00.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
