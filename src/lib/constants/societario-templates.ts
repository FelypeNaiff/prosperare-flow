/**
 * Tipos e Templates para Documentos Societários (DREI)
 * Permite a geração dinâmica de cláusulas contratuais.
 */

export interface Socio {
  nome: string;
  nacionalidade: string;
  estadoCivil: string;
  dataNascimento: string;
  profissao: string;
  rg: string;
  orgaoEmissor: string;
  cpf: string;
  enderecoCompleto: string;
}

export interface Atividade {
  codigo: string;
  descricao: string;
}

export interface QuotaDistribuicao {
  nome: string;
  quotas: number | string;
  valor: string;
}

export interface Empresa {
  razaoSocialAntiga?: string;
  novaRazaoSocial: string;
  novoNomeFantasia?: string;
  enderecoSede: string;
  cnpj?: string;
  capitalAntigo?: string;
  capitalAntigoExtenso?: string;
  novoCapital?: string;
  novoCapitalExtenso?: string;
  distribuicaoQuotas?: QuotaDistribuicao[];
  dataInicioAtividades?: string;
  tipoJuridico?: string;
  foroCidade?: string;
  cidadeData?: string;
  dataAssinatura?: string;
}

export interface CessaoQuotasDados {
  valorCotas: string;
  valorCotasExtenso: string;
  totalCotasCedidas: string;
  totalCotasCedidasExtenso: string;
  numeroCotasCedidas: string;
  numeroCotasCedidasExtenso: string;
  valorNominalQuota: string;
  valorNominalQuotaExtenso: string;
}

/**
 * Auxiliar para formatar a qualificação padrão de um sócio
 */
export const formatSocioQualificacao = (socio: Socio): string => {
  return `${socio.nome}, ${socio.nacionalidade}, ${socio.estadoCivil}, nascida em ${socio.dataNascimento}, ${socio.profissao}, RG nº: ${socio.rg} ${socio.orgaoEmissor}, CPF: ${socio.cpf}, residente e domiciliado ${socio.enderecoCompleto}`;
};

/**
 * 1. MODELO DE CLAUSULA DE QUALIFICAÇÃO
 */
export const getQualificacaoSocios = (socios: Socio | Socio[], empresa: Empresa): string => {
  const sociosArr = Array.isArray(socios) ? socios : [socios];
  const qualificacaoText = sociosArr.map(formatSocioQualificacao).join(" e ");
  const qualidade = sociosArr.length === 1 ? "titular" : "sócios";
  
  return `${qualificacaoText}, na qualidade de ${qualidade} da empresa, ${empresa.razaoSocialAntiga || ""} com sede na ${empresa.enderecoSede}, resolve:`;
};

/**
 * 2. MODELO DE CLAUSULA DE TRANSFORMAR, MUDANÇA O NOME EMPRESARIAL E FANTASIA
 */
export const getAlteracaoNomeSede = (empresa: Empresa): string => {
  return `Cláusula Primeira - Transformar o tipo jurídico para Sociedade Empresária Limitada, adotando o nome empresarial ${empresa.novaRazaoSocial}, nome fantasia ${empresa.novoNomeFantasia || ""} e terá sua sede e domicílio no ${empresa.enderecoSede}.`;
};

/**
 * 3. MODELO DE CLAUSULA DE ALTERAÇÃO DE ATIVIDADES E OBJETO SOCIAL
 */
export const getAlteracaoAtividades = (atividades: Atividade[]): string => {
  const listText = atividades.map(a => `${a.codigo} – ${a.descricao}`).join("\n");
  const commaText = atividades.map(a => a.descricao.toUpperCase()).join(", ");
  
  return `Cláusula Segunda – A sociedade terá por objeto o exercício das seguintes atividades econômicas:
${listText}
Parágrafo único. Em estabelecimento eleito como Sede (Matriz) será(ão) exercida(s) a(s) atividade(s) de ${commaText}.`;
};

/**
 * 4. MODELO DE CLAUSULA DE ALTERAÇÃO DE CAPITAL SOCIAL
 */
export const getAlteracaoCapitalSocial = (empresa: {
  capitalAntigo: string;
  capitalAntigoExtenso: string;
  novoCapital: string;
  novoCapitalExtenso: string;
  distribuicaoQuotas: QuotaDistribuicao[];
}): string => {
  const rows = empresa.distribuicaoQuotas
    .map(q => ` ${q.nome}\t${q.quotas}\t${q.valor}`)
    .join("\n");
    
  return `Cláusula Terceira – Capital Social da empresa está atualmente no valor de ${empresa.capitalAntigo} (${empresa.capitalAntigoExtenso}). O acervo do empresário ora transformado passa a ser no valor de ${empresa.novoCapital} (${empresa.novoCapitalExtenso}), passa a constituir o capital da nova sociedade, e fica assim distribuído:

Sócio\tNº de Quotas\tValor
${rows}`;
};

/**
 * 5. MODELO DE CONSOLIDAÇÃO CONTRATO/ESTATUTO
 */
export const getContratoSocialConsolidado = (
  socios: Socio | Socio[],
  empresa: Empresa,
  atividades: Atividade[]
): string => {
  const sociosArr = Array.isArray(socios) ? socios : [socios];
  const listSociosText = sociosArr.map(formatSocioQualificacao).join(" e ");
  
  const tipoSocio = sociosArr.length === 1 ? "sócio único" : "sócios";
  const administradorCargo = sociosArr.length === 1 ? "sócio administrador" : "sócios administradores";
  const administradorCargoArt = sociosArr.length === 1 ? "sócio único" : "sócios";

  // Prepara a administração (Cláusula Sexta)
  const administradorNome = sociosArr.map(s => s.nome).join(" e ");
  const administradorPronome = sociosArr.length === 1 ? "Pela sócia" : "Pelos sócios";
  
  // Prepara as assinaturas no fim do documento
  const assinaturas = sociosArr.map(s => 
    `_______________________________\n${s.nome}\nCPF: ${s.cpf}\nSócio-Administrador`
  ).join("\n\n");

  const listAtividades = atividades.map(a => `${a.codigo} – ${a.descricao}`).join("\n");
  const commaAtividades = atividades.map(a => a.descricao.toUpperCase()).join(", ");

  const computedQuotas = empresa.novoCapital
    ? empresa.novoCapital.split(",")[0].replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : "";

  return `ATO CONSTITUTIVO DA SOCIEDADE EMPRESARIA LIMITADA ${empresa.novaRazaoSocial.toUpperCase()}
${listSociosText}, na qualidade de ${administradorCargo} da empresa ${empresa.novaRazaoSocial.toUpperCase()}, inscrito no CNPJ sob o ${empresa.cnpj || ""} com sede na ${empresa.enderecoSede}. Passa a constituir o tipo jurídico Sociedade Empresária Limitada, a qual se regerá, doravante, pelo presente CONTRATO SOCIAL, mediante as condições e cláusulas seguintes:

DO NOME EMPRESARIAL (ART. 997, II, DO CC) 
Cláusula Primeira - A sociedade adotará o seguinte nome empresarial ${empresa.novaRazaoSocial} e nome fantasia ${empresa.novoNomeFantasia || ""}. 

DA SEDE (ART. 997, II, DO CC)
Cláusula Segunda - A sociedade terá sua sede no seguinte endereço ${empresa.enderecoSede}

DAS ATIVIDADES E DO OBJETO SOCIAL (ART. 997, II, DO CC)
Cláusula Terceira - A sociedade terá por objeto o exercício das seguintes atividades econômicas:
${listAtividades}
Parágrafo único. Em estabelecimento eleito como Sede (Matriz) será(ão) exercida(s) a(s) atividade(s) de ${commaAtividades}. 

DO INÍCIO DAS ATIVIDADES E DO PRAZO (ART. 53, III, F, DO DECRETO Nº 1.800, DE 1996)
Cláusula Quarta - A sociedade iniciou suas atividades a partir de ${empresa.dataInicioAtividades || ""} e seu prazo de duração é indeterminado.

DO CAPITAL SOCIAL (ART. 997, III E IV E ARTS. 1.052 E 1.055 DO CC)
Cláusula Quinta - O capital social é de ${empresa.novoCapital || ""} (${empresa.novoCapitalExtenso || ""}), dividido em ${computedQuotas} quota(s), no valor nominal de R$1,00 (um real) cada uma.
Parágrafo único. O capital encontra-se subscrito e integralizado pelo ${tipoSocio}, em moeda corrente do País.

DA ADMINISTRAÇÃO (ARTS. 997, VI; 1.013; 1.015; 1.064 DO CC)
Cláusula Sexta – A administração da sociedade será exercida:
${administradorPronome}, ${administradorNome} que representará legalmente a sociedade e poderá praticar todos os atospertinentes à gestão da sociedade, em nome da pessoa jurídica, dentre ele(s):
a)\tabrir, movimentar e encerrar contas correntes e/ou contas de pagamento, inclusive por meio de cartão decrédito e/ou débito;
b)\trealizar transferências ou cobranças via DOC, TED, Pix e/ou qualquer outro meio;
c)\tcontratar ou renegociar empréstimos e/ou financiamentos;
d)\trealizar ou resgatar aplicações financeiras e/ou investimentos;
e)\tcontratar ou cancelar seguros;
f)\toutorgar procurações que contenham os poderes previstos acima;
g)\tprestar garantias;
h)\tsolicitar a aquisição de novos produtos financeiros;
i)\ttodo e qualquer ato de gestão pertinente ao objeto social não expressamente previsto nas alíneasanteriores.

Parágrafo Único. Não constituindo o objeto social, a alienação ou a oneração de bens imóveis depende de autorização da maioria.

DO BALANÇO PATRIMONIAL (ART. 1.065 DO CC)
Cláusula Sétima – Ao término de cada exercício, em 31 de dezembro, o administrador prestará contas justificadas de sua administração, procedendo à elaboração do inventário, do balanço patrimonial e dobalanço de resultado econômico, cabendo ao(s) sócio(s), os lucros ou perdas apuradas na proporção de suas quotas (se for o caso).

DECLARAÇÃO DE MICROEMPRESA
Cláusula Oitava – Declara para efeitos de enquadramento como MICROEMPRESA que o movimento da receita bruta anual da empresa não excederá o limite fixado no inciso I do artigo 3° da Lei Complementar 123 de 14 de dezembro de 2006, eq ue não se enquadra em qualquer das hipóteses de exclusão relacionadas no §4° do artigo 3° da mencionada lei.

DA DECLARAÇÃO DE DESIMPEDIMENTO DE ADMINISTRADOR (ART. 1.011, § 1º, DO CC EART. 37, II, DA LEI Nº 8.934, DE 1994)
Cláusula Nona - O administrador da empresa declara, sob as penas da lei, de que não está impedido deexercer a administração da empresa, por lei especial, ou em virtude de condenação criminal, ou por se encontrar sob os efeitos dela, a pena que vede, ainda que temporariamente, o acesso a cargos públicos; ou por crime falimentar, de prevaricação, peita ou suborno, concussão, peculato, ou contra a economia popular, contra o sistema financeiro nacional, contra normas de defesa da concorrência, contra as relações de consumo, fé pública, ou a propriedade.

Cláusula Décima - A(s) parte(s) elege(m) o foro ${empresa.foroCidade || "Macapá - AP"} para dirimir quaisquer dúvidas decorrentes do presente instrumento contratual, bem como para o exercício e cumprimento dos direitos e obrigações resultantes deste contrato, renunciando a qualquer outro, por mais privilegiado que possa ser.

E, por estar assim constituída, assina(m) o presente instrumento particular, em via única.

${empresa.cidadeData || "Macapá-AP"}, ${empresa.dataAssinatura || ""}.


${assinaturas}`;
};

/**
 * 6. MODELO DE CLAUSULA DE ALTERAÇÃO DE ENDEREÇO
 */
export const getAlteracaoEndereco = (empresa: { enderecoSede: string }): string => {
  return `Cláusula Primeira - Alterar o endereço da sociedade, que passa a localizar-se na(o) ${empresa.enderecoSede}.`;
};

/**
 * 7. MODELO DE CLAUSULA DE ALTERAÇÃO DE NOME FANTASIA
 */
export const getAlteracaoNomeFantasia = (empresa: { novoNomeFantasia: string }): string => {
  return `Cláusula Primeira – A sociedade terá seu nome fantasia: ${empresa.novoNomeFantasia}`;
};

/**
 * 8. MODELO DE CLAUSULA DE ALTERAÇÃO DE NOME EMPRESARIAL
 */
export const getAlteracaoNomeEmpresarial = (empresa: { novaRazaoSocial: string }): string => {
  return `Cláusula Primeira - A sociedade adotará o seguinte nome empresarial: ${empresa.novaRazaoSocial}`;
};

/**
 * 9. MODELO DE CLAUSULA DE TRANSFERENCIA DE TITULARIDADE
 */
export const getTransferenciaTitularidade = (
  socioCedente: Socio,
  socioCessionario: Socio,
  empresa: {
    novaRazaoSocial: string;
    enderecoSede: string;
    nire: string;
    cnpj: string;
    valorCessao: string;
    valorCessaoExtenso: string;
  }
): string => {
  return `Cláusula Primeira – TRANSFERÊNCIA DE TITULARIDADE
${socioCedente.nome}, transfere a titularidade desta Sociedade Empresaria Limitada ${empresa.novaRazaoSocial} para ${socioCessionario.nome}, nacionalidade ${socioCessionario.nacionalidade}, ${socioCessionario.profissao}, ${socioCessionario.estadoCivil}, CPF: ${socioCessionario.cpf}, documento de identidade ${socioCessionario.rg}, ${socioCessionario.orgaoEmissor}, com domicílio/residência à ${socioCessionario.enderecoCompleto},  que passará a ser o sócio da ${empresa.novaRazaoSocial} com sede e domicílio na ${empresa.enderecoSede}, registrada nesta Junta Comercial do Estado do Amapá - JUCAP sob NIRE: ${empresa.nire}, CNPJ ${empresa.cnpj}, com sub-rogação de todos os direitos e obrigações pertinentes.
Cláusula Segunda - A administração da empresa caberá ao único sócio administrador ${socioCessionario.nome}, com os poderes e atribuições de representação ativa e passiva, judicial e extrajudicial, podendo praticar todos os atos compreendidos no objeto.
Cláusula Terceira - ${socioCedente.nome}, declara haver recebido, neste ato, em moeda corrente, a quantia de ${empresa.valorCessao} (${empresa.valorCessaoExtenso}), assim como declara ter recebido todos os seus direitos e haveres, nada mais tendo sobre elas a reclamar, seja a qual título for, nem do cessionário e nem da empresa individual de responsabilidade limitada, dando-lhes plena, geral, rasa e irrevogável quitação.
Cláusula Quarta - ${socioCessionario.nome}, único Sócio Administrador da empresa declara, sob as penas da lei, de que não está impedido de exercer a administração da empresa, por lei especial, ou em virtude de condenação criminal, ou por se encontrar sob os efeitos dela, a pena que vede, ainda que temporariamente, o acesso a cargos públicos; ou por crime falimentar, de prevaricação, peita ou suborno, concussão, peculato, ou contra a economia popular, contra o sistema financeiro nacional, contra normas de defesa da concorrência, contra as relações de consumo, fé pública, ou a propriedade.`;
};

/**
 * 10. MODELO DE CESSÃO DE QUOTAS E TRANSFERENCIA DE TITULARIDADE
 */
export const getCessaoQuotas = (
  socioCedente: { nome: string },
  socioCessionario: { nome: string },
  dados: CessaoQuotasDados
): string => {
  return `Cláusula Primeira – DA SAÍDA DE SÓCIO
O sócio ${socioCedente.nome} resolve ceder e transferir a totalidade de suas cotas do capital social ${dados.valorCotas} (${dados.valorCotasExtenso}) à ${socioCessionario.nome}

Com essa transferência, ${socioCedente.nome} se retira da sociedade. As cotas cedidas totalizam ${dados.totalCotasCedidas} (${dados.totalCotasCedidasExtenso}), dividido em ${dados.numeroCotasCedidas} (${dados.numeroCotasCedidasExtenso}) unidades, cada uma no valor de ${dados.valorNominalQuota} (${dados.valorNominalQuotaExtenso}). A sócia, ${socioCessionario.nome}, passará a integrar a sociedade na qualidade de titular dessas cotas.`;
};

/**
 * 11. MODELOS DE TITULOS DE CONTRATO
 */
export const getTitulosContrato = (empresa: { novaRazaoSocial: string; razaoSocialAntiga?: string }) => {
  const nomeSemLtda = empresa.novaRazaoSocial.replace(/\s+LTDA$/i, "");
  return {
    transformacaoMeiParaLtda: `TRANSFORMAÇÃO DE MICRO EMPREENDEDOR INDIVIDUAL (MEI) EM SOCIEDADE EMPRESÁRIA LIMITADA`,
    transformacaoEiParaLtda: `TRANSFORMAÇÃO DE EMPREENDEDOR INDIVIDUAL EM SOCIEDADE EMPRESÁRIA LIMITADA`,
    alteracaoConsolidacaoLtda: `INSTRUMENTO PARTICULAR DE ALTERAÇÃO E CONSOLIDAÇÃO CONTRATUAL DA SOCIEDADE EMPRESARIAL LIMITADA ${empresa.novaRazaoSocial}`,
    alteracaoEi: `ALTERAÇÃO DO INSTRUMENTO DE INSCRIÇÃO ${empresa.razaoSocialAntiga || nomeSemLtda}`
  };
};
