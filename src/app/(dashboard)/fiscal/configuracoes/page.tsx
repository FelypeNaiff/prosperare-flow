'use client';

export default function FiscalConfiguracoesPage() {
  return (
    <div className="max-w-4xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Configurações Fiscais
        </h1>
        <p className="text-sm text-zinc-500">
          Parâmetros de ambiente, séries padrão e credenciamento de
          certificados.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
          Ambiente Sefin Nacional
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ambiente-sefin"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Ambiente de Execução
            </label>
            <select
              id="ambiente-sefin"
              name="ambienteSefin"
              value="PRODUCAO_RESTRITA"
              disabled
              className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="PRODUCAO_RESTRITA">Produção restrita (desenvolvimento)</option>
            </select>
            <p className="mt-2 text-xs text-zinc-500">Produção não pode ser habilitada pelo navegador nesta fase.</p>
          </div>

          <div>
            <label
              htmlFor="serie-padrao-dps"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Série Padrão DPS
            </label>
            <input
              id="serie-padrao-dps"
              name="seriePadraoDps"
              type="text"
              defaultValue="1"
              className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
