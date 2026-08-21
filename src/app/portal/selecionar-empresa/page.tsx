'use client';

import { useState } from "react"
import { useUser } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, ArrowRight, ShieldCheck, LogOut } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { initiateLogout } from "@/firebase/non-blocking-login"
import { useAuth } from "@/firebase"

export default function SelecionarEmpresaPage() {
  const { selectedUser } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState<string | null>(null)

  // Lista de empresas vinculadas com fallback mockado para validação visual
  const empresas = selectedUser?.empresasVinculadas || [
    { cnpj: "12.345.678/0001-90", companyName: "ELETRO LTDA", razaoSocial: "ELETRO LTDA" },
    { cnpj: "04.536.819/0001-90", companyName: "PROSPERARE LTDA", razaoSocial: "PROSPERARE LTDA" }
  ]

  const formatCnpj = (val: string) => {
    const clean = val.replace(/\D/g, "")
    if (clean.length !== 14) return val
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
  }

  const handleSelectCompany = (emp: any) => {
    setIsNavigating(emp.cnpj)
    
    // Define a empresa ativa
    localStorage.setItem("portal_client_active_cnpj", emp.cnpj || "")
    localStorage.setItem("portal_client_active_company", emp.companyName || emp.razaoSocial || "")

    toast({
      title: "Empresa Selecionada!",
      description: `Direcionando para o portal da ${emp.companyName || emp.razaoSocial}.`
    })

    // Redireciona para página de férias
    router.push("/portal/ferias")
  }

  const handleLogout = async () => {
    try {
      await initiateLogout(auth)
      toast({ title: "Sessão encerrada" })
      router.push("/login")
    } catch (e) {
      toast({ title: "Erro ao sair", variant: "destructive" })
    }
  }

  const clientName = selectedUser?.fullName || selectedUser?.name || "Cliente"

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
      
      <div className="w-full max-w-2xl z-10 space-y-6">
        
        {/* Gateway Card */}
        <Card className="border-slate-200/80 shadow-2xl bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#2C4156] text-white p-8 relative">
            <div className="absolute top-6 right-6 flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              Ambiente Seguro
            </div>
            
            <Building2 className="h-10 w-10 text-[#2563EB] mb-4 shrink-0" />
            <CardTitle className="text-2xl font-black uppercase tracking-tight">
              Olá, {clientName}
            </CardTitle>
            <CardDescription className="text-white/60 font-semibold text-xs tracking-wide">
              Selecione a empresa que deseja acessar para gerenciar demandas e consultar informações:
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8 space-y-4">
            
            <div className="grid grid-cols-1 gap-4">
              {empresas.map((emp: any) => (
                <button
                  key={emp.cnpj}
                  onClick={() => handleSelectCompany(emp)}
                  disabled={isNavigating !== null}
                  className="group w-full flex items-center justify-between p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#2563EB] hover:bg-slate-50/50 hover:shadow-md transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#2C4156] group-hover:text-blue-900 transition-colors uppercase text-sm">
                        {emp.companyName || emp.razaoSocial}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                        CNPJ: {formatCnpj(emp.cnpj)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-[#2563EB] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
                      Acessar
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#2563EB] text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

          </CardContent>
        </Card>

        {/* Footer actions */}
        <div className="flex justify-between items-center px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Prosperare Flow v3.1
          </p>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-xs font-black uppercase text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 gap-2 px-4 rounded-xl"
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </Button>
        </div>

      </div>
    </div>
  )
}
