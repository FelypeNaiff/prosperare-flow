'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { authenticatedFiscalFetch } from '@/lib/fiscal/client';

const emissaoNfseSchema = z.object({
  tomadorNome: z.string().trim().min(2, 'Informe o nome do tomador.'),
  tomadorCpfCnpj: z
    .string()
    .trim()
    .refine((value) => {
      const documento = value.replace(/\D/g, '');
      return documento.length === 11 || documento.length === 14;
    }, 'Informe um CPF ou CNPJ válido.'),
  discriminacao: z
    .string()
    .trim()
    .min(5, 'Descreva o serviço prestado.')
    .max(2_000, 'A descrição deve ter no máximo 2.000 caracteres.'),
  valorServico: z
    .string()
    .trim()
    .refine((value) => {
      const normalized = value.replace(',', '.');
      const amount = Number(normalized);
      return Number.isFinite(amount) && amount > 0;
    }, 'Informe um valor maior que zero.'),
});

type EmissaoNfseFormData = z.infer<typeof emissaoNfseSchema>;

export interface EmissaoNfseModalProps {
  prestadorId: string;
  prestadorNome: string;
  prestadorCnpj: string;
  onClose: () => void;
}

export function EmissaoNfseModal({
  prestadorId,
  prestadorNome,
  prestadorCnpj,
  onClose,
}: EmissaoNfseModalProps) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmissaoNfseFormData>({
    resolver: zodResolver(emissaoNfseSchema),
    mode: 'onChange',
    defaultValues: {
      tomadorNome: '',
      tomadorCpfCnpj: '',
      discriminacao: '',
      valorServico: '',
    },
  });

  const prepareDraft = handleSubmit(async (data) => {
    if (!user) {
      setServerMessage('Sessão não autenticada.');
      return;
    }
    setIsSubmitting(true);
    setServerMessage(null);
    try {
      const response = await authenticatedFiscalFetch(user, '/api/nfse/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: prestadorId,
          taker: { name: data.tomadorNome, document: data.tomadorCpfCnpj },
          service: { description: data.discriminacao },
          amounts: { serviceAmount: Number(data.valorServico.replace(',', '.')) },
        }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; state?: string };
      if (response.status === 503 && payload.state === 'BLOQUEADO_TRANSMISSAO') {
        setServerMessage('Dados validados. A transmissão permanece bloqueada nesta fase.');
      } else {
        setServerMessage(payload.error || 'Não foi possível validar a preparação.');
      }
    } catch {
      setServerMessage('Falha ao validar a preparação da NFS-e.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preparar nova NFS-e</DialogTitle>
          <DialogDescription>
            Revise os dados do tomador e do serviço. A transmissão fiscal ainda
            não está habilitada.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={prepareDraft}>
          <div className="rounded-lg border bg-zinc-50 p-4 text-sm">
            <p className="text-xs font-semibold uppercase text-zinc-500">Empresa prestadora</p>
            <p className="mt-1 font-semibold text-zinc-900">{prestadorNome}</p>
            <p className="text-zinc-600">{prestadorCnpj}</p>
            <p className="mt-2 text-xs text-zinc-500">O prestador vem da empresa autorizada e não pode ser alterado neste formulário.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nfse-tomador-nome">Nome do tomador</Label>
              <Input
                id="nfse-tomador-nome"
                autoComplete="organization"
                aria-invalid={Boolean(errors.tomadorNome)}
                {...register('tomadorNome')}
              />
              {errors.tomadorNome && (
                <p className="text-xs text-red-600">{errors.tomadorNome.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nfse-tomador-documento">CPF/CNPJ do tomador</Label>
              <Input
                id="nfse-tomador-documento"
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={Boolean(errors.tomadorCpfCnpj)}
                {...register('tomadorCpfCnpj')}
              />
              {errors.tomadorCpfCnpj && (
                <p className="text-xs text-red-600">
                  {errors.tomadorCpfCnpj.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nfse-valor">Valor do serviço</Label>
              <Input
                id="nfse-valor"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                autoComplete="off"
                aria-invalid={Boolean(errors.valorServico)}
                {...register('valorServico')}
              />
              {errors.valorServico && (
                <p className="text-xs text-red-600">
                  {errors.valorServico.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nfse-discriminacao">Descrição do serviço</Label>
              <Textarea
                id="nfse-discriminacao"
                rows={5}
                placeholder="Descreva de forma objetiva o serviço prestado."
                aria-invalid={Boolean(errors.discriminacao)}
                {...register('discriminacao')}
              />
              {errors.discriminacao && (
                <p className="text-xs text-red-600">
                  {errors.discriminacao.message}
                </p>
              )}
            </div>
          </div>

          {serverMessage && <p className="rounded-lg border bg-zinc-50 p-3 text-sm text-zinc-700">{serverMessage}</p>}

          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Nenhum certificado, senha ou dado de prestador será solicitado ou
              enviado nesta etapa. A emissão depende de autenticação,
              autorização multiempresa e homologação oficial.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} title="Apenas valida os dados; não transmite">
              <LockKeyhole className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Validando...' : 'Validar preparação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
