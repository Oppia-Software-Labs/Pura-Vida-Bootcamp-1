export const LEVELS = [
  { id: 1, name: "El nido", subject: "Conocé Stellar", icon: "nest" },
  { id: 2, name: "La eclosión", subject: "Conectá tu wallet", icon: "egg" },
  { id: 3, name: "La caminata", subject: "Explorá tu cuenta", icon: "steps" },
  { id: 4, name: "El mar", subject: "Enviá un pago de prueba", icon: "waves" },
] as const;

export type Level = (typeof LEVELS)[number]["id"];
export type Progress = 0 | Level;

export function isLevel(value: unknown): value is Level {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function nextLevel(progress: Progress): Level {
  return progress === 4 ? 4 : (progress + 1) as Level;
}

export function advanceProgress(progress: Progress, completed: Level): Progress {
  return completed === progress + 1 ? completed : progress;
}
