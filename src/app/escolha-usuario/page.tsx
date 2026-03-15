
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useAuth } from "@/firebase"
import { initiateLogout } from "@/firebase/non-blocking-login"
import { TrendingUp, Plus, LogOut, Loader2, User, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const PROFILES = [
  { id: 'felype', name: 'Felype Naiff', role: 'ADMINISTRADOR', color: 'bg-[#1FA67A]', image: 'https://picsum.photos/seed/felype/200/200' },
  { id: 'thalysson', name: 'Thalysson Luiz', role: 'ADMINISTRADOR', color: 'bg-[#2574A9]', image: 'https://picsum.photos/seed/thalysson/200/200' },
]

export default function EscolhaUsuarioPage() {
  const { user, isUserLoading, userData } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleSelect = (profileId: string) => {
    setSelectedId(profileId)
    // Pequeno delay para efeito visual de seleção
    setTimeout(() => {
      router.push("/liberacao")
    }, 600)
  }

  const handleLogout = () => {
    initiateLogout(auth)
    router.push("/login")
  }

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2C4156]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2C4156] text-white p-4 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#1FA67A] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2574A9] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-4xl space-y-12 z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10 mb-4">
            <TrendingUp className="h-8 w-8 text-[#1FA67A]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
            Quem está <span className="text-[#1FA67A]">acessando?</span>
          </h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Escolha seu perfil Prosperare Flow</p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile.id)}
              disabled={selectedId !== null}
              className="group flex flex-col items-center space-y-4 transition-all duration-300"
            >
              <div className={cn(
                "relative w-32 h-32 md:w-44 md:h-44 rounded-3xl overflow-hidden border-4 transition-all duration-500",
                selectedId === profile.id 
                  ? "border-[#1FA67A] scale-110 shadow-[0_0_40px_rgba(31,166,122,0.4)]" 
                  : "border-transparent group-hover:border-white/40 group-hover:scale-105"
              )}>
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage src={profile.image} className="object-cover" />
                  <AvatarFallback className={cn("text-4xl font-black text-white rounded-none", profile.color)}>
                    {profile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Active Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity duration-300",
                  selectedId === profile.id && "opacity-100"
                )}>
                  <Loader2 className="h-10 w-10 animate-spin text-[#1FA67A]" />
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <p className={cn(
                  "text-sm md:text-lg font-black uppercase tracking-tight transition-colors",
                  selectedId === profile.id ? "text-[#1FA67A]" : "text-white/60 group-hover:text-white"
                )}>
                  {profile.name}
                </p>
                <Badge variant="outline" className={cn(
                  "text-[8px] font-black uppercase tracking-widest border-white/10",
                  selectedId === profile.id ? "bg-[#1FA67A] text-white border-none" : "text-white/30"
                )}>
                  {profile.role}
                </Badge>
              </div>
            </button>
          ))}

          {/* New Profile placeholder */}
          <button className="group flex flex-col items-center space-y-4 opacity-40 hover:opacity-100 transition-all duration-300">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-white/40 group-hover:bg-white/5 transition-all">
              <Plus className="h-12 w-12 text-white/20 group-hover:text-white/60" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs md:text-sm font-black text-white/40 uppercase tracking-widest group-hover:text-white">Adicionar</p>
            </div>
          </button>
        </div>

        <div className="pt-12 flex flex-col items-center space-y-6">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-[0.2em] h-12 px-10 rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" /> Encerrar Sessão
          </Button>
          
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
            <ShieldCheck className="h-3 w-3" />
            Ambiente Seguro Prosperare
          </div>
        </div>
      </div>
    </div>
  )
}
