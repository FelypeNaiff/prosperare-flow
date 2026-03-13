"use client"

import { useState } from "react"
import { FolderOpen, FileText, Search, Plus, MoreVertical, Download, Trash2, Eye, Share2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

const MOCK_FILES = [
  { id: '1', name: 'Contrato Social - Padaria Central.pdf', type: 'PDF', size: '2.4 MB', date: '12/05/2023', client: 'Padaria Central' },
  { id: '2', name: 'PGDAS_Jan2024.pdf', type: 'PDF', size: '1.1 MB', date: '20/01/2024', client: 'Oficina do João' },
  { id: '3', name: 'Balancete_T4_2023.xlsx', type: 'Excel', size: '4.8 MB', date: '05/01/2024', client: 'Consultoria Tech' },
  { id: '4', name: 'Documentos_Admissao_Carlos.zip', type: 'ZIP', size: '15.2 MB', date: '18/01/2024', client: 'Padaria Central' },
  { id: '5', name: 'Relatorio_Faturamento_2023.pdf', type: 'PDF', size: '3.5 MB', date: '10/01/2024', client: 'Agro Vale' },
]

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Repositório de Documentos</h1>
          <p className="text-muted-foreground">Armazenamento seguro e organizado para toda a documentação dos clientes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filtros Avançados
          </Button>
          <Button className="bg-primary hover:bg-secondary gap-2">
            <Plus className="h-4 w-4" /> Upload de Arquivo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Pastas Favoritas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-2 text-primary font-semibold">
              <FolderOpen className="h-4 w-4" /> Recentes
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FolderOpen className="h-4 w-4" /> Contratos Sociais
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FolderOpen className="h-4 w-4" /> Guias de Impostos
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FolderOpen className="h-4 w-4" /> Balancetes/Livros
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FolderOpen className="h-4 w-4" /> RH e Folha
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome do arquivo ou cliente..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Card>
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="divide-y">
                {MOCK_FILES.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-accent">{file.client}</span>
                          <span>•</span>
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="hidden sm:inline-flex">{file.type}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> Visualizar</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2"><Download className="h-4 w-4" /> Download</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2"><Share2 className="h-4 w-4" /> Compartilhar</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  )
}
