"use client"

import { doc } from "firebase/firestore"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import {
  OFFICIAL_LETTERHEAD_FILE_NAME,
  OFFICIAL_LETTERHEAD_MARGINS_MM,
  OFFICIAL_LETTERHEAD_PATH,
} from "@/lib/official-letterhead"

/**
 * Papel timbrado oficial do escritório.
 * Armazenado em Firestore: officeSettings/letterhead
 * Usado como fundo (página A4 inteira) em todos os documentos oficiais.
 */
export interface LetterheadSettings {
  imageDataUrl: string
  fileName?: string
  /** Margens de conteúdo em milímetros (área livre do timbrado) */
  marginTopMm: number
  marginBottomMm: number
  marginLeftMm: number
  marginRightMm: number
  updatedAt?: string
}

export const DEFAULT_LETTERHEAD: LetterheadSettings = {
  imageDataUrl: OFFICIAL_LETTERHEAD_PATH,
  fileName: OFFICIAL_LETTERHEAD_FILE_NAME,
  marginTopMm: OFFICIAL_LETTERHEAD_MARGINS_MM.top,
  marginBottomMm: OFFICIAL_LETTERHEAD_MARGINS_MM.bottom,
  marginLeftMm: OFFICIAL_LETTERHEAD_MARGINS_MM.left,
  marginRightMm: OFFICIAL_LETTERHEAD_MARGINS_MM.right,
}

export const LETTERHEAD_DOC_PATH = ["officeSettings", "letterhead"] as const

export function useLetterhead() {
  const firestore = useFirestore()
  const ref = useMemoFirebase(() => doc(firestore, ...LETTERHEAD_DOC_PATH), [firestore])
  const { data, isLoading } = useDoc(ref)
  const letterhead: LetterheadSettings = {
    ...DEFAULT_LETTERHEAD,
    ...((data as Partial<LetterheadSettings>) || {}),
  }
  if (!letterhead.imageDataUrl) letterhead.imageDataUrl = DEFAULT_LETTERHEAD.imageDataUrl
  return { letterhead, isLoading, ref }
}

/** Converte qualquer URL (inclusive /public) em data URL base64 — útil para enviar ao servidor (DOCX). */
export async function letterheadToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url
  const res = await fetch(url)
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}
