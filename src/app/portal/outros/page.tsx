'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen } from "lucide-react"

export default function OutrosPortalPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Outros Assuntos</h1>
        <p className="text-[#98A7AA] font-medium text-sm">Envie outras demandas, dúvidas ou documentos avulsos para o escritório.</p>
      </div>

      <Card className="border-[#D2D7DB] shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            Solicitações Gerais / Avulsas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center text-slate-400 font-semibold uppercase text-xs tracking-wider">
          Utilize esta aba para enviar quaisquer outras dúvidas ou solicitações gerais ao suporte.
        </CardContent>
      </Card>
    </div>
  )
}
