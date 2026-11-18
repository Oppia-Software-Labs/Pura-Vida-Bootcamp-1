import { helpByLevel, ravenDocs } from "../../content/raven-fallback/entries.ts";
import type { Level } from "../journey.ts";
import type { RavenAnswer, RavenQuestion } from "./shared.ts";

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function fallbackAnswer({ pregunta, nivel }: RavenQuestion): RavenAnswer {
  const question = ` ${normalize(pregunta)} `;
  let match: (typeof helpByLevel)[Level][number] | undefined;
  let bestScore = 0;

  for (const [step, entries] of Object.entries(helpByLevel)) {
    for (const entry of entries) {
      const score = entry.palabras.reduce(
        (total, word) => question.includes(` ${word} `) ? total + word.split(" ").length : total, 0,
      );
      const weighted = score + (score > 0 && Number(step) === nivel ? .5 : 0);
      if (weighted > bestScore) {
        bestScore = weighted;
        match = entry;
      }
    }
  }

  if (!match) {
    return {
      respuesta: "En este modo puedo ayudarte con las preguntas preparadas del recorrido. Probá una de las sugerencias para consultar conceptos de Stellar, Freighter, Testnet o el pago de prueba.",
      fuentes: [ravenDocs],
      modo: "fallback",
    };
  }

  return { respuesta: match.respuesta, fuentes: match.fuentes, modo: "fallback" };
}
