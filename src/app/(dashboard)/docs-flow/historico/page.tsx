
"use client"

import { useState } from "react"
import { 
  History, 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Filter,
  ArrowLeft,
  Building2,
  Calendar,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, orderBy } from "firebase/firestore"
import { format } from "date-fns"

export default function DocsFlowHistoricoPage() {
  const router = useRouter()
  const firestore = useFirestore()
  const { userLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState("")

  const docsQuery = useMemoFirebase(() => 
    userLoaded ? query(collection(firestore, "generated_documents"), orderBy("createdAt", "desc")) : null,
    [firestore, userLoaded]
  )
  const { data: documents = [], isLoading } = useCollection(docsQuery)

  const filteredDocs = (documents || []).filter(d => 
    d.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (confirm("Deseja excluir este registro do histórico?")) {
      deleteDocumentNonBlocking(doc(firestore, "generated_documents", id))
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#39586D]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-[#2C4156] uppercase tracking-tight">Histórico de Documentos</h1>
          <p className="text-[#98A7AA] font-bold text-sm">Rastreabilidade completa de todos os documentos avulsos gerados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#D2D7DB] bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#1FA67A]/10 rounded-xl text-[#1FA67A]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Total Gerado</p>
              <p className="text-2xl font-black text-[#2C4156]">{documents?.length || 0} Docs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB] bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#2574A9]/10 rounded-xl text-[#2574A9]">
              <History className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Recém Criados</p>
              <p className="text-2xl font-black text-[#2C4156]">
                {documents?.filter(d => new Date(d.createdAt).toDateString() === new Date().toDateString()).length || 0} Hoje
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#D2D7DB] bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#F2B705]/10 rounded-xl text-[#F2B705]">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-[#98A7AA] tracking-widest">Tipos Ativos</p>
              <p className="text-2xl font-black text-[#2C4156]">3 Formatos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#D2D7DB]">
        <CardHeader className="bg-[#F7F7F7]/50 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#98A7AA]" />
              <Input 
                placeholder="Buscar empresa ou documento..." 
                className="pl-9 h-9 bg-white border-[#D2D7DB]" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#2C4156]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white font-black uppercase text-[10px]">Data de Emissão</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Empresa</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Documento</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px]">Tipo</TableHead>
                <TableHead className="text-white font-black uppercase text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1FA67A]" />
                  </TableCell>
                </TableRow>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F7F7F7]/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#39586D]">
                          {format(new Date(item.createdAt), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-[10px] text-[#98A7AA]">{format(new Date(item.createdAt), 'HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-[#2C4156] uppercase text-xs">{item.clientName}</TableCell>
                    <TableCell className="text-xs font-medium text-[#39586D] uppercase">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-[#D2D7DB] text-[#39586D]">
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E74C3C]" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-[#98A7AA] font-bold">
                    Nenhum documento salvo no histórico.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
