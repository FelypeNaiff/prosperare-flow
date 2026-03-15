
"use client"

import { useState, useEffect } from "react"
import { useAuth, useUser } from "@/firebase"
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login"
import { useRouter } from "next/navigation"
import { TrendingUp, Loader2, ShieldCheck, Lock, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export default function LoginPage() {
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleGoogleLogin = () => {
    setIsLoggingIn(true)
    try {
      initiateGoogleSignIn(auth)
    } catch (error) {
      setIsLoggingIn(false)
      toast({ 
        variant: "destructive", 
        title: "Erro na autenticação", 
        description: "Não foi possível iniciar o login com Google." 
      })
    }
  }

  const heroImage = PlaceHolderImages.find(i => i.id === 'office-hero')

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2C4156]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-[#F7F7F7]">
      {/* Coluna Visual (Esquerda) */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#2C4156] p-12 text-white relative overflow-hidden">
        {heroImage && (
          <Image 
            src={heroImage.imageUrl} 
            alt={heroImage.description} 
            fill 
            className="object-cover opacity-20"
            priority
            data-ai-hint="accounting office"
          />
        )}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#1FA67A]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#2574A9]/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-8 max-w-md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#1FA67A] rounded-2xl shadow-xl">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase">
                PROSPERARE <span className="text-[#1FA67A]">FLOW</span>
              </h1>
              <p className="text-[#98A7AA] text-xs font-bold uppercase tracking-[0.3em]">Sistema de Gestão Contábil</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">A inteligência que o seu escritório merece.</h2>
            <div className="space-y-4">
              <FeatureItem icon={ShieldCheck} text="Segurança de dados padrão bancário (LGPD)" />
              <FeatureItem icon={Lock} text="Cofre de senhas e acessos e-CAC protegido" />
              <FeatureItem icon={TrendingUp} text="Automação de processos e CNDs" />
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Login (Direita) */}
      <div className="flex items-center justify-center p-6 relative">
        <Card className="w-full max-w-md border-[#D2D7DB] shadow-2xl overflow-hidden z-10 bg-white">
          <CardHeader className="text-center space-y-2 bg-[#2C4156] text-white pb-8">
            <div className="lg:hidden flex justify-center mb-4">
               <TrendingUp className="h-12 w-12 text-[#1FA67A]" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Portal de Acesso</CardTitle>
            <CardDescription className="text-white/60 font-medium">Utilize sua conta corporativa para entrar.</CardDescription>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
              <Button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full h-14 bg-white hover:bg-[#F7F7F7] text-[#2C4156] border-2 border-[#D2D7DB] font-bold text-base gap-3 shadow-sm transition-all"
              >
                {isLoggingIn ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.48-.98 7.31-2.64l-3.57-2.77c-1.01.68-2.31 1.09-3.74 1.09-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.01H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.99l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.01l3.66 2.84c.86-2.59 3.29-4.53 12-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {isLoggingIn ? "Autenticando..." : "Entrar com Google"}
              </Button>
              
              <div className="flex items-center gap-2 p-4 bg-[#E3F0F9]/30 rounded-xl border border-[#2574A9]/10">
                <LogIn className="h-5 w-5 text-[#2574A9] shrink-0" />
                <p className="text-[11px] text-[#39586D] leading-tight font-medium">
                  Este sistema é restrito a colaboradores autorizados. O acesso é monitorado e protegido por protocolos de segurança.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#D2D7DB]"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black text-[#98A7AA] bg-white px-2">Prosperare Cloud</div>
            </div>

            <p className="text-center text-[10px] text-[#98A7AA] font-bold leading-relaxed">
              Ao acessar, você concorda com nossos termos de uso e políticas de privacidade de dados contábeis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FeatureItem({ icon: Icon, text }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-1.5 bg-[#1FA67A]/20 rounded-lg">
        <Icon className="h-5 w-5 text-[#1FA67A]" />
      </div>
      <p className="text-sm font-medium text-white/80">{text}</p>
    </div>
  )
}
