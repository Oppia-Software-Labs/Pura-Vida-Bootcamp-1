import type {
  BookContent,
  BookDetail,
  BookSummary,
  CreateBookInput,
  LibraryResponse,
  PlatformConfig,
  PurchaseAccess,
  PurchaseQuote,
  ReviewResult,
} from "../../shared/types";

const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ErrorBody {
  error?: string;
  code?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let body: ErrorBody = {};

    try {
      body = (await response.json()) as ErrorBody;
    } catch {
      body = {};
    }

    throw new ApiError(
      body.error ?? "No se pudo completar la solicitud.",
      response.status,
      body.code,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getConfig: () => request<PlatformConfig>("/config"),

  getBooks: () => request<BookSummary[]>("/books"),

  getBook: (bookId: string) =>
    request<BookDetail>(`/books/${encodeURIComponent(bookId)}`),

  createBook: (input: CreateBookInput) =>
    request<BookDetail>("/books", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getContent: (bookId: string, accessToken: string) =>
    request<BookContent>(`/books/${encodeURIComponent(bookId)}/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  getQuote: (bookId: string, reader: string) =>
    request<PurchaseQuote>("/purchases/quote", {
      method: "POST",
      body: JSON.stringify({ bookId, reader }),
    }),

  confirmPurchase: (bookId: string, reader: string, txHash: string) =>
    request<PurchaseAccess>("/purchases/confirm", {
      method: "POST",
      body: JSON.stringify({ bookId, reader, txHash }),
    }),

  submitReview: (input: {
    bookId: string;
    accessToken: string;
    rating: number;
    text: string;
    readerName?: string;
  }) =>
    request<ReviewResult>("/reviews", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getLibrary: (address: string) =>
    request<LibraryResponse>(`/library/${encodeURIComponent(address)}`),

  fundAccount: (address: string) =>
    request<{ funded: boolean; alreadyFunded?: boolean }>("/fund", {
      method: "POST",
      body: JSON.stringify({ address }),
    }),
};
