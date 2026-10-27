
"use client"

import { Palette, Upload, Monitor, Sun, Moon, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"

export default function AparenciaPage() {
  const handleSave = () => {
    toast({ title: "Preferências de aparência salvas!", className: "bg-[#2563EB] text-white" })
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Aparência</h1>
        <p className="text-[#98A7AA] font-medium">Personalize a identidade visual do seu Prosperare Flow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#2563EB]" />
              Logo do Sistema
            </CardTitle>
            <CardDescription>Esta imagem substituirá o texto no topo da barra lateral.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center bg-[#F7F7F7] gap-2">
              <Upload className="h-8 w-8 text-[#98A7AA]" />
              <p className="text-xs font-bold text-[#2C4156]">Clique para fazer upload da logo</p>
              <p className="text-[10px] text-[#98A7AA]">Formatos: PNG, SVG (Recomendado: 200x60px)</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-white border rounded flex items-center justify-center font-bold text-[#2C4156]">PF</div>
              <div>
                <p className="text-sm font-bold">Logo Atual</p>
                <p className="text-[10px] text-[#98A7AA]">Padrao_Prosperare.png</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto text-[#E74C3C]">Remover</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5 text-[#2574A9]" />
              Tema da Interface
            </CardTitle>
            <CardDescription>Escolha entre o modo claro, escuro ou automático.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="light" className="grid grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#2563EB] [&:has([data-state=checked])]:border-[#2563EB] cursor-pointer"
                >
                  <Sun className="mb-3 h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase">Claro</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#2563EB] [&:has([data-state=checked])]:border-[#2563EB] cursor-pointer"
                >
                  <Moon className="mb-3 h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase">Escuro</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label
                  htmlFor="system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#2563EB] [&:has([data-state=checked])]:border-[#2563EB] cursor-pointer"
                >
                  <Monitor className="mb-3 h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase">Auto</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter className="bg-[#F7F7F7]/50 pt-4">
            <Button className="w-full bg-[#2563EB] font-bold" onClick={handleSave}>Salvar Preferências</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
