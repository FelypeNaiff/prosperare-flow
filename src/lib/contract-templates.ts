/**
 * Modelos de Contrato de Prestação de Serviços Contábeis por REGIME DE TRIBUTAÇÃO.
 * Estrutura única consumida pela pré-visualização (React) e pela geração DOCX (API).
 *
 * Para cadastrar o modelo de outro regime, implemente a função correspondente
 * em CONTRACT_TEMPLATES (retornando a lista de blocos).
 */

export type TaxRegime = "Simples Nacional" | "Lucro Presumido" | "Lucro Real"

export const TAX_REGIMES: { id: TaxRegime; label: string; description: string }[] = [
  { id: "Simples Nacional", label: "SIMPLES NACIONAL", description: "DAS / PGDAS-D" },
  { id: "Lucro Presumido", label: "LUCRO PRESUMIDO", description: "IRPJ/CSLL presumidos" },
  { id: "Lucro Real", label: "LUCRO REAL", description: "Apuração pelo lucro contábil" },
]

/** Segmento de texto: b = negrito, hl = campo variável (destaque amarelo) */
export interface Seg { t: string; b?: boolean; hl?: boolean }

export type Block =
  | { kind: "title"; text: string }
  | { kind: "subtitle"; text: string }
  | { kind: "box"; lines: Seg[][] }
  | { kind: "heading"; text: string }
  | { kind: "para"; segs: Seg[] }
  | { kind: "item"; segs: Seg[] } // alínea recuada
  | { kind: "date"; segs: Seg[] }
  | { kind: "signatures"; left: string[]; right: string[] }
  | { kind: "witnesses" }

export interface ContractData {
  clientName: string
  clientCnpj: string
  clientAddress: string
  clientEmail: string
  socioNome: string
  socioCpf: string
  socioCargo: string
  employeeCount: number
  valueFormatted: string // "R$ 300,00 (trezentos reais)"
  dueDay: number
  dueDayExtenso: string
  city: string
  dateExtenso: string
}

export const CONTRATADA_TEXT =
  "PROSPERARE SERVIÇOS CONTÁBEIS LTDA, inscrita no CNPJ/MF sob o nº 23.077.213/0001-17, CRC nº AP-000149/O, com sede na Avenida Acelino de Leão, 1046, Letra B, Trem, Macapá/AP, representada na forma de seu contrato social por seu sócio administrador FELYPE MACIEL NAIFF, inscrito no CPF sob o nº 917.722.812-04."

const UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove", "vinte", "vinte e um", "vinte e dois", "vinte e três", "vinte e quatro", "vinte e cinco", "vinte e seis", "vinte e sete", "vinte e oito", "vinte e nove", "trinta", "trinta e um"]
export const dayExtenso = (n: number) => UNIDADES[n] || String(n)

const p = (...segs: Seg[]): Block => ({ kind: "para", segs })
const s = (t: string, opts: Partial<Seg> = {}): Seg => ({ t, ...opts })
const b = (t: string): Seg => ({ t, b: true })
const hl = (t: string): Seg => ({ t, b: true, hl: true })

function simplesNacional(d: ContractData): Block[] {
  const func = d.employeeCount.toString().padStart(2, "0")
  return [
    { kind: "title", text: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS" },
    { kind: "subtitle", text: "INSTRUMENTO PARTICULAR COM FORÇA DE TÍTULO EXECUTIVO EXTRAJUDICIAL (ART. 784, III, DO CPC)" },
    {
      kind: "box",
      lines: [
        [b("CONTRATADA: "), s(CONTRATADA_TEXT)],
        [b("CONTRATANTE: "), hl(d.clientName), s(", inscrita no CNPJ sob o nº "), hl(d.clientCnpj), s(", com sede na "), hl(d.clientAddress), s(", representada por seu(sua) sócio(a) administrador(a) "), hl(d.socioNome), s(", inscrito(a) no CPF sob o nº "), hl(d.socioCpf), s(".")],
      ],
    },
    p(s("As partes acima qualificadas têm, entre si, justo e acordado o presente Contrato de Prestação de Serviços Contábeis, que se regerá pelas normas do Código Civil Brasileiro, normas e resoluções do Conselho Federal de Contabilidade (CFC) e pelas cláusulas e condições seguintes:")),

    { kind: "heading", text: "CLÁUSULA PRIMEIRA – DO OBJETO" },
    p(s("O presente contrato tem por objeto a prestação de serviços profissionais de assessoria Fiscal e de Departamento Pessoal pela CONTRATADA em favor da CONTRATANTE, pessoa jurídica enquadrada no regime tributário do Simples Nacional, em estrita observância aos limites e condições pactuados neste instrumento.")),

    { kind: "heading", text: "CLÁUSULA SEGUNDA – DOS SERVIÇOS INCLUSOS NO PACOTE MENSAL" },
    p(b("2.1. Área Fiscal: "), s("Apuração mensal dos tributos devidos no regime do Simples Nacional (DAS/PGDAS-D), monitoramento das regras tributárias aplicáveis e cumprimento tempestivo das obrigações acessórias fiscais de rotina (DEFIS, EFD-Reinf e acompanhamento das diretrizes de transição IBS/CBS).")),
    p(b("2.2. Departamento Pessoal (para até "), hl(func), b(" funcionário/sócio): "), s("Processamento mensal de folha de pagamento, pró-labore, cálculo de férias e rescisões, transmissão mensal dos eventos no eSocial e DCTFWeb, bem como emissão das respectivas guias de recolhimento previdenciário e trabalhista (FGTS Digital e INSS/DARF Previdenciário).")),
    p(b("Parágrafo Único: "), s("A inclusão de funcionários ou sócios excedentes ao limite estipulado no item 2.2 ensejará acréscimo automático de R$ 50,00 (cinquenta reais) por colaborador/mês sobre a fatura de honorários.")),

    { kind: "heading", text: "CLÁUSULA TERCEIRA – DOS SERVIÇOS EXCLUÍDOS E ROTINAS AVULSAS" },
    p(b("3.1. Escrituração Contábil Propriamente Dita: "), s("A escrituração contábil formal (elaboração de Balanço Patrimonial, Demonstração do Resultado do Exercício - DRE, Livro Diário, Livro Razão e Sped Contábil/ECD) NÃO integra a parcela fixa mensal ora contratada.")),
    p(b("3.2. Demonstrações Contábeis Sob Demanda: "), s("Caso a CONTRATANTE solicite a elaboração de Balanço Patrimonial, DRE ou demonstrações contábeis com finalidade de suporte a licitações, obtenção de crédito bancário ou encerramento formal de exercício, os serviços serão previamente orçados e cobrados de forma avulsa mediante termo aditivo ou proposta de honorários específicos.")),
    p(b("3.3. Serviços Extraordinários: "), s("Quaisquer procedimentos extraordinários (alterações contratuais, parcelamentos de débitos fiscais pré-existentes, obtenção de certidões especializadas com saneamento presencial de débitos, auditorias e defesas fiscais) não estão inclusos e serão orçados e cobrados separadamente, mediante prévia autorização da CONTRATANTE.")),

    { kind: "heading", text: "CLÁUSULA QUARTA – DAS OBRIGAÇÕES, COMUNICAÇÃO E DISPONIBILIZAÇÃO DE GUIAS" },
    p(b("4.1. Envio de Documentação: "), s("A CONTRATANTE obriga-se a disponibilizar à CONTRATADA toda a documentação fiscal, financeira, bancária e trabalhista idônea, completa e sem rasuras até o dia 5 (cinco) do mês subsequente ao de competência das operações.")),
    p(b("4.2. Canais Oficiais de Comunicação: "), s("Fica estipulado que todo e qualquer comunicado, remessa de relatórios, declarações e disponibilização de guias de tributos (DAS, DARF, FGTS, etc.) dar-se-á exclusivamente por meio dos canais oficiais formalmente cadastrados:")),
    { kind: "item", segs: [b("a) E-mail cadastrado da CONTRATANTE: "), hl(d.clientEmail), s(";")] },
    { kind: "item", segs: [b("b) Portal/Plataforma do Cliente: "), s("Software de atendimento ou plataforma em nuvem oficial disponibilizada pela CONTRATADA.")] },
    p(b("4.3. Comprovante de Transmissão e Presunção de Ciência: "), s("O registro eletrônico de envio no sistema, protocolo digital ou recibo de transmissão de correio eletrônico com a respectiva guia anexa constituirá prova plena da tempestiva entrega da obrigação pela CONTRATADA. Presume-se ciente e aceito o teor do envio caso a CONTRATANTE não se manifeste no prazo de até 24 (vinte e quatro) horas úteis do seu envio.")),
    p(b("4.4. Antecedência de Envio de Guias: "), s("As guias para recolhimento de tributos e encargos de folha serão encaminhadas pela CONTRATADA com antecedência mínima de 24 (vinte e quatro) a 48 (quarenta e oito) horas úteis da data de vencimento oficial, desde que a CONTRATANTE tenha atendido ao prazo fixado na Cláusula 4.1.")),
    p(b("4.5. Isenção por Inércia ou Atraso do Cliente: "), s("O não envio dos documentos pelo cliente até o dia 5 de cada mês, ou a falta de adimplemento tempestivo da guia disponibilizada no canal oficial, isenta a CONTRATADA de qualquer responsabilidade civil, administrativa ou financeira por juros, multas de mora ou encargos adicionais, correndo estes por conta única e exclusiva da CONTRATANTE.")),
    p(b("4.6. Veracidade das Informações: "), s("A CONTRATANTE responde de maneira exclusiva nas esferas civil, administrativa e criminal pela idoneidade, veracidade e legitimidade dos documentos, notas fiscais, relatórios e extratos bancários fornecidos à contabilidade.")),

    { kind: "heading", text: "CLÁUSULA QUINTA – DOS HONORÁRIOS E DA INADIMPLÊNCIA" },
    p(b("5.1. Valor Mensal e Vencimento: "), s("Pelos serviços ordinários pactuados na Cláusula Segunda, a CONTRATANTE pagará à CONTRATADA o valor mensal líquido de "), hl(d.valueFormatted), s(", com vencimento estipulado para o dia "), hl(`${d.dueDay} (${d.dueDayExtenso})`), s(" do mês subsequente ao vencido.")),
    p(b("5.2. Décimo Terceiro Honorário: "), s("No mês de dezembro de cada ano, será devido à CONTRATADA o valor correspondente a 01 (um) honorário mensal complementar, a título de 13º honorário contábil, destinado a cobrir o encerramento da expressiva carga operacional anual, informes anuais e encerramentos de obrigações fiscais e trabalhistas do exercício fiscal.")),
    p(b("5.3. Penalidades Moratórias: "), s("O atraso no pagamento de quaisquer parcelas sujeitará o débito à incidência de multa moratória irrelegável de 2% (dois por cento), juros moratórios de 1% (um por cento) ao mês apurados pro rata die, bem como atualização monetária integral calculada pela variação positiva acumulada do IPCA/IBGE (ou índice oficial correlato).")),
    p(b("5.4. Suspensão de Serviços Sob Demanda (15 dias): "), s("Decorrido atraso superior a 15 (quinze) dias no pagamento, a CONTRATADA poderá suspender preventivamente a prestação de serviços adicionais, emissão de certidões negativas sob demanda, emissão de notas fiscais avulsas e elaboração de relatórios gerenciais, mantendo apenas o cumprimento das obrigações acessórias indispensáveis à responsabilidade técnica ativa.")),
    p(b("5.5. Protesto e Inclusão nos Órgãos Restritivos (30 dias): "), s("Verificado o atraso no pagamento de qualquer parcela por período superior a 30 (trinta) dias corridos, o presente contrato poderá ser levado a protesto extrajudicial perante os Cartórios de Protesto de Títulos competentes, bem como promovida a inserção dos dados da CONTRATANTE e de seus sócios perante os cadastros de proteção ao crédito (SPC, SERASA e entidades congêneres).")),
    p(b("5.6. Rescisão por Justa Causa e Execução (45 dias): "), s("O atraso superior a 45 (quarenta e cinco) dias configurará infração contratual grave, ensejando a faculdade de rescisão imediata e motivada (justa causa) por iniciativa da CONTRATADA, com o descredenciamento e baixa da responsabilidade técnica perante os órgãos de fiscalização tributária e o Conselho Regional de Contabilidade (CRC), procedendo-se à imediata cobrança e execução do montante total devedor, acrescido de custas de cobrança e honorários advocatícios fixados em 20% (vinte por cento).")),

    { kind: "heading", text: "CLÁUSULA SEXTA – DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)" },
    p(b("6.1. Conformidade com a Lei nº 13.709/2018: "), s("As partes declaram cumprir integralmente a Lei Geral de Proteção de Dados (LGPD). A CONTRATADA compromete-se a tratar os dados pessoais e corporativos recebidos exclusivamente para o regular cumprimento do objeto contratual e para atender obrigações decorrentes de disposições legais e regulatórias.")),
    p(b("6.2. Autorização de Transmissão Institucional: "), s("A CONTRATANTE expressamente autoriza o compartilhamento de dados fiscais, societários e trabalhistas com órgãos da administração pública direta e indireta (Receita Federal do Brasil, Secretarias de Estado da Fazenda, Secretarias Municipais de Finanças, eSocial, Ministério do Trabalho e Emprego, Caixa Econômica Federal e FGTS Digital) estritamente necessários à fiel execução das rotinas fiscais e previdenciárias.")),

    { kind: "heading", text: "CLÁUSULA SÉTIMA – DA RESCISÃO E TRANSIÇÃO DA RESPONSABILIDADE TÉCNICA" },
    p(b("7.1. Rescisão Imotivada: "), s("O presente contrato vigora por prazo indeterminado. Qualquer das partes poderá rescindi-lo imotivadamente mediante formalização de aviso prévio por escrito com antecedência mínima de 30 (trinta) dias, período no qual as rotinas operacionais serão mantidas e os honorários devidos quitados normalmente.")),
    p(b("7.2. Termo de Transferência de Responsabilidade Técnica: "), s("Formalizado o distrato, a CONTRATADA emitirá o Termo de Transferência de Responsabilidade Técnica nos termos das normas do Conselho Federal de Contabilidade (CFC), disponibilizando ao novo responsável técnico indicado todos os arquivos digitais de declarações e livros processados, mediante protocolo assinado.")),
    p(b("7.3. Desvinculação da Cobrança em Face da Transição Ética: "), s("A existência de pendências financeiras ou débitos não constituirá óbice à expedição do Termo de Transferência de Responsabilidade Técnica, restando assegurado à CONTRATADA o direito autônomo e imediato de promover a cobrança, protesto e execução judicial dos valores devidos.")),

    { kind: "heading", text: "CLÁUSULA OITAVA – DO TÍTULO EXECUTIVO EXTRAJUDICIAL" },
    p(s("As partes atribuem ao presente instrumento a natureza de TÍTULO EXECUTIVO EXTRAJUDICIAL, em estrita conformidade com o disposto no artigo 784, inciso III, do Código de Processo Civil (Lei Federal nº 13.105/2015), reconhecendo a CONTRATANTE a liquidez, certeza e incontestável exigibilidade de todas as obrigações pecuniárias decorrentes deste contrato.")),

    { kind: "heading", text: "CLÁUSULA NONA – DO FORO" },
    p(s("Fica expressamente eleito o Foro da Comarca de Macapá, Estado do Amapá, para dirimir quaisquer dúvidas, litígios ou controvérsias oriundos do presente contrato, com renúncia expressa a qualquer outro juízo, por mais privilegiado ou especial que seja.")),

    { kind: "date", segs: [s(`${d.city}, `), hl(d.dateExtenso), s(".")] },
    {
      kind: "signatures",
      left: ["PROSPERARE SERVIÇOS CONTÁBEIS LTDA", "FELYPE MACIEL NAIFF", "Sócio-Administrador"],
      right: [d.clientName, d.socioNome, d.socioCargo],
    },
    { kind: "witnesses" },
  ]
}

export const CONTRACT_TEMPLATES: Record<TaxRegime, ((d: ContractData) => Block[]) | null> = {
  "Simples Nacional": simplesNacional,
  "Lucro Presumido": null, // modelo a cadastrar
  "Lucro Real": null, // modelo a cadastrar
}

export function normalizeRegime(r?: string): TaxRegime {
  const u = (r || "").toUpperCase()
  if (u.includes("PRESUMIDO")) return "Lucro Presumido"
  if (u.includes("REAL")) return "Lucro Real"
  return "Simples Nacional"
}

export function buildContract(regime: string | undefined, d: ContractData): Block[] | null {
  const fn = CONTRACT_TEMPLATES[normalizeRegime(regime)]
  return fn ? fn(d) : null
}

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
export function formatDateExtenso(dateStr?: string) {
  const parts = (dateStr || "").split("-")
  if (parts.length !== 3) return "____ de ______________ de 2026"
  return `${parseInt(parts[2], 10).toString().padStart(2, "0")} de ${MONTHS[parseInt(parts[1], 10) - 1] || "janeiro"} de ${parts[0]}`
}

/** Monta ContractData a partir do contrato + cliente (Firestore) + sócio */
export function buildContractData(contrato: any, cliente: any, socio: any, valorExtenso: (n: number) => string): ContractData {
  const value = Number(contrato?.value || 0)
  const dueDay = Number(contrato?.dueDay || 10)
  const addr = [
    cliente?.address,
    cliente?.neighborhood,
    cliente?.city && cliente?.state ? `${cliente.city}/${cliente.state}` : "",
    cliente?.zipCode ? `CEP ${cliente.zipCode}` : "",
  ].filter(Boolean).join(", ")
  return {
    clientName: (cliente?.corporateName || contrato?.clientName || "EMPRESA").toUpperCase(),
    clientCnpj: cliente?.cnpj || contrato?.clientCnpj || "00.000.000/0000-00",
    clientAddress: addr || "[ENDEREÇO DO CLIENTE]",
    clientEmail: cliente?.email || cliente?.emailFinanceiro || "[E-MAIL OFICIAL DO CLIENTE]",
    socioNome: (socio?.nome || "SÓCIO ADMINISTRADOR").toUpperCase(),
    socioCpf: socio?.cpfCnpj || socio?.cpf || "000.000.000-00",
    socioCargo: socio?.qualificacao || socio?.cargoDirecao || socio?.condicaoSocio || "Sócio-Administrador",
    employeeCount: Number(contrato?.employeeCount ?? 0),
    valueFormatted: `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${valorExtenso(value)})`,
    dueDay,
    dueDayExtenso: dayExtenso(dueDay),
    city: "Macapá/AP",
    dateExtenso: formatDateExtenso(contrato?.startDate),
  }
}
