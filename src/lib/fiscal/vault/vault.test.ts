import assert from 'node:assert/strict';
import test from 'node:test';

import type { VaultAccessContext, VaultAuditEvent } from './domain';
import { VaultSecurityError } from './domain';
import { SimulatedFiscalCredentialVault } from './simulated-vault';

const events: VaultAuditEvent[] = [];
const audit = { record: (event: VaultAuditEvent) => { events.push(structuredClone(event)); } };

interface TestEncryptedPart { ciphertext: Buffer; iv: Buffer; authTag: Buffer }
interface TestStoredVersion { material: TestEncryptedPart; passphrase: TestEncryptedPart }

function storedVersions(vault: SimulatedFiscalCredentialVault): TestStoredVersion[] {
  const records = (vault as unknown as { records: Map<string, TestStoredVersion[]> }).records;
  return records.values().next().value || [];
}

function context(overrides: Partial<VaultAccessContext> = {}): VaultAccessContext {
  return {
    actorUid: 'funcionario-1', clientId: 'empresa-1', actorType: 'FUNCIONARIO',
    active: true, administrarCredenciais: true, ...overrides,
  };
}

function input(clientId = 'empresa-1', material = 'PFX-SINTETICO', passphrase = 'SENHA-SINTETICA') {
  return {
    credentialId: 'cert-1', clientId,
    syntheticMaterial: Buffer.from(material), syntheticPassphrase: Buffer.from(passphrase),
  };
}

test.beforeEach(() => { events.length = 0; });

test('armazena e recupera material exclusivamente sintético', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  const reference = await vault.store(context(), input());
  assert.equal(reference.version, 1);
  const lease = await vault.retrieve(context(), 'cert-1');
  assert.equal(lease.syntheticMaterial.toString(), 'PFX-SINTETICO');
  assert.equal(lease.syntheticPassphrase.toString(), 'SENHA-SINTETICA');
  lease.dispose();
  assert.equal(lease.syntheticMaterial.every((byte) => byte === 0), true);
  assert.equal(lease.syntheticPassphrase.every((byte) => byte === 0), true);
});

test('isola credenciais entre empresas', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await vault.store(context(), input());
  await assert.rejects(() => vault.retrieve(context({ clientId: 'empresa-2' }), 'cert-1'), (error: unknown) => error instanceof VaultSecurityError && error.code === 'NOT_FOUND');
});

test('rejeita armazenamento com empresa diferente do contexto', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await assert.rejects(() => vault.store(context(), input('empresa-2')), (error: unknown) => error instanceof VaultSecurityError && error.code === 'CROSS_COMPANY');
});

test('informa credencial inexistente sem expor material', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await assert.rejects(() => vault.retrieve(context(), 'inexistente'), /Credencial inexistente/);
});

test('impede recuperar credencial revogada', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await vault.store(context(), input());
  await vault.revoke(context(), 'cert-1');
  await assert.rejects(() => vault.retrieve(context(), 'cert-1'), (error: unknown) => error instanceof VaultSecurityError && error.code === 'REVOKED');
});

test('versiona substituição e bloqueia versão anterior', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await vault.store(context(), input());
  const second = await vault.store(context(), input('empresa-1', 'PFX-SINTETICO-V2'));
  assert.equal(second.version, 2);
  await assert.rejects(() => vault.retrieve(context(), 'cert-1', 1), (error: unknown) => error instanceof VaultSecurityError && error.code === 'REPLACED');
  const lease = await vault.retrieve(context(), 'cert-1');
  assert.equal(lease.syntheticMaterial.toString(), 'PFX-SINTETICO-V2');
  lease.dispose();
});

test('nega usuário interno sem permissão', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await assert.rejects(() => vault.store(context({ administrarCredenciais: false }), input()), /não autorizada/);
});

test('nega cliente mesmo com permissão marcada', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await assert.rejects(() => vault.store(context({ actorType: 'CLIENTE' }), input()), /não autorizada/);
});

test('destrói todas as versões de forma controlada', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await vault.store(context(), input());
  await vault.store(context(), input('empresa-1', 'PFX-SINTETICO-V2'));
  await vault.destroy(context(), 'cert-1');
  await assert.rejects(() => vault.retrieve(context(), 'cert-1'), /Credencial inexistente/);
});

test('auditoria e referências não contêm segredos', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  const reference = await vault.store(context(), input());
  const serialized = JSON.stringify({ reference, events });
  assert.equal(serialized.includes('PFX-SINTETICO'), false);
  assert.equal(serialized.includes('SENHA-SINTETICA'), false);
  assert.equal(Object.keys(events[0]).some((key) => /pfx|senha|password|secret|material/i.test(key)), false);
});

test('usa nonces GCM de 96 bits distintos e tags de autenticação', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await vault.store(context(), input());
  await vault.store(context(), input('empresa-1', 'PFX-SINTETICO-V2', 'SENHA-SINTETICA-V2'));
  const parts = storedVersions(vault).flatMap((version) => [version.material, version.passphrase]);
  assert.equal(parts.every((part) => part.iv.length === 12), true);
  assert.equal(parts.every((part) => part.authTag.length === 16), true);
  assert.equal(new Set(parts.map((part) => part.iv.toString('hex'))).size, parts.length);
});

test('rejeita ciphertext adulterado pela autenticação do GCM', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await vault.store(context(), input());
  const record = storedVersions(vault)[0];
  record.material.ciphertext[0] ^= 0xff;
  await assert.rejects(
    () => vault.retrieve(context(), 'cert-1'),
    (error: unknown) => error instanceof Error
      && !error.message.includes('PFX-SINTETICO')
      && !error.message.includes('SENHA-SINTETICA'),
  );
});

test('descarta material já aberto quando a descriptografia da senha falha', async () => {
  const vault = new SimulatedFiscalCredentialVault(audit);
  await vault.store(context(), input());
  const record = storedVersions(vault)[0];
  record.passphrase.authTag[0] ^= 0xff;

  const clearedPlaintexts: string[] = [];
  const originalFill = Buffer.prototype.fill;
  Buffer.prototype.fill = function (this: Buffer, ...args: unknown[]) {
    const before = this.toString('utf8');
    if (before.includes('SINTETIC')) clearedPlaintexts.push(before);
    return (originalFill as (...fillArgs: unknown[]) => Buffer).apply(this, args);
  } as Buffer['fill'];
  try {
    await assert.rejects(() => vault.retrieve(context(), 'cert-1'));
  } finally {
    Buffer.prototype.fill = originalFill;
  }
  assert.deepEqual(clearedPlaintexts, ['PFX-SINTETICO']);
});

test('descarta buffers quando o sink de auditoria falha após a descriptografia', async () => {
  let failRetrieveAudit = false;
  const failingAudit = {
    record(event: VaultAuditEvent) {
      if (failRetrieveAudit && event.operation === 'RECUPERAR') throw new Error('AUDIT_SINK_FAILURE');
    },
  };
  const vault = new SimulatedFiscalCredentialVault(failingAudit);
  await vault.store(context(), input());
  failRetrieveAudit = true;

  const clearedPlaintexts: string[] = [];
  const originalFill = Buffer.prototype.fill;
  Buffer.prototype.fill = function (this: Buffer, ...args: unknown[]) {
    const before = this.toString('utf8');
    if (before.includes('SINTETIC')) clearedPlaintexts.push(before);
    return (originalFill as (...fillArgs: unknown[]) => Buffer).apply(this, args);
  } as Buffer['fill'];
  try {
    await assert.rejects(() => vault.retrieve(context(), 'cert-1'), /AUDIT_SINK_FAILURE/);
  } finally {
    Buffer.prototype.fill = originalFill;
  }
  assert.deepEqual(clearedPlaintexts.sort(), ['PFX-SINTETICO', 'SENHA-SINTETICA'].sort());
});

test('bloqueia a implementação simulada em produção sem parâmetro de bypass', () => {
  const previous = process.env.NODE_ENV;
  Reflect.set(process.env, 'NODE_ENV', 'production');
  try {
    assert.throws(() => new SimulatedFiscalCredentialVault(audit), (error: unknown) => error instanceof VaultSecurityError && error.code === 'PRODUCTION_BLOCKED');
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV');
    else Reflect.set(process.env, 'NODE_ENV', previous);
  }
});
