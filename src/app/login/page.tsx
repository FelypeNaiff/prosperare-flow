'use client';

import { useState, useEffect } from "react"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { useRouter } from "next/navigation"
import { TrendingUp, Loader2, MessageSquare, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

export default function LoginPage() {
  const auth = useAuth()
  const firestore = useFirestore()
  const { user, isUserLoading, setSelectedUser } = useUser()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"cliente" | "equipe">("cliente")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false)

  // Auto redirect if user is already authenticated on mount
  useEffect(() => {
    const handleAutoRedirect = async () => {
      if (user && !isUserLoading) {
        try {
          const userDocRef = doc(firestore, "users", user.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            const data = userDoc.data()
            const role = (data.role || data.profile || '').toUpperCase()
            if (role === 'CLIENTE') {
              setSelectedUser(data)
              router.push("/portal/ferias")
            } else {
              router.push("/escolha-usuario")
            }
          } else {
            router.push("/escolha-usuario")
          }
        } catch (e) {
          router.push("/escolha-usuario")
        }
      }
    }
    handleAutoRedirect()
  }, [user, isUserLoading, router, firestore, setSelectedUser])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, informe seu e-mail e sua senha de acesso."
      })
      return
    }

    setIsLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      const firebaseUser = credential.user

      // Buscar perfil na base do Firestore
      const userDocRef = doc(firestore, "users", firebaseUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data()
        const role = (data.role || data.profile || '').toUpperCase()
        const status = (data.status || 'ATIVO').toUpperCase()

        if (status !== 'ATIVO') {
          await signOut(auth)
          toast({
            variant: "destructive",
            title: "Acesso Inativo",
            description: "Esta credencial operacional está inativa no momento."
          })
          setIsLoading(false)
          return
        }

        if (role === 'CLIENTE') {
          // Salva identidade operacional do cliente e envia ao portal
          setSelectedUser(data)
          toast({
            title: "Acesso Liberado!",
            description: `Bem-vindo ao portal, ${data.fullName || 'Cliente'}.`
          })
          router.push("/portal/ferias")
        } else {
          // Usuários administrativos / equipe
          toast({
            title: "Sessão Iniciada",
            description: "Redirecionando para a área operacional."
          })
          router.push("/dashboard")
        }
      } else {
        await signOut(auth)
        toast({
          variant: "destructive",
          title: "Cadastro não localizado",
          description: "Nenhum perfil operacional foi vinculado a este e-mail."
        })
      }
    } catch (error: any) {
      console.error("Email Login error:", error)
      let errorMessage = "Senha incorreta ou e-mail inválido."
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "O e-mail ou a senha informada não conferem."
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "Cadastro não encontrado no sistema de acesso."
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Múltiplas tentativas falhas. Conta bloqueada temporariamente."
      }
      
      toast({
        variant: "destructive",
        title: "Falha na Autenticação",
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoggingIn(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      const userDocRef = doc(firestore, "users", firebaseUser.uid)
      let userDoc = await getDoc(userDocRef)

      const seedAdmins = [
        'pscsucesso@gmail.com', 
        'felypenaiff01@gmail.com', 
        'thalyssonluiz@gmail.com',
        'cpgama79@gmail.com',
        'marrypassosmarques@gmail.com',
        'thalyssonluiz20@gmail.com'
      ]

      let data = userDoc.exists() ? userDoc.data() : null

      // Provisão automática para os administradores do sistema
      if (!data && seedAdmins.includes(firebaseUser.email || "")) {
        const name = firebaseUser.email?.includes('felype') ? 'FELYPE NAIFF' : 
                     firebaseUser.email?.includes('thalysson') ? 'THALYSSON LUIZ' : 
                     firebaseUser.email?.includes('cpgama79') ? 'CP GAMA' :
                     firebaseUser.email?.includes('marrypassosmarques') ? 'MARRY PASSOS' : 'ADMINISTRADOR GERAL'

        const { setDoc } = await import("firebase/firestore")
        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          fullName: name,
          email: firebaseUser.email,
          profile: 'ADMINISTRADOR',
          status: 'ATIVO',
          createdAt: new Date().toISOString()
        }, { merge: true })

        userDoc = await getDoc(userDocRef)
        data = userDoc.data() ?? null
      }

      if (data) {
        const role = (data.role || data.profile || '').toUpperCase()
        const status = (data.status || 'ATIVO').toUpperCase()

        if (status !== 'ATIVO') {
          await signOut(auth)
          toast({
            variant: "destructive",
            title: "Acesso Inativo",
            description: "Esta credencial operacional está inativa no momento."
          })
          setIsGoogleLoggingIn(false)
          return
        }

        if (role === 'CLIENTE') {
          setSelectedUser(data)
          toast({
            title: "Acesso Liberado!",
            description: `Bem-vindo ao portal, ${data.fullName || 'Cliente'}.`
          })
          router.push("/portal/ferias")
        } else {
          toast({
            title: "Sessão Iniciada",
            description: "Redirecionando para a área operacional."
          })
          router.push("/dashboard")
        }
      } else {
        await signOut(auth)
        toast({
          variant: "destructive",
          title: "Não autorizado",
          description: "E-mail não está cadastrado no sistema da equipe."
        })
      }
    } catch (error: any) {
      console.error("Google Login error:", error)
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        setIsGoogleLoggingIn(false)
        return
      }
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: error.message || "Não foi possível conectar com o Google."
      })
    } finally {
      setIsGoogleLoggingIn(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2C4156]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2C4156] p-4 overflow-hidden relative">
      {/* Premium background radial highlights */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#2563EB] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#2574A9] rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-[440px] space-y-8 z-10 animate-in fade-in duration-700">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-2xl mb-2 backdrop-blur-sm">
            <TrendingUp className="h-10 w-10 text-[#2563EB]" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
            PROSPERARE <span className="text-[#2563EB]">FLOW</span>
          </h1>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Ambiente Seguro de Acesso</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 space-y-6 text-slate-800">
          
          {/* Segmented Tab Bar */}
          <div className="grid w-full grid-cols-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/20">
            <button 
              type="button"
              onClick={() => setActiveTab("cliente")}
              className={cn(
                "py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all outline-none",
                activeTab === "cliente" 
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 font-extrabold" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Portal Cliente
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab("equipe")}
              className={cn(
                "py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all outline-none",
                activeTab === "equipe" 
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50 font-extrabold" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Área da Equipe
            </button>
          </div>

          {/* Form Tabs Content */}
          {activeTab === "cliente" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email"
                    type="email"
                    placeholder="email@cliente.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-slate-50 border-slate-200 text-slate-800 font-semibold focus-visible:ring-[#2563EB] rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-slate-50 border-slate-200 text-slate-800 font-semibold focus-visible:ring-[#2563EB] rounded-xl text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-[#2563EB] hover:bg-[#2563EB]/95 text-white font-black text-xs uppercase tracking-widest shadow-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Entrar no Portal
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 py-3 flex flex-col items-center">
              <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-widest leading-relaxed mb-1">
                Acesso exclusivo para colaboradores do escritório
              </p>
              
              <Button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoggingIn}
                className="w-full h-14 bg-white hover:bg-slate-50 text-[#2C4156] border-2 border-slate-200/80 font-black text-[11px] uppercase tracking-[0.12em] shadow-md hover:shadow-lg rounded-xl transition-all flex items-center justify-center gap-3"
              >
                {isGoogleLoggingIn ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
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
          )}

        </div>

        {/* Support Section */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2563EB]/10 rounded-lg border border-[#2563EB]/20">
              <MessageSquare className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/90 uppercase leading-none mb-1">Suporte Técnico</span>
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">Central Prosperare</span>
            </div>
          </div>
          <Button variant="ghost" className="text-[10px] font-black text-[#2563EB] uppercase h-8 hover:bg-white/5 transition-colors">
            Suporte On-line
          </Button>
        </div>
      </div>
    </div>
  )
}
