
"use client"

import { FileText, Plus, Copy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

const MODELS = [
  { title: 'Abertura de Empresa LTDA', tasks: 12, dept: 'ADMINISTRATIVO' },
  { title: 'Fechamento de Folha Mensal', tasks: 8, dept: 'PESSOAL' },
  { title: 'Apuração Fiscal Trimestral', tasks: 15, dept: 'FISCAL' },
  { title: 'Alteração de Contrato Social', tasks: 10, dept: 'ADMINISTRATIVO' },
]

export default function ModelosProcessosPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Modelos de Processos</h1>
          <p className="text-[#98A7AA] font-medium">Checklists padronizados para acelerar o fluxo de trabalho.</p>
        </div>
        <Button className="ml-auto bg-[#1FA67A] gap-2">
          <Plus className="h-4 w-4" /> Criar Novo Modelo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODELS.map((model, i) => (
          <Card key={i} className="border-[#D2D7DB] hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#F7F7F7] rounded-lg">
                  <FileText className="h-5 w-5 text-[#2C4156]" />
                </div>
                <Badge variant="outline" className="text-[9px] font-bold">{model.dept}</Badge>
              </div>
              <CardTitle className="text-base font-bold mt-2 text-[#2C4156]">{model.title}</CardTitle>
              <CardDescription className="text-xs">{model.tasks} etapas no checklist</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2 border-[#D2D7DB]">
                <Copy className="h-3 w-3" /> Usar Modelo
              </Button>
              <Button variant="ghost" size="sm" className="text-[#98A7AA]">Editar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
