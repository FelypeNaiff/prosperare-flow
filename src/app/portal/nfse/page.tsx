'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function NfsePortalPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Solicitação de NFSe</h1>
        <p className="text-[#98A7AA] font-medium text-sm">Solicite a emissão de notas fiscais de serviço para seus clientes.</p>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Emissão de Nota Fiscal de Serviço (NFSe)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center text-slate-400 font-semibold uppercase text-xs tracking-wider">
          Módulo de emissão de NFSe em fase de homologação junto à prefeitura.
        </CardContent>
      </Card>
    </div>
  )
}
