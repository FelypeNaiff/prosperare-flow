'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarClock } from "lucide-react"

export default function EventosPortalPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Eventos</h1>
        <p className="text-[#98A7AA] font-medium text-sm">Envie variáveis de folha, prêmios, comissões ou horas extras.</p>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            Lançamento de Eventos da Folha
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center text-slate-400 font-semibold uppercase text-xs tracking-wider">
          Módulo de envio de eventos do cliente está sendo estruturado.
        </CardContent>
      </Card>
    </div>
  )
}
