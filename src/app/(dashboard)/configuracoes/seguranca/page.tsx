
"use client"

import { Lock, History, ShieldAlert, Monitor, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"

const ACCESSES = [
  { user: 'Ricardo Santos', time: 'Há 5 min', ip: '192.168.1.1', device: 'Chrome / Windows', status: 'Sucesso' },
  { user: 'Ana Souza', time: 'Há 45 min', ip: '172.16.0.12', device: 'Safari / iPhone', status: 'Sucesso' },
  { user: 'Desconhecido', time: 'Hoje - 08:30', ip: '189.12.44.2', device: 'Chrome / Linux', status: 'Negado' },
]

export default function SegurancaLogsPage() {
  const handleSave = () => {
    toast({ title: "Configurações de segurança atualizadas!" })
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#2C4156]">Segurança e Logs</h1>
        <p className="text-[#98A7AA] font-medium text-sm">Controle de acesso e monitoramento de integridade do sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#D2D7DB]">
            <CardHeader className="bg-[#F7F7F7]/50">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Monitor className="h-5 w-5 text-[#2C4156]" />
                Acessos Recentes
              </CardTitle>
              <CardDescription>Últimos acessos realizados na plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-slate-500 font-medium text-sm">Usuário</TableHead>
                    <TableHead className="text-slate-500 font-medium text-sm">Data/Hora</TableHead>
                    <TableHead className="text-slate-500 font-medium text-sm">IP / Dispositivo</TableHead>
                    <TableHead className="text-slate-500 font-medium text-sm text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ACCESSES.map((acc, i) => (
                    <TableRow key={i} className="text-xs">
                      <TableCell className="font-semibold text-slate-700">{acc.user}</TableCell>
                      <TableCell className="text-slate-600">{acc.time}</TableCell>
                      <TableCell className="text-[#98A7AA]">{acc.ip} <br/> {acc.device}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={acc.status === 'Sucesso' ? "bg-emerald-50 text-emerald-700 border-none" : "bg-red-50 text-red-700 border-none"}>
                          {acc.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-[#D2D7DB]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-[#2563EB]" />
                Histórico de Alterações
              </CardTitle>
              <CardDescription>Log de quem alterou o quê nas configurações.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="p-4 text-center text-xs text-[#98A7AA] italic">
                Nenhuma alteração registrada nos últimos 7 dias.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#D2D7DB] h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#E74C3C]" />
              Políticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">2FA Obrigatório</Label>
                <p className="text-[10px] text-[#98A7AA]">Exigir confirmação em dois fatores.</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Bloqueio Comercial</Label>
                <p className="text-[10px] text-[#98A7AA]">Bloquear acesso fora do horário.</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Logout Automático</Label>
              <Select defaultValue="30">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="never">Nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full bg-[#2C4156] font-bold gap-2">
              <Save className="h-4 w-4" /> Salvar políticas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
