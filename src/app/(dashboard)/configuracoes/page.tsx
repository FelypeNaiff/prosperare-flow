"use client"

import { useState } from "react"
import { Settings, Building, Bell, Shield, Palette, Database, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as preferências globais do seu escritório.</p>
      </div>

      <Tabs defaultValue="escritorio" className="space-y-6">
        <TabsList className="bg-muted w-full justify-start overflow-x-auto">
          <TabsTrigger value="escritorio" className="gap-2"><Building className="h-4 w-4" /> Dados do Escritório</TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2"><Bell className="h-4 w-4" /> Notificações</TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2"><Shield className="h-4 w-4" /> Segurança</TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-2"><Palette className="h-4 w-4" /> Aparência</TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-2"><Database className="h-4 w-4" /> Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="escritorio">
          <Card>
            <CardHeader>
              <CardTitle>Perfil do Escritório</CardTitle>
              <CardDescription>Informações que aparecerão nos relatórios e guias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Razão Social</Label>
                  <Input id="nome" defaultValue="ContaHub Soluções Contábeis Ltda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" defaultValue="12.345.678/0001-90" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Principal</Label>
                  <Input id="email" defaultValue="contato@contahub.com.br" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" defaultValue="(11) 4002-8922" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input id="endereco" defaultValue="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 flex justify-end">
              <Button className="bg-primary gap-2"><Save className="h-4 w-4" /> Salvar Alterações</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Defina como você deseja ser alertado sobre prazos e vencimentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">E-mails de Vencimento</Label>
                  <p className="text-sm text-muted-foreground">Receber alertas de guias vencendo nos próximos 5 dias.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Alertas de Certidões</Label>
                  <p className="text-sm text-muted-foreground">Notificar quando uma CND estiver a 15 dias do vencimento.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Comunicação Automática com Clientes</Label>
                  <p className="text-sm text-muted-foreground">Permitir que a IA sugira rascunhos de e-mails para pendências.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia">
          <Card>
            <CardHeader>
              <CardTitle>Personalização do Sistema</CardTitle>
              <CardDescription>Ajuste o visual do ContaHub para o seu escritório.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema do Sistema</Label>
                <Select defaultValue="light">
                  <SelectTrigger className="w-[200px]">
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
                <Label>Cor Primária da Marca</Label>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2C4156] border-2 border-white ring-2 ring-primary cursor-pointer" />
                  <div className="w-8 h-8 rounded-full bg-blue-600 cursor-pointer" />
                  <div className="w-8 h-8 rounded-full bg-emerald-600 cursor-pointer" />
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
