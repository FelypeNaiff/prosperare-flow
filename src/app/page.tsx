"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp } from "lucide-react"

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    router.push("/dashboard")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-primary">
      <div className="animate-pulse flex flex-col items-center gap-6">
        <div className="relative w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-primary/20" />
          <TrendingUp className="w-10 h-10 text-primary z-10" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight uppercase">Prosperare Flow</h1>
          <p className="text-muted-foreground font-medium tracking-widest uppercase text-[10px]">
            Carregando Fluxo de Tarefas...
          </p>
        </div>
      </div>
    </div>
  )
}
