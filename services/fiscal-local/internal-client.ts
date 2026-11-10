import { sanitizedFiscalErrorSchema, sanitizedFiscalResultSchema, type IsolatedFiscalRequest, type IsolatedFiscalResponse } from './contracts';

export async function callLocalFiscalService(input: {
  baseUrl: string;
  token: string;
  request: IsolatedFiscalRequest;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}): Promise<IsolatedFiscalResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    const response = await (input.fetchImpl || fetch)(`${input.baseUrl}/internal/v1/synthetic-credential/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-prosperare-internal-auth': input.token },
      body: JSON.stringify(input.request),
      signal: controller.signal,
    });
    const body = await response.json() as unknown;
    const parsed = response.ok ? sanitizedFiscalResultSchema.safeParse(body) : sanitizedFiscalErrorSchema.safeParse(body);
    if (!parsed.success) return { success: false, code: 'SERVICE_UNAVAILABLE', message: 'Resposta inválida do serviço fiscal.' };
    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, code: 'SERVICE_TIMEOUT', message: 'Tempo limite do serviço fiscal excedido.' };
    }
    return { success: false, code: 'SERVICE_UNAVAILABLE', message: 'Serviço fiscal temporariamente indisponível.' };
  } finally {
    clearTimeout(timer);
  }
}
