
"use client"

import { CalendarClock, Info, AlertTriangle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

const OBRIGACOES = [
  { id: 'das_simples', label: 'DAS do Simples', default: '10' },
  { id: 'das_mei', label: 'DAS do MEI', default: '10' },
  { id: 'parcelamentos', label: 'Parcelamentos', default: '15' },
  { id: 'dctfweb', label: 'DCTFWeb', default: '10' },
  { id: 'declaracoes', label: 'Declarações', default: '1' },
  { id: 'fgts', label: 'FGTS Digital', default: '1' },
  { id: 'esocial', label: 'eSocial', default: '7' },
  { id: 'certidoes', label: 'Certidões', default: '15' },
  { id: 'relatorio', label: 'Relatório Fiscal', default: '1' },
  { id: 'efd', label: 'EFD Contribuições', default: '10' },
  { id: 'ecd', label: 'ECD (SPED Contábil)', default: '1' },
  { id: 'ecf', label: 'ECF', default: '1' },
]

export default function AgendamentoAutomaticoPage() {
  const handleSave = () => {
    toast({ title: "Agendamentos atualizados!" })
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Agendamento Automático</h1>
        <p className="text-[#98A7AA] font-medium">Escolha o dia do mês para o Prosperare Flow iniciar o processo de geração.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert className="bg-[#E3F0F9] border-[#2574A9]/20 text-[#2574A9]">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs font-bold">
            O parcelamento Simples Nacional inicia a partir do dia 10, devido ao portal do e-CAC.
          </AlertDescription>
        </Alert>
        <Alert className="bg-[#FEF3C7] border-[#F2B705]/20 text-[#F2B705]">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs font-bold">
            Não recomendamos agendar o Simples Nacional no dia 20, para evitar riscos no vencimento.
          </AlertDescription>
        </Alert>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[#2563EB]" />
            Cronograma de Automação
          </CardTitle>
          <CardDescription>Defina os gatilhos mensais para geração e envio das obrigações.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#D2D7DB]">
            {OBRIGACOES.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-[#F7F7F7] transition-colors">
                <Label className="font-bold text-[#39586D]">{item.label}</Label>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold text-[#98A7AA]">Iniciar:</span>
                  <Select defaultValue={item.default}>
                    <SelectTrigger className="w-[140px] border-[#D2D7DB] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>Todo dia {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-[#F7F7F7] p-4 flex justify-end border-t">
          <Button onClick={handleSave} className="bg-[#2563EB] font-bold gap-2">
            <Save className="h-4 w-4" /> Salvar configurações
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
