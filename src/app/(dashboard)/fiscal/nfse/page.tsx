'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { EmissaoNfseModal } from '@/components/nfse/EmissaoNfseModal';

export default function NfsePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dados simulados até a integração da página com a fonte de clientes.
  const clienteExemplo = {
    id: '1',
    nome: 'Empresa Exemplo LTDA',
    cpfCnpj: '00.000.000/0001-99',
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Emissão de NFS-e Nacional
          </h1>
          <p className="text-sm text-zinc-500">
            Gerencie e emita notas fiscais de serviço diretamente pelo Ambiente
            Nacional.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nova NFS-e
        </button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b p-6 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Notas Fiscais Recentes
          </h2>
        </div>
        <div className="p-6 text-center text-sm text-zinc-500">
          Nenhuma nota fiscal emitida recentemente. Clique em &quot;Nova
          NFS-e&quot; para começar.
        </div>
      </div>

      {isModalOpen && (
        <EmissaoNfseModal
          clienteId={clienteExemplo.id}
          clienteNome={clienteExemplo.nome}
          clienteCpfCnpj={clienteExemplo.cpfCnpj}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
