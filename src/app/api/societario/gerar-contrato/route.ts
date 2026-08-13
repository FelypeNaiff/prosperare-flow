import { NextRequest, NextResponse } from "next/server";
import { numberToExtensoBRL } from "@/lib/utils";
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

// Grammatic gender flexer for premium contracts
const getGenderedWord = (word: string, gender: string) => {
  if (!word) return "";
  const lower = word.trim().toLowerCase();
  const isFemale = gender === "Feminino";
  
  if (lower.startsWith("brasileir")) {
    return isFemale ? "brasileira" : "brasileiro";
  }
  if (lower.startsWith("solteir")) {
    return isFemale ? "solteira" : "solteiro";
  }
  if (lower.startsWith("casad")) {
    return isFemale ? "casada" : "casado";
  }
  if (lower.startsWith("divorciad")) {
    return isFemale ? "divorciada" : "divorciado";
  }
  if (lower.startsWith("viúv") || lower.startsWith("viuv")) {
    return isFemale ? "viúva" : "viúvo";
  }
  if (lower.startsWith("empresári") || lower.startsWith("empresari")) {
    return isFemale ? "empresária" : "empresário";
  }
  if (lower.startsWith("sócio") || lower.startsWith("socio")) {
    return isFemale ? "sócia" : "sócio";
  }
  if (lower.startsWith("administrador")) {
    return isFemale ? "administradora" : "administrador";
  }
  
  // General flex for simple cases
  if (isFemale && lower.endsWith("o")) {
    return word.substring(0, word.length - 1) + "a";
  }
  return word;
};

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
            text: `DA SOCIEDADE: ${String(currentCompany.corporateName || "").toUpperCase()}`,
            bold: true,
            font: "Arial",
            size: 24,
          }),
        ],
      })
    );

    // Address of company headquarters formatted
    const companyAddressParts = [];
    if (currentCompany.address) {
      let streetAndNum = currentCompany.address;
      if (currentCompany.numero) streetAndNum += `, ${currentCompany.numero}`;
      if (currentCompany.complemento) streetAndNum += ` - ${currentCompany.complemento}`;
      companyAddressParts.push(streetAndNum);
    }
    if (currentCompany.neighborhood) companyAddressParts.push(`BAIRRO ${currentCompany.neighborhood}`);
    if (currentCompany.city && currentCompany.state) companyAddressParts.push(`${currentCompany.city}/${currentCompany.state}`);
    if (currentCompany.zipCode) companyAddressParts.push(`CEP ${currentCompany.zipCode}`);
    const companyAddressStr = companyAddressParts.length > 0 ? companyAddressParts.join(", ") : `${currentCompany.address || ""}${currentCompany.numero ? ", " + currentCompany.numero : ""}${currentCompany.complemento ? " - " + currentCompany.complemento : ""}, ${currentCompany.neighborhood || ""}, ${currentCompany.city || ""}/${currentCompany.state || ""}, CEP ${currentCompany.zipCode || ""}`;

    const qualificandos = socios.some((s: any) => s.statusAlteracao === "saindo")
      ? socios.filter((s: any) => s.statusAlteracao === "saindo")
      : socios.filter((s: any) => s.statusAlteracao !== "entrando");

    const resolvesWord = qualificandos.length > 1 ? "resolvem:" : "resolve:";

    // Partner qualifications (Modelo de Cláusula de Qualificação Cadastral)
    qualificandos.forEach((s: any) => {
      const g = s.sexo || "Masculino";
      const isFemale = g === "Feminino";
      
      const nac = getGenderedWord(s.nacionalidade || "brasileiro", g);
      const estCivil = getGenderedWord(s.estadoCivil || "solteiro", g);
      const prof = getGenderedWord(s.profissao || "empresário", g);
      
      let bornText = "";
      if (s.dataNascimento) {
        bornText = `, nascid${isFemale ? "a" : "o"} em ${formatDate(s.dataNascimento)}`;
      }

      let rgText = "";
      if (s.rg) {
        rgText = `, RG nº: ${s.rg}${s.rgOrgaoEmissor ? " " + s.rgOrgaoEmissor : ""}${s.rgUf ? "/" + s.rgUf : ""}`;
      }

      let cpfText = s.cpfCnpj ? `, CPF: ${s.cpfCnpj}` : "";

      const partnerAddr = s.enderecoResidencial || s.endereco || companyAddressStr;
      const resText = `, residente e domiciliado ${partnerAddr}`;

      const condicaoSocio = (s.condicaoSocio || "titular").toLowerCase();
      const qualidadeStr = `, na qualidade de ${condicaoSocio} da empresa, `;

      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 240 },
          children: [
            new TextRun({
              text: `${String(s.nome || "").toUpperCase()}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, ${nac}, ${estCivil}${bornText}, ${prof}${rgText}${cpfText}${resText}${qualidadeStr}`,
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
              text: ` com sede na ${companyAddressStr}, ${resolvesWord}`,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    });

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

    // 1. Alteração do Nome / Razão Social (220)
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

    // 2. Alteração do Objeto Social (244 ou objeto_social)
    if (eventosSelecionados.includes("244") || eventosSelecionados.includes("objeto_social")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA ALTERAÇÃO DE ATIVIDADES E OBJETO SOCIAL`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );

      const cnaesList = updatedCompany.cnaes || [];

      if (cnaesList.length > 0) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 360, after: 120 },
            children: [
              new TextRun({
                text: "A sociedade terá por objeto o exercício das seguintes atividades econômicas:",
                font: "Arial",
                size: 24,
              }),
            ],
          })
        );

        cnaesList.forEach((cnae: any) => {
          const codePart = cnae.code ? `${cnae.code} – ` : "";
          const descPart = (cnae.description || "").toUpperCase();
          children.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: 360, after: 60 },
              children: [
                new TextRun({
                  text: `${codePart}${descPart}`,
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
            })
          );
        });

        const descriptions = cnaesList
          .map((c: any) => (c.description || "").toUpperCase().trim())
          .filter(Boolean);

        if (descriptions.length > 0) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: 360, before: 120, after: 240 },
              children: [
                new TextRun({
                  text: "Parágrafo único. ",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
                new TextRun({
                  text: "Em estabelecimento eleito como Sede (Matriz) será(ão) exercida(s) a(s) atividade(s) de: ",
                  font: "Arial",
                  size: 24,
                }),
                new TextRun({
                  text: `${descriptions.join(", ")}.`,
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
            })
          );
        }
      } else {
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
    }

    // 3. Alteração de Endereço (endereco, 211, 209, 210)
    if (eventosSelecionados.includes("endereco") || 
        eventosSelecionados.includes("211") || 
        eventosSelecionados.includes("209") || 
        eventosSelecionados.includes("210")) {
      
      let typeText = "dentro do mesmo município";
      if (eventosSelecionados.includes("209")) {
        typeText = "entre municípios dentro do mesmo estado";
      } else if (eventosSelecionados.includes("210")) {
        typeText = "entre estados";
      }

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
              text: `A sociedade altera o endereço de sua sede administrativa (mudança ${typeText}), deixando o local anterior e passando a localizar-se na `,
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
              text: ", devendo ser promovidas as devidas atualizações cadastrais perante todos os órgãos públicos.",
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    // 4. Alteração de Natureza Jurídica / Transformação (225 ou transformacao)
    if (eventosSelecionados.includes("225") || eventosSelecionados.includes("transformacao")) {
      const companyAddressParts = [];
      const street = updatedCompany.address || currentCompany.address;
      const num = updatedCompany.numero || currentCompany.numero;
      const comp = updatedCompany.complemento || currentCompany.complemento;
      if (street) {
        let streetAndNum = street;
        if (num) streetAndNum += `, ${num}`;
        if (comp) streetAndNum += ` - ${comp}`;
        companyAddressParts.push(streetAndNum);
      }
      const neigh = updatedCompany.neighborhood || currentCompany.neighborhood;
      if (neigh) companyAddressParts.push(`BAIRRO ${neigh}`);
      const ct = updatedCompany.city || currentCompany.city;
      const st = updatedCompany.state || currentCompany.state;
      if (ct && st) companyAddressParts.push(`${ct}/${st}`);
      const zip = updatedCompany.zipCode || currentCompany.zipCode;
      if (zip) companyAddressParts.push(`CEP ${zip}`);
      const companyAddrStr = companyAddressParts.join(", ");

      const corpNameStr = (updatedCompany.corporateName || currentCompany.corporateName || "").toUpperCase();
      const fantasiaStr = (updatedCompany.nomeFantasia || currentCompany.nomeFantasia || corpNameStr.replace(/\s+LTDA$/i, "").replace(/\s+ME$/i, "")).toUpperCase();

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA TRANSFORMAÇÃO, DENOMINAÇÃO SOCIAL E FANTASIA`,
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
              text: "Transformar o tipo jurídico para Sociedade Empresária Limitada, adotando o nome empresarial ",
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${corpNameStr}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: ", nome fantasia ",
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${fantasiaStr}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: ` e terá sua sede e domicílio no ${companyAddrStr}.`,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    // 5. Alteração da Forma de Atuação (249)
    if (eventosSelecionados.includes("249")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA ALTERAÇÃO DA FORMA DE ATUAÇÃO`,
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
              text: "A sociedade altera sua forma de atuação dos estabelecimentos, passando a realizar atividades nas modalidades presenciais, internet e demais meios eletrônicos, conforme definido em regulamento interno.",
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    // 6. Alteração do Tipo de Unidade (248)
    if (eventosSelecionados.includes("248")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA ALTERAÇÃO DO TIPO DE UNIDADE`,
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
              text: "Fica modificado o tipo de unidade do estabelecimento da sociedade, passando a operar como unidade operacional/produtiva, visando otimizar a logística e os processos operacionais.",
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    // 7. Reativação da Sociedade (052)
    if (eventosSelecionados.includes("052")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA REATIVAÇÃO DE SOCIEDADE (ART. 60 LEI 8.934/94)`,
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
              text: "Os sócios promovem a reativação da sociedade limitada sob o amparo do artigo 60 da Lei nº 8.934/94, declarando a intenção de retornar a todas as suas operações normais e restabelecer sua atividade empresarial de forma plena.",
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    // 8. Licenciamento de Estabelecimento (090)
    if (eventosSelecionados.includes("090") || eventosSelecionados.includes("999")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DO LICENCIAMENTO DE ESTABELECIMENTO ANTERIORMENTE REGISTRADO`,
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
              text: "Fica pactuada a solicitação e regularização do licenciamento do estabelecimento anteriormente registrado (Legado) perante as autarquias locais, vigilância sanitária e corpo de bombeiros, visando o pleno funcionamento legal da sociedade.",
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    // 9. Nome de Fantasia (221)
    if (eventosSelecionados.includes("221")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA ALTERAÇÃO DO NOME DE FANTASIA`,
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
              text: `A sociedade altera o título de seu estabelecimento (Nome Fantasia) para `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `"${updatedCompany.nomeFantasia || "PROSPERARE"}"`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: ", consolidando tal designação para fins mercadológicos.",
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );
    }

    // 10. Transferência de Titularidade / Quadro de Sócios (alteracao_socio, entrada_socio, saida_socio, cessao_quotas)
    if (eventosSelecionados.includes("alteracao_socio") || 
        eventosSelecionados.includes("entrada_socio") || 
        eventosSelecionados.includes("saida_socio") ||
        eventosSelecionados.includes("cessao_quotas")) {

      const saindoSocio = socios.find((s: any) => s.statusAlteracao === "saindo")
        || socios.find((s: any) => s.dataSaida && s.dataSaida !== "")
        || socios[0]
        || {};
      const entrandoSocio = socios.find((s: any) => s.statusAlteracao === "entrando")
        || socios.find((s: any) => s.statusAlteracao !== "saindo" && s.statusAlteracao !== "permanece" && s.dataIngresso && s.dataIngresso !== "")
        || socios[1]
        || socios[0]
        || {};

      const corpNameStr = (updatedCompany.corporateName || currentCompany.corporateName || "").toUpperCase();
      const cnpjStr = updatedCompany.cnpj || currentCompany.cnpj || "28.154.716/0001-62";
      const nireStr = updatedCompany.nire || currentCompany.nire || "1620014713-1";

      const g = entrandoSocio.sexo || "Masculino";
      const nac = getGenderedWord(entrandoSocio.nacionalidade || "brasileiro", g);
      const estCivil = getGenderedWord(entrandoSocio.estadoCivil || "solteiro", g);
      const prof = getGenderedWord(entrandoSocio.profissao || "empresário", g);
      const rgStr = `${entrandoSocio.rg || "314962"}${entrandoSocio.rgOrgaoEmissor ? ", " + entrandoSocio.rgOrgaoEmissor : ""}${entrandoSocio.rgUf ? " - " + entrandoSocio.rgUf : ""}`;
      const cpfStr = entrandoSocio.cpfCnpj || "610.001.162-04";

      const companyAddressParts = [];
      const street = updatedCompany.address || currentCompany.address;
      const num = updatedCompany.numero || currentCompany.numero;
      const comp = updatedCompany.complemento || currentCompany.complemento;
      if (street) {
        let streetAndNum = street;
        if (num) streetAndNum += `, ${num}`;
        if (comp) streetAndNum += ` - ${comp}`;
        companyAddressParts.push(streetAndNum);
      }
      const neigh = updatedCompany.neighborhood || currentCompany.neighborhood;
      if (neigh) companyAddressParts.push(`BAIRRO ${neigh}`);
      const ct = updatedCompany.city || currentCompany.city;
      const st = updatedCompany.state || currentCompany.state;
      if (ct && st) companyAddressParts.push(`${ct}/${st}`);
      const zip = updatedCompany.zipCode || currentCompany.zipCode;
      if (zip) companyAddressParts.push(`CEP ${zip}`);
      const companyAddrStr = companyAddressParts.join(", ");

      const partnerAddr = entrandoSocio.enderecoResidencial || entrandoSocio.endereco || companyAddrStr;

      const transferVal = Number(saindoSocio.participacao || entrandoSocio.participacao || updatedCompany.capitalSocial || currentCompany.capitalSocial || 100000);
      const transferValStr = `R$ ${formatBRL(transferVal)} (${numberToExtensoBRL(transferVal).toUpperCase()})`;

      // Cláusula 1 - TRANSFERÊNCIA DE TITULARIDADE
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - TRANSFERÊNCIA DE TITULARIDADE`,
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
              text: `${String(saindoSocio.nome || "FABIO RODRIGO E SILVA FILHO").toUpperCase()}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, transfere a titularidade desta Sociedade Empresaria Limitada `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${corpNameStr}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: ` para `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${String(entrandoSocio.nome || "FABIO RODRIGO E SILVA").toUpperCase()}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, nacionalidade ${nac}, ${prof}, ${estCivil}, CPF: ${cpfStr}, documento de identidade ${rgStr}, com domicílio/residência à ${partnerAddr}, que passará a ser o sócio da `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${corpNameStr}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: ` com sede e domicílio na ${companyAddrStr}, registrada nesta Junta Comercial sob NIRE: ${nireStr}, CNPJ ${cnpjStr}, com sub-rogação de todos os direitos e obrigações pertinentes.`,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );

      // Cláusula 2 - ADMINISTRAÇÃO DA EMPRESA
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 180 },
          children: [
            new TextRun({
              text: `A administração da empresa caberá ao único sócio administrador `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${String(entrandoSocio.nome || "FABIO RODRIGO E SILVA").toUpperCase()}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, com os poderes e atribuições de representação ativa e passiva, judicial e extrajudicial, podendo praticar todos os atos compreendidos no objeto.`,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );

      // Cláusula 3 - QUITAÇÃO DA CESSÃO
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 180 },
          children: [
            new TextRun({
              text: `${String(saindoSocio.nome || "FABIO RODRIGO E SILVA FILHO").toUpperCase()}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, declara haver recebido, neste ato, em moeda corrente, a quantia de `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${transferValStr}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, assim como declara ter recebido todos os seus direitos e haveres, nada mais tendo sobre elas a reclamar, seja a qual título for, nem do cessionário e nem da empresa individual de responsabilidade limitada, dando-lhes plena, geral, rasa e irrevogável quitação.`,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );

      // Cláusula 4 - DECLARAÇÃO DE DESIMPEDIMENTO
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 240 },
          children: [
            new TextRun({
              text: `${String(entrandoSocio.nome || "FABIO RODRIGO E SILVA").toUpperCase()}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, único Sócio Administrador da empresa declara, sob as penas da lei, de que não está impedido de exercer a administração da empresa, por lei especial, ou em virtude de condenação criminal, ou por se encontrar sob os efeitos dela, a pena que vede, ainda que temporariamente, o acesso a cargos públicos; ou por crime falimentar, de prevaricação, peita ou suborno, concussão, peculato, ou contra a economia popular, contra o sistema financeiro nacional, contra normas de defesa da concorrência, contra as relações de consumo, fé pública, ou a propriedade.`,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );

      // Modelo de Cessão de Quotas e Transferência de Titularidade (Saída de Sócio)
      if (eventosSelecionados.includes("cessao_quotas")) {
        const cedeSocio = socios.find((s: any) => s.statusAlteracao === "saindo")
          || socios.find((s: any) => s.dataSaida && s.dataSaida !== "")
          || socios[0]
          || {};
        const recebeSocio = socios.find((s: any) => s.statusAlteracao === "entrando")
          || socios.find((s: any) => s.statusAlteracao !== "saindo" && s.statusAlteracao !== "permanece" && s.dataIngresso && s.dataIngresso !== "")
          || socios[1]
          || socios[0]
          || {};

        const cedeNome = String(cedeSocio.nome || "ORLANDO FERREIRA COUTINHO JUNIOR").toUpperCase();
        const recebeNome = String(recebeSocio.nome || "DISRAELI DOS SANTOS ANDRADE").toUpperCase();

        const cedeVal = Number(cedeSocio.participacao || 16500);
        const cedeValStr = `R$${formatBRL(cedeVal)} (${numberToExtensoBRL(cedeVal)})`;

        const totalCessaoVal = Number(updatedCompany.capitalSocial || currentCompany.capitalSocial || 50000);
        const totalCessaoStr = `R$${formatBRL(totalCessaoVal)} (${numberToExtensoBRL(totalCessaoVal)})`;
        const totalQuotasStr = `${totalCessaoVal.toLocaleString("pt-BR")} (${numberToExtensoBRL(totalCessaoVal).replace(" reais", "").replace(" real", "")})`;

        const isFemaleRecebe = recebeSocio.sexo === "Feminino";

        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: `CLÁUSULA ${numberToRoman(clauseCounter++)}ª - DA SAÍDA DE SÓCIO E CESSÃO DE QUOTAS`,
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
              new TextRun({ text: "O sócio ", font: "Arial", size: 24 }),
              new TextRun({ text: `${cedeNome}`, bold: true, font: "Arial", size: 24 }),
              new TextRun({ text: " resolve ceder e transferir a totalidade de suas cotas do capital social ", font: "Arial", size: 24 }),
              new TextRun({ text: `${cedeValStr}`, bold: true, font: "Arial", size: 24 }),
              new TextRun({ text: " à ", font: "Arial", size: 24 }),
              new TextRun({ text: `${recebeNome}`, bold: true, font: "Arial", size: 24 }),
            ],
          })
        );

        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 360, after: 240 },
            children: [
              new TextRun({ text: "Com essa transferência, ", font: "Arial", size: 24 }),
              new TextRun({ text: `${cedeNome}`, bold: true, font: "Arial", size: 24 }),
              new TextRun({ text: " se retira da sociedade. As cotas cedidas totalizam ", font: "Arial", size: 24 }),
              new TextRun({ text: `${totalCessaoStr}`, bold: true, font: "Arial", size: 24 }),
              new TextRun({ text: ", dividido em ", font: "Arial", size: 24 }),
              new TextRun({ text: `${totalQuotasStr}`, bold: true, font: "Arial", size: 24 }),
              new TextRun({ text: " unidades, cada uma no valor de R$1,00 (um real). ", font: "Arial", size: 24 }),
              new TextRun({ text: `${isFemaleRecebe ? "A sócia" : "O sócio"}, `, font: "Arial", size: 24 }),
              new TextRun({ text: `${recebeNome}`, bold: true, font: "Arial", size: 24 }),
              new TextRun({ text: ", passará a integrar a sociedade na qualidade de titular dessas cotas.", font: "Arial", size: 24 }),
            ],
          })
        );
      }
    }

    // 11. Alteração do Capital Social (capital, cessao_quotas)
    if (eventosSelecionados.includes("capital") || eventosSelecionados.includes("cessao_quotas")) {
      const oldCap = Number(currentCompany.capitalSocial || 0);
      const newCap = Number(updatedCompany.capitalSocial || 0);

      const oldCapStr = `R$${formatBRL(oldCap)} (${numberToExtensoBRL(oldCap)})`;
      const newCapStr = `R$ ${formatBRL(newCap)} (${numberToExtensoBRL(newCap)})`;

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
              text: `Capital Social da empresa está atualmente no valor de `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${oldCapStr}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `. O acervo do empresário ora transformado passa a ser no valor de `,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `${newCapStr}`,
              bold: true,
              font: "Arial",
              size: 24,
            }),
            new TextRun({
              text: `, passa a constituir o capital da nova sociedade, e fica assim distribuído:`,
              font: "Arial",
              size: 24,
            }),
          ],
        })
      );

      // Build 3-column table: Sócio | Nº de Quotas | Valor
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sócio", bold: true, font: "Arial", size: 20 })] })],
              width: { size: 50, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Nº de Quotas", bold: true, font: "Arial", size: 20 })] })],
              width: { size: 25, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Valor", bold: true, font: "Arial", size: 20 })] })],
              width: { size: 25, type: WidthType.PERCENTAGE }
            }),
          ]
        })
      ];

      socios.forEach((s: any) => {
        const value = Number(s.participacao || 0);

        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: (s.nome || "").toUpperCase(), font: "Arial", size: 20 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value.toLocaleString("pt-BR"), font: "Arial", size: 20 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `R$${formatBRL(value)}`, font: "Arial", size: 20 })] })],
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
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: newCap.toLocaleString("pt-BR"), bold: true, font: "Arial", size: 20 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `R$${formatBRL(newCap)}`, bold: true, font: "Arial", size: 20 })] })],
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
        id: "denominacao",
        title: "CLÁUSULA PRIMEIRA - DA DENOMINAÇÃO E SEDE",
        content: `A sociedade limitada gira sob o nome empresarial "${updatedCompany.corporateName || currentCompany.corporateName || ""}" e tem sede e domicílio na ${updatedCompany.address || currentCompany.address || ""}, ${updatedCompany.neighborhood || currentCompany.neighborhood || ""}, ${updatedCompany.city || currentCompany.city || ""}/${updatedCompany.state || currentCompany.state || ""}, CEP: ${updatedCompany.zipCode || currentCompany.zipCode || ""}.`
      },
      {
        id: "objeto_social",
        title: "CLÁUSULA SEGUNDA - DO OBJETO SOCIAL",
        content: `A sociedade tem por objeto social a exploração e prestação de serviços nas áreas de: ${updatedCompany.objetoSocial || updatedCompany.naturezaJuridica || currentCompany.naturezaJuridica || "serviços de assessoria, consultoria administrativa e contabilidade."}`
      },
      {
        id: "capital",
        title: "CLÁUSULA TERCEIRA - DO CAPITAL SOCIAL",
        content: `O capital social é de R$ ${formatBRL(updatedCompany.capitalSocial || currentCompany.capitalSocial)}, dividido em quotas no valor unitário de R$ 1,00 (um real) cada, integralizadas e distribuídas entre os sócios de acordo com a listagem consolidada descrita neste ato.`
      },
      {
        id: "administracao",
        title: "CLÁUSULA QUARTA - DA ADMINISTRAÇÃO",
        content: "A administração da sociedade e o uso de seu nome empresarial caberão ao(s) administrador(es) devidamente designados neste ato, com plenos poderes para assinar e representar a empresa em todos os atos judiciais, extrajudiciais e administrativos de seu interesse, vedado o uso em avais ou finalidades estranhas ao objeto social."
      },
      {
        id: "balanco",
        title: "CLÁUSULA QUINTA - DO BALANÇO E RESULTADOS",
        content: "Ao fim de cada exercício social, em 31 de dezembro, a administração procederá à elaboração das demonstrações contábeis e do balanço patrimonial. Os lucros ou prejuízos apurados serão distribuídos ou suportados pelos sócios na proporção de suas quotas."
      },
      {
        id: "desimpedimento",
        title: "CLÁUSULA SEXTA - DA DECLARAÇÃO DE DESIMPEDIMENTO",
        content: "O(s) Administrador(es) declara(m), sob as penas da lei, que não está(ão) impedido(s) de exercer a administração da sociedade por lei especial ou em virtude de condenação criminal."
      },
      {
        id: "foro",
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

      if (c.id === "objeto_social" && updatedCompany.cnaes && updatedCompany.cnaes.length > 0) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 360, after: 120 },
            children: [
              new TextRun({
                text: "A sociedade terá por objeto o exercício das seguintes atividades econômicas:",
                font: "Arial",
                size: 24,
              }),
            ],
          })
        );

        updatedCompany.cnaes.forEach((cnae: any) => {
          const codePart = cnae.code ? `${cnae.code} – ` : "";
          const descPart = (cnae.description || "").toUpperCase();
          children.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: 360, after: 60 },
              children: [
                new TextRun({
                  text: `${codePart}${descPart}`,
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
            })
          );
        });

        const descriptions = updatedCompany.cnaes
          .map((c: any) => (c.description || "").toUpperCase().trim())
          .filter(Boolean);

        if (descriptions.length > 0) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { line: 360, before: 120, after: 240 },
              children: [
                new TextRun({
                  text: "Parágrafo único. ",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
                new TextRun({
                  text: "Em estabelecimento eleito como Sede (Matriz) será(ão) exercida(s) a(s) atividade(s) de: ",
                  font: "Arial",
                  size: 24,
                }),
                new TextRun({
                  text: `${descriptions.join(", ")}.`,
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
            })
          );
        }
      } else {
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
      }
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
              text: getGenderedWord(s.condicaoSocio || "Sócio", s.sexo) + (s.condicaoAdministrador === "Administrador" ? " / " + getGenderedWord("Administrador", s.sexo) : ""),
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
