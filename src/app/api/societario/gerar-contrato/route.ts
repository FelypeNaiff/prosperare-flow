import { NextRequest, NextResponse } from "next/server";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  AlignmentType, 
  WidthType, 
  BorderStyle 
} from "docx";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresa, socios = [], novosDados = {}, eventosSelecionados = [] } = body;

    const currentCompany = empresa || {};
    const updatedCompany = { ...currentCompany, ...novosDados };

    // Format BRL function
    const formatBRL = (val: any) => {
      const num = Number(val);
      if (isNaN(num)) return "0,00";
      return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Helper to format date YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    };

    // Build children array for the document
    const children: any[] = [];

    // Title
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 },
        children: [
          new TextRun({
            text: "INSTRUMENTO PARTICULAR DE ALTERAÇÃO E CONSOLIDAÇÃO CONTRATUAL",
            bold: true,
            font: "Arial",
            size: 24, // 12pt
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `DE SÃO DO CONTRATO SOCIAL DA SOCIEDADE: ${String(currentCompany.corporateName || "").toUpperCase()}`,
            bold: true,
            font: "Arial",
            size: 24,
          }),
        ],
      })
    );

    // Qualification introduction
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 240 },
        children: [
          new TextRun({
            text: "Pelo presente instrumento particular de Alteração e Consolidação Contratual, os abaixo assinados na qualidade de únicos sócios da sociedade:",
            font: "Arial",
            size: 24,
          }),
        ],
      })
    );

    // Partner qualifications
    socios.forEach((s: any) => {
      const regimeText = s.regimeBens ? `, sob o regime de ${s.regimeBens}` : "";
      const rgText = s.rg ? `, portador(a) do RG nº ${s.rg}${s.rgOrgaoEmissor ? " " + s.rgOrgaoEmissor : ""}${s.rgUf ? "/" + s.rgUf : ""}` : "";
      
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 120 },
          children: [
            new TextRun({
              text: `${s.nome || ""}, ${s.nacionalidade || "brasileiro(a)"}, ${s.estadoCivil || "solteiro(a)"}${regimeText}, ${s.profissao || "empresário(a)"}${rgText}, inscrito(a) no CPF/MF sob o nº ${s.cpfCnpj || ""}, residente e domiciliado(a) no endereço informado, titular das quotas societárias na sociedade limitada `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${String(currentCompany.corporateName || "").toUpperCase()}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, pessoa jurídica de direito privado, com sede na ${currentCompany.address || ""}, ${currentCompany.neighborhood || ""}, ${currentCompany.city || ""}/${currentCompany.state || ""}, CEP: ${currentCompany.zipCode || ""}, inscrita no CNPJ/MF sob o nº ${currentCompany.cnpj || ""}, e com seu ato constitutivo arquivado na Junta Comercial sob o NIRE nº ${currentCompany.nire || ""}.`,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    });

    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 240 },
        children: [
          new TextRun({
            text: "Resolvem, de comum acordo e na melhor forma de direito, alterar o contrato social da sociedade mediante as cláusulas a seguir dispostas:",
            font: "Arial",
            size: 24,
          }),
        ],
      })
    );

    // Event conditionals
    let clauseCounter = 1;
    const numberToRoman = (num: number) => {
      const lookup: any = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
      let roman = "";
      for (const i in lookup) {
        while (num >= lookup[i]) {
          roman += i;
          num -= lookup[i];
        }
      }
      return roman;
    };

    if (eventosSelecionados.includes("220")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA ALTERAÇÃO DA DENOMINAÇÃO SOCIAL`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 240 },
          children: [
            new TextRun({
              text: `A sociedade, que antes adotava e girava sob a denominação social de "${currentCompany.corporateName || ""}", passa a adotar a denominação social de `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `"${updatedCompany.corporateName || ""}"`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: ", devendo ser promovidos os registros correspondentes perante os órgãos competentes.",
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    if (eventosSelecionados.includes("244")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA ALTERAÇÃO DO OBJETO SOCIAL`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 240 },
          children: [
            new TextRun({
              text: `A sociedade altera seu objeto social, que passará a contemplar a exploração das seguintes atividades: `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${updatedCompany.objetoSocial || updatedCompany.naturezaJuridica || "Prestação de serviços contábeis e assessoria empresarial."}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    if (eventosSelecionados.includes("capital")) {
      const newCapital = Number(updatedCompany.capitalSocial || 0);
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA ALTERAÇÃO DO CAPITAL SOCIAL`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 180 },
          children: [
            new TextRun({
              text: `O capital social da sociedade, que era de R$ ${formatBRL(currentCompany.capitalSocial)}, fica alterado para `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `R$ ${formatBRL(newCapital)}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, dividido em ${newCapital.toLocaleString("pt-BR")} quotas de valor nominal R$ 1,00 (um real) cada, totalmente subscrito e integralizado pelos sócios na seguinte proporção:`,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );

      // Build table rows
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sócio", bold: true, font: "Arial", size: 20 })] })],
              width: { size: 40, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Quotas", bold: true, font: "Arial", size: 20 })] })],
              width: { size: 20, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Valor (R$)", bold: true, font: "Arial", size: 20 })] })],
              width: { size: 20, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Participação (%)", bold: true, font: "Arial", size: 20 })] })],
              width: { size: 20, type: WidthType.PERCENTAGE }
            }),
          ]
        })
      ];

      socios.forEach((s: any) => {
        const value = Number(s.participacao || 0);
        const percent = newCapital > 0 ? (value / newCapital) * 100 : 0;

        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: s.nome || "", font: "Arial", size: 20 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value.toLocaleString("pt-BR"), font: "Arial", size: 20 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBRL(value), font: "Arial", size: 20 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: percent.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + "%", font: "Arial", size: 20 })] })],
              }),
            ]
          })
        );
      });

      // Total Row
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true, font: "Arial", size: 20 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: newCapital.toLocaleString("pt-BR"), bold: true, font: "Arial", size: 20 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatBRL(newCapital), bold: true, font: "Arial", size: 20 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "100%", bold: true, font: "Arial", size: 20 })] })],
            }),
          ]
        })
      );

      const table = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: tableRows,
      });

      children.push(table);
      children.push(new Paragraph({ spacing: { after: 240 } })); // spacer
    }

    if (eventosSelecionados.includes("endereco")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA ALTERAÇÃO DO ENDEREÇO DA SEDE`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 240 },
          children: [
            new TextRun({
              text: `A sociedade altera o endereço de sua sede administrativa, que deixa o local anterior e passa a localizar-se na `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${updatedCompany.address || ""}, ${updatedCompany.neighborhood || ""}, ${updatedCompany.city || ""}/${updatedCompany.state || ""}, CEP: ${updatedCompany.zipCode || ""}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: ".",
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    // Consolidation Title
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 240 },
        children: [
          new TextRun({
            text: `CONTRATO SOCIAL CONSOLIDADO`,
            bold: true,
            font: "Arial",
            size: 28,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 240 },
        children: [
          new TextRun({
            text: "Em razão das alterações operadas, os sócios resolvem consolidar o Contrato Social da sociedade, que passa a reger-se pelas seguintes cláusulas constitutivas:",
            font: "Arial",
            size: 24,
          }),
        ],
      })
    );

    // Constitutive Clauses
    const defaultClauses = [
      {
        title: "CLÁUSULA PRIMEIRA - DA DENOMINAÇÃO E SEDE",
        content: `A sociedade limitada gira sob o nome empresarial "${updatedCompany.corporateName || currentCompany.corporateName || ""}" e tem sede e domicílio na ${updatedCompany.address || currentCompany.address || ""}, ${updatedCompany.neighborhood || currentCompany.neighborhood || ""}, ${updatedCompany.city || currentCompany.city || ""}/${updatedCompany.state || currentCompany.state || ""}, CEP: ${updatedCompany.zipCode || currentCompany.zipCode || ""}.`
      },
      {
        title: "CLÁUSULA SEGUNDA - DO OBJETO SOCIAL",
        content: `A sociedade tem por objeto social a exploração e prestação de serviços nas áreas de: ${updatedCompany.objetoSocial || updatedCompany.naturezaJuridica || currentCompany.naturezaJuridica || "serviços de assessoria, consultoria administrativa e contabilidade."}`
      },
      {
        title: "CLÁUSULA TERCEIRA - DO CAPITAL SOCIAL",
        content: `O capital social é de R$ ${formatBRL(updatedCompany.capitalSocial || currentCompany.capitalSocial)}, dividido em quotas no valor unitário de R$ 1,00 (um real) cada, integralizadas e distribuídas entre os sócios de acordo com a listagem consolidada descrita neste ato.`
      },
      {
        title: "CLÁUSULA QUARTA - DA ADMINISTRAÇÃO",
        content: "A administração da sociedade e o uso de seu nome empresarial caberão ao(s) administrador(es) devidamente designados neste ato, com plenos poderes para assinar e representar a empresa em todos os atos judiciais, extrajudiciais e administrativos de seu interesse, vedado o uso em avais ou finalidades estranhas ao objeto social."
      },
      {
        title: "CLÁUSULA QUINTA - DO BALANÇO E RESULTADOS",
        content: "Ao fim de cada exercício social, em 31 de dezembro, a administração procederá à elaboração das demonstrações contábeis e do balanço patrimonial. Os lucros ou prejuízos apurados serão distribuídos ou suportados pelos sócios na proporção de suas quotas."
      },
      {
        title: "CLÁUSULA SEXTA - DA DECLARAÇÃO DE DESIMPEDIMENTO",
        content: "O(s) Administrador(es) declara(m), sob as penas da lei, que não está(ão) impedido(s) de exercer a administração da sociedade por lei especial ou em virtude de condenação criminal."
      },
      {
        title: "CLÁUSULA SÉTIMA - DO FORO",
        content: `Para dirimir quaisquer controvérsias decorrentes deste contrato, os sócios elegem o foro da Comarca de ${updatedCompany.city || currentCompany.city || "Macapá"}, com exclusão de qualquer outro por mais privilegiado que seja.`
      }
    ];

    defaultClauses.forEach((c) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 180, after: 60 },
          children: [
            new TextRun({
              text: c.title,
              bold: true,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 120 },
          children: [
            new TextRun({
              text: c.content,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    });

    // Date
    const today = new Date();
    const months = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const dateString = `${updatedCompany.city || currentCompany.city || "Cidade"}, ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}.`;

    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 360, after: 480 },
        children: [
          new TextRun({
            text: dateString,
            font: "Arial",
            size: 24,
          }),
        ],
      })
    );

    // Signatures
    socios.forEach((s: any) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480 },
          children: [
            new TextRun({
              text: "_______________________________________________",
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: `${s.nome || ""}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
          children: [
            new TextRun({
              text: `Sócio(a) / Administrador(a)`,
              font: "Arial",
              size: 20,
            }),
          ],
        })
      );
    });

    // Generate document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 inch = 1440 twips = 2.54 cm
                bottom: 1440,
                left: 1440,
                right: 1440,
              }
            }
          },
          children: children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=alteracao_contratual.docx",
      },
    });

  } catch (error: any) {
    console.error("Erro na geração do contrato:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno na geração do contrato" },
      { status: 500 }
    );
  }
}
