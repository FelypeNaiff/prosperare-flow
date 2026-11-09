const fs = require('fs');
const path = require('path');

async function fetchCnpj(cnpj) {
  const clean = String(cnpj).replace(/\D/g, '');
  const url = `https://brasilapi.com.br/api/cnpj/v1/${clean}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar BrasilAPI: ${res.status} ${res.statusText}`);
  return res.json();
}

function buildPayload(apiData) {
  const cleanCnpj = apiData.cnpj || '';
  const payload = {
    corporateName: (apiData.razao_social || '').replace(/\n/g, ' ').trim(),
    nomeFantasia: (apiData.nome_fantasia || '').replace(/\n/g, ' ').trim(),
    cnpj: cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'),
    taxRegime: apiData.opcao_pelo_simples ? 'Simples Nacional' : (apiData.regime_tributario && apiData.regime_tributario.length ? apiData.regime_tributario.join(', ') : 'Não informado'),
    companyStatus: (apiData.descricao_situacao_cadastral || apiData.descricao_situacao || apiData.situacao || '').toUpperCase(),
    status: 'ATIVO',
    email: apiData.email || '',
    phone: (apiData.ddd_telefone_1 || '') + (apiData.ddd_telefone_2 || ''),
    city: apiData.municipio || apiData.municipio || apiData.nome_cidade || apiData.nome_municipio || apiData.municipio || '',
    state: apiData.uf || '',
    zipCode: apiData.cep || '',
    address: [apiData.descricao_tipo_de_logradouro, apiData.descricao_tipo_de_logradouro ? apiData.logradouro : apiData.logradouro].filter(Boolean).join(' ').trim() || '',
    neighborhood: apiData.bairro || '',
    openingDate: apiData.data_inicio_atividade || apiData.data_inicio || '',
    primaryCnae: apiData.cnae_fiscal_descricao || apiData.cnae_fiscal || '',
    companyStatusReason: apiData.descricao_motivo_situacao_cadastral || apiData.motivo_situacao_cadastral || '',
    source: 'brasilapi',
    fetchedAt: new Date().toISOString()
  };
  return payload;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Uso: node generate-restore-payload.js <CNPJ>');
    process.exit(2);
  }
  try {
    const apiData = await fetchCnpj(arg);
    const payload = buildPayload(apiData);
    const clean = String(arg).replace(/\D/g, '');
    const outPath = path.join(__dirname, `restore-${clean}.json`);
    fs.writeFileSync(outPath, JSON.stringify({ apiData, payload }, null, 2), 'utf8');
    console.log('Payload gerado em', outPath);
    console.log('Abra o arquivo e revise os campos. Se quiser, use o script `restore-client-admin.js` para aplicar a alteração (requer firebase-admin e serviceAccountKey).');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
