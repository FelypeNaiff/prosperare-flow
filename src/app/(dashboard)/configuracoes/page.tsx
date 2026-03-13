
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ConfiguracoesPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redireciona para a primeira seção por padrão
    router.push("/configuracoes/meus-dados")
  }, [router])

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1FA67A]"></div>
    </div>
  )
}
