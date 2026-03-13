
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Plus, Calendar, ShieldCheck, History, AlertTriangle } from "lucide-react"
import { format, parseISO, differenceInDays, isBefore } from "date-fns"
import { cn } from "@/lib/utils"

interface DigitalCertificateTabProps {
  clientId: string;
}

export function DigitalCertificateTab({ clientId }: DigitalCertificateTabProps) {
  const [certificates, setCertificates] = useState([
    { 
      id: '1', 
      tipo: 'A1', 
      validade: '2025-05-15', 
      identificacao: 'Certificado_Matriz_2024.pfx', 
      ecac: 'Sim', 
      procuracaoValidade: '2025-12-31',
      status: 'Ativo'
    }
  ])

  const getCertStatus = (validadeStr: string) => {
    const hoje = new Date()
    const validade = parseISO(validadeStr)
    const dias = differenceInDays(validade, hoje)

    if (isBefore(validade, hoje)) return { label: 'Vencido', color: 'bg-red-500' }
    if (dias <= 30) return { label: 'Vencendo', color: 'bg-yellow-500 text-black' }
    return { label: 'Válido', color: 'bg-emerald-500' }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Gerenciamento de Certificado Digital
        </h3>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Certificado
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert) => {
          const status = getCertStatus(cert.validade)
          return (
            <Card key={cert.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="font-bold">{cert.tipo}</Badge>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
                <CardTitle className="text-md mt-2">{cert.identificacao}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Validade
                    </p>
                    <p className="font-bold">{format(parseISO(cert.validade), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Procuração e-CAC</p>
                    <p className="font-bold">{cert.ecac}</p>
                  </div>
                </div>
                {cert.ecac === 'Sim' && (
                  <div className="p-3 bg-muted rounded-md text-xs">
                    <p className="font-semibold text-primary">Procuração Ativa</p>
                    <p className="text-muted-foreground">Vencimento: {format(parseISO(cert.procuracaoValidade), 'dd/MM/yyyy')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico de Certificados
        </h4>
        <div className="border rounded-lg divide-y">
          {[
            { data: '10/05/2023', acao: 'Certificado Expirado', id: 'A1 - 2023' },
            { data: '12/05/2022', acao: 'Certificado Expirado', id: 'A1 - 2022' },
          ].map((item, i) => (
            <div key={i} className="p-3 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{item.data}</span>
              <span className="font-medium">{item.acao}</span>
              <span className="text-xs text-muted-foreground">{item.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
