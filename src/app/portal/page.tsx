'use client';

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Calendar,
  FileX,
  Receipt,
  PlusCircle,
  Building,
  Flame,
  ShieldAlert,
  Clock,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/firebase"

export default function PortalDashboardPage() {
  const { selectedUser } = useUser()
  const [cnpj, setCnpj] = useState("")
  const [companyName, setCompanyName] = useState("")

  // Sincroniza CNPJ da empresa ativa no portal
  useEffect(() => {
    const container = document.getElementById("portal-context-container")
    if (container) {
      setCnpj(container.getAttribute("data-active-cnpj") || "")
      setCompanyName(container.getAttribute("data-active-company") || "")
    }

    const handleCnpjChange = (e: any) => {
      if (e.detail?.cnpj) {
        setCnpj(e.detail.cnpj)
        if (e.detail.client) {
          setCompanyName(e.detail.client.nomeFantasia || e.detail.client.razaoSocial || "")
        }
      }
    }
    window.addEventListener("portalCompanyChanged", handleCnpjChange)
    return () => window.removeEventListener("portalCompanyChanged", handleCnpjChange)
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      
      {/* 1. WELCOME HEADER */}
      <div className="bg-gradient-to-r from-[#2C4156] to-[#1E293B] text-white p-8 rounded-3xl shadow-lg border border-white/5 relative overflow-hidden">
        {/* Soft decorative glow */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#2563EB]/10 rounded-full blur-[40px] pointer-events-none transform translate-x-12 -translate-y-6" />
        
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Painel do Cliente</span>
          <h1 className="text-3xl font-black tracking-tight uppercase">Olá, {selectedUser?.fullName || 'Cliente'}</h1>
          <p className="text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
            Seja bem-vindo ao seu portal. Acompanhe a regularidade do seu negócio, solicite serviços e gerencie obrigações com facilidade.
          </p>

          {companyName && (
            <div className="flex flex-wrap items-center gap-3 pt-3 text-xs font-bold border-t border-white/10 mt-6">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                <Building className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{companyName}</span>
              </div>
              {cnpj && (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-slate-400 uppercase tracking-widest text-[9px]">CNPJ:</span>
                  <span>{cnpj}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. SECTION: QUICK ACTIONS */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-[#2C4156] uppercase tracking-[0.2em]">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Férias */}
          <Link href="/portal/ferias">
            <Card className="border-slate-200/80 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group bg-white">
              <CardContent className="p-6 space-y-4 text-left">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#2C4156] uppercase tracking-wide group-hover:text-blue-600 transition-colors">Solicitar Férias</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Programe períodos de descanso para seus colaboradores de forma prática.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: Rescisão */}
          <Link href="/portal/rescisao">
            <Card className="border-slate-200/80 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group bg-white">
              <CardContent className="p-6 space-y-4 text-left">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl w-fit group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                  <FileX className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#2C4156] uppercase tracking-wide group-hover:text-rose-600 transition-colors">Solicitar Rescisão</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Envie dados e documentos para desligamento de colaboradores.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 3: Emissão de NFSe */}
          <Link href="/portal/nfse">
            <Card className="border-slate-200/80 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group bg-white">
              <CardContent className="p-6 space-y-4 text-left">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <Receipt className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#2C4156] uppercase tracking-wide group-hover:text-emerald-600 transition-colors">Emissão de NF-e</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Solicite a emissão de notas fiscais eletrônicas de produto ou serviço.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card 4: Outros */}
          <Link href="/portal/outros">
            <Card className="border-slate-200/80 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full group bg-white">
              <CardContent className="p-6 space-y-4 text-left">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#2C4156] uppercase tracking-wide group-hover:text-amber-600 transition-colors">Outras Demandas</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Envie solicitações personalizadas, documentos ou tire dúvidas gerais.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>

      {/* 3. SECTION: LICENSES & PERMITS TRACKING */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-[#2C4156] uppercase tracking-[0.2em]">Acompanhamento de Alvarás</h2>
        </div>
        <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100">
            
            {/* Item 1: Prefeitura */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Alvará de Funcionamento (Prefeitura)</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Licença municipal obrigatória de localização e funcionamento.</p>
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-start sm:justify-end">
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                  Vigente até 31/12/2026
                </Badge>
              </div>
            </div>

            {/* Item 2: Bombeiros */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
              <div className="flex items-center gap-4 text-left w-full sm:max-w-xl">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                  <Flame className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Certificado Corpo de Bombeiros</h3>
                    <p className="text-[11px] text-slate-400 font-semibold">Vistoria e atestado de segurança das instalações físicas.</p>
                  </div>
                  
                  {/* Progress tracker */}
                  <div className="space-y-1 pt-1 max-w-sm">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-amber-600 tracking-wider">
                      <span>Análise técnica da vistoria</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-1.5 bg-slate-100" />
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-start sm:justify-end">
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                  Em processo de renovação
                </Badge>
              </div>
            </div>

            {/* Item 3: Vigilância Sanitária */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2C4156] uppercase tracking-wide">Vigilância Sanitária</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Licença de conformidade com normas sanitárias e de saúde.</p>
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-start sm:justify-end">
                <Badge className="bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-100 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                  Não exigido
                </Badge>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  )
}
