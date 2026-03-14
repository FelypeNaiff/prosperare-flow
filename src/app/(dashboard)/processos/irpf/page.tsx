
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  LayoutGrid, 
  Table as TableIcon, 
  Search, 
  Filter, 
  Download,
  ClipboardList,
  BarChart3,
  Settings
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { IrpfDashboard } from "@/components/irpf/irpf-dashboard"
import { IrpfKanban } from "@/components/irpf/irpf-kanban"
import { IrpfList } from "@/components/irpf/irpf-list"
import { IrpfDeclarationModal } from "@/components/irpf/irpf-declaration-modal"
import { useAuth } from "@/hooks/use-auth-mock"
import Link from "next/link"

export default function IrpfPage() {
  const [view, setView] = useState<"kanban" | "lista">("kanban")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { user } = useAuth()

  const canAccess = user?.profile !== 'ASSISTENTE'

  if (!canAccess) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <ClipboardList className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Acesso Restrito ao IRPF</h2>
        <p className="text-muted-foreground">Contate o Administrador para visualizar as declarações.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">
            Gestão <span className="text-[#1FA67A]">IRPF 2026</span>
          </h1>
          <p className="text-[#98A7AA] font-medium">Fluxo de declarações de Imposto de Renda Pessoa Física.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-[#D2D7DB] gap-2">
            <Link href="/configuracoes/irpf">
              <Settings className="h-4 w-4" /> Configurar Etiquetas
            </Link>
          </Button>
          <Button variant="outline" className="border-[#D2D7DB] gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nova Declaração
          </Button>
        </div>
      </div>

      <IrpfDashboard />

      <Tabs defaultValue="kanban" value={view} onValueChange={(v) => setView(v as any)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-[#D2D7DB]/30 p-1">
            <TabsTrigger value="kanban" className="data-[state=active]:bg-white font-bold gap-2">
              <LayoutGrid className="h-4 w-4" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="lista" className="data-[state=active]:bg-white font-bold gap-2">
              <TableIcon className="h-4 w-4" /> Lista/Tabela
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                className="pl-9 w-[250px] bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="border-[#D2D7DB]">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="kanban" className="mt-6 border-none p-0">
          <IrpfKanban searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="lista" className="mt-6 border-none p-0">
          <IrpfList searchTerm={searchTerm} />
        </TabsContent>
      </Tabs>

      <IrpfDeclarationModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
