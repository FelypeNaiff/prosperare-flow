
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FinanceiroRootPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redireciona para Contas a Receber por padrão ao acessar /financeiro
    router.push("/financeiro/receber")
  }, [router])

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
