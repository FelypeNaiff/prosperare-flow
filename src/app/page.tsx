"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // In a real app, check auth state here
    router.push("/dashboard")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded flex items-center justify-center">
          <span className="text-white font-bold text-2xl">C</span>
        </div>
        <p className="text-primary font-bold tracking-widest uppercase text-sm">Carregando ContaHub...</p>
      </div>
    </div>
  )
}
