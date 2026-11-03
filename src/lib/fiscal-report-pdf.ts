import jsPDF from "jspdf"
import type { FiscalAnalysis } from "@/ai/flows/analyze-fiscal-document-flow"

export type Letterhead = {
  headerImage?: string   // data URL (PNG/JPG) - faixa do topo
  footerImage?: string   // data URL (PNG/JPG) - faixa do rodapé
  fullPageImage?: string // data URL - papel timbrado de página inteira (A4) como fundo
  companyName?: string
  cnpj?: string
  address?: string
  phone?: string
  email?: string
  responsible?: string
  crc?: string
  primaryColor?: string  // hex
}

const A4_W = 210
const A4_H = 297
const MARGIN_X = 18

function hexToRgb(hex = "#39586D"): [number, number, number] {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function imgSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 1, h: 1 })
    img.src = dataUrl
  })
}

function imgFormat(dataUrl: string) {
  return dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG"
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export async function generateFiscalReportPdf(
  analysis: FiscalAnalysis,
  lh: Letterhead,
  opts: { clientName?: string; preparedBy?: string } = {}
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const color = hexToRgb(lh.primaryColor)

  // Medidas do timbre
  let headerH = 0
  let footerH = 0
  if (lh.headerImage) {
    const s = await imgSize(lh.headerImage)
    headerH = Math.min((A4_W * s.h) / s.w, 50)
  }
  if (lh.footerImage) {
    const s = await imgSize(lh.footerImage)
    footerH = Math.min((A4_W * s.h) / s.w, 35)
  }
  const fallbackHeader = !lh.headerImage && !lh.fullPageImage
  const fallbackFooter = !lh.footerImage && !lh.fullPageImage
  if (fallbackHeader) headerH = 24
  if (fallbackFooter) footerH = 14
  if (lh.fullPageImage) { headerH = Math.max(headerH, 40); footerH = Math.max(footerH, 28) }

  const topY = headerH + 8
  const bottomY = A4_H - footerH - 8
  const contentW = A4_W - MARGIN_X * 2
  let y = topY

  const drawLetterhead = () => {
    if (lh.fullPageImage) doc.addImage(lh.fullPageImage, imgFormat(lh.fullPageImage), 0, 0, A4_W, A4_H, undefined, "FAST")
    if (lh.headerImage) doc.addImage(lh.headerImage, imgFormat(lh.headerImage), 0, 0, A4_W, headerH, undefined, "FAST")
    if (lh.footerImage) doc.addImage(lh.footerImage, imgFormat(lh.footerImage), 0, A4_H - footerH, A4_W, footerH, undefined, "FAST")
    if (fallbackHeader) {
      doc.setFillColor(...color); doc.rect(0, 0, A4_W, 3, "F")
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...color)
      doc.text(lh.companyName || "Prosperare Serviços Contábeis", MARGIN_X, 13)
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(110)
      doc.text([lh.cnpj && `CNPJ ${lh.cnpj}`, lh.phone, lh.email].filter(Boolean).join("  •  "), MARGIN_X, 18)
      doc.setDrawColor(220); doc.line(MARGIN_X, 21, A4_W - MARGIN_X, 21)
    }
    if (fallbackFooter) {
      doc.setDrawColor(220); doc.line(MARGIN_X, A4_H - 13, A4_W - MARGIN_X, A4_H - 13)
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(130)
      doc.text(lh.address || "", MARGIN_X, A4_H - 8)
    }
  }

  const newPage = () => { doc.addPage(); drawLetterhead(); y = topY }
  const ensure = (h: number) => { if (y + h > bottomY) newPage() }

  const paragraph = (text: string, size = 10, style: "normal" | "bold" | "italic" = "normal", rgb: [number, number, number] = [45, 45, 45], indent = 0) => {
    doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...rgb)
    const lines = doc.splitTextToSize(text || "", contentW - indent)
    const lh2 = size * 0.45
    for (const line of lines) { ensure(lh2); doc.text(line, MARGIN_X + indent, y); y += lh2 }
    y += 1.5
  }

  const section = (title: string) => {
    ensure(14); y += 3
    doc.setFillColor(...color); doc.rect(MARGIN_X, y - 4, 1.4, 6, "F")
    doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.setTextColor(...color)
    doc.text(title.toUpperCase(), MARGIN_X + 4, y + 0.5); y += 7
  }

  // ---------- Página 1 ----------
  drawLetterhead()

  doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(...color)
  doc.text("Relatório de Análise Fiscal", MARGIN_X, y + 2); y += 8
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(110)
  doc.text(analysis.tipoDocumento, MARGIN_X, y); y += 7

  // Card de identificação
  const status = {
    REGULAR: { label: "REGULAR", rgb: [22, 163, 74] as [number, number, number] },
    ATENCAO: { label: "REQUER ATENÇÃO", rgb: [217, 119, 6] as [number, number, number] },
    IRREGULAR: { label: "IRREGULAR", rgb: [220, 38, 38] as [number, number, number] },
  }[analysis.situacaoGeral]

  doc.setFillColor(246, 248, 250); doc.setDrawColor(226, 232, 240)
  doc.roundedRect(MARGIN_X, y, contentW, 26, 2, 2, "FD")
  doc.setFontSize(8); doc.setTextColor(120); doc.setFont("helvetica", "normal")
  doc.text("CONTRIBUINTE", MARGIN_X + 5, y + 6)
  doc.text("CNPJ/CPF", MARGIN_X + 5, y + 17)
  doc.text("EMISSÃO DO DOCUMENTO", MARGIN_X + 70, y + 17)
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(30)
  doc.text(doc.splitTextToSize(opts.clientName || analysis.contribuinteNome, 120)[0], MARGIN_X + 5, y + 11)
  doc.text(analysis.contribuinteDocumento || "-", MARGIN_X + 5, y + 22)
  doc.text(analysis.dataEmissao || "-", MARGIN_X + 70, y + 22)
  // Selo de status
  doc.setFillColor(...status.rgb)
  doc.roundedRect(A4_W - MARGIN_X - 46, y + 5, 41, 16, 2, 2, "F")
  doc.setTextColor(255); doc.setFontSize(7); doc.setFont("helvetica", "normal")
  doc.text("SITUAÇÃO GERAL", A4_W - MARGIN_X - 25.5, y + 10.5, { align: "center" })
  doc.setFontSize(9.5); doc.setFont("helvetica", "bold")
  doc.text(status.label, A4_W - MARGIN_X - 25.5, y + 16.5, { align: "center" })
  y += 33

  section("Resumo")
  paragraph(analysis.resumo)

  section("Emissão de Certidão (CND)")
  paragraph(analysis.podeEmitirCND)

  // Pendências
  section(`Pendências identificadas (${analysis.pendencias.length})`)
  if (!analysis.pendencias.length) {
    paragraph("Nenhuma pendência identificada nos documentos analisados.", 10, "italic", [22, 120, 60])
  } else {
    const total = analysis.pendencias.reduce((s, p) => s + (p.valor || 0), 0)
    if (total > 0) paragraph(`Valor total identificado: ${brl(total)}`, 10, "bold", [30, 30, 30])
    const gColor = { ALTA: [220, 38, 38], MEDIA: [217, 119, 6], BAIXA: [100, 116, 139] } as const
    analysis.pendencias.forEach((p, i) => {
      ensure(22)
      const c = gColor[p.gravidade] as unknown as [number, number, number]
      doc.setFillColor(...c); doc.circle(MARGIN_X + 1.6, y - 1.2, 1.6, "F")
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30)
      const head = `${i + 1}. ${p.tipo} — ${p.orgao}`
      doc.text(doc.splitTextToSize(head, contentW - 45)[0], MARGIN_X + 5, y)
      doc.setFontSize(8); doc.setTextColor(...c)
      doc.text(`GRAVIDADE ${p.gravidade === "MEDIA" ? "MÉDIA" : p.gravidade}`, A4_W - MARGIN_X, y, { align: "right" })
      y += 5
      const meta = [p.periodo && `Período: ${p.periodo}`, p.valor > 0 && `Valor: ${brl(p.valor)}`].filter(Boolean).join("   |   ")
      if (meta) paragraph(meta, 8.5, "bold", [90, 90, 90], 5)
      paragraph(p.descricao, 9.5, "normal", [50, 50, 50], 5)
      paragraph(`Como regularizar: ${p.recomendacao}`, 9, "italic", [...color] as [number, number, number], 5)
      y += 2
    })
  }

  if (analysis.parcelamentos.length) {
    section("Parcelamentos")
    analysis.parcelamentos.forEach(p => {
      paragraph(`• ${p.descricao} — ${p.situacao}`, 9.5, "bold", [40, 40, 40])
      if (p.observacao) paragraph(p.observacao, 9, "normal", [90, 90, 90], 4)
    })
  }

  if (analysis.pontosPositivos.length) {
    section("Pontos positivos")
    analysis.pontosPositivos.forEach(t => paragraph(`✓  ${t}`.replace("✓", "+"), 9.5, "normal", [22, 110, 60]))
  }

  section("Plano de ação recomendado")
  analysis.recomendacoes.forEach((r, i) => paragraph(`${i + 1}. ${r}`, 9.5))

  section("Conclusão")
  paragraph(analysis.conclusao)

  // Assinatura
  ensure(30); y += 12
  doc.setDrawColor(150); doc.line(A4_W / 2 - 40, y, A4_W / 2 + 40, y); y += 5
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30)
  doc.text(opts.preparedBy || lh.responsible || lh.companyName || "Prosperare", A4_W / 2, y, { align: "center" }); y += 4.5
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(110)
  const sub = [lh.crc && `CRC ${lh.crc}`, lh.companyName].filter(Boolean).join(" • ")
  if (sub) doc.text(sub, A4_W / 2, y, { align: "center" })

  // Numeração e data em todas as páginas
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(140)
    doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}  •  Página ${i} de ${pages}`, A4_W - MARGIN_X, A4_H - footerH - 3, { align: "right" })
  }

  const fileName = `Analise_Fiscal_${(opts.clientName || analysis.contribuinteNome || "cliente").replace(/[^\w]+/g, "_")}.pdf`
  doc.save(fileName)
}

/** Redimensiona/comprime imagem para caber no Firestore (limite 1MB por documento). */
export function compressImage(file: File, maxW = 1700, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext("2d")!
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
