export const OFFICIAL_LETTERHEAD_PATH = "/timbrado-padrao.png"
export const OFFICIAL_LETTERHEAD_FILE_NAME = "timbrado com endereço.png"

export const OFFICIAL_LETTERHEAD_MARGINS_MM = {
  top: 38,
  right: 20,
  bottom: 32,
  left: 20,
} as const

let officialLetterheadDataUrlPromise: Promise<string> | null = null

/**
 * Carrega o papel timbrado oficial como data URL para geradores de PDF/DOCX.
 * O resultado é compartilhado durante a sessão para evitar leituras repetidas.
 */
export function loadOfficialLetterheadDataUrl(): Promise<string> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("O papel timbrado deve ser carregado no navegador."))
  }

  if (!officialLetterheadDataUrlPromise) {
    officialLetterheadDataUrlPromise = fetch(OFFICIAL_LETTERHEAD_PATH)
      .then((response) => {
        if (!response.ok) throw new Error("Não foi possível carregar o papel timbrado oficial.")
        return response.blob()
      })
      .then((blob) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o papel timbrado oficial."))
        reader.readAsDataURL(blob)
      }))
      .catch((error) => {
        officialLetterheadDataUrlPromise = null
        throw error
      })
  }

  return officialLetterheadDataUrlPromise
}

type PdfDocument = {
  internal: { pageSize: { getWidth(): number; getHeight(): number } }
  addPage(): unknown
  addImage(
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number,
    alias?: string,
    compression?: string,
  ): unknown
}

/** Aplica o fundo oficial à página atual de um PDF. */
export async function addOfficialLetterheadPage(pdf: PdfDocument): Promise<void> {
  const image = await loadOfficialLetterheadDataUrl()
  pdf.addImage(
    image,
    "PNG",
    0,
    0,
    pdf.internal.pageSize.getWidth(),
    pdf.internal.pageSize.getHeight(),
    undefined,
    "FAST",
  )
}

/**
 * Pagina uma captura HTML dentro da área livre do papel timbrado.
 * O recorte por página impede que tabelas cubram o cabeçalho e o rodapé.
 */
export async function addCanvasToOfficialPdf(pdf: PdfDocument, source: HTMLCanvasElement): Promise<void> {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - OFFICIAL_LETTERHEAD_MARGINS_MM.left - OFFICIAL_LETTERHEAD_MARGINS_MM.right
  const contentHeight = pageHeight - OFFICIAL_LETTERHEAD_MARGINS_MM.top - OFFICIAL_LETTERHEAD_MARGINS_MM.bottom
  const pixelsPerMm = source.width / contentWidth
  const sliceHeightPx = Math.max(1, Math.floor(contentHeight * pixelsPerMm))
  let sourceY = 0
  let pageIndex = 0

  while (sourceY < source.height) {
    if (pageIndex > 0) pdf.addPage()
    await addOfficialLetterheadPage(pdf)

    const currentSliceHeight = Math.min(sliceHeightPx, source.height - sourceY)
    const slice = document.createElement("canvas")
    slice.width = source.width
    slice.height = currentSliceHeight
    const context = slice.getContext("2d")
    if (!context) throw new Error("Não foi possível preparar a página do relatório.")
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, slice.width, slice.height)
    context.drawImage(source, 0, sourceY, source.width, currentSliceHeight, 0, 0, source.width, currentSliceHeight)

    pdf.addImage(
      slice.toDataURL("image/png"),
      "PNG",
      OFFICIAL_LETTERHEAD_MARGINS_MM.left,
      OFFICIAL_LETTERHEAD_MARGINS_MM.top,
      contentWidth,
      currentSliceHeight / pixelsPerMm,
      undefined,
      "FAST",
    )

    sourceY += currentSliceHeight
    pageIndex += 1
  }
}
