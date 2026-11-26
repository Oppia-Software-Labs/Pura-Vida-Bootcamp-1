// Servidor web mínimo, SIN dependencias (solo Node.js).
// Sirve los archivos de esta carpeta en http://localhost:5173
// Las wallets como Varial (antes Freighter) no funcionan abriendo el HTML con doble clic (file://),
// por eso usamos este pequeño servidor local.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 5173;
const ROOT = __dirname;
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function responder(res, codigo, texto) {
  res.writeHead(codigo, { "Content-Type": "text/plain; charset=utf-8" }).end(texto);
}

const server = http.createServer((req, res) => {
  let ruta;
  try {
    // Base fija: no dependemos del encabezado Host (podría venir mal formado).
    ruta = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return responder(res, 400, "Petición inválida"); // ej. "%E0%A4%A" mal codificado
  }
  if (ruta === "/") ruta = "/index.html";

  const archivo = path.join(ROOT, ruta);
  const relativa = path.relative(ROOT, archivo);
  // Seguridad: no permitir salir de la carpeta del proyecto (../) ni servir
  // archivos ocultos como .env o .git, ni rutas con caracteres nulos.
  if (
    ruta.includes("\0") ||
    relativa.startsWith("..") ||
    path.isAbsolute(relativa) ||
    relativa.split(path.sep).some((parte) => parte.startsWith("."))
  ) {
    return responder(res, 403, "Prohibido");
  }

  fs.readFile(archivo, (err, datos) => {
    if (err) return responder(res, 404, "No encontrado");
    const tipo = TIPOS[path.extname(archivo).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": tipo, "X-Content-Type-Options": "nosniff" }).end(datos);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Stellar Aprende Lab corriendo en http://localhost:${PORT}`);
  console.log("Presiona Ctrl + C para detenerlo.");
});
