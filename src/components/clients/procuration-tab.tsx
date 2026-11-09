
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { FileSignature, RefreshCw, Calendar, CheckCircle2, AlertCircle } from "lucide-react"

interface ProcurationTabProps {
  clientId: string;
}

export function ProcurationTab({ clientId }: ProcurationTabProps) {
  const [services, setServices] = useState([
    { id: '1', label: 'Parcelamento de Débitos', checked: true },
    { id: '2', label: 'Consulta Pendências Fiscais', checked: true },
    { id: '3', label: 'Emissão de DARF', checked: true },
    { id: '4', label: 'Processos Digitais (e-Processo)', checked: true },
    { id: '5', label: 'Declarações e Demonstrativos', checked: true },
    { id: '6', label: 'Restituição e Compensação', checked: false },
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-primary" />
          Procuração Eletrônica e-CAC
        </h3>
        <Button size="sm" variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar Status
        </Button>
      </div>

      <Card className="bg-emerald-50/30 border-emerald-100">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8 justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Status Atual</p>
                  <p className="text-xl font-bold text-blue-700">Procuração Ativa</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Início da Vigência</Label>
                  <p className="font-bold flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> 01/01/2024
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Vencimento</Label>
                  <p className="font-bold flex items-center gap-1 text-blue-600">
                    <Calendar className="h-3 w-3" /> 31/12/2024
                  </p>
                </div>
              </div>
            </div>

            <div className="md:w-1/3 p-4 bg-background rounded-lg border space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">Observações</p>
              <p className="text-sm">Procuração outorgada para todos os serviços federais, com poderes para parcelamento.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h4 className="font-bold text-sm">Serviços Autorizados</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/30 transition-colors">
              <Checkbox id={service.id} checked={service.checked} />
              <Label htmlFor={service.id} className="text-xs cursor-pointer">{service.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
