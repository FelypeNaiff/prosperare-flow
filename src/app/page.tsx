"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2C4156] text-white overflow-hidden">
      <div className="relative flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
        <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-[#1FA67A]">
          <TrendingUp className="w-12 h-12 text-[#2C4156]" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#1FA67A] rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
        
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-2">
            PROSPERARE <span className="text-[#1FA67A]">FLOW</span>
          </h1>
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-[#1FA67A]" />
            <p className="text-[#98A7AA] font-bold tracking-[0.3em] uppercase text-[10px]">
              Sincronizando Fluxo de Trabalho...
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-40">
        <p className="text-[10px] font-black uppercase tracking-widest">Powered by Prosperare Intelligence</p>
        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#1FA67A] animate-progress origin-left w-full" />
        </div>
      </div>
    </div>
  )
}
