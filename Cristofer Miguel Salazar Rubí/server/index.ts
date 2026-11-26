import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { StrKey } from "@stellar/stellar-sdk";
import { z } from "zod";
import type {
  BookDetail,
  BookTheme,
  CreateBookInput,
  LibraryResponse,
  PlatformConfig,
  PurchaseAccess,
  PurchaseQuote,
  ReadingToken,
  ReviewResult,
} from "../shared/types";
import {
  addPurchase,
  completeReview,
  computeAmounts,
  createListing,
  FEE_PERCENT,
  findPurchaseByAccessToken,
  findPurchaseByBookAndReader,
  findPurchaseByTx,
  getBook,
  getBookContent,
  getBookDetail,
  getLibrary,
  hasReviewFor,
  listBooks,
  parseBookContent,
} from "./store";
import {
  buildPurchaseXdr,
  ensureAccountExists,
  EXPLORER_URL,
  FRIEND_BOT_URL,
  fundWithFriendbot,
  getIssuer,
  getIssuerAddress,
  HORIZON_URL,
  issueBookToken,
  StellarServiceError,
  verifyPurchaseTransaction,
} from "./stellar";

const SERVER_DIR = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(SERVER_DIR, "..", "dist");

class HttpError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

function asyncRoute(
  handler: (request: Request, response: Response) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    handler(request, response).catch(next);
  };
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".");
    const message = issue?.message ?? "Datos inválidos.";
    throw new HttpError(
      400,
      field && field.length > 0 ? `${field}: ${message}` : message,
      "VALIDATION",
    );
  }
  return result.data;
}

function requireAddress(address: string, message = "La dirección Stellar no es válida."): string {
  const clean = address.trim();
  if (!StrKey.isValidEd25519PublicKey(clean)) {
    throw new HttpError(400, message, "INVALID_ADDRESS");
  }
  return clean;
}

const themeValues = [
  "forest",
  "ember",
  "ocean",
  "plum",
  "sand",
  "noir",
] as const satisfies readonly BookTheme[];

const themeSchema = z.enum(themeValues, {
  errorMap: () => ({ message: "Elige un tema válido." }),
});

const addressSchema = z
  .string({
    required_error: "La dirección Stellar es obligatoria.",
    invalid_type_error: "La dirección Stellar debe ser texto.",
  })
  .trim()
  .refine(
    (value) => StrKey.isValidEd25519PublicKey(value),
    "La dirección Stellar no es válida.",
  );

const bookIdSchema = z
  .string({
    required_error: "El libro es obligatorio.",
    invalid_type_error: "El identificador del libro debe ser texto.",
  })
  .trim()
  .min(1, "El identificador del libro es obligatorio.")
  .max(200, "El identificador del libro es demasiado largo.");

const optionalNameSchema = z
  .string({ invalid_type_error: "El nombre debe ser texto." })
  .trim()
  .max(40, "El nombre no puede superar 40 caracteres.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const priceSchema = z
  .string({
    required_error: "El precio es obligatorio.",
    invalid_type_error: "El precio debe ser texto decimal.",
  })
  .trim()
  .regex(
    /^\d+(\.\d{1,7})?$/,
    "El precio debe ser un decimal con máximo 7 decimales.",
  )
  .refine((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 10_000;
  }, "El precio debe estar entre 1 y 10000 XLM.");

const createBookSchema = z.object({
  title: z
    .string({
      required_error: "El título es obligatorio.",
      invalid_type_error: "El título debe ser texto.",
    })
    .trim()
    .min(2, "El título debe tener al menos 2 caracteres.")
    .max(120, "El título no puede superar 120 caracteres."),
  author: z
    .string({
      required_error: "El autor es obligatorio.",
      invalid_type_error: "El autor debe ser texto.",
    })
    .trim()
    .min(2, "El autor debe tener al menos 2 caracteres.")
    .max(80, "El autor no puede superar 80 caracteres."),
  synopsis: z
    .string({
      required_error: "La sinopsis es obligatoria.",
      invalid_type_error: "La sinopsis debe ser texto.",
    })
    .trim()
    .min(20, "La sinopsis debe tener al menos 20 caracteres.")
    .max(600, "La sinopsis no puede superar 600 caracteres."),
  price: priceSchema,
  theme: themeSchema,
  offerer: addressSchema,
  offererName: optionalNameSchema,
  content: z
    .string({
      required_error: "El contenido es obligatorio.",
      invalid_type_error: "El contenido debe ser texto.",
    })
    .min(200, "El contenido debe tener al menos 200 caracteres.")
    .max(300_000, "El contenido no puede superar 300000 caracteres."),
});

const quoteSchema = z.object({
  bookId: bookIdSchema,
  reader: addressSchema,
});

const confirmSchema = z.object({
  bookId: bookIdSchema,
  reader: addressSchema,
  txHash: z
    .string({
      required_error: "El hash de la transacción es obligatorio.",
      invalid_type_error: "El hash de la transacción debe ser texto.",
    })
    .trim()
    .regex(
      /^[a-fA-F0-9]{64}$/,
      "El hash de la transacción debe tener 64 caracteres hexadecimales.",
    )
    .transform((value) => value.toLowerCase()),
});

const reviewSchema = z.object({
  bookId: bookIdSchema,
  accessToken: z
    .string({
      required_error: "El token de acceso es obligatorio.",
      invalid_type_error: "El token de acceso debe ser texto.",
    })
    .trim()
    .min(1, "El token de acceso es obligatorio.")
    .max(200, "El token de acceso no es válido."),
  rating: z
    .number({
      required_error: "La calificación es obligatoria.",
      invalid_type_error: "La calificación debe ser un número.",
    })
    .int("La calificación debe ser un número entero.")
    .min(1, "La calificación debe estar entre 1 y 5.")
    .max(5, "La calificación debe estar entre 1 y 5."),
  text: z
    .string({
      required_error: "La reseña es obligatoria.",
      invalid_type_error: "La reseña debe ser texto.",
    })
    .trim()
    .min(20, "La reseña debe tener al menos 20 caracteres.")
    .max(2000, "La reseña no puede superar 2000 caracteres."),
  readerName: optionalNameSchema,
});

const fundSchema = z.object({
  address: addressSchema,
});

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/config", (_request, response) => {
  const issuer = getIssuerAddress();
  const config: PlatformConfig = {
    network: "testnet",
    horizonUrl: HORIZON_URL,
    platformAddress: issuer,
    issuer,
    feePercent: FEE_PERCENT,
    friendbotUrl: FRIEND_BOT_URL,
    explorerUrl: EXPLORER_URL,
  };
  response.json(config);
});

app.get("/api/books", (_request, response) => {
  response.json(listBooks());
});

app.get("/api/books/:id", (request, response) => {
  const bookId = String(request.params.id ?? "");
  const book = getBookDetail(bookId);
  if (!book) {
    throw new HttpError(404, "El libro no existe.", "BOOK_NOT_FOUND");
  }
  response.json(book);
});

app.post(
  "/api/books",
  asyncRoute(async (request, response) => {
    const input = parseBody(createBookSchema, request.body);
    const chapters = parseBookContent(input.content);
    const bookInput: CreateBookInput = {
      title: input.title,
      author: input.author,
      synopsis: input.synopsis,
      price: input.price,
      theme: input.theme,
      offerer: input.offerer,
      offererName: input.offererName,
      content: input.content,
    };
    const book: BookDetail = createListing(bookInput, chapters);
    response.status(201).json(book);
  }),
);

app.post(
  "/api/purchases/quote",
  asyncRoute(async (request, response) => {
    const input = parseBody(quoteSchema, request.body);
    const book = getBook(input.bookId);
    if (!book) {
      throw new HttpError(404, "El libro no existe.", "BOOK_NOT_FOUND");
    }
    if (book.offerer === input.reader) {
      throw new HttpError(
        400,
        "No puedes comprar tu propio libro.",
        "OWN_BOOK",
      );
    }
    if (findPurchaseByBookAndReader(book.id, input.reader)) {
      throw new HttpError(
        409,
        "Ya compraste este libro. Está en tu biblioteca.",
        "ALREADY_PURCHASED",
      );
    }

    const { platformFee, offererAmount } = computeAmounts(book.price);
    await ensureAccountExists(book.offerer);
    const issuer = await getIssuer();
    const xdr = await buildPurchaseXdr({
      reader: input.reader,
      offerer: book.offerer,
      issuer,
      assetCode: book.assetCode,
      offererAmount,
      platformFee,
    });

    const quote: PurchaseQuote = {
      bookId: book.id,
      reader: input.reader,
      amount: book.price,
      platformFee,
      offererAmount,
      feePercent: FEE_PERCENT,
      xdr,
      assetCode: book.assetCode,
      issuer,
      offerer: book.offerer,
    };
    response.json(quote);
  }),
);

const pendingTransactions = new Set<string>();

app.post(
  "/api/purchases/confirm",
  asyncRoute(async (request, response) => {
    const input = parseBody(confirmSchema, request.body);
    const book = getBook(input.bookId);
    if (!book) {
      throw new HttpError(404, "El libro no existe.", "BOOK_NOT_FOUND");
    }

    const existingByHash = findPurchaseByTx(input.txHash);
    if (existingByHash) {
      if (
        existingByHash.bookId === input.bookId &&
        existingByHash.reader === input.reader
      ) {
        throw new HttpError(
          409,
          "Este pago ya fue confirmado. Abre el libro desde el dispositivo donde hiciste la compra.",
          "ALREADY_CONFIRMED",
        );
      }
      throw new HttpError(
        409,
        "Esa transacción ya fue utilizada para otra compra.",
        "TX_ALREADY_USED",
      );
    }

    if (findPurchaseByBookAndReader(input.bookId, input.reader)) {
      throw new HttpError(
        409,
        "Ya compraste este libro. Está en tu biblioteca.",
        "ALREADY_PURCHASED",
      );
    }

    if (pendingTransactions.has(input.txHash)) {
      throw new HttpError(
        409,
        "Esa transacción ya se está confirmando.",
        "TX_PENDING",
      );
    }

    pendingTransactions.add(input.txHash);
    try {
      const { platformFee, offererAmount } = computeAmounts(book.price);
      await verifyPurchaseTransaction({
        txHash: input.txHash,
        reader: input.reader,
        offerer: book.offerer,
        issuer: getIssuerAddress(),
        assetCode: book.assetCode,
        offererAmount,
        platformFee,
      });

      const repeatedByHash = findPurchaseByTx(input.txHash);
      if (repeatedByHash) {
        if (
          repeatedByHash.bookId === input.bookId &&
          repeatedByHash.reader === input.reader
        ) {
          throw new HttpError(
            409,
            "Este pago ya fue confirmado. Abre el libro desde el dispositivo donde hiciste la compra.",
            "ALREADY_CONFIRMED",
          );
        }
        throw new HttpError(
          409,
          "Esa transacción ya fue utilizada para otra compra.",
          "TX_ALREADY_USED",
        );
      }

      if (findPurchaseByBookAndReader(input.bookId, input.reader)) {
        throw new HttpError(
          409,
          "Ya compraste este libro. Está en tu biblioteca.",
          "ALREADY_PURCHASED",
        );
      }

      const access: PurchaseAccess = addPurchase({
        bookId: book.id,
        reader: input.reader,
        amount: book.price,
        platformFee,
        offererAmount,
        txHash: input.txHash,
        accessToken: randomBytes(24).toString("hex"),
      });
      response.json(access);
    } finally {
      pendingTransactions.delete(input.txHash);
    }
  }),
);

app.get(
  "/api/books/:id/content",
  asyncRoute(async (request, response) => {
    const bookId = String(request.params.id ?? "");
    if (!getBook(bookId)) {
      throw new HttpError(404, "El libro no existe.", "BOOK_NOT_FOUND");
    }

    const header = request.get("authorization")?.trim() ?? "";
    const match = /^Bearer\s+(\S+)$/i.exec(header);
    if (!match?.[1]) {
      throw new HttpError(
        401,
        "Falta el token de acceso de lectura.",
        "UNAUTHORIZED",
      );
    }

    const purchase = findPurchaseByAccessToken(match[1]);
    if (!purchase) {
      throw new HttpError(
        401,
        "El token de acceso de lectura no es válido.",
        "UNAUTHORIZED",
      );
    }
    if (purchase.bookId !== bookId) {
      throw new HttpError(
        403,
        "Ese token no da acceso a este libro.",
        "FORBIDDEN",
      );
    }

    const content = getBookContent(bookId);
    if (!content) {
      throw new HttpError(404, "El libro no existe.", "BOOK_NOT_FOUND");
    }
    response.json(content);
  }),
);

const pendingReviews = new Set<string>();

app.post(
  "/api/reviews",
  asyncRoute(async (request, response) => {
    const input = parseBody(reviewSchema, request.body);
    const book = getBook(input.bookId);
    if (!book) {
      throw new HttpError(404, "El libro no existe.", "BOOK_NOT_FOUND");
    }

    const purchase = findPurchaseByAccessToken(input.accessToken);
    if (!purchase) {
      throw new HttpError(
        401,
        "El token de acceso de lectura no es válido.",
        "UNAUTHORIZED",
      );
    }
    if (purchase.bookId !== input.bookId) {
      throw new HttpError(
        403,
        "Ese token no da acceso a este libro.",
        "FORBIDDEN",
      );
    }
    if (purchase.hasReview || hasReviewFor(book.id, purchase.reader)) {
      throw new HttpError(
        409,
        "Ya reseñaste este libro.",
        "ALREADY_REVIEWED",
      );
    }
    if (pendingReviews.has(purchase.id)) {
      throw new HttpError(
        409,
        "Tu reseña ya se está procesando.",
        "REVIEW_PENDING",
      );
    }

    pendingReviews.add(purchase.id);
    try {
      const issuance = await issueBookToken({
        reader: purchase.reader,
        assetCode: book.assetCode,
      });
      const token: ReadingToken = {
        assetCode: book.assetCode,
        issuer: getIssuerAddress(),
        bookId: book.id,
        bookTitle: book.title,
        txHash: issuance.txHash,
        createdAt: new Date().toISOString(),
      };
      const result: ReviewResult = completeReview(purchase.id, {
        rating: input.rating,
        text: input.text,
        readerName: input.readerName,
        token,
      });
      response.json(result);
    } finally {
      pendingReviews.delete(purchase.id);
    }
  }),
);

app.get("/api/library/:address", (request, response) => {
  const address = requireAddress(String(request.params.address ?? ""));
  const library: LibraryResponse = getLibrary(address);
  response.json(library);
});

app.post(
  "/api/fund",
  asyncRoute(async (request, response) => {
    const input = parseBody(fundSchema, request.body);
    const result = await fundWithFriendbot(input.address);
    if (result.alreadyFunded) {
      response.json({ funded: true, alreadyFunded: true });
      return;
    }
    response.json({ funded: true });
  }),
);

app.use("/api", (_request, response) => {
  response.status(404).json({
    error: "Ruta no encontrada.",
    code: "NOT_FOUND",
  });
});

if (existsSync(join(DIST_DIR, "index.html"))) {
  app.use(express.static(DIST_DIR));
  app.use((request, response, next) => {
    if (
      (request.method !== "GET" && request.method !== "HEAD") ||
      !request.accepts("html") ||
      extname(request.path).length > 0
    ) {
      next();
      return;
    }
    response.sendFile(join(DIST_DIR, "index.html"));
  });
} else {
  app.use((_request, response) => {
    response.status(404).json({
      error: "Ruta no encontrada.",
      code: "NOT_FOUND",
    });
  });
}

app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: error.message,
      ...(error.code ? { code: error.code } : {}),
    });
    return;
  }

  if (error instanceof StellarServiceError) {
    response.status(error.status).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  const candidate = error as { type?: string; status?: number };
  if (candidate.type === "entity.too.large") {
    response.status(400).json({
      error: "El cuerpo de la solicitud es demasiado grande.",
      code: "PAYLOAD_TOO_LARGE",
    });
    return;
  }
  if (error instanceof SyntaxError && candidate.status === 400) {
    response.status(400).json({
      error: "El cuerpo de la solicitud no es JSON válido.",
      code: "INVALID_JSON",
    });
    return;
  }

  const message = error instanceof Error ? error.message : "error desconocido";
  console.error(`[folio] ${request.method} ${request.path}: ${message}`);
  response.status(500).json({
    error: "Ocurrió un error inesperado.",
    code: "INTERNAL",
  });
});

const requestedPort = Number(process.env.PORT ?? "8787");
const port =
  Number.isInteger(requestedPort) &&
  requestedPort > 0 &&
  requestedPort < 65_536
    ? requestedPort
    : 8787;

app.listen(port, () => {
  console.log(`[folio] API escuchando en http://localhost:${port}`);
});
