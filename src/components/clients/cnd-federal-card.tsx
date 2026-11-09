"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Download, ShieldAlert, CheckCircle2, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking } from "@/firebase"

interface CndFederalCardProps {
  clientId: string;
  clientRef: any;
  initialCnd?: {
    status: "REGULAR" | "IRREGULAR" | "EXPIRANDO" | string;
    dataEmissao: string;
    dataValidade: string;
    urlDocumentoPdf: string;
    updatedAt?: string;
  };
  cnpj: string;
}

export function CndFederalCard({ clientId, clientRef, initialCnd, cnpj }: CndFederalCardProps) {
  const [loading, setLoading] = useState(false)
  const [cnd, setCnd] = useState(initialCnd || null)

  const handleSync = async () => {
    if (!cnpj) {
      toast({ 
        variant: "destructive", 
        title: "Erro de Sincronização", 
        description: "CNPJ do cliente não cadastrado." 
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/cnd/federal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cnpj }),
      })

      if (!response.ok) {
        throw new Error("Erro na comunicação com a API de CND")
      }

      const data = await response.json()

      const updatedCnd = {
        status: data.status,
        dataEmissao: data.dataEmissao,
        dataValidade: data.dataValidade,
        urlDocumentoPdf: data.urlDocumentoPdf,
        updatedAt: new Date().toISOString()
      }

      // Salva no estado local
      setCnd(updatedCnd)

      // Persiste no documento do cliente no Firestore
      if (clientRef) {
        await updateDocumentNonBlocking(clientRef, {
          cndFederal: updatedCnd
        })
      }

      toast({
        title: "CND Sincronizada!",
        description: `Status atualizado para: ${data.status}`
      })
    } catch (error: any) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Falha na Sincronização",
        description: error.message || "Não foi possível obter a certidão."
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "REGULAR":
        return (
          <Badge 
            variant="outline" 
            className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 shrink-0"
          >
            <CheckCircle2 className="h-3 w-3" />
            REGULAR
          </Badge>
        )
      case "IRREGULAR":
        return (
          <Badge 
            variant="outline" 
            className="bg-red-50 text-red-700 border-red-200 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 shrink-0"
          >
            <ShieldAlert className="h-3 w-3" />
            IRREGULAR
          </Badge>
        )
      case "EXPIRANDO":
        return (
          <Badge 
            variant="outline" 
            className="bg-amber-50 text-amber-700 border-amber-200 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 shrink-0"
          >
            <Clock className="h-3 w-3" />
            EXPIRANDO
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0">
            NÃO CONSULTADO
          </Badge>
        )
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "--"
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  return (
    <Card className="border-[#D2D7DB] bg-white rounded-xl shadow-sm">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-black uppercase text-[#2C4156] tracking-tight">
          Certidão Negativa (Federal e INSS)
        </CardTitle>
        {cnd && getStatusBadge(cnd.status)}
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {!cnd ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-xs text-slate-400 font-medium">Nenhuma CND federal sincronizada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-3 rounded-lg border border-slate-100">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-[#98A7AA] uppercase tracking-wider block">Emissão</span>
              <span className="font-bold text-[#39586D]">{formatDate(cnd.dataEmissao)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-[#98A7AA] uppercase tracking-wider block">Validade</span>
              <span className="font-bold text-[#39586D]">{formatDate(cnd.dataValidade)}</span>
            </div>
            {cnd.updatedAt && (
              <div className="col-span-2 pt-1 border-t border-slate-100 text-[9px] text-slate-400 font-medium">
                Última atualização: {new Date(cnd.updatedAt).toLocaleString("pt-BR")}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 w-full pt-1">
          <Button 
            variant="outline" 
            className="flex-1 border-[#D2D7DB] text-slate-700 text-xs font-bold h-9 rounded-lg gap-1.5 hover:bg-slate-50 transition-colors"
            onClick={handleSync}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            )}
            Sincronizar Agora
          </Button>

          <Button 
            variant="outline" 
            className="border-[#D2D7DB] text-slate-700 text-xs font-bold h-9 px-3 rounded-lg hover:bg-slate-50 transition-colors shrink-0 disabled:opacity-50"
            disabled={!cnd?.urlDocumentoPdf}
            asChild={!!cnd?.urlDocumentoPdf}
          >
            {cnd?.urlDocumentoPdf ? (
              <a 
                href={cnd.urlDocumentoPdf} 
                target="_blank" 
                rel="noopener noreferrer"
                title="Baixar PDF"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
              </a>
            ) : (
              <span>
                <Download className="h-3.5 w-3.5 text-slate-500" />
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
