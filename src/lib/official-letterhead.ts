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
