import { adminFirestore } from '../src/lib/firebase-admin';
import {
  assertMigrationWriteAllowed,
  normalizeCnpj,
  resolveCompany,
  userCompanyCandidates,
  type MigrationResolution as Resolution,
} from '../src/lib/fiscal/migration';

const APPLY = process.argv.includes('--apply');
const ALLOW_APPLY = process.env.SPRINT_2_2_ALLOW_APPLY === 'true';
const COMPANY_COLLECTIONS = [
  'tasks', 'processes', 'alvaras', 'certidoes', 'certifications', 'contracts',
  'receivables', 'installments', 'generated_documents', 'analisesFiscais',
  'societaryOpenings', 'societaryAlterations', 'funcionarios',
] as const;

type ReportItem = { collection: string; documentId: string; resolution: Resolution };

async function loadCompanyIndex() {
  const clients = await adminFirestore.collection('clients').get();
  const clientIds = new Set<string>();
  const clientsByCnpj = new Map<string, string[]>();
  for (const client of clients.docs) {
    clientIds.add(client.id);
    const cnpj = normalizeCnpj(client.data().cnpj);
    if (!cnpj) continue;
    clientsByCnpj.set(cnpj, [...(clientsByCnpj.get(cnpj) || []), client.id]);
  }
  return { clientIds, clientsByCnpj };
}

async function migrateCanonicalIds(clientIds: Set<string>, clientsByCnpj: Map<string, string[]>) {
  const report: ReportItem[] = [];
  let updated = 0;
  for (const collectionName of COMPANY_COLLECTIONS) {
    const snapshot = await adminFirestore.collection(collectionName).get();
    for (const document of snapshot.docs) {
      if (typeof document.data().canonicalClientId === 'string' && document.data().canonicalClientId) continue;
      const resolution = resolveCompany(document.data(), clientIds, clientsByCnpj);
      report.push({ collection: collectionName, documentId: document.id, resolution });
      if (APPLY && resolution.status === 'resolved') {
        await document.ref.update({ canonicalClientId: resolution.clientId });
        updated += 1;
      }
    }
  }
  return { updated, report };
}

async function migrateUserLinks(clientIds: Set<string>, clientsByCnpj: Map<string, string[]>) {
  const users = await adminFirestore.collection('users').get();
  const report: ReportItem[] = [];
  let created = 0;
  for (const user of users.docs) {
    const profile = String(user.data().profile || user.data().role || '');
    const kind = profile === 'CLIENTE' ? 'CLIENTE' : 'FUNCIONARIO';
    for (const resolution of userCompanyCandidates(user.data(), clientIds, clientsByCnpj)) {
      report.push({ collection: 'userCompanyAccess', documentId: user.id, resolution });
      if (!APPLY || resolution.status !== 'resolved') continue;
      const id = `${user.id}_${resolution.clientId}`;
      const reference = adminFirestore.collection('userCompanyAccess').doc(id);
      if ((await reference.get()).exists) continue;
      await reference.create({
        userId: user.id,
        clientId: resolution.clientId,
        kind,
        status: user.data().status === 'ATIVO' ? 'ATIVO' : 'INATIVO',
        fiscalPermissions: {
          consultar: kind === 'CLIENTE',
          emitir: false,
          cancelar: false,
          administrarCredenciais: false,
        },
      });
      created += 1;
    }
  }
  return { created, report };
}

async function main() {
  assertMigrationWriteAllowed(APPLY, ALLOW_APPLY);
  const { clientIds, clientsByCnpj } = await loadCompanyIndex();
  const canonical = await migrateCanonicalIds(clientIds, clientsByCnpj);
  const links = await migrateUserLinks(clientIds, clientsByCnpj);
  const ambiguities = [...canonical.report, ...links.report]
    .filter((item) => item.resolution.status !== 'resolved');
  process.stdout.write(`${JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    companies: clientIds.size,
    canonical: { candidates: canonical.report.length, updated: canonical.updated },
    links: { candidates: links.report.length, created: links.created },
    ambiguities,
  }, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
