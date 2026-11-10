export interface NonceStore {
  registerOnce(nonce: string, expiresAt: number, nowEpochSeconds: number): Promise<'REGISTERED' | 'REPLAYED'>;
}

export class InMemoryAtomicNonceStore implements NonceStore {
  private readonly expirations = new Map<string, number>();

  async registerOnce(nonce: string, expiresAt: number, nowEpochSeconds: number): Promise<'REGISTERED' | 'REPLAYED'> {
    // Sem await entre consulta e escrita: a seção é indivisível dentro desta
    // instância Node. Produção ainda exigirá um datastore compartilhado.
    for (const [storedNonce, storedExpiration] of this.expirations) {
      if (storedExpiration <= nowEpochSeconds) this.expirations.delete(storedNonce);
    }
    if (this.expirations.has(nonce)) return 'REPLAYED';
    this.expirations.set(nonce, expiresAt);
    return 'REGISTERED';
  }
}
