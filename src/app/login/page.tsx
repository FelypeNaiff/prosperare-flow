
"use client"

import { useState, useEffect } from "react"
import { useAuth, useUser } from "@/firebase"
import { initiateGoogleSignIn, initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login"
import { useRouter } from "next/navigation"
import { TrendingUp, Loader2, ShieldCheck, Lock, Mail, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export default function LoginPage() {
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleGoogleLogin = () => {
    setIsLoggingIn(true)
    initiateGoogleSignIn(auth)
  }

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha e-mail e senha." })
      return
    }
    setIsLoggingIn(true)
    initiateEmailSignIn(auth, email, password)
  }

  const handleEmailSignUp = () => {
    if (!email || !password) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha e-mail e senha para cadastrar." })
      return
    }
    setIsLoggingIn(true)
    initiateEmailSignUp(auth, email, password)
    toast({ title: "Cadastro iniciado", description: "Verifique sua caixa de entrada se necessário." })
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      {/* Coluna Visual */}
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

      {/* Coluna Login */}
      <div className="flex items-center justify-center bg-[#F7F7F7] p-6 relative">
        <Card className="w-full max-w-md border-[#D2D7DB] shadow-2xl overflow-hidden z-10">
          <CardHeader className="text-center space-y-2 bg-[#2C4156] text-white pb-8">
            <div className="lg:hidden flex justify-center mb-4">
               <TrendingUp className="h-12 w-12 text-[#1FA67A]" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Portal de Acesso</CardTitle>
            <CardDescription className="text-white/60 font-medium">Escolha seu método de entrada preferido.</CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs defaultValue="google" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-[#F7F7F7] border border-[#D2D7DB]">
                <TabsTrigger value="google" className="font-bold text-xs uppercase data-[state=active]:bg-[#2C4156] data-[state=active]:text-white">
                  Google
                </TabsTrigger>
                <TabsTrigger value="email" className="font-bold text-xs uppercase data-[state=active]:bg-[#2C4156] data-[state=active]:text-white">
                  E-mail
                </TabsTrigger>
              </TabsList>

              <TabsContent value="google" className="space-y-4">
                <Button 
                  className="w-full h-14 bg-white hover:bg-slate-50 text-slate-700 border-2 border-[#D2D7DB] font-bold text-lg flex items-center justify-center gap-4 transition-all shadow-sm"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="relative w-6 h-6">
                      <Image 
                        src="https://picsum.photos/seed/google/24/24" 
                        alt="Google" 
                        width={24} 
                        height={24} 
                        className="rounded-full"
                        data-ai-hint="google logo"
                      />
                    </div>
                  )}
                  Entrar com Google
                </Button>
                <p className="text-[10px] text-center text-[#98A7AA] font-black uppercase tracking-widest">
                  Método recomendado para usuários corporativos
                </p>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">E-mail Corporativo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        className="pl-10 border-[#D2D7DB]" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Senha</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-[#98A7AA]" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 border-[#D2D7DB]" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button 
                      type="submit" 
                      className="bg-[#2C4156] font-bold uppercase text-xs"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-[#D2D7DB] font-bold uppercase text-xs"
                      onClick={handleEmailSignUp}
                      disabled={isLoggingIn}
                    >
                      Cadastrar
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#D2D7DB]"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black text-[#98A7AA] bg-white px-2">Autenticação Segura</div>
            </div>

            <p className="text-center text-[10px] text-[#98A7AA] font-bold leading-relaxed mt-6">
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
