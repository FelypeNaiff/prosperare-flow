
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useAuth } from "@/firebase"
import { initiateLogout } from "@/firebase/non-blocking-login"
import { TrendingUp, ShieldCheck, ArrowRight, Loader2, LogOut, CheckCircle2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LiberacaoPage() {
  const { user, isUserLoading, userData } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const [isReleasing, setIsReleasing] = useState(false)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleRelease = () => {
    setIsReleasing(true)
    // Simula validação de ambiente antes da entrada definitiva
    setTimeout(() => {
      router.push("/dashboard")
    }, 1200)
  }

  const handleLogout = () => {
    initiateLogout(auth)
    router.push("/login")
  }

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F7] p-4">
      <div className="w-full max-w-[480px] space-y-8 animate-in zoom-in duration-500">
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border-4 border-[#1FA67A]">
              <TrendingUp className="w-12 h-12 text-[#2C4156]" />
            </div>
            <div className="absolute -top-2 -right-2 bg-[#1FA67A] text-white p-1.5 rounded-full shadow-lg border-4 border-[#F7F7F7]">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#2C4156] tracking-tighter uppercase">
              Liberação de <span className="text-[#1FA67A]">Acesso</span>
            </h1>
            <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.3em]">Perfil Identificado: {userData?.fullName || user.email}</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-10 space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-[#E3F0F9] p-2 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-[#2574A9]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2C4156] uppercase">Estação Identificada</h3>
                  <p className="text-xs text-[#39586D] font-medium leading-relaxed">Seu terminal foi reconhecido e o túnel de criptografia Prosperare está ativo.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 bg-[#7ED6B5]/20 p-2 rounded-xl">
                  <ShieldCheck className="h-5 w-5 text-[#1FA67A]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2C4156] uppercase">Perfil Autorizado</h3>
                  <p className="text-xs text-[#39586D] font-medium leading-relaxed">Acesso total liberado para gestão de clientes, processos e financeiro.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Button 
                onClick={handleRelease}
                disabled={isReleasing}
                className="w-full h-16 bg-[#1FA67A] hover:bg-[#1FA67A]/90 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 rounded-2xl gap-3 transition-all group"
              >
                {isReleasing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Confirmar e Entrar
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => router.push("/escolha-usuario")}
                className="w-full text-[10px] font-black text-[#98A7AA] uppercase tracking-widest hover:bg-slate-50"
              >
                <User className="h-3 w-3 mr-2" /> Trocar de Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[9px] text-[#98A7AA] font-bold uppercase tracking-widest">
          Sincronizado com Prosperare Cloud v2026.0.1
        </p>
      </div>
    </div>
  )
}
