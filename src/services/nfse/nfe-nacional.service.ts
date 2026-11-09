import { SignedXml } from 'xml-crypto';

export interface EmitirNfseParams {
  certBuffer: Buffer;
  certPassword: string;
  dpsXml: string;
}

const XMLDSIG = {
  canonicalization: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
  enveloped: 'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
  rsaSha256: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
  sha256: 'http://www.w3.org/2001/04/xmlenc#sha256',
} as const;

function obterInfDpsId(dpsXml: string): string {
  const match = dpsXml.match(/<(?:(?:\w+):)?infDPS\b[^>]*\bId=["']([^"']+)["']/);
  const id = match?.[1];

  if (!id) {
    throw new Error('O XML do DPS não contém o atributo Id em infDPS.');
  }

  if (!/^ID[A-Za-z0-9_.:-]+$/.test(id)) {
    throw new Error('O atributo Id de infDPS não segue o formato seguro esperado.');
  }

  return id;
}

/**
 * Assina um DPS quando a chave privada e o certificado já foram extraídos do
 * PKCS#12 por uma implementação de servidor validada.
 *
 * Esta função não valida o DPS contra o XSD oficial. O XML assinado só pode ser
 * transmitido depois da homologação do leiaute, certificado e algoritmos.
 */
export function assinarDpsComPem(
  dpsXml: string,
  privateKeyPem: string,
  publicCertPem: string,
): string {
  const infDpsId = obterInfDpsId(dpsXml);
  const signedXml = new SignedXml({
    privateKey: privateKeyPem,
    publicCert: publicCertPem,
    signatureAlgorithm: XMLDSIG.rsaSha256,
    canonicalizationAlgorithm: XMLDSIG.canonicalization,
  });

  signedXml.addReference({
    xpath: `//*[local-name(.)='infDPS' and @Id='${infDpsId}']`,
    uri: `#${infDpsId}`,
    transforms: [XMLDSIG.enveloped, XMLDSIG.canonicalization],
    digestAlgorithm: XMLDSIG.sha256,
  });

  signedXml.computeSignature(dpsXml, {
    prefix: 'ds',
    location: {
      reference: "//*[local-name(.)='DPS']",
      action: 'append',
    },
  });

  return signedXml.getSignedXml();
}

/**
 * Entrada reservada para certificados A1 em PKCS#12/PFX.
 *
 * O Node.js não extrai chaves PKCS#12 com crypto.createPrivateKey. A emissão
 * permanece bloqueada até que um extrator PKCS#12 mantido e testes com um
 * certificado de homologação sejam adicionados exclusivamente ao backend.
 */
export function assinarDps(
  dpsXml: string,
  certBuffer: Buffer,
  password: string,
): never {
  void dpsXml;
  void certBuffer;
  void password;

  throw new Error(
    'Assinatura de DPS com certificado PFX desabilitada até a homologação da integração PKCS#12.',
  );
}
