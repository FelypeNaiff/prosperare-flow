import * as https from 'https';
import { NextResponse } from 'next/server';

import { gerarXmlDps } from '@/services/nfse/dps-builder.service';
import { assinarDps } from '@/services/nfse/nfe-nacional.service';

export const runtime = 'nodejs';

// Deve permanecer falso até a autenticação, a autorização multiempresa, o
// armazenamento seguro do certificado e a integração oficial serem homologados.
const EMISSAO_FISCAL_HABILITADA = false;

interface EmitirNfseBody {
  serie: string;
  numero: string;
  prestadorCnpj: string;
  tomadorCnpjCpf: string;
  tomadorNome: string;
  valorServico: number;
  discriminacao: string;
  codigoMunicipioPrestacao: string;
  certBufferBase64: string;
  certPassword: string;
}

interface RespostaSefin {
  statusCode: number;
  body: string;
}

function transmitirComMtls(
  endpoint: URL,
  soapEnvelope: string,
  certBuffer: Buffer,
  certPassword: string,
): Promise<RespostaSefin> {
  return new Promise((resolve, reject) => {
    const requisicao = https.request(
      endpoint,
      {
        method: 'POST',
        pfx: certBuffer,
        passphrase: certPassword,
        rejectUnauthorized: true,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          SOAPAction:
            'http://www.sped.fazenda.gov.br/nfse/RecepcaoLotes',
          'Content-Length': Buffer.byteLength(soapEnvelope),
        },
      },
      (resposta) => {
        const partes: Buffer[] = [];

        resposta.on('data', (parte: Buffer | string) => {
          partes.push(Buffer.isBuffer(parte) ? parte : Buffer.from(parte));
        });

        resposta.on('end', () => {
          resolve({
            statusCode: resposta.statusCode ?? 500,
            body: Buffer.concat(partes).toString('utf8'),
          });
        });
      },
    );

    requisicao.setTimeout(30_000, () => {
      requisicao.destroy(new Error('Tempo limite excedido na comunicação com a Sefin Nacional.'));
    });
    requisicao.on('error', reject);
    requisicao.end(soapEnvelope);
  });
}

export async function POST(request: Request) {
  if (!EMISSAO_FISCAL_HABILITADA) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Emissão fiscal indisponível até a homologação da autenticação e da integração oficial.',
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as Partial<EmitirNfseBody>;
    const {
      serie,
      numero,
      prestadorCnpj,
      tomadorCnpjCpf,
      tomadorNome,
      valorServico,
      discriminacao,
      codigoMunicipioPrestacao,
      certBufferBase64,
      certPassword,
    } = body;

    if (
      !serie ||
      !numero ||
      !prestadorCnpj ||
      !tomadorCnpjCpf ||
      !tomadorNome ||
      typeof valorServico !== 'number' ||
      !Number.isFinite(valorServico) ||
      valorServico <= 0 ||
      !discriminacao ||
      !codigoMunicipioPrestacao ||
      !certBufferBase64 ||
      !certPassword
    ) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios inválidos ou ausentes.' },
        { status: 400 },
      );
    }

    const endpointConfigurado = process.env.NFSE_SEFIN_ENDPOINT;

    if (!endpointConfigurado) {
      return NextResponse.json(
        {
          success: false,
          error: 'A variável de ambiente NFSE_SEFIN_ENDPOINT não foi configurada.',
        },
        { status: 500 },
      );
    }

    const endpointNfse = new URL(endpointConfigurado);
    if (endpointNfse.protocol !== 'https:') {
      return NextResponse.json(
        { success: false, error: 'NFSE_SEFIN_ENDPOINT deve usar HTTPS.' },
        { status: 500 },
      );
    }

    const dataEmissao = new Date().toISOString().slice(0, 19);
    const dpsXml = gerarXmlDps({
      serie,
      numero,
      dataEmissao,
      prestadorCnpj,
      tomadorCnpjCpf,
      tomadorNome,
      valorServico,
      discriminacao,
      codigoMunicipioPrestacao,
    });

    const certBuffer = Buffer.from(certBufferBase64, 'base64');
    if (certBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'O certificado A1 informado é inválido.' },
        { status: 400 },
      );
    }

    const dpsAssinadoXml = assinarDps(dpsXml, certBuffer, certPassword);
    const dpsBase64 = Buffer.from(dpsAssinadoXml, 'utf8').toString('base64');
    const soapEnvelope = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <EnviaLoteDpsEnvio xmlns="http://www.sped.fazenda.gov.br/nfse">
      <dps>${dpsBase64}</dps>
    </EnviaLoteDpsEnvio>
  </soap:Body>
</soap:Envelope>`;

    const resposta = await transmitirComMtls(
      endpointNfse,
      soapEnvelope,
      certBuffer,
      certPassword,
    );

    if (resposta.statusCode < 200 || resposta.statusCode >= 300) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro na comunicação com a Sefin Nacional.',
          detalhes: resposta.body,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'DPS transmitido com sucesso!',
      retornoSefin: resposta.body,
    });
  } catch (error: unknown) {
    const mensagem =
      error instanceof Error ? error.message : 'Erro desconhecido ao emitir a NFS-e.';

    return NextResponse.json(
      { success: false, error: mensagem },
      { status: 500 },
    );
  }
}
