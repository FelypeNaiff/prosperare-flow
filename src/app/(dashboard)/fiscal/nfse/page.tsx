'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

import { EmissaoNfseModal } from '@/components/nfse/EmissaoNfseModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccessibleCompanies } from '@/hooks/use-accessible-companies';

export default function NfsePage() {
  const { companies, isLoading, error } = useAccessibleCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!companies.some((company) => company.id === selectedCompanyId)) {
      setSelectedCompanyId(companies[0]?.id || '');
    }
  }, [companies, selectedCompanyId]);

  const company = companies.find((item) => item.id === selectedCompanyId);

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Emissão de NFS-e Nacional</h1>
          <p className="text-sm text-zinc-500">Empresas e ações são filtradas pelas permissões fiscais do usuário autenticado.</p>
        </div>
        <div className="flex min-w-72 items-center gap-3">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger aria-label="Empresa fiscal"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
              <SelectContent>
                {companies.map((item) => <SelectItem key={item.id} value={item.id}>{item.corporateName} — {item.cnpj}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={!company?.fiscalPermissions.emitir}
            title={company && !company.fiscalPermissions.emitir ? 'Sem permissão para emitir nesta empresa' : undefined}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova NFS-e
          </Button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!isLoading && companies.length === 0 && <p className="rounded-lg border p-6 text-sm text-zinc-500">Nenhuma empresa com acesso fiscal foi atribuída a este usuário.</p>}

      <div className="rounded-xl border bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b p-6 dark:border-zinc-800"><h2 className="text-base font-semibold">Notas fiscais recentes</h2></div>
        <div className="p-6 text-center text-sm text-zinc-500">A consulta será disponibilizada após homologação. A emissão real permanece bloqueada.</div>
      </div>

      {isModalOpen && company && (
        <EmissaoNfseModal
          prestadorId={company.id}
          prestadorNome={company.corporateName}
          prestadorCnpj={company.cnpj}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
