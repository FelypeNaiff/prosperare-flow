
"use client"

import { useState } from "react"
import { 
  Settings, 
  Building, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Save, 
  History,
  Lock,
  Eye,
  ShieldAlert,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Configurações</h1>
        <p className="text-[#98A7AA] font-medium">Gerencie as preferências globais do seu escritório.</p>
      </div>

      <Tabs defaultValue="escritorio" className="space-y-6">
        <TabsList className="bg-[#D2D7DB]/30 w-full justify-start overflow-x-auto p-1 h-fit">
          <TabsTrigger value="escritorio" className="gap-2 data-[state=active]:bg-white font-bold"><Building className="h-4 w-4" /> Dados do Escritório</TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2 data-[state=active]:bg-white font-bold"><Bell className="h-4 w-4" /> Notificações</TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2 data-[state=active]:bg-white font-bold"><Shield className="h-4 w-4" /> Segurança</TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-2 data-[state=active]:bg-white font-bold"><Palette className="h-4 w-4" /> Aparência</TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-2 data-[state=active]:bg-white font-bold"><Database className="h-4 w-4" /> Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="escritorio" className="m-0">
          <Card className="border-[#D2D7DB]">
            <CardHeader>
              <CardTitle className="text-[#2C4156]">Perfil do Escritório</CardTitle>
              <CardDescription className="text-[#98A7AA]">Informações que aparecerão nos relatórios e guias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-[10px] uppercase font-bold text-[#98A7AA]">Razão Social</Label>
                  <Input id="nome" defaultValue="Prosperare Flow Soluções Contábeis Ltda" className="bg-[#F7F7F7] border-[#D2D7DB]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-[10px] uppercase font-bold text-[#98A7AA]">CNPJ</Label>
                  <Input id="cnpj" defaultValue="12.345.678/0001-90" className="bg-[#F7F7F7] border-[#D2D7DB]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] uppercase font-bold text-[#98A7AA]">E-mail Principal</Label>
                  <Input id="email" defaultValue="contato@prosperare.com.br" className="bg-[#F7F7F7] border-[#D2D7DB]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-[10px] uppercase font-bold text-[#98A7AA]">Telefone</Label>
                  <Input id="telefone" defaultValue="(96) 3222-1100" className="bg-[#F7F7F7] border-[#D2D7DB]" />
                </div>
              </div>
              <Separator className="bg-[#D2D7DB]/50" />
              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-[10px] uppercase font-bold text-[#98A7AA]">Endereço Completo</Label>
                <Input id="endereco" defaultValue="Av. FAB, 1000 - Centro, Macapá - AP" className="bg-[#F7F7F7] border-[#D2D7DB]" />
              </div>
            </CardContent>
            <CardFooter className="bg-[#F7F7F7] flex justify-end p-4 rounded-b-lg border-t border-[#D2D7DB]">
              <Button className="bg-[#1FA67A] gap-2 font-bold"><Save className="h-4 w-4" /> Salvar Alterações</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="m-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#D2D7DB]">
              <CardHeader>
                <CardTitle className="text-[#2C4156] flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#2C4156]" />
                  Acessos e Auditoria
                </CardTitle>
                <CardDescription>Gerencie quem acessou o sistema e quando.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-[#F7F7F7] rounded-lg border border-[#D2D7DB] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full border border-[#D2D7DB]"><History className="h-4 w-4 text-[#1FA67A]" /></div>
                    <div>
                      <p className="text-sm font-bold text-[#2C4156]">Histórico Completo de Ações</p>
                      <p className="text-xs text-[#98A7AA]">Registros de criação, edição e exclusão.</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase border-[#D2D7DB]">
                    <Link href="/equipe?tab=historico">Acessar Log <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
                <div className="p-4 bg-[#F7F7F7] rounded-lg border border-[#D2D7DB] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full border border-[#D2D7DB]"><Eye className="h-4 w-4 text-[#2574A9]" /></div>
                    <div>
                      <p className="text-sm font-bold text-[#2C4156]">Log de Visualização de Senhas</p>
                      <p className="text-xs text-[#98A7AA]">Quem acessou o cofre de senhas dos clientes.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase border-[#D2D7DB]">Ver Logs</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#D2D7DB]">
              <CardHeader>
                <CardTitle className="text-[#2C4156] flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-[#E74C3C]" />
                  Políticas de Retenção
                </CardTitle>
                <CardDescription>Defina por quanto tempo os dados serão mantidos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-[#2C4156]">Retenção de Logs de Auditoria</Label>
                    <p className="text-xs text-[#98A7AA]">Manter histórico de ações por 12 meses.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-[#D2D7DB]/50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-[#2C4156]">Autenticação em Dois Fatores</Label>
                    <p className="text-xs text-[#98A7AA]">Obrigar todos os membros a usarem 2FA.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notificacoes" className="m-0">
          <Card className="border-[#D2D7DB]">
            <CardHeader>
              <CardTitle className="text-[#2C4156]">Preferências de Notificação</CardTitle>
              <CardDescription className="text-[#98A7AA]">Defina como você deseja ser alertado sobre prazos e vencimentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-[#2C4156]">E-mails de Vencimento</Label>
                  <p className="text-sm text-[#98A7AA]">Receber alertas de guias vencendo nos próximos 5 dias.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-[#D2D7DB]/50" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-[#2C4156]">Alertas de Certidões</Label>
                  <p className="text-sm text-[#98A7AA]">Notificar quando uma CND estiver a 15 dias do vencimento.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-[#D2D7DB]/50" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-[#2C4156]">Comunicação Automática com Clientes</Label>
                  <p className="text-sm text-[#98A7AA]">Permitir que a IA sugira rascunhos de e-mails para pendências.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="m-0">
          <Card className="border-[#D2D7DB]">
            <CardHeader>
              <CardTitle className="text-[#2C4156]">Personalização do Sistema</CardTitle>
              <CardDescription className="text-[#98A7AA]">Ajuste o visual do Prosperare Flow para o seu escritório.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Tema do Sistema</Label>
                <Select defaultValue="light">
                  <SelectTrigger className="w-[200px] border-[#D2D7DB]">
                    <SelectValue placeholder="Selecione o tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro (Padrão)</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Cor Primária da Marca</Label>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2C4156] border-2 border-white ring-2 ring-[#1FA67A] cursor-pointer" />
                  <div className="w-8 h-8 rounded-full bg-blue-600 cursor-pointer" />
                  <div className="w-8 h-8 rounded-full bg-[#1FA67A] cursor-pointer" />
                  <div className="w-8 h-8 rounded-full bg-slate-700 cursor-pointer" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
