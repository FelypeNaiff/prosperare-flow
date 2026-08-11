import { NextRequest, NextResponse } from "next/server";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  HeadingLevel, 
  BorderStyle
} from "docx";
import { numberToExtensoBRL } from "@/lib/utils";

const formatDateExtenso = (dateStr?: string) => {
  if (!dateStr) return "01 de janeiro de 2026";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;

  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];

  return `${day.toString().padStart(2, "0")} de ${months[monthIdx] || "janeiro"} de ${year}`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contrato, cliente, socio } = body;

    const corpName = (cliente?.corporateName || cliente?.razaoSocial || contrato?.clientName || "EMPRESA CLIENTE LTDA").toUpperCase();
    const cnpj = cliente?.cnpj || contrato?.clientCnpj || "00.000.000/0001-00";
    
    const companyAddrParts = [
      cliente?.address,
      cliente?.neighborhood ? `Bairro ${cliente.neighborhood}` : "",
      cliente?.city && cliente?.state ? `${cliente.city}/${cliente.state}` : "",
      cliente?.zipCode ? `CEP ${cliente.zipCode}` : ""
    ].filter(Boolean).join(", ");
    
    const addressStr = companyAddrParts || "Avenida Paraíba, 770, Pacoval, Macapá/AP";

    const socioNome = (socio?.nome || cliente?.qsa?.[0]?.nome || "SÓCIO ADMINISTRADOR").toUpperCase();
    const socioCpf = socio?.cpfCnpj || socio?.cpf || cliente?.qsa?.[0]?.cpfCnpj || "000.000.000-00";
    const socioCargo = socio?.cargoDirecao || socio?.condicaoSocio || "Sócio-Administrador";

    const employeeCount = Number(contrato?.employeeCount ?? 0);
    const employeeCountStr = employeeCount.toString().padStart(2, "0");

    const servicesList: string[] = Array.isArray(contrato?.services) && contrato.services.length > 0 
      ? contrato.services 
      : ["DEPARTAMENTO PESSOAL", "DEPARTAMENTO TRIBUTÁRIO"];

    const servicosObjetoStr = servicesList.map(s => {
      const upper = s.toUpperCase();
      if (upper.includes("PESSOAL")) return "Departamento Pessoal";
      if (upper.includes("TRIBUTÁRIO") || upper.includes("TRIBUTARIO")) return "Área Fiscal e Tributária";
      if (upper.includes("CONTÁBIL") || upper.includes("CONTABIL")) return "Escrituração Contábil";
      if (upper.includes("LEGALIZAÇÃO") || upper.includes("LEGALIZACAO")) return "Abertura e Legalização";
      return s;
    }).join(", ");

    const hasPessoal = servicesList.some(s => s.toUpperCase().includes("PESSOAL"));
    const hasTributario = servicesList.some(s => s.toUpperCase().includes("TRIBUTÁRIO") || s.toUpperCase().includes("TRIBUTARIO") || s.toUpperCase().includes("FISCAL"));
    const hasContabil = servicesList.some(s => s.toUpperCase().includes("CONTÁBIL") || s.toUpperCase().includes("CONTABIL"));
    const hasLegalizacao = servicesList.some(s => s.toUpperCase().includes("LEGALIZAÇÃO") || s.toUpperCase().includes("LEGALIZACAO") || s.toUpperCase().includes("ABERTURA"));

    const valorMensal = Number(contrato?.value || 0);
    const valorExtenso = numberToExtensoBRL(valorMensal);
    const valorMensalFormatted = `R$ ${valorMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${valorExtenso})`;

    const dueDay = contrato?.dueDay || 10;
    const startDateExtenso = formatDateExtenso(contrato?.startDate);

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                bottom: 1440,
                left: 1440,
                right: 1440
              }
            }
          },
          children: [
            // Header Title
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
              children: [
                new TextRun({
                  text: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS",
                  bold: true,
                  size: 26,
                  font: "Arial"
                })
              ]
            }),

            // CONTRATADA
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
              children: [
                new TextRun({ text: "CONTRATADA: ", bold: true, font: "Arial", size: 20 }),
                new TextRun({
                  text: "PROSPERARE SERVIÇOS CONTÁBEIS LTDA, inscrita no CNPJ/MF sob o nº 23.077.213/0001-17, CRC nº AP-000149/O, com sede na Avenida Acelino de Leão, 1046, Letra B, Trem, Macapá/AP, representada por seu sócio administrador FELYPE MACIEL NAIFF, CPF nº 917.722.812-04.",
                  font: "Arial",
                  size: 20
                })
              ]
            }),

            // CONTRATANTE
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
              children: [
                new TextRun({ text: "CONTRATANTE: ", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: `${corpName}`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                new TextRun({ text: ", inscrita no CNPJ sob o nº ", font: "Arial", size: 20 }),
                new TextRun({ text: `${cnpj}`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                new TextRun({ text: ", com sede na ", font: "Arial", size: 20 }),
                new TextRun({ text: `${addressStr}`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                new TextRun({ text: ", representada por sua sócia administradora ", font: "Arial", size: 20 }),
                new TextRun({ text: `${socioNome}`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                new TextRun({ text: ", CPF nº ", font: "Arial", size: 20 }),
                new TextRun({ text: `${socioCpf}`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                new TextRun({ text: ".", font: "Arial", size: 20 })
              ]
            }),

            // CLAUSULA PRIMEIRA
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({ text: "CLÁUSULA PRIMEIRA – DO OBJETO\n", bold: true, font: "Arial", size: 20 }),
                new TextRun({
                  text: `O presente contrato tem por objeto a prestação de serviços profissionais de assessoria de (${servicosObjetoStr}) para a CONTRATANTE, nos limites estabelecidos neste instrumento.`,
                  font: "Arial",
                  size: 20
                })
              ]
            }),

            // CLAUSULA SEGUNDA
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 150 },
              children: [
                new TextRun({ text: "CLÁUSULA SEGUNDA – DOS SERVIÇOS INCLUSOS NO PACOTE MENSAL\n", bold: true, font: "Arial", size: 20 }),
                
                ...(hasTributario ? [
                  new TextRun({ text: "2.1. Área Fiscal e Tributária:\n", bold: true, font: "Arial", size: 20 }),
                  new TextRun({ text: "1. Apuração mensal dos tributos (DAS/PGDAS-D) e monitoramento das regras operacionais vigentes.\n", font: "Arial", size: 20 }),
                  new TextRun({ text: "2. Cumprimento das obrigações acessórias fiscais de rotina (DEFIS, EFD-Reinf e acompanhamento do IBS/CBS).\n\n", font: "Arial", size: 20 })
                ] : []),
                
                ...(hasPessoal ? [
                  new TextRun({ text: "2.2. Departamento Pessoal (para ", bold: true, font: "Arial", size: 20 }),
                  new TextRun({ text: `${employeeCountStr}`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                  new TextRun({ text: " funcionário/sócio):\n", bold: true, font: "Arial", size: 20 }),
                  new TextRun({ text: "1. Processamento de folha de pagamento, pró-labore, férias e rescisões.\n", font: "Arial", size: 20 }),
                  new TextRun({ text: "2. Transmissão mensal das obrigações no eSocial, DCTFWeb e emissão das guias de FGTS Digital e INSS.\n\n", font: "Arial", size: 20 })
                ] : []),

                ...(hasContabil ? [
                  new TextRun({ text: "2.3. Área Contábil:\n", bold: true, font: "Arial", size: 20 }),
                  new TextRun({ text: "1. Escrituração contábil regular conforme as normas vigentes.\n\n", font: "Arial", size: 20 })
                ] : []),

                ...(hasLegalizacao ? [
                  new TextRun({ text: "2.4. Abertura e Legalização:\n", bold: true, font: "Arial", size: 20 }),
                  new TextRun({ text: "1. Assessoria e trâmites de alterações cadastrais e suporte de regularização junto aos órgãos públicos.\n\n", font: "Arial", size: 20 })
                ] : []),
                
                new TextRun({ text: "Parágrafo Único: ", italics: true, bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "A inclusão de funcionários excedentes gerará um acréscimo de R$ 50,00 (cinquenta reais) por funcionário/mês na fatura.", italics: true, font: "Arial", size: 20 })
              ]
            }),

            // CLAUSULA TERCEIRA
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({ text: "CLÁUSULA TERCEIRA – DOS SERVIÇOS EXCLUÍDOS E CONTABILIDADE AVULSA\n", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "3.1. A ESCRITURAÇÃO CONTÁBIL PROPRIAMENTE DITA ", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "(elaboração de Balanço Patrimonial, Demonstração do Resultado do Exercício - DRE, Livro Diário, Livro Razão e Sped Contábil/ECD) ", font: "Arial", size: 20 }),
                new TextRun({ text: "NÃO ESTÁ INCLUSA ", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "na parcela fixa mensal contratada.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "3.2. Caso a CONTRATANTE solicite a elaboração de Balanço Patrimonial ou demonstrações contábeis para fins bancários, licitações ou encerramento do exercício, os serviços serão orçados e cobrados à parte em contrato aditivo específico.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "3.3. Quaisquer serviços extraordinários (alterações contratuais, parcelamentos de débitos antigos, certidões específicas, regularizações de pendências fiscais anteriores) serão cobrados separadamente mediante aprovação prévia.", font: "Arial", size: 20 })
              ]
            }),

            // CLAUSULA QUARTA
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({ text: "CLÁUSULA QUARTA – DAS OBRIGAÇÕES E RESPONSABILIDADES DA CONTRATANTE\n", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "4.1. A CONTRATANTE obriga-se a fornecer toda a documentação fiscal, financeira e trabalhista idônea e completa ", font: "Arial", size: 20 }),
                new TextRun({ text: "até o dia 5 (cinco) do mês subsequente ", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "ao da prestação dos serviços.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "4.2. A não entrega dos documentos no prazo isenta a CONTRATADA de qualquer responsabilidade por multas, juros ou atrasos na entrega de obrigações acessórias, os quais serão de inteira responsabilidade da CONTRATANTE.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "4.3. A CONTRATANTE responde civil e criminalmente pela veracidade e autenticidade dos dados, extratos bancários e documentos fornecidos.", font: "Arial", size: 20 })
              ]
            }),

            // CLAUSULA QUINTA
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({ text: "CLÁUSULA QUINTA – DOS HONORÁRIOS E DA INADIMPLÊNCIA\n", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "5.1. Pelos serviços prestados da Cláusula Segunda, a CONTRATANTE pagará o valor mensal de ", font: "Arial", size: 20 }),
                new TextRun({ text: `${valorMensalFormatted}`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                new TextRun({ text: ", com vencimento todo dia ", font: "Arial", size: 20 }),
                new TextRun({ text: `${dueDay}`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                new TextRun({ text: " do mês subsequente.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "5.2. Do 13º Honorário: ", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "No mês de dezembro de cada ano, será devido o valor correspondente a 01 (um) honorário mensal adicional, referente ao encerramento da carga operacional anual e obrigações trabalhistas decorrentes do exercício.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "5.3. Inadimplência: ", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "O atraso no pagamento sujeitará o débito à multa moratória de 2%, acrescida de juros de 1% ao mês e atualização monetária.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "5.4. Suspensão dos Serviços por Atraso: ", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "O atraso no pagamento por período superior a 30 (trinta) dias ensejará a suspensão do envio de guias e declarações, ficando a CONTRATADA isenta de qualquer prejuízo fiscal ou trabalhista gerado por esta paralisação.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "5.5. Atraso Superior a 90 Dias:\n", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "• A) O título/contrato será levado a protesto extrajudicial e inclusão nos órgãos de proteção ao crédito (SPC/SERASA).\n", font: "Arial", size: 20 }),
                new TextRun({ text: "• B) Cobrança judicial com acréscimo de custas processuais e honorários advocatícios fixados em 20% sobre o valor total da dívida.", font: "Arial", size: 20 })
              ]
            }),

            // CLAUSULA SEXTA
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({ text: "CLÁUSULA SEXTA – DA PROTEÇÃO DE DADOS (LGPD)\n", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "6.1. As partes declaram cumprir a Lei nº 13.709/2018. A CONTRATADA tratará os dados recebidos exclusivamente para os fins deste contrato e cumprimentos de deveres legais.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "6.2. A CONTRATANTE autoriza o compartilhamento de dados com órgãos governamentais (Receita Federal, eSocial, Ministério do Trabalho, Secretarias de Finanças) para cumprimento das rotinas operacionais.", font: "Arial", size: 20 })
              ]
            }),

            // CLAUSULA SÉTIMA
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({ text: "CLÁUSULA SÉTIMA – DA RESCISÃO E BLINDAGEM DE TRANSIÇÃO\n", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "7.1. O presente contrato vigora por prazo indeterminado. Qualquer das partes poderá rescindi-lo mediante ", font: "Arial", size: 20 }),
                new TextRun({ text: "aviso prévio por escrito com antecedência mínima de 30 (trinta) dias", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: ", devendo os honorários desse período ser quitados normalmente.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "7.2. A rescisão contratual ou a transferência da responsabilidade técnica fica condicionada à ", font: "Arial", size: 20 }),
                new TextRun({ text: "quitação integral de todos os débitos e honorários em aberto ", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "com a CONTRATADA.\n", font: "Arial", size: 20 }),
                new TextRun({ text: "7.3. Em caso de inadimplência superior a 60 (sessenta) dias, a CONTRATADA poderá rescindir o contrato imediatamente por justa causa, notificando o cliente e isentando-se das obrigações futuras.", font: "Arial", size: 20 })
              ]
            }),

            // CLAUSULA OITAVA
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 400 },
              children: [
                new TextRun({ text: "CLÁUSULA OITAVA – DO FORO\n", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "Fica eleito o Foro da Comarca de ", font: "Arial", size: 20 }),
                new TextRun({ text: "Macapá/AP", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: " para dirimir quaisquer dúvidas ou litígios oriundos do presente contrato, com renúncia expressa de qualquer outro por mais privilegiado que seja.", font: "Arial", size: 20 })
              ]
            }),

            // Local e Data
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 600 },
              children: [
                new TextRun({ text: "Macapá/AP, ", font: "Arial", size: 20 }),
                new TextRun({ text: `${startDateExtenso}`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                new TextRun({ text: ".", font: "Arial", size: 20 })
              ]
            }),

            // Assinatura CONTRATANTE
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 500, after: 100 },
              children: [
                new TextRun({ text: "____________________________________\n", font: "Arial", size: 20 }),
                new TextRun({ text: `${socioNome}\n`, bold: true, highlight: "yellow", font: "Arial", size: 20 }),
                new TextRun({ text: `${socioCargo}`, bold: true, highlight: "yellow", font: "Arial", size: 20 })
              ]
            }),

            // Assinatura CONTRATADA
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 100 },
              children: [
                new TextRun({ text: "____________________________________\n", font: "Arial", size: 20 }),
                new TextRun({ text: "FELYPE MACIEL NAIFF\n", bold: true, font: "Arial", size: 20 }),
                new TextRun({ text: "Prosperare Serviços Contábeis", font: "Arial", size: 20 })
              ]
            })
          ]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="contrato_prestacao_servicos_${corpName.replace(/\s+/g, "_")}.docx"`
      }
    });
  } catch (error: any) {
    console.error("Erro ao gerar contrato de serviços:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao gerar contrato" }, { status: 500 });
  }
}
