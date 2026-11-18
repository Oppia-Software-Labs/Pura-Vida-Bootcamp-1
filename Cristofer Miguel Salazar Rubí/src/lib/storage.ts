const ACCESS_KEY = "folio.access.v1";
const PROGRESS_KEY = "folio.progress.v1";
const READER_KEY = "folio.reader.v1";

type AccessMap = Record<string, string>;
type ProgressMap = Record<string, { chapter: number; updatedAt: string }>;

export interface ReaderPreferences {
  fontSize: number;
  theme: "paper" | "sepia" | "night";
}

const DEFAULT_READER: ReaderPreferences = {
  fontSize: 19,
  theme: "paper",
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private mode; the session still works.
  }
}

export function getAccessToken(bookId: string): string | null {
  return readJson<AccessMap>(ACCESS_KEY, {})[bookId] ?? null;
}

export function saveAccessToken(bookId: string, token: string): void {
  const access = readJson<AccessMap>(ACCESS_KEY, {});
  access[bookId] = token;
  writeJson(ACCESS_KEY, access);
}

export function listAccessBookIds(): string[] {
  return Object.keys(readJson<AccessMap>(ACCESS_KEY, {}));
}

export function getProgress(bookId: string): number {
  return readJson<ProgressMap>(PROGRESS_KEY, {})[bookId]?.chapter ?? 0;
}

export function saveProgress(bookId: string, chapter: number): void {
  const progress = readJson<ProgressMap>(PROGRESS_KEY, {});
  progress[bookId] = {
    chapter,
    updatedAt: new Date().toISOString(),
  };
  writeJson(PROGRESS_KEY, progress);
}

export function getReaderPreferences(): ReaderPreferences {
  return readJson<ReaderPreferences>(READER_KEY, DEFAULT_READER);
}

export function saveReaderPreferences(preferences: ReaderPreferences): void {
  writeJson(READER_KEY, preferences);
}
