
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

const INITIAL_MOCK_CERTIFICATES: Certificate[] = [
  { id: '1', tipo: 'Federal (Receita/PGFN)', numero: '8872.A211.C902', emissao: '2024-08-10', validade: '2025-02-10', arquivoUrl: '#', isManual: false },
  { id: '2', tipo: 'FGTS (CRF)', numero: '20240115082211', emissao: '2024-09-15', validade: '2024-10-14', arquivoUrl: '#', isManual: false },
  { id: '3', tipo: 'Estadual (SEFA-AP)', numero: '9922.881.002', emissao: '2024-09-01', validade: '2024-10-10', arquivoUrl: '#', isManual: true },
  { id: '4', tipo: 'Trabalhista (CNDT)', numero: '2211.3344.55', emissao: '2024-03-20', validade: '2024-09-20', arquivoUrl: '#', isManual: false },
]

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({
        ...formData,
        fileName: file.name,
        arquivoUrl: URL.createObjectURL(file)
      })
    }
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
      // Update
      setCertificates(prev => prev.map(c => 
        c.id === editingCert.id ? { ...c, ...formData } : c
      ));
      toast({ title: "Certidão Atualizada", description: "Os dados foram atualizados com sucesso." });
    } else {
      // Create
      const newItem: Certificate = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        isManual: true
      };
      setCertificates([newItem, ...certificates]);
      toast({ title: "Certidão Adicionada", description: "O registro manual foi incluído com sucesso." });
    }

    setIsModalOpen(false);
    setEditingCert(null);
    setFormData({ tipo: "", numero: "", emissao: "", validade: "", arquivoUrl: "", fileName: "" });
  }

  const handleEdit = (cert: Certificate) => {
    setEditingCert(cert);
    setFormData({
      tipo: cert.tipo,
      numero: cert.numero,
      emissao: cert.emissao,
      validade: cert.validade,
      arquivoUrl: cert.arquivoUrl,
      fileName: cert.fileName || ""
    });
    setIsModalOpen(true);
  }

  const handleDelete = () => {
    if (certToDelete) {
      setCertificates(prev => prev.filter(c => c.id !== certToDelete));
      setIsDeleteDialogOpen(false);
      setCertToDelete(null);
      toast({ title: "Registro Excluído", description: "A certidão foi removida do sistema." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <FileSearch className="h-4 w-4" /> 
          Monitoramento de Regularidade Fiscal
        </h3>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingCert(null);
            setFormData({ tipo: "", numero: "", emissao: "", validade: "", arquivoUrl: "", fileName: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
              <PlusCircle className="h-4 w-4" /> Incluir Certidão Manual
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCert ? "Atualizar Certidão" : "Inclusão Manual de CND"}</DialogTitle>
              <DialogDescription>
                {editingCert 
                  ? "Atualize os dados e a nova validade da certidão manual."
                  : "Utilize esta opção quando a certidão foi emitida fora do sistema."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Certidão</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Federal (Receita/PGFN)">Federal (Receita/PGFN)</SelectItem>
                    <SelectItem value="FGTS (CRF)">FGTS (CRF)</SelectItem>
                    <SelectItem value="Estadual (SEFA-AP)">Estadual (SEFA-AP)</SelectItem>
                    <SelectItem value="Municipal (Macapá)">Municipal (Macapá)</SelectItem>
                    <SelectItem value="Trabalhista (CNDT)">Trabalhista (CNDT)</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="numero">Número da Certidão</Label>
                <Input 
                  id="numero" 
                  placeholder="Ex: 8872.A211..." 
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="emissao">Data Emissão</Label>
                  <Input 
                    id="emissao" 
                    type="date" 
                    value={formData.emissao}
                    onChange={(e) => setFormData({...formData, emissao: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validade">Data Validade</Label>
                  <Input 
                    id="validade" 
                    type="date" 
                    value={formData.validade}
                    onChange={(e) => setFormData({...formData, validade: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <Label>Documento da Certidão</Label>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="h-3.5 w-3.5" /> Upload PDF
                    </TabsTrigger>
                    <TabsTrigger value="link" className="gap-2">
                      <LinkIcon className="h-3.5 w-3.5" /> Link Drive
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="pt-2">
                    <div 
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <FileSearch className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formData.fileName || "Clique para selecionar o PDF"}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="link" className="pt-2">
                    <Input 
                      placeholder="Cole o link do Google Drive ou Dropbox aqui..." 
                      value={formData.arquivoUrl}
                      onChange={(e) => setFormData({...formData, arquivoUrl: e.target.value})}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editingCert ? "Salvar Alterações" : "Salvar Registro"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Tipo de Certidão</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-center">Dias Restantes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map((cert) => {
              const status = getStatusInfo(cert.validade);
              return (
                <TableRow key={cert.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium flex items-center gap-2">
                    {cert.tipo}
                    {cert.isManual && <Badge variant="outline" className="text-[10px] h-4 px-1">Manual</Badge>}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{cert.numero}</TableCell>
                  <TableCell>{cert.emissao !== '-' && cert.emissao ? format(parseISO(cert.emissao), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell>{cert.validade !== '-' && cert.validade ? format(parseISO(cert.validade), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell className={cn(
                    "text-center font-bold", 
                    status.days < 0 ? "text-red-600" : 
                    status.days <= 7 ? "text-orange-600" : 
                    status.days <= 30 ? "text-yellow-600" : "text-emerald-600"
                  )}>
                    {cert.validade === '-' ? '-' : status.days}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("hover:opacity-80 transition-opacity", status.color)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button variant="ghost" size="icon" title="Consultar Agora" className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      
                      <ClientCommunicationTool 
                        client={{ name: "Cliente", email: "cliente@email.com", regime: "Simples" }}
                        trigger={
                          <Button variant="ghost" size="icon" title="Enviar por E-mail" className="h-8 w-8">
                            <Mail className="h-4 w-4 text-accent" />
                          </Button>
                        }
                        initialPurpose={`Enviar a certidão ${cert.tipo} (Número: ${cert.numero}) para o cliente.`}
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild disabled={!cert.arquivoUrl}>
                            <a href={cert.arquivoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              <Download className="h-4 w-4" /> Baixar / Ver
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(cert)} className="gap-2">
                            <Edit className="h-4 w-4" /> Editar Registro
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setCertToDelete(cert.id);
                              setIsDeleteDialogOpen(true);
                            }} 
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir Registro de Certidão?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro da certidão será permanentemente removido do histórico do cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCertToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
