import { createServer, type Server } from 'node:http';

import { MAX_REQUEST_BYTES } from './contracts';
import type { InternalHttpRequest, InternalHttpResponse } from './isolated-fiscal-service';

export type FiscalRequestHandler = (request: InternalHttpRequest) => Promise<InternalHttpResponse>;

export function createLocalFiscalHttpServer(handler: FiscalRequestHandler, environment = process.env.NODE_ENV): Server {
  if (environment !== 'development' && environment !== 'test') {
    throw new Error('Protótipo fiscal local bloqueado em produção.');
  }
  return createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/internal/v1/synthetic-credential/validate') {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ success: false, code: 'INVALID_REQUEST', message: 'Rota interna inexistente.' }));
      return;
    }
    let rawBody = '';
    for await (const chunk of request) {
      rawBody += chunk.toString('utf8');
      if (Buffer.byteLength(rawBody, 'utf8') > MAX_REQUEST_BYTES) break;
    }
    const result = await handler({
      headers: {
        'x-prosperare-internal-auth': request.headers['x-prosperare-internal-auth'] as string | undefined,
        origin: request.headers.origin,
        'sec-fetch-site': request.headers['sec-fetch-site'] as string | undefined,
      },
      rawBody,
    });
    response.writeHead(result.status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify(result.body));
  });
}
