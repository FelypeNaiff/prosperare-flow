'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, LockKeyhole } from 'lucide-react';

import { useUser } from '@/firebase';
import { useAccessibleCompanies } from '@/hooks/use-accessible-companies';
import { fetchCertificateMetadata } from '@/lib/fiscal/client';
import type { PublicCertificateMetadata } from '@/lib/fiscal/credentials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FiscalConfiguracoesPage() {
  const { user } = useUser();
  const { companies, isLoading, error } = useAccessibleCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [certificates, setCertificates] = useState<PublicCertificateMetadata[]>([]);
  const [credentialError, setCredentialError] = useState('');
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  useEffect(() => {
    if (!companies.some((company) => company.id === selectedCompanyId)) {
      setSelectedCompanyId(companies.find((company) => company.fiscalPermissions.administrarCredenciais)?.id || '');
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (!user || !selectedCompanyId) {
      setCertificates([]);
      return;
    }
    let active = true;
    setLoadingCredentials(true);
    setCredentialError('');
    fetchCertificateMetadata(user, selectedCompanyId)
      .then((items) => { if (active) setCertificates(items); })
      .catch(() => { if (active) setCredentialError('Sem autorização ou indisponível para esta empresa.'); })
      .finally(() => { if (active) setLoadingCredentials(false); });
    return () => { active = false; };
  }, [user, selectedCompanyId]);

  const company = companies.find((item) => item.id === selectedCompanyId);

  return (
    <div className="max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Configurações Fiscais</h1>
        <p className="text-sm text-zinc-500">Metadados de credenciais A1 por empresa. Upload e acesso ao conteúdo estão desabilitados.</p>
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2"><LockKeyhole className="h-5 w-5" /><h2 className="text-lg font-medium">Certificado A1</h2></div>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger aria-label="Empresa vinculada"><SelectValue placeholder="Selecione uma empresa autorizada" /></SelectTrigger>
            <SelectContent>
              {companies.filter((item) => item.fiscalPermissions.administrarCredenciais).map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.corporateName} — {item.cnpj}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(error || credentialError) && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error || credentialError}</p>}
        {company && <p className="text-sm text-zinc-500">Empresa vinculada: <strong>{company.corporateName}</strong> — {company.cnpj}</p>}
        {loadingCredentials && <Loader2 className="h-5 w-5 animate-spin" />}
        {!loadingCredentials && company && certificates.length === 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Nenhum certificado cadastrado. O cadastro real permanece desabilitado nesta Sprint.
          </div>
        )}
        {certificates.map((certificate) => {
          const days = Math.ceil((new Date(certificate.expiresAt).getTime() - Date.now()) / 86_400_000);
          return (
            <div key={certificate.id} className="grid gap-2 rounded-md border p-4 text-sm sm:grid-cols-2">
              <span>Situação: <strong>{certificate.status}</strong></span>
              <span>Titular: {certificate.holderCnpj}</span>
              <span>Emissor: {certificate.issuer}</span>
              <span>Validade: {new Date(certificate.expiresAt).toLocaleDateString('pt-BR')}</span>
              {days <= 30 && certificate.status === 'VALIDO' && <span className="flex items-center gap-1 text-amber-700"><AlertTriangle className="h-4 w-4" /> Vence em {days} dias</span>}
              {(certificate.replacedAt || certificate.revokedAt) && <span>Histórico: {certificate.replacedAt ? 'substituído' : 'revogado'}</span>}
              <span className="text-zinc-500">Cadastro auditado em {new Date(certificate.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          );
        })}
        <button type="button" disabled className="rounded-md bg-zinc-200 px-4 py-2 text-sm text-zinc-500">Upload de PFX desabilitado</button>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium">Ambiente Sefin Nacional</h2>
        <p className="mt-2 text-sm text-zinc-500">Produção restrita. A transmissão real continua bloqueada no servidor.</p>
      </div>
    </div>
  );
}
