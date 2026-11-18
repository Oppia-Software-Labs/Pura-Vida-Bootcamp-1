import type { Level } from "../../lib/journey.ts";

export const MAX_QUESTION_LENGTH = 400;
export const TESTNET_REMINDER = "Recordá que estás en Testnet, una red para practicar sin dinero real.";
export const SENSITIVE_NOTICE = "Quitá claves, frases de recuperación o datos personales antes de enviar tu pregunta.";

export type RavenMode = "live" | "fallback";
export type RavenQuestion = { pregunta: string; nivel: Level };
export type RavenSource = { titulo: string; url: string };
export type RavenAnswer = { respuesta: string; fuentes: RavenSource[]; modo: RavenMode };

const sensitive = [
  /(?:^|[^a-z0-9])S[A-Z2-7]{55}(?![a-z0-9])/i,
  /\b(?:sk-[a-z0-9_-]{12,}|ghp_[a-z0-9]{12,}|xox[baprs]-[a-z0-9-]{12,})\b/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:frase(?:\s+de\s+recuperaci[oó]n|\s+semilla)?|mnemonic|seed phrase|clave secreta|contraseña|api[_ -]?key|token)\s*(?:[:=]|\bes\b)\s*[^?\s]{3}/i,
  /\bBearer\s+[a-z0-9._:-]{12,}/i,
];

export function hasSensitiveText(question: string) {
  if (sensitive.some((pattern) => pattern.test(question))) return true;

  // Una línea de palabras sueltas puede ser una frase de recuperación pegada.
  return question.split(/\r?\n/).some((line) => {
    const words = line.trim().split(/\s+/);
    return [12, 15, 18, 21, 24].includes(words.length) && words.every((word) => /^\p{L}{3,12}$/u.test(word))
      && !/^(como|cómo|que|qué|cual|cuál|cuando|cuándo|donde|dónde|por|puedo|quiero)\b/i.test(line.trim());
  });
}

export function omitPublicAddresses(question: string) {
  return question.replace(/\bG[A-Z2-7]{55}\b/gi, "[dirección pública]");
}
