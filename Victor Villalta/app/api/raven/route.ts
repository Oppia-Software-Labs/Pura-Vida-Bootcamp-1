import { NextResponse } from "next/server";
import { isLevel } from "@/lib/journey";
import { askRaven, ravenMode } from "@/lib/raven";
import { hasSensitiveText, MAX_QUESTION_LENGTH, omitPublicAddresses, SENSITIVE_NOTICE } from "@/lib/raven/shared";

export const runtime = "nodejs";
export const maxDuration = 60;
const RESPONSE_HEADERS = { "Cache-Control": "no-store" };

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Cuerpo vacío");

  const decoder = new TextDecoder();
  let content = "";
  let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        throw new Error("Cuerpo demasiado largo");
      }
      content += decoder.decode(value, { stream: true });
    }
    return JSON.parse(content + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

export function GET() {
  return NextResponse.json({ modo: ravenMode() }, { headers: RESPONSE_HEADERS });
}

export async function POST(request: Request) {
  function badRequest(error: string) {
    return NextResponse.json({ error }, { status: 400, headers: RESPONSE_HEADERS });
  }

  let input: unknown;
  try {
    input = await readBody(request);
  } catch {
    return badRequest("Escribí una pregunta breve para Raven e intentá de nuevo.");
  }

  if (!input || typeof input !== "object") return badRequest("Mandá una pregunta y el nivel del recorrido.");
  const { pregunta, nivel } = input as { pregunta?: unknown; nivel?: unknown };
  if (typeof pregunta !== "string" || !pregunta.trim() || pregunta.length > MAX_QUESTION_LENGTH || !isLevel(nivel)) {
    return badRequest(`Escribí una pregunta de hasta ${MAX_QUESTION_LENGTH} caracteres y elegí un nivel válido.`);
  }
  if (hasSensitiveText(pregunta)) return badRequest(SENSITIVE_NOTICE);

  // direccionPublica es opcional en el contrato. La ayuda no necesita identificar la cuenta.
  const answer = await askRaven({ pregunta: omitPublicAddresses(pregunta.trim()), nivel });
  return NextResponse.json(answer, { headers: RESPONSE_HEADERS });
}
