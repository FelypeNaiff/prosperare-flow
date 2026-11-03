
"use client"

import { CreditCard, Rocket, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PlanoAssinaturaPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Plano e Assinatura</h1>
        <p className="text-[#98A7AA] font-medium">Gerencie seu plano Prosperare Flow e detalhes de faturamento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#2563EB] border-2 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#2563EB] text-white text-[10px] font-bold px-4 py-1 rounded-bl-lg uppercase">Plano Atual</div>
          <CardHeader>
            <CardTitle className="text-2xl font-black text-[#2C4156]">FLOW PRO</CardTitle>
            <CardDescription>Escritórios de médio e grande porte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-[#2563EB]">R$ 499</span>
              <span className="text-sm font-bold text-[#98A7AA]">/mês</span>
            </div>
            <ul className="space-y-2">
              {['Clientes Ilimitados', 'Processos Automáticos', 'IA Redatora Full', 'WhatsApp Ilimitado', 'Suporte Prioritário'].map((feat, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium text-[#39586D]">
                  <div className="bg-[#7ED6B5] rounded-full p-0.5"><Check className="h-3 w-3 text-[#2563EB]" /></div>
                  {feat}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-[#D2D7DB] font-bold">Alterar Plano</Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card className="border-[#D2D7DB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#2C4156]" />
                Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-[#F7F7F7] rounded-lg border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                  <div>
                    <p className="text-sm font-bold">•••• 4455</p>
                    <p className="text-[10px] text-[#98A7AA]">Exp: 12/28</p>
                  </div>
                </div>
                <Button variant="ghost" className="text-xs font-bold text-[#2574A9]">Editar</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#2C4156] text-white border-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl"><Rocket className="h-8 w-8 text-[#2563EB]" /></div>
              <div>
                <p className="font-bold">Indique e Ganhe</p>
                <p className="text-xs text-white/70">Ganhe 1 mês de isenção para cada escritório que contratar o Prosperare Flow.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
