"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileStack, 
  UserMinus, 
  TrendingUp, 
  History,
  FileText,
  Search,
  Stethoscope
} from "lucide-react"
import { TerminationTermForm } from "@/components/docs-flow/termination-term-form"
import { ProlaboreForm } from "@/components/docs-flow/prolabore-form"
import { RevenueDeclarationForm } from "@/components/docs-flow/revenue-declaration-form"
import { AsoReferralForm } from "@/components/docs-flow/aso-referral-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"

export default function DocsFlowPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "rescisao")

  // Atualiza a aba se o parâmetro da URL mudar
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) setActiveTab(tab)
  }, [searchParams])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight flex items-center gap-3">
            <FileStack className="h-8 w-8 text-[#2563EB]" />
            Docs <span className="text-[#2563EB]">Flow</span>
          </h1>
          <p className="text-[#98A7AA] font-bold text-sm">Central de geração de documentos avulsos e inteligentes.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-[#D2D7DB] text-[#39586D] font-bold gap-2"
            onClick={() => router.push("/docs-flow/historico")}
          >
            <History className="h-4 w-4" /> Histórico Geral
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rescisao" value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-2 rounded-xl border shadow-sm">
          <TabsList className="bg-[#F7F7F7] border-none justify-start h-12">
            <TabsTrigger value="rescisao" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 h-10 px-6 text-[10px] uppercase">
              <UserMinus className="h-4 w-4" /> Termo de Rescisão
            </TabsTrigger>
            <TabsTrigger value="prolabore" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 h-10 px-6 text-[10px] uppercase">
              <FileText className="h-4 w-4" /> Pró-labore Avulso
            </TabsTrigger>
            <TabsTrigger value="faturamento" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 h-10 px-6 text-[10px] uppercase">
              <TrendingUp className="h-4 w-4" /> Faturamento 12 Meses
            </TabsTrigger>
            <TabsTrigger value="aso" className="data-[state=active]:bg-[#2C4156] data-[state=active]:text-white font-bold gap-2 h-10 px-6 text-[10px] uppercase">
              <Stethoscope className="h-4 w-4" /> Encaminhamento ASO
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 px-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input placeholder="Buscar modelos..." className="pl-9 h-10 w-[200px] border-[#D2D7DB] text-xs" />
            </div>
          </div>
        </div>

        <TabsContent value="rescisao" className="m-0">
          <TerminationTermForm />
        </TabsContent>

        <TabsContent value="prolabore" className="m-0">
          <ProlaboreForm />
        </TabsContent>

        <TabsContent value="faturamento" className="m-0">
          <RevenueDeclarationForm />
        </TabsContent>

        <TabsContent value="aso" className="m-0">
          <AsoReferralForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}