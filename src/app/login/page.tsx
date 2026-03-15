'use client';

import { useState, useEffect } from "react"
import { useAuth, useUser } from "@/firebase"
import { initiateEmailSignIn } from "@/firebase/non-blocking-login"
import { useRouter } from "next/navigation"
import { TrendingUp, Loader2, ShieldCheck, Lock, Eye, EyeOff, Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  
  const [email] = useState("pscsucesso@gmail.com")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/escolha-usuario")
    }
  }, [user, isUserLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    try {
      await initiateEmailSignIn(auth, email, password)
      router.push("/escolha-usuario")
    } catch (error: any) {
      setIsLoggingIn(false)
      toast({ variant: "destructive", title: "Falha no acesso", description: "Senha mestre incorreta ou erro de conexão." })
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
          <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-[0.3em]">Sistema de Gestão Contábil</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-3xl">
          <CardHeader className="p-0">
            <Alert className="bg-[#7ED6B5]/20 border-none rounded-none p-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[#1FA67A] shrink-0 mt-0.5" />
              <AlertDescription className="text-[11px] font-bold text-[#1FA67A] leading-tight uppercase">
                Acesso Mestre: Entre com a conta principal do escritório para prosseguir.
              </AlertDescription>
            </Alert>
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">E-mail Administrativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
                  <Input 
                    type="email"
                    value={email}
                    readOnly
                    className="pl-10 h-12 bg-[#F7F7F7] border-none font-bold text-[#2C4156] opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Senha Mestre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#98A7AA]" />
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite a senha mestre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-[#F7F7F7] border-none font-bold text-[#2C4156] focus-visible:ring-[#1FA67A]"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-[#98A7AA] hover:text-[#1FA67A]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-14 bg-[#1FA67A] hover:bg-[#1FA67A]/90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 rounded-2xl transition-all"
              >
                {isLoggingIn ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Liberar Acesso Team"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="bg-[#2C4156] p-4 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-[#1FA67A]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase leading-none mb-1">Suporte Técnico</span>
              <span className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">Central de Ajuda Prosperare</span>
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
