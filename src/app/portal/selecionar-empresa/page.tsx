'use client';

import { Building2, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { initiateLogout } from '@/firebase/non-blocking-login';
import { useAccessibleCompanies } from '@/hooks/use-accessible-companies';

export default function SelecionarEmpresaPage() {
  const { companies, isLoading, error } = useAccessibleCompanies();
  const auth = useAuth();
  const router = useRouter();

  const selectCompany = (id: string) => {
    sessionStorage.setItem('portal_active_client_id', id);
    window.dispatchEvent(new CustomEvent('portalCompanyChanged', { detail: { clientId: id } }));
    router.push('/portal/nfse');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-2xl overflow-hidden shadow-xl">
        <CardHeader className="bg-[#2C4156] p-8 text-white">
          <ShieldCheck className="mb-3 h-9 w-9 text-emerald-400" />
          <CardTitle>Selecione uma empresa autorizada</CardTitle>
          <CardDescription className="text-white/70">A lista é validada no servidor a partir dos vínculos e permissões fiscais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-8">
          {isLoading && <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Carregando empresas...</div>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!isLoading && companies.length === 0 && <p className="text-sm text-slate-500">Nenhuma empresa foi autorizada para este usuário.</p>}
          {companies.map((company) => (
            <button key={company.id} onClick={() => selectCompany(company.id)} className="flex w-full items-center gap-4 rounded-xl border p-4 text-left hover:border-blue-500 hover:bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span><strong className="block text-sm text-slate-800">{company.corporateName}</strong><small className="text-slate-500">{company.cnpj}</small></span>
            </button>
          ))}
          <Button variant="ghost" className="mt-4 text-red-600" onClick={async () => { await initiateLogout(auth); router.push('/login'); }}><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
        </CardContent>
      </Card>
    </div>
  );
}
