
"use client"

import { useState } from "react"
import { Layers, Plus, Edit, Trash2, Users, ChevronRight, CheckCircle2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const DEFAULT_GROUPS = [
  { id: '1', name: 'FOLHA DE PAGAMENTO', icon: '📋', color: '#1FA67A', dept: 'Pessoal', processes: 8, clients: 12, active: true },
  { id: '2', name: 'FISCAL SERVIÇOS', icon: '🔵', color: '#2574A9', dept: 'Fiscal', processes: 4, clients: 8, active: true },
  { id: '3', name: 'FISCAL COMÉRCIO', icon: '🟡', color: '#F2B705', dept: 'Fiscal', processes: 5, clients: 5, active: true },
  { id: '4', name: 'FISCAL LUCRO PRESUMIDO', icon: '🟠', color: '#E67E22', dept: 'Fiscal', processes: 7, clients: 3, active: true },
  { id: '5', name: 'CONTABILIDADE', icon: '🔴', color: '#C0392B', dept: 'Contábil', processes: 7, clients: 10, active: true },
  { id: '6', name: 'MEI', icon: '🟣', color: '#8E44AD', dept: 'Fiscal', processes: 3, clients: 15, active: true },
  { id: '7', name: 'ABERTURA DE EMPRESA', icon: '⚫', color: '#2C4156', dept: 'Administrativo', processes: 7, clients: 2, active: true },
]

export default function GruposObrigacoesPage() {
  const [groups, setGroups] = useState(DEFAULT_GROUPS)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleToggleStatus = (id: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, active: !g.active } : g))
    toast({ title: "Status do grupo alterado" })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C4156]">Grupos de Obrigações</h1>
          <p className="text-[#98A7AA] font-medium">Automatize a criação de processos vinculando grupos às empresas.</p>
        </div>
        <Button className="bg-[#1FA67A] hover:bg-[#1FA67A]/90 gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Grupo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="border-[#D2D7DB] hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: group.color }} />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <div>
                    <CardTitle className="text-sm font-black text-[#2C4156] uppercase leading-tight">{group.name}</CardTitle>
                    <Badge variant="outline" className="text-[9px] uppercase font-bold mt-1">{group.dept}</Badge>
                  </div>
                </div>
                <Switch 
                  checked={group.active} 
                  onCheckedChange={() => handleToggleStatus(group.id)} 
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Processos</p>
                  <p className="text-lg font-black text-[#2C4156]">{group.processes}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-[#98A7AA] uppercase">Empresas</p>
                  <p className="text-lg font-black text-[#2C4156]">{group.clients}</p>
                </div>
              </div>
              
              <div className="pt-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase border-[#D2D7DB] gap-1 flex-1">
                  <Edit className="h-3 w-3" /> Editar
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase border-[#D2D7DB] gap-1 flex-1">
                  <Users className="h-3 w-3" /> Empresas
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#2C4156]">Configurar Grupo de Obrigações</DialogTitle>
            <DialogDescription>Defina os processos que serão gerados automaticamente para as empresas deste grupo.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">Nome do Grupo</Label>
                <Input placeholder="Ex: FISCAL SIMPLES" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-[#98A7AA]">Departamento</Label>
                <Input placeholder="Ex: Fiscal" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-sm font-black text-[#2C4156] uppercase tracking-widest">Processos do Grupo</h4>
                <Button variant="ghost" size="sm" className="text-[#1FA67A] font-bold text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Processo
                </Button>
              </div>
              
              <div className="space-y-2">
                {['PGDAS-D', 'Escrituração Fiscal', 'Relatório Mensal'].map((proc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-[#F7F7F7]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white border flex items-center justify-center font-bold text-xs text-[#2C4156]">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2C4156]">{proc}</p>
                        <p className="text-[10px] text-[#98A7AA] font-bold uppercase">Todo dia 20 • Mensal</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-[#98A7AA]"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-[#F7F7F7] -mx-6 -mb-6 p-6 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A] font-bold px-8">Salvar Grupo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
