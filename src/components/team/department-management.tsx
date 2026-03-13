
"use client"

import { useState } from "react"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  ChevronRight,
  AlertCircle,
  Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

interface Department {
  id: string;
  name: string;
  color: string;
  members: number;
  isDefault: boolean;
}

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'PESSOAL', color: '#2574A9', members: 4, isDefault: true },
  { id: '2', name: 'ADMINISTRATIVO', color: '#39586D', members: 2, isDefault: true },
  { id: '3', name: 'FISCAL', color: '#1FA67A', members: 3, isDefault: true },
  { id: '4', name: 'COMERCIAL', color: '#F2B705', members: 1, isDefault: true },
  { id: '5', name: 'FINANCEIRO', color: '#2C4156', members: 2, isDefault: true },
]

export function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newDept, setNewDept] = useState({ name: '', color: '#1FA67A' })

  const handleAddDepartment = () => {
    if (!newDept.name) return;
    const dept: Department = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDept.name.toUpperCase(),
      color: newDept.color,
      members: 0,
      isDefault: false
    };
    setDepartments([...departments, dept]);
    setIsModalOpen(false);
    setNewDept({ name: '', color: '#1FA67A' });
    toast({ title: "Departamento Criado", description: `O departamento ${dept.name} foi adicionado.` });
  }

  const handleDelete = (id: string) => {
    const dept = departments.find(d => d.id === id);
    if (dept?.isDefault) {
      toast({ 
        variant: "destructive", 
        title: "Ação Negada", 
        description: "Departamentos padrão do sistema não podem ser excluídos." 
      });
      return;
    }
    
    if (dept && dept.members > 0) {
      toast({ 
        variant: "destructive", 
        title: "Exclusão Bloqueada", 
        description: `Existem ${dept.members} membros vinculados. Reatribua os membros antes de excluir.` 
      });
      return;
    }

    setDepartments(departments.filter(d => d.id !== id));
    toast({ title: "Departamento Excluído" });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#2C4156] flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#1FA67A]" />
          Estrutura Organizacional
        </h3>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#1FA67A] gap-2">
          <Plus className="h-4 w-4" /> Novo Departamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <Card key={dept.id} className="border-[#D2D7DB] hover:shadow-md transition-shadow group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: dept.color }}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2C4156] leading-tight">{dept.name}</h4>
                    <p className="text-xs text-[#98A7AA] font-bold uppercase tracking-wider">{dept.members} Membros</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#98A7AA] hover:text-[#2574A9]">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!dept.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-[#98A7AA] hover:text-[#E74C3C]"
                      onClick={() => handleDelete(dept.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#F7F7F7] flex justify-between items-center">
                {dept.isDefault ? (
                  <Badge variant="outline" className="text-[9px] uppercase font-bold text-[#98A7AA] border-[#D2D7DB]">Padrão Sistema</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] uppercase font-bold text-[#1FA67A] border-[#1FA67A]/20">Personalizado</Badge>
                )}
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-[#39586D] uppercase gap-1">
                  Ver Membros <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-[#D2D7DB]">
          <DialogHeader>
            <DialogTitle className="text-[#2C4156] font-bold">Novo Departamento</DialogTitle>
            <DialogDescription>Defina o nome e a cor de identificação da nova estrutura.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Nome do Departamento</Label>
              <Input 
                placeholder="EX: MARKETING" 
                value={newDept.name} 
                onChange={(e) => setNewDept({...newDept, name: e.target.value.toUpperCase()})}
                className="bg-[#F7F7F7] border-[#D2D7DB]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-[#98A7AA]">Cor de Identificação</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  type="color" 
                  value={newDept.color} 
                  onChange={(e) => setNewDept({...newDept, color: e.target.value})}
                  className="w-12 h-10 p-1 border-[#D2D7DB]"
                />
                <span className="text-xs font-mono text-[#39586D]">{newDept.color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#1FA67A]" onClick={handleAddDepartment}>Criar Departamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
