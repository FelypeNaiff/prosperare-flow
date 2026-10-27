import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Header,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";
import { numberToExtensoBRL } from "@/lib/utils";
import { buildContract, buildContractData, normalizeRegime, Seg, Block } from "@/lib/contract-templates";

const FONT = "Calibri";
const SIZE = 21; // 10.5pt
const NAVY = "1F3864";
const MM = 56.7; // twips por mm

const runs = (segs: Seg[]) =>
  segs.map(s => new TextRun({ text: s.t, bold: s.b, highlight: s.hl ? "yellow" : undefined, font: FONT, size: SIZE }));

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder };

function blockToDocx(block: Block): (Paragraph | Table)[] {
  switch (block.kind) {
    case "title":
      return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: block.text, bold: true, size: 30, font: FONT, color: NAVY })] })];
    case "subtitle":
      return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: block.text, bold: true, size: 15, font: FONT, color: NAVY })] })];
    case "box": {
      const border = { style: BorderStyle.SINGLE, size: 6, color: "B4C6E7" };
      return [new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: noBorder, insideVertical: noBorder },
        rows: [new TableRow({
          children: [new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "F2F6FC" },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: block.lines.map((l, i) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: i === block.lines.length - 1 ? 0 : 120 }, children: runs(l) })),
          })],
        })],
      }), new Paragraph({ spacing: { after: 120 }, children: [] })];
    }
    case "heading":
      return [new Paragraph({ spacing: { before: 200, after: 80 }, keepNext: true, children: [new TextRun({ text: block.text, bold: true, font: FONT, size: SIZE + 1, color: NAVY })] })];
    case "para":
      return [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 100 }, children: runs(block.segs) })];
    case "item":
      return [new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { left: 567 }, spacing: { after: 60 }, children: runs(block.segs) })];
    case "date":
      return [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 240, after: 900 }, children: runs(block.segs) })];
    case "signatures": {
      const cell = (lines: string[]) => new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, bottom: noBorder, left: noBorder, right: noBorder },
        children: lines.map((t, i) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, bold: i === 0, font: FONT, size: SIZE, color: i === 0 ? NAVY : undefined })] })),
      });
      const gap = new TableCell({ borders: noBorders, children: [new Paragraph({ children: [] })] });
      return [new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        columnWidths: [4500, 600, 4500],
        rows: [new TableRow({ cantSplit: true, children: [cell(block.left), gap, cell(block.right)] })],
      })];
    }
    case "witnesses":
      return [
        new Paragraph({ spacing: { before: 480, after: 240 }, children: [new TextRun({ text: "TESTEMUNHAS:", bold: true, font: FONT, size: SIZE, color: NAVY })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: noBorders,
          rows: [new TableRow({
            cantSplit: true,
            children: ["1.", "2."].map(n => new TableCell({
              borders: noBorders,
              children: [`${n} ____________________________________`, "Nome:", "CPF:"].map(t => new Paragraph({ children: [new TextRun({ text: t, font: FONT, size: SIZE })] })),
            })),
          })],
        }),
      ];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { contrato, cliente, socio, letterhead } = await req.json();
    const regime = normalizeRegime(contrato?.taxRegime || contrato?.clientRegime);
    const data = buildContractData(contrato, cliente, socio, numberToExtensoBRL);
    const blocks = buildContract(regime, data);

    if (!blocks) {
      return NextResponse.json({ error: `O modelo de contrato para ${regime} ainda não foi cadastrado.` }, { status: 400 });
    }

    // Papel timbrado como imagem de fundo (página A4 inteira, atrás do texto)
    let headers: { default: Header } | undefined;
    const lh = letterhead || {};
    if (typeof lh.imageDataUrl === "string" && lh.imageDataUrl.startsWith("data:image")) {
      const [meta, b64] = lh.imageDataUrl.split(",");
      const type = meta.includes("png") ? "png" : "jpg";
      headers = {
        default: new Header({
          children: [new Paragraph({
            children: [new ImageRun({
              type,
              data: Buffer.from(b64, "base64"),
              transformation: { width: 794, height: 1123 }, // A4 @96dpi
              floating: {
                horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                behindDocument: true,
                allowOverlap: true,
              },
            } as any)],
          })],
        }),
      };
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: Math.round((lh.marginTopMm ?? 38) * MM),
              bottom: Math.round((lh.marginBottomMm ?? 32) * MM),
              left: Math.round((lh.marginLeftMm ?? 20) * MM),
              right: Math.round((lh.marginRightMm ?? 20) * MM),
              header: 0,
              footer: 0,
            },
          },
        },
        headers,
        children: blocks.flatMap(blockToDocx),
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeName = data.clientName.replace(/[^\w]+/g, "_");

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="contrato_prestacao_servicos_${safeName}.docx"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar contrato de serviços:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao gerar contrato" }, { status: 500 });
  }
}
