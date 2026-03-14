
"use client"

import { useState, useRef } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  RefreshCw, 
  FileText, 
  ExternalLink, 
  PlusCircle, 
  Link as LinkIcon,
  Upload,
  FileSearch,
  Trash2,
  Edit,
  Mail,
  MoreVertical,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, differenceInDays, parseISO, isBefore } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientCommunicationTool } from "@/components/clients/client-communication-tool"

interface Certificate {
  id: string;
  tipo: string;
  numero: string;
  emissao: string;
  validade: string;
  arquivoUrl: string;
  fileName?: string;
  isManual?: boolean;
}

interface ClientCertificatesTableProps {
  clientId: string;
}

const INITIAL_MOCK_CERTIFICATES: Certificate[] = []

export function ClientCertificatesTable({ clientId }: ClientCertificatesTableProps) {
  const [certificates, setCertificates] = useState<Certificate[]>(INITIAL_MOCK_CERTIFICATES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [certToDelete, setCertToDelete] = useState<string | null>(null)
  const [editingCert, setEditingCert] = useState<Certificate | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    tipo: "",
    numero: "",
    emissao: "",
    validade: "",
    arquivoUrl: "",
    fileName: ""
  })

  const getStatusInfo = (validadeStr: string) => {
    if (validadeStr === '-' || !validadeStr) return { label: 'Não emitida', color: 'bg-slate-400', days: 0 };
    
    const hoje = new Date();
    const validade = parseISO(validadeStr);
    const diasRestantes = differenceInDays(validade, hoje);

    if (isBefore(validade, hoje)) {
      return { label: 'Vencida', color: 'bg-red-500', days: diasRestantes };
    }
    if (diasRestantes <= 7) {
      return { label: 'Crítica', color: 'bg-orange-500', days: diasRestantes };
    }
    if (diasRestantes <= 30) {
      return { label: 'A Vencer', color: 'bg-yellow-500 text-black', days: diasRestantes };
    }
    return { label: 'Válida', color: 'bg-emerald-500', days: diasRestantes };
  }

  const handleSave = () => {
    if (!formData.tipo || !formData.validade) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o tipo e a data de validade.",
        variant: "destructive"
      })
      return;
    }

    if (editingCert) {
      setCertificates(prev => prev.map(c => 
        c.id === editingCert.id ? { ...c, ...formData } : c
      ));
      toast({ title: "Certidão Atualizada" });
    } else {
      const newItem: Certificate = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        isManual: true
      };
      setCertificates([newItem, ...certificates]);
      toast({ title: "Certidão Adicionada" });
    }

    setIsModalOpen(false);
    setEditingCert(null);
    setFormData({ tipo: "", numero: "", emissao: "", validade: "", arquivoUrl: "", fileName: "" });
  }

  const handleDelete = () => {
    if (certToDelete) {
      setCertificates(prev => prev.filter(c => c.id !== certToDelete));
      setIsDeleteDialogOpen(false);
      setCertToDelete(null);
      toast({ title: "Registro Excluído" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <FileSearch className="h-4 w-4" /> 
          Regularidade Fiscal
        </h3>
        <Button size="sm" variant="outline" className="gap-2 border-primary text-primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-4 w-4" /> Incluir Manual
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Tipo de Certidão</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.length > 0 ? (
              certificates.map((cert) => {
                const status = getStatusInfo(cert.validade);
                return (
                  <TableRow key={cert.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{cert.tipo}</TableCell>
                    <TableCell className="text-xs font-mono">{cert.numero}</TableCell>
                    <TableCell>{cert.emissao ? format(parseISO(cert.emissao), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>{cert.validade ? format(parseISO(cert.validade), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setCertToDelete(cert.id);
                            setIsDeleteDialogOpen(true);
                          }} className="text-destructive">Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[#98A7AA] font-bold">
                  Nenhuma certidão registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Certidão Manual</DialogTitle>
          </DialogHeader>
          {/* Campos de formulário aqui */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá a certidão do histórico.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
