"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  Table as TableIcon, 
  Clock, 
  User, 
  AlertCircle,
  MoreVertical,
  CheckSquare
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'border-t-muted' },
  { id: 'progress', title: 'Em Progresso', color: 'border-t-chart-3' },
  { id: 'review', title: 'Em Revisão', color: 'border-t-chart-2' },
  { id: 'done', title: 'Concluído', color: 'border-t-chart-1' },
]

const MOCK_TASKS = [
  { id: 't1', client: 'Posto Sul', title: 'Folha de Pagamento - Setembro', status: 'todo', due: '05/10', priority: 'Urgente', responsible: 'Ricardo' },
  { id: 't2', client: 'Mercado Bom', title: 'PGDAS-D Apuração', status: 'progress', due: '20/10', priority: 'Alta', responsible: 'Fernanda' },
  { id: 't3', client: 'Tech Soluções', title: 'DCTF Mensal', status: 'todo', due: '15/10', priority: 'Média', responsible: 'Ricardo' },
  { id: 't4', client: 'Auto Peças', title: 'EFD ICMS IPI', status: 'review', due: '10/10', priority: 'Alta', responsible: 'Ana' },
  { id: 't5', client: 'Padaria Alfa', title: 'FGTS Digital', status: 'done', due: '20/10', priority: 'Urgente', responsible: 'Ricardo' },
]

export default function ProcessosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processos e Tarefas</h1>
          <p className="text-muted-foreground">Gerencie o fluxo de trabalho do escritório e prazos fiscais.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" /> Calendário
          </Button>
          <Button className="bg-primary">
            <Plus className="mr-2 h-4 w-4" /> Novo Processo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
         <SummaryCard label="Total" value={142} />
         <SummaryCard label="Em Multa" value={3} color="destructive" />
         <SummaryCard label="A Fazer" value={54} color="muted" />
         <SummaryCard label="Em Progresso" value={28} color="info" />
         <SummaryCard label="Concluído" value={57} color="success" />
      </div>

      <Tabs defaultValue="kanban">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban"><LayoutGrid className="mr-2 h-4 w-4" /> Kanban</TabsTrigger>
            <TabsTrigger value="lista"><TableIcon className="mr-2 h-4 w-4" /> Lista</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[600px]">
            {COLUMNS.map(col => (
              <div key={col.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold flex items-center gap-2">
                    {col.title}
                    <Badge variant="secondary" className="rounded-full px-1.5 h-5 min-w-5 flex items-center justify-center">
                      {MOCK_TASKS.filter(t => t.status === col.id).length}
                    </Badge>
                  </h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
                </div>
                
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="flex flex-col gap-3 pr-4">
                    {MOCK_TASKS.filter(t => t.status === col.id).map(task => (
                      <Card key={task.id} className={`border-t-4 ${col.color} hover:shadow-md transition-shadow cursor-pointer`}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{task.client}</span>
                            <Badge variant={task.priority === 'Urgente' ? 'destructive' : 'outline'} className="text-[10px] px-1 h-4">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold leading-tight">{task.title}</p>
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">{task.due}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">{task.responsible}</span>
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string, value: number, color?: string }) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-4 text-center space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className={`text-2xl font-bold ${color === 'destructive' ? 'text-destructive' : color === 'success' ? 'text-chart-1' : color === 'info' ? 'text-chart-3' : 'text-primary'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
