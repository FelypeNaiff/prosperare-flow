"use client"

import React, { forwardRef } from "react"
import type { Block, Seg } from "@/lib/contract-templates"
import type { LetterheadSettings } from "@/hooks/use-letterhead"

/**
 * Renderização de documentos oficiais com papel timbrado.
 * Usa estilos inline para que o HTML possa ser reaproveitado na janela de impressão.
 */

const NAVY = "#1F3864"

const Segs = ({ segs, highlight }: { segs: Seg[]; highlight: boolean }) => (
  <>
    {segs.map((s, i) => (
      <span key={i} style={{ fontWeight: s.b ? 700 : undefined, background: s.hl && highlight ? "#FFF200" : undefined }}>{s.t}</span>
    ))}
  </>
)

export function BlocksRenderer({ blocks, highlight = true }: { blocks: Block[]; highlight?: boolean }) {
  return (
    <div style={{ fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif", fontSize: "10.5pt", lineHeight: 1.45, color: "#1e293b" }}>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "title":
            return <h2 key={i} style={{ textAlign: "center", color: NAVY, fontSize: "15pt", fontWeight: 700, margin: "0 0 2pt" }}>{block.text}</h2>
          case "subtitle":
            return <p key={i} style={{ textAlign: "center", color: NAVY, fontSize: "7.5pt", fontWeight: 700, margin: "0 0 12pt" }}>{block.text}</p>
          case "box":
            return (
              <div key={i} style={{ border: "1px solid #B4C6E7", background: "#F2F6FC", padding: "8pt 10pt", margin: "0 0 10pt", textAlign: "justify" }}>
                {block.lines.map((l, j) => <p key={j} style={{ margin: j === block.lines.length - 1 ? 0 : "0 0 6pt" }}><Segs segs={l} highlight={highlight} /></p>)}
              </div>
            )
          case "heading":
            return <h3 key={i} style={{ color: NAVY, fontSize: "10.5pt", fontWeight: 700, margin: "10pt 0 3pt", breakAfter: "avoid" }}>{block.text}</h3>
          case "para":
            return <p key={i} style={{ textAlign: "justify", margin: "0 0 5pt" }}><Segs segs={block.segs} highlight={highlight} /></p>
          case "item":
            return <p key={i} style={{ textAlign: "justify", margin: "0 0 3pt", paddingLeft: "10mm" }}><Segs segs={block.segs} highlight={highlight} /></p>
          case "date":
            return <p key={i} style={{ textAlign: "right", margin: "14pt 0 48pt" }}><Segs segs={block.segs} highlight={highlight} /></p>
          case "signatures":
            return (
              <div key={i} style={{ display: "flex", gap: "10mm", textAlign: "center", breakInside: "avoid" }}>
                {[block.left, block.right].map((lines, j) => (
                  <div key={j} style={{ flex: 1, borderTop: "1px solid #000", paddingTop: "3pt" }}>
                    {lines.map((t, k) => <div key={k} style={{ fontWeight: k === 0 ? 700 : 400, color: k === 0 ? NAVY : undefined }}>{t}</div>)}
                  </div>
                ))}
              </div>
            )
          case "witnesses":
            return (
              <div key={i} style={{ marginTop: "24pt", breakInside: "avoid" }}>
                <p style={{ fontWeight: 700, color: NAVY, margin: "0 0 14pt" }}>TESTEMUNHAS:</p>
                <div style={{ display: "flex", gap: "10mm" }}>
                  {["1.", "2."].map(n => (
                    <div key={n} style={{ flex: 1 }}>
                      <div>{n} ____________________________________</div>
                      <div>Nome:</div>
                      <div>CPF:</div>
                    </div>
                  ))}
                </div>
              </div>
            )
        }
      })}
    </div>
  )
}

/** Folha A4 contínua com papel timbrado repetido a cada página (visualização em tela). */
export const LetterheadSheet = forwardRef<HTMLDivElement, { letterhead: LetterheadSettings; children: React.ReactNode }>(
  ({ letterhead, children }, ref) => (
    <div
      className="mx-auto my-6 bg-white shadow-xl"
      style={{
        width: "210mm",
        minHeight: "297mm",
        backgroundImage: `url(${letterhead.imageDataUrl})`,
        backgroundSize: "210mm 297mm",
        backgroundRepeat: "repeat-y",
        padding: `${letterhead.marginTopMm}mm ${letterhead.marginRightMm}mm ${letterhead.marginBottomMm}mm ${letterhead.marginLeftMm}mm`,
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  )
)
LetterheadSheet.displayName = "LetterheadSheet"

/**
 * Imprime / salva em PDF qualquer HTML com o papel timbrado em TODAS as páginas.
 * Técnica: imagem fixa (repete por página) + thead/tfoot espaçadores que reservam as margens.
 */
export function printWithLetterhead(contentHtml: string, letterhead: LetterheadSettings, title = "Documento") {
  const w = window.open("", "_blank")
  if (!w) return
  const bg = letterhead.imageDataUrl.startsWith("data:") ? letterhead.imageDataUrl : new URL(letterhead.imageDataUrl, window.location.origin).href
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bg { position: fixed; top: 0; left: 0; width: 210mm; height: 297mm; z-index: -1; }
  table.page { width: 210mm; border-collapse: collapse; }
  td.content { padding: 0 ${letterhead.marginRightMm}mm 0 ${letterhead.marginLeftMm}mm; }
  .sp-top { height: ${letterhead.marginTopMm}mm; }
  .sp-bottom { height: ${letterhead.marginBottomMm}mm; }
</style></head><body>
<img class="bg" src="${bg}" />
<table class="page">
  <thead><tr><td><div class="sp-top"></div></td></tr></thead>
  <tfoot><tr><td><div class="sp-bottom"></div></td></tr></tfoot>
  <tbody><tr><td class="content">${contentHtml}</td></tr></tbody>
</table>
<script>
  const img = document.querySelector('.bg');
  const go = () => setTimeout(() => { window.focus(); window.print(); }, 200);
  if (img.complete) go(); else { img.onload = go; img.onerror = go; }
</script>
</body></html>`)
  w.document.close()
}
