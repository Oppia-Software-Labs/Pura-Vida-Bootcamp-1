import "server-only";
import { fallbackAnswer } from "./fallback";
import { liveAnswer, liveConfiguration } from "./live";
import type { RavenAnswer, RavenQuestion } from "./shared";

export function ravenMode() {
  return liveConfiguration() ? "configured" : "fallback";
}

export async function askRaven(question: RavenQuestion): Promise<RavenAnswer> {
  const configuration = liveConfiguration();
  if (configuration) {
    try {
      return await liveAnswer(question, configuration);
    } catch {
      // Si falta evidencia o una credencial dejó de funcionar, usamos la ayuda local.
    }
  }
  return fallbackAnswer(question);
}
