"use client"

import { useState } from "react"
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
  PlusCircle, 
  FileSearch, 
  MoreVertical,
  Loader2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format, differenceInDays, parseISO, isBefore } from "date-fns"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

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

export function ClientCertificatesTable({ clientId }: { clientId: string }) {
  const firestore = useFirestore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Auditoria: Unificando para a coleção 'certifications' conforme o blueprint
  const certsQuery = useMemoFirebase(() => 
    query(collection(firestore, "certifications"), where("clientId", "==", clientId)),
    [firestore, clientId]
  )
  const { data: certificates, isLoading } = useCollection<Certificate>(certsQuery)

  const getStatusInfo = (validadeStr: string) => {
    if (!validadeStr || validadeStr === '-') return { label: 'Não emitida', color: 'bg-slate-400', days: 0 };
    
    try {
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
    } catch (e) {
      return { label: 'Erro Data', color: 'bg-slate-400', days: 0 };
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1FA67A]" />
                </TableCell>
              </TableRow>
            ) : certificates && certificates.length > 0 ? (
              certificates.map((cert) => {
                const status = getStatusInfo(cert.validade);
                return (
                  <TableRow key={cert.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{cert.tipo}</TableCell>
                    <TableCell className="text-xs font-mono">{cert.numero || '--'}</TableCell>
                    <TableCell>{cert.emissao ? format(parseISO(cert.emissao), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>{cert.validade ? format(parseISO(cert.validade), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-[#98A7AA] font-bold italic">
                  Nenhuma certidão registrada para esta empresa.
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
            <DialogDescription>Preencha os dados da certidão para manter o histórico de regularidade atualizado.</DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center text-sm text-muted-foreground">
            Funcionalidade de upload em desenvolvimento.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
