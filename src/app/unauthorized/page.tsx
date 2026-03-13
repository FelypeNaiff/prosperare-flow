import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Acesso não autorizado</h1>
          <p className="text-muted-foreground">
            Desculpe, seu e-mail do Gmail não está cadastrado em nossa base de usuários. 
            Entre em contato com o administrador do sistema para solicitar acesso.
          </p>
        </div>
        <Button asChild className="bg-primary w-full">
          <Link href="/">Voltar para o Login</Link>
        </Button>
      </div>
    </div>
  )
}
