type Celda = string | number | null | undefined

function escapar(valor: Celda) {
  const s = valor == null ? "" : String(valor)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function descargarCSV(nombreArchivo: string, encabezados: string[], filas: Celda[][]) {
  const contenido = [encabezados, ...filas].map((f) => f.map(escapar).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombreArchivo.endsWith(".csv") ? nombreArchivo : `${nombreArchivo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const escaparHTML = (s: Celda) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

/** Abre una vista imprimible para guardar como PDF desde el navegador. */
export function exportarPDF(titulo: string, subtitulo: string, encabezados: string[], filas: Celda[][]) {
  const ventana = window.open("", "_blank")
  if (!ventana) return false
  ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escaparHTML(titulo)}</title>
  <style>body{font-family:Inter,system-ui,sans-serif;color:#1b1c33;padding:32px}h1{font-size:20px;margin:0}p{color:#7f82a3;margin:4px 0 20px;font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;background:#f2f1fd;color:#4b3bb0;padding:8px}td{padding:8px;border-bottom:1px solid #e4e6f3}</style>
  </head><body><h1>${escaparHTML(titulo)}</h1><p>${escaparHTML(subtitulo)}</p><table><thead><tr>${encabezados
    .map((h) => `<th>${escaparHTML(h)}</th>`)
    .join("")}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${escaparHTML(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <script>window.onload=()=>{window.print()}</script></body></html>`)
  ventana.document.close()
  return true
}
