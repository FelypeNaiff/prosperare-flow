'use client';

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { initiateLogout } from "@/firebase/non-blocking-login"
import { TrendingUp, LogOut, Loader2, ShieldCheck, Lock, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { collection, query, orderBy } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

export default function EscolhaUsuarioPage() {
  const { user, isUserLoading, setSelectedUser } = useUser()
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  
  const [selectedCollab, setSelectedCollab] = useState<any>(null)
  const [pin, setPin] = useState("")
  const [isPinOpen, setIsPinOpen] = useState(false)

  // Busca colaboradores reais cadastrados no Firestore para compor a lista de perfis
  const usersQuery = useMemoFirebase(() => 
    query(collection(firestore, "users"), orderBy("fullName", "asc")), 
    [firestore]
  )
  const { data: team = [], isLoading } = useCollection(usersQuery)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  const handleSelect = (collab: any) => {
    setSelectedCollab(collab)
    setIsPinOpen(true)
  }

  const handleVerifyPin = () => {
    // PIN padrão para qualquer colaborador: 1234
    if (pin === "1234") {
      setSelectedUser(selectedCollab)
      toast({ title: "Identidade Confirmada!", description: `Bem-vindo, ${selectedCollab.fullName}.` })
      router.push("/dashboard")
    } else {
      toast({ variant: "destructive", title: "PIN Incorreto", description: "O código padrão de acesso é 1234." })
      setPin("")
    }
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
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#1FA67A] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2574A9] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl space-y-12 z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10 mb-4">
            <TrendingUp className="h-8 w-8 text-[#1FA67A]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
            Quem está <span className="text-[#1FA67A]">operando agora?</span>
          </h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Selecione sua identidade operacional</p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#1FA67A]" />
              <p className="text-[10px] font-black uppercase text-white/40">Carregando Identidades...</p>
            </div>
          ) : team && team.length > 0 ? (
            team.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member)}
                className="group flex flex-col items-center space-y-4 transition-all duration-300"
              >
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-4 border-transparent group-hover:border-[#1FA67A] group-hover:scale-105 transition-all duration-500 shadow-xl">
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarFallback className="text-4xl font-black text-white rounded-none bg-[#39586D]">
                      {member.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-sm md:text-base font-black uppercase tracking-tight text-white/80 group-hover:text-white transition-colors">
                    {member.fullName}
                  </p>
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/10 text-white/40 group-hover:bg-[#1FA67A] group-hover:text-white group-hover:border-none transition-all">
                    {member.profile}
                  </Badge>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12 space-y-4 opacity-40">
              <UserIcon className="h-12 w-12 mx-auto text-[#98A7AA]" />
              <p className="text-xs font-black uppercase tracking-widest text-[#98A7AA]">Nenhuma identidade cadastrada.</p>
            </div>
          )}
        </div>

        <div className="pt-12 flex flex-col items-center space-y-6">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-[0.2em] h-12 px-10 rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" /> Encerrar Sessão Mestre
          </Button>
          
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
            <ShieldCheck className="h-3 w-3" />
            Ambiente Seguro Prosperare Cloud
          </div>
        </div>
      </div>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="max-w-[350px] p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-8 bg-white space-y-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F7F7F7] flex items-center justify-center border">
              <Lock className="h-8 w-8 text-[#2C4156]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#2C4156] uppercase leading-tight">Olá, {selectedCollab?.fullName?.split(' ')[0]}</h3>
              <p className="text-[10px] font-black text-[#98A7AA] uppercase tracking-widest">Confirme seu PIN de 4 dígitos</p>
            </div>
            <Input 
              type="password" 
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center h-14 text-2xl font-black tracking-[0.5em] bg-[#F7F7F7] border-[#D2D7DB] focus-visible:ring-[#1FA67A]"
              placeholder="••••"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
            />
            <Button className="w-full h-14 bg-[#1FA67A] font-black uppercase text-xs tracking-widest shadow-lg" onClick={handleVerifyPin}>
              Confirmar Identidade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
