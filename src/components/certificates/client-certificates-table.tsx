
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
  Plus, 
  Calendar as CalendarIcon,
  PlusCircle,
  Link as LinkIcon,
  Upload,
  FileSearch
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format, differenceInDays, parseISO, isBefore } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ClientCertificatesTableProps {
  clientId: string;
}

const INITIAL_MOCK_CERTIFICATES = [
  { id: '1', tipo: 'Federal (Receita/PGFN)', numero: '8872.A211.C902', emissao: '2024-08-10', validade: '2025-02-10', arquivoUrl: '#' },
  { id: '2', tipo: 'FGTS (CRF)', numero: '20240115082211', emissao: '2024-09-15', validade: '2024-10-14', arquivoUrl: '#' },
  { id: '3', tipo: 'Estadual (SEFA-AP)', numero: '9922.881.002', emissao: '2024-09-01', validade: '2024-09-28', arquivoUrl: '#' },
  { id: '4', tipo: 'Trabalhista (CNDT)', numero: '2211.3344.55', emissao: '2024-03-20', validade: '2024-09-20', arquivoUrl: '#' },
  { id: '5', tipo: 'Municipal (Macapá)', numero: '-', emissao: '-', validade: '-', arquivoUrl: '' },
]

export function ClientCertificatesTable({ clientId }: ClientCertificatesTableProps) {
  const [certificates, setCertificates] = useState(INITIAL_MOCK_CERTIFICATES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form State
  const [newCert, setNewCert] = useState({
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
      setNewCert({
        ...newCert,
        fileName: file.name,
        arquivoUrl: URL.createObjectURL(file) // Simulação de URL local
      })
    }
  }

  const handleAddManual = () => {
    if (!newCert.tipo || !newCert.validade) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o tipo e a data de validade.",
        variant: "destructive"
      })
      return;
    }

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...newCert
    };

    setCertificates([newItem, ...certificates]);
    setIsModalOpen(false);
    setNewCert({ tipo: "", numero: "", emissao: "", validade: "", arquivoUrl: "", fileName: "" });
    
    toast({
      title: "Certidão Adicionada",
      description: "O registro manual foi incluído com sucesso."
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
              <PlusCircle className="h-4 w-4" /> Incluir Certidão Manual
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Inclusão Manual de CND</DialogTitle>
              <DialogDescription>
                Utilize esta opção quando a certidão foi emitida fora do sistema ou por portais com erro de automação.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Certidão</Label>
                <Select onValueChange={(v) => setNewCert({...newCert, tipo: v})}>
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
                  value={newCert.numero}
                  onChange={(e) => setNewCert({...newCert, numero: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="emissao">Data Emissão</Label>
                  <Input 
                    id="emissao" 
                    type="date" 
                    value={newCert.emissao}
                    onChange={(e) => setNewCert({...newCert, emissao: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validade">Data Validade</Label>
                  <Input 
                    id="validade" 
                    type="date" 
                    value={newCert.validade}
                    onChange={(e) => setNewCert({...newCert, validade: e.target.value})}
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
                          {newCert.fileName || "Clique para selecionar o PDF"}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="link" className="pt-2">
                    <Input 
                      placeholder="Cole o link do Google Drive ou Dropbox aqui..." 
                      value={newCert.arquivoUrl}
                      onChange={(e) => setNewCert({...newCert, arquivoUrl: e.target.value})}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddManual}>Salvar Registro</Button>
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
                  <TableCell className="font-medium">{cert.tipo}</TableCell>
                  <TableCell className="text-xs font-mono">{cert.numero}</TableCell>
                  <TableCell>{cert.emissao !== '-' ? format(parseISO(cert.emissao), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell>{cert.validade !== '-' ? format(parseISO(cert.validade), 'dd/MM/yyyy') : '-'}</TableCell>
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
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Consultar Agora">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Ver Documento" 
                        disabled={!cert.arquivoUrl}
                        asChild={!!cert.arquivoUrl}
                      >
                        {cert.arquivoUrl ? (
                          <a href={cert.arquivoUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" title="Acessar Portal">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
