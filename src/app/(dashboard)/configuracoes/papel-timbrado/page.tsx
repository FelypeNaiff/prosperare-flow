"use client"

import { useEffect, useRef, useState } from "react"
import { Upload, Save, RotateCcw, Loader2, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { setDocumentNonBlocking } from "@/firebase"
import { useLetterhead, DEFAULT_LETTERHEAD, LetterheadSettings } from "@/hooks/use-letterhead"

// Redimensiona para A4 @150dpi e comprime (limite de 1MB por documento no Firestore)
async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const W = 1240, H = 1754
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, W, H)
    ctx.drawImage(img, 0, 0, W, H)
    let q = 0.85
    let out = canvas.toDataURL("image/jpeg", q)
    while (out.length > 900_000 && q > 0.4) {
      q -= 0.1
      out = canvas.toDataURL("image/jpeg", q)
    }
    return out
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function PapelTimbradoPage() {
  const { letterhead, isLoading, ref } = useLetterhead()
  const [form, setForm] = useState<LetterheadSettings>(DEFAULT_LETTERHEAD)
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading) setForm(letterhead)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  const handleFile = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Envie o timbrado como imagem (PNG ou JPG).", variant: "destructive" })
      return
    }
    setProcessing(true)
    try {
      const dataUrl = await compressImage(file)
      setForm(f => ({ ...f, imageDataUrl: dataUrl, fileName: file.name }))
    } catch {
      toast({ title: "Erro ao processar imagem", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  const handleSave = () => {
    setDocumentNonBlocking(ref, { ...form, updatedAt: new Date().toISOString() }, { merge: true })
    toast({ title: "Papel timbrado salvo!", description: "Será aplicado em todos os documentos oficiais." })
  }

  const num = (k: keyof LetterheadSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: Math.max(0, Number(e.target.value)) }))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-[#2C4156] tracking-tight">Papel Timbrado</h1>
        <p className="text-[#98A7AA] font-medium text-sm">Modelo oficial aplicado em contratos e demais documentos emitidos pelo sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <Card className="border-[#D2D7DB] h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#2C4156]">Modelo</CardTitle>
            <CardDescription className="text-xs">Imagem A4 (retrato) em PNG ou JPG. Será esticada para a página inteira.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            <Button id="btn-upload-timbrado" variant="outline" className="w-full gap-2 h-11" onClick={() => inputRef.current?.click()} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Enviar novo timbrado
            </Button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileImage className="h-4 w-4" /> <span className="truncate">{form.fileName || "—"}</span>
            </div>

            <div>
              <Label className="text-xs font-black text-[#2C4156] uppercase tracking-wider">Margens do conteúdo (mm)</Label>
              <p className="text-[11px] text-slate-500 mb-2">Ajuste para o texto não sobrepor cabeçalho e rodapé do timbrado.</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-[11px]">Superior</Label><Input type="number" value={form.marginTopMm} onChange={num("marginTopMm")} /></div>
                <div><Label className="text-[11px]">Inferior</Label><Input type="number" value={form.marginBottomMm} onChange={num("marginBottomMm")} /></div>
                <div><Label className="text-[11px]">Esquerda</Label><Input type="number" value={form.marginLeftMm} onChange={num("marginLeftMm")} /></div>
                <div><Label className="text-[11px]">Direita</Label><Input type="number" value={form.marginRightMm} onChange={num("marginRightMm")} /></div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="gap-2" onClick={() => setForm(DEFAULT_LETTERHEAD)}>
                <RotateCcw className="h-4 w-4" /> Padrão
              </Button>
              <Button id="btn-salvar-timbrado" className="flex-1 bg-[#2563EB] hover:bg-[#2563EB]/90 gap-2 font-bold" onClick={handleSave}>
                <Save className="h-4 w-4" /> Salvar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#D2D7DB] bg-slate-100">
          <CardContent className="p-6 flex justify-center">
            <div
              className="relative bg-white shadow-xl w-full max-w-[595px] aspect-[210/297] bg-no-repeat"
              style={{ backgroundImage: `url(${form.imageDataUrl})`, backgroundSize: "100% 100%" }}
            >
              <div
                className="absolute border-2 border-dashed border-blue-400/70 bg-blue-50/20 flex items-center justify-center text-[11px] font-bold text-blue-500"
                style={{
                  top: `${(form.marginTopMm / 297) * 100}%`,
                  bottom: `${(form.marginBottomMm / 297) * 100}%`,
                  left: `${(form.marginLeftMm / 210) * 100}%`,
                  right: `${(form.marginRightMm / 210) * 100}%`,
                }}
              >
                ÁREA DO CONTEÚDO
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
