
"use client"

import { ClipboardList, Plus, Edit, Trash2, CheckCircle2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

const DEFAULT_TAGS = [
  { name: 'Prioritário', color: '#E74C3C' },
  { name: 'Aguardando retorno', color: '#F2B705' },
  { name: 'Documentos pendentes', color: '#F2B705' },
  { name: 'Em dia', color: '#1FA67A' },
  { name: 'Restituição', color: '#1FA67A' },
  { name: 'A pagar', color: '#E74C3C' },
  { name: 'Malha fiscal', color: '#2C4156' },
]

export default function ConfigIrpfPage() {
  const handleSave = () => {
    toast({ title: "Configurações de IRPF salvas!" })
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Configurações IRPF</h1>
        <p className="text-[#98A7AA] font-medium">Personalize etiquetas, checklists e parâmetros do módulo de Imposto de Renda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5 text-[#1FA67A]" />
              Etiquetas de Status
            </CardTitle>
            <CardDescription>Tags coloridas para identificar rapidamente o estado das declarações.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TAGS.map((tag) => (
                <div key={tag.name} className="flex items-center gap-2 p-2 border rounded-lg bg-[#F7F7F7]">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="text-xs font-bold text-[#39586D]">{tag.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-[#98A7AA]"><Edit className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full gap-2 border-dashed border-[#D2D7DB] text-[#98A7AA]">
              <Plus className="h-4 w-4" /> Adicionar nova etiqueta
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#2574A9]" />
              Checklist Padrão
            </CardTitle>
            <CardDescription>Itens que serão copiados automaticamente para cada nova declaração.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              'Informe de rendimentos (DIRF)',
              'Extratos bancários anuais',
              'Comprovantes de saúde',
              'Recibos de educação',
              'Bens e Direitos (Imóveis/Carros)',
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 border-b last:border-0">
                <span className="text-xs font-bold text-[#39586D]">{item}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-[#E74C3C]"><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4 gap-2 border-dashed border-[#D2D7DB] text-[#98A7AA]">
              <Plus className="h-4 w-4" /> Adicionar item ao checklist
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-lg">Parâmetros de Prazo e Alerta</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-[#98A7AA]">Data Limite Padrão</Label>
              <Input type="date" defaultValue="2026-04-30" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-[#98A7AA]">Alerta Próximo (dias)</Label>
              <Input type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-[#98A7AA]">Alerta Crítico (dias)</Label>
              <Input type="number" defaultValue="7" />
            </div>
          </CardContent>
          <CardFooter className="bg-[#F7F7F7] border-t p-4 flex justify-end">
            <Button onClick={handleSave} className="bg-[#1FA67A] font-bold px-8">Salvar Alterações</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
