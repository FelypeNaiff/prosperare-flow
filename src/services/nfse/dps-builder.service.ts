export interface DadosDps {
  serie: string;
  numero: string;
  dataEmissao: string; // Formato AAAA-MM-DDTHH:MM:SS
  prestadorCnpj: string;
  tomadorCnpjCpf: string;
  tomadorNome: string;
  valorServico: number;
  discriminacao: string;
  codigoMunicipioPrestacao: string; // Ex.: "1600303" para Macapá/AP
}

function escaparXml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Constrói a string XML do DPS baseada no Padrão Nacional da NFS-e.
 */
export function gerarXmlDps(dados: DadosDps): string {
  const documentoTomador = dados.tomadorCnpjCpf.replace(/\D/g, '');
  const tomadorXml =
    documentoTomador.length === 14
      ? `<CNPJ>${documentoTomador}</CNPJ>`
      : `<CPF>${documentoTomador}</CPF>`;

  const idDps = escaparXml(`DPS${dados.serie}${dados.numero}`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
  <infDPS Id="${idDps}">
    <tpAmb>1</tpAmb>
    <dhEmi>${escaparXml(dados.dataEmissao)}</dhEmi>
    <prest>
      <CNPJ>${dados.prestadorCnpj.replace(/\D/g, '')}</CNPJ>
    </prest>
    <toma>
      ${tomadorXml}
      <xNome>${escaparXml(dados.tomadorNome)}</xNome>
    </toma>
    <serv>
      <valServicos>
        <vServ>${dados.valorServico.toFixed(2)}</vServ>
      </valServicos>
      <xLocPrestacao>${escaparXml(dados.codigoMunicipioPrestacao)}</xLocPrestacao>
      <xDescServ>${escaparXml(dados.discriminacao)}</xDescServ>
    </serv>
  </infDPS>
</DPS>`;
}
