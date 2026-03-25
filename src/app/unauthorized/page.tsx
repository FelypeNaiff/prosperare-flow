"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/firebase"
import { initiateLogout } from "@/firebase/non-blocking-login"
import { useRouter } from "next/navigation"

export default function UnauthorizedPage() {
  const auth = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    initiateLogout(auth)
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] p-4 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-[#E74C3C]/10 flex items-center justify-center border-2 border-[#E74C3C]/20 shadow-inner">
            <ShieldAlert className="h-12 w-12 text-[#E74C3C]" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Acesso Negado</h1>
          <div className="space-y-2">
            <p className="text-[#39586D] font-medium leading-relaxed">
              Este e-mail não está cadastrado como colaborador no <span className="font-bold text-[#1FA67A]">Prosperare Flow</span>.
            </p>
            <p className="text-xs text-[#98A7AA] font-bold uppercase tracking-widest">
              Solicite acesso ao administrador do escritório.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-4">
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="border-[#D2D7DB] text-[#2C4156] font-bold h-12 gap-2 hover:bg-white"
          >
            <LogOut className="h-4 w-4 text-[#E74C3C]" />
            Sair e trocar de conta
          </Button>
          
          <Button asChild variant="ghost" className="text-[#98A7AA] font-bold hover:text-[#2C4156]">
            <Link href="/login" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar ao início
            </Link>
          </Button>
        </div>

        <div className="pt-8 opacity-20 grayscale pointer-events-none">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-black tracking-tighter">PROSPERARE</span>
            <span className="text-xs font-black tracking-tighter text-[#1FA67A]">FLOW</span>
          </div>
        </div>
      </div>
    </div>
  )
}
