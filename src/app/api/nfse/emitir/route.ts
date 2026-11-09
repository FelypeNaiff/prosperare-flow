import { NextResponse } from 'next/server';
import { gerarXmlDps } from '@/services/nfse/dps-builder.service';
import { assinarDps } from '@/services/nfse/nfe-nacional.service';
import * as https from 'https';

export async function POST(request: Request) {
  try {
    const body = await request.json();
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

    // 1. Data atual no formato exigido AAAA-MM-DDTHH:MM:SS
    const dataEmissao = new Date().toISOString().slice(0, 19);

    // 2. Gerar XML do DPS
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

    // 3. Converter o Buffer do Certificado A1 recebido em Base64
    const certBuffer = Buffer.from(certBufferBase64, 'base64');

    // 4. Assinar digitalmente o XML do DPS
    const dpsAssinadoXml = assinarDps(dpsXml, certBuffer, certPassword);

    // 5. Configurar agente HTTPS com mTLS (Mutual TLS usando o Certificado A1)
    const httpsAgent = new https.Agent({
      pfx: certBuffer,
      passphrase: certPassword,
      rejectUnauthorized: true,
    });

    // Endpoint oficial do Ambiente Nacional (Exemplo de Produção / Homologação da Sefin Nacional)
    // Nota: Os endpoints específicos variam conforme o layout de recepção de lotes da Sefin
    const endpointNfse =
      'https://nfe.receita.economia.gov.br/ws/sefin/recepcao'; // Ajustar conforme manual atualizado

    // 6. Transmissão via fetch com mTLS
    const response = await fetch(endpointNfse, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        SOAPAction: 'http://www.sped.fazenda.gov.br/nfse/RecepcaoLotes',
      },
      body: `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <EnviaLoteDpsEnvio xmlns="http://www.sped.fazenda.gov.br/nfse">
            <dps>${Buffer.from(dpsAssinadoXml).toString('base64')}</dps>
          </EnviaLoteDpsEnvio>
        </soap:Body>
      </soap:Envelope>`,
      // @ts-ignore - agent é suportado no Node.js fetch do Next.js
      agent: httpsAgent,
    });

    const respostaTexto = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro na comunicação com a Sefin Nacional',
          detalhes: respostaTexto,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'DPS transmitido com sucesso!',
      retornoSefin: respostaTexto,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
