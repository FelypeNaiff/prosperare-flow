'use client';

import { useState, useEffect } from "react"
import { useAuth, useUser } from "@/firebase"
import { useRouter } from "next/navigation"
import { TrendingUp, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false)

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/escolha-usuario")
    }
  }, [user, isUserLoading, router])

  const handleGoogleLogin = async () => {
    setIsGoogleLoggingIn(true)
    try {
      const { initiateGoogleSignIn } = await import("@/firebase/non-blocking-login")
      await initiateGoogleSignIn(auth)
      // Check if user actually logged in by letting a short timeout verify auth state
      // If it takes too long without auth state changing, reset the spinner. 
      // The pop-up itself is awaited, so if they close it, we arrive here.
      setTimeout(() => {
        if (!auth.currentUser) setIsGoogleLoggingIn(false)
      }, 500)
    } catch (error: any) {
      setIsGoogleLoggingIn(false)
      console.error("Google Login failed:", error);
      toast({ 
        variant: "destructive", 
        title: "Tente novamente", 
        description: `Erro na autenticação do Google: ${error?.message || 'Ação cancelada.'}`
      })
    }
  }



  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F7] p-4">
      <div className="w-full max-w-[440px] space-y-8 animate-in fade-in duration-700">
        
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-[#1FA67A] rounded-2xl shadow-lg mb-2">
            <TrendingUp className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[#2C4156] uppercase">
            PROSPERARE <span className="text-[#1FA67A]">FLOW</span>
          </h1>
          <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.3em]">Ambiente Seguro de Acesso</p>
        </div>

        <div className="space-y-6">
          <Button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoggingIn}
            className="w-full h-14 bg-white hover:bg-slate-50 text-[#2C4156] border-2 border-[#D2D7DB]/50 font-black text-[11px] uppercase tracking-[0.15em] shadow-xl rounded-[1.5rem] transition-all flex items-center justify-center gap-3"
          >
            {isGoogleLoggingIn ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#1FA67A]" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Entrar com Google
              </>
            )}
          </Button>

        </div>

        <div className="bg-[#2C4156] p-4 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-[#1FA67A]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase leading-none mb-1">Suporte Técnico</span>
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">Central Prosperare</span>
            </div>
          </div>
          <Button variant="ghost" className="text-[10px] font-black text-[#1FA67A] uppercase h-8 hover:bg-white/5">
            Suporte On-line
          </Button>
        </div>
      </div>
    </div>
  )
}
