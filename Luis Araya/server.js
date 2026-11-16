import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const ROOT = resolve(import.meta.dirname);

const FILES = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/src/app.js", ["src/app.js", "text/javascript; charset=utf-8"]],
  ["/src/horizon.js", ["src/horizon.js", "text/javascript; charset=utf-8"]],
  ["/src/payments.js", ["src/payments.js", "text/javascript; charset=utf-8"]],
  ["/src/relata-ui.js", ["src/relata-ui.js", "text/javascript; charset=utf-8"]],
  ["/vendor/stellar-wallets-kit/index.js", ["vendor/stellar-wallets-kit/index.js", "text/javascript; charset=utf-8"]],
  ["/vendor/stellar-wallets-kit/NOTICE.md", ["vendor/stellar-wallets-kit/NOTICE.md", "text/markdown; charset=utf-8"]],
]);

const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }
  let path;
  try {
    path = new URL(req.url ?? "/", `http://${HOST}:${PORT}`).pathname;
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad Request");
    return;
  }
  const entry = FILES.get(path);
  if (!entry) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }
  const [relativePath, contentType] = entry;
  const content = await readFile(resolve(ROOT, relativePath));
  res.writeHead(200, { "Content-Type": contentType });
  res.end(req.method === "HEAD" ? undefined : content);
});

server.listen(PORT, HOST, () => {
  console.log(`Relata disponible en local: http://${HOST}:${PORT}`);
});
