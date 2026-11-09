'use client';

import { Building2, FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccessibleCompanies } from '@/hooks/use-accessible-companies';

export default function NfsePortalPage() {
  const { companies, isLoading } = useAccessibleCompanies();
  const activeId = typeof window === 'undefined' ? '' : sessionStorage.getItem('portal_active_client_id') || '';
  const company = companies.find((item) => item.id === activeId) || companies[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-[#2C4156]">Solicitação de NFS-e</h1>
        <p className="text-sm font-medium text-[#98A7AA]">Somente operações autorizadas para a empresa selecionada são exibidas.</p>
      </div>
      {company && (
        <div className="flex items-center gap-3 rounded-lg border bg-blue-50 p-4 text-sm text-blue-900">
          <Building2 className="h-5 w-5" /> <strong>{company.corporateName}</strong><span>{company.cnpj}</span>
        </div>
      )}
      <Card className="border-[#D2D7DB] shadow-sm">
        <CardHeader className="border-b bg-slate-50/50"><CardTitle className="flex items-center gap-2 text-sm text-slate-700"><FileText className="h-5 w-5 text-blue-600" /> Emissão de Nota Fiscal de Serviço</CardTitle></CardHeader>
        <CardContent className="p-12 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
          {isLoading ? 'Validando acesso...' : !company ? 'Nenhuma empresa autorizada.' : !company.fiscalPermissions.emitir ? 'Seu acesso permite consulta, mas não emissão para esta empresa.' : 'Emissão autorizada, porém indisponível até a homologação oficial (HTTP 503).'}
        </CardContent>
      </Card>
    </div>
  );
}
