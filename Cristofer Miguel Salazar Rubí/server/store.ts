import { createHash, randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair } from "@stellar/stellar-sdk";
import type {
  BookContent,
  BookDetail,
  BookStats,
  BookSummary,
  Chapter,
  CreateBookInput,
  LibraryResponse,
  PublicReview,
  Purchase,
  PurchaseAccess,
  ReadingToken,
  ReviewResult,
} from "../shared/types";
import { seedBooks } from "./seed-books";

const SERVER_DIR = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = join(SERVER_DIR, "data");
const STORE_FILE = join(DATA_DIR, "store.json");
const STROOPS_PER_UNIT = 10_000_000n;

export const FEE_PERCENT = 5;

export interface StoredBook {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  price: string;
  theme: CreateBookInput["theme"];
  offerer: string;
  offererName?: string;
  assetCode: string;
  chapters: Chapter[];
  wordCount: number;
  seededReads: number;
  createdAt: string;
}

export interface StoredReview extends PublicReview {
  tokenTxHash?: string;
}

export interface StoredPurchase extends Purchase {
  accessToken: string;
}

interface StoreData {
  version: 1;
  books: StoredBook[];
  purchases: StoredPurchase[];
  reviews: StoredReview[];
}

function emptyStore(): StoreData {
  return { version: 1, books: [], purchases: [], reviews: [] };
}

let data: StoreData = emptyStore();

export function decimalToStroops(value: string): bigint {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  const paddedFraction = `${fraction}0000000`.slice(0, 7);
  return BigInt(whole) * STROOPS_PER_UNIT + BigInt(paddedFraction);
}

export function stroopsToDecimal(value: bigint): string {
  const whole = value / STROOPS_PER_UNIT;
  const fraction = (value % STROOPS_PER_UNIT)
    .toString()
    .padStart(7, "0")
    .replace(/0+$/, "");
  return fraction.length > 0 ? `${whole}.${fraction}` : whole.toString();
}

export function computeAmounts(price: string): {
  platformFee: string;
  offererAmount: string;
} {
  const priceStroops = decimalToStroops(price);
  const feeStroops = (priceStroops * BigInt(FEE_PERCENT) + 50n) / 100n;
  return {
    platformFee: stroopsToDecimal(feeStroops),
    offererAmount: stroopsToDecimal(priceStroops - feeStroops),
  };
}

function hashId(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function generateAssetCode(bookId: string, used: Set<string>): string {
  let salt = 0;
  while (salt < 10_000) {
    const digest = hashId(salt === 0 ? bookId : `${bookId}:${salt}`).toUpperCase();
    const candidate = `FOLIO${digest.slice(0, 6)}`;
    if (!used.has(candidate)) return candidate;
    salt += 1;
  }
  const fallback = randomBytes(5).toString("hex").slice(0, 6).toUpperCase();
  return `FOLIO${fallback}`;
}

export function countWords(chapters: Chapter[]): number {
  return chapters
    .flatMap((chapter) => chapter.paragraphs)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function parseBookContent(content: string): Chapter[] {
  const chapters: Chapter[] = [];
  let current: Chapter | undefined;

  for (const rawLine of content.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    if (line.startsWith("## ")) {
      const title = line.slice(3).trim();
      current = {
        title:
          title.length > 0 ? title : `Capítulo ${chapters.length + 1}`,
        paragraphs: [],
      };
      chapters.push(current);
      continue;
    }

    if (!current) {
      current = { title: "Capítulo 1", paragraphs: [] };
      chapters.push(current);
    }
    current.paragraphs.push(line);
  }

  if (chapters.length === 0) {
    chapters.push({ title: "Capítulo 1", paragraphs: [] });
  }

  return chapters;
}

function safeIsoDate(value: string, fallback: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function cloneReview(review: StoredReview): PublicReview {
  return {
    id: review.id,
    bookId: review.bookId,
    reader: review.reader,
    readerName: review.readerName,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt,
    tokenAssetCode: review.tokenAssetCode,
  };
}

function cloneToken(token: ReadingToken): ReadingToken {
  return {
    assetCode: token.assetCode,
    issuer: token.issuer,
    bookId: token.bookId,
    bookTitle: token.bookTitle,
    txHash: token.txHash,
    createdAt: token.createdAt,
  };
}

export function toPurchase(purchase: StoredPurchase): Purchase {
  return {
    id: purchase.id,
    bookId: purchase.bookId,
    bookTitle: purchase.bookTitle,
    reader: purchase.reader,
    amount: purchase.amount,
    platformFee: purchase.platformFee,
    offererAmount: purchase.offererAmount,
    txHash: purchase.txHash,
    createdAt: purchase.createdAt,
    hasReview: purchase.hasReview,
    token: purchase.token ? cloneToken(purchase.token) : undefined,
  };
}

function reviewsForBook(bookId: string): StoredReview[] {
  return data.reviews
    .filter((review) => review.bookId === bookId)
    .sort((left, right) => {
      const delta =
        Date.parse(right.createdAt) - Date.parse(left.createdAt);
      return Number.isFinite(delta) && delta !== 0
        ? delta
        : right.id.localeCompare(left.id);
    });
}

function statsForBook(book: StoredBook): BookStats {
  const reviews = reviewsForBook(book.id);
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const purchases = data.purchases.filter(
    (purchase) => purchase.bookId === book.id,
  ).length;

  return {
    ratingAverage:
      reviews.length > 0
        ? Math.round((total / reviews.length) * 10) / 10
        : 0,
    ratingCount: reviews.length,
    reads: book.seededReads + purchases,
  };
}

function toSummary(book: StoredBook): BookSummary {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    synopsis: book.synopsis,
    price: book.price,
    theme: book.theme,
    offerer: book.offerer,
    offererName: book.offererName,
    assetCode: book.assetCode,
    chaptersCount: book.chapters.length,
    wordCount: book.wordCount,
    createdAt: book.createdAt,
    stats: statsForBook(book),
  };
}

function toDetail(book: StoredBook): BookDetail {
  return {
    ...toSummary(book),
    chapterTitles: book.chapters.map((chapter) => chapter.title),
    reviews: reviewsForBook(book.id).map(cloneReview),
  };
}

function sortBooks(books: StoredBook[]): StoredBook[] {
  return [...books].sort((left, right) => {
    if (left.seededReads !== right.seededReads) {
      return right.seededReads - left.seededReads;
    }
    return right.createdAt.localeCompare(left.createdAt);
  });
}

function seedToStoredBook(
  seedId: string,
  seed: (typeof seedBooks)[number],
  index: number,
  usedAssetCodes: Set<string>,
): StoredBook {
  const createdAt = new Date(
    Date.now() - index * 60_000,
  ).toISOString();
  const chapters: Chapter[] =
    seed.chapters.length > 0
      ? seed.chapters.map((chapter) => ({
          title: chapter.title,
          paragraphs: [...chapter.paragraphs],
        }))
      : [{ title: "Capítulo 1", paragraphs: [] }];

  return {
    id: seedId,
    title: seed.title,
    author: seed.author,
    synopsis: seed.synopsis,
    price: seed.price,
    theme: seed.theme,
    offerer: Keypair.random().publicKey(),
    offererName: seed.offererName,
    assetCode: generateAssetCode(seedId, usedAssetCodes),
    chapters,
    wordCount: countWords(chapters),
    seededReads: Math.max(0, Math.round(seed.reads)),
    createdAt,
  };
}

function hydrateSeedBooks(): boolean {
  let changed = false;
  const knownIds = new Set(data.books.map((book) => book.id));
  const usedAssetCodes = new Set(data.books.map((book) => book.assetCode));

  seedBooks.forEach((seed, index) => {
    if (knownIds.has(seed.id)) return;
    const book = seedToStoredBook(seed.id, seed, index, usedAssetCodes);
    usedAssetCodes.add(book.assetCode);
    data.books.push(book);
    data.reviews.push(...seedReviewsFor(book.id));
    changed = true;
  });

  return changed;
}

function seedReviewsFor(bookId: string): StoredReview[] {
  const seed = seedBooks.find((candidate) => candidate.id === bookId);
  if (!seed) return [];
  const book = data.books.find((candidate) => candidate.id === bookId);
  const fallback = book?.createdAt ?? new Date().toISOString();

  return seed.reviews.map((review, index) => ({
    id: `review_seed_${hashId(`${bookId}:${index}`).slice(0, 16)}`,
    bookId,
    reader: Keypair.random().publicKey(),
    readerName: review.readerName,
    rating: Math.min(5, Math.max(1, Math.round(review.rating))),
    text: review.text,
    createdAt: safeIsoDate(review.createdAt, fallback),
  }));
}

function persist(): void {
  const temporaryFile = `${STORE_FILE}.tmp`;
  writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporaryFile, STORE_FILE);
}

function loadStore(): StoreData {
  if (!existsSync(STORE_FILE)) return emptyStore();

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(STORE_FILE, "utf8"));
  } catch {
    throw new Error("No se pudo leer server/data/store.json.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Partial<StoreData>).books) ||
    !Array.isArray((parsed as Partial<StoreData>).purchases) ||
    !Array.isArray((parsed as Partial<StoreData>).reviews)
  ) {
    throw new Error("El archivo server/data/store.json tiene un formato inválido.");
  }

  const store = parsed as StoreData;
  return {
    version: 1,
    books: store.books.map((book) => ({
      ...book,
      seededReads:
        typeof book.seededReads === "number" ? book.seededReads : 0,
    })),
    purchases: store.purchases,
    reviews: store.reviews,
  };
}

function initializeStore(): void {
  mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  const existed = existsSync(STORE_FILE);
  data = loadStore();
  const hydrated = hydrateSeedBooks();
  if (!existed || hydrated) persist();
}

export function listBooks(): BookSummary[] {
  return sortBooks(data.books).map(toSummary);
}

export function getBook(bookId: string): StoredBook | undefined {
  return data.books.find((book) => book.id === bookId);
}

export function getBookDetail(bookId: string): BookDetail | undefined {
  const book = getBook(bookId);
  return book ? toDetail(book) : undefined;
}

export function getBookContent(bookId: string): BookContent | undefined {
  const book = getBook(bookId);
  if (!book) return undefined;
  return {
    bookId: book.id,
    title: book.title,
    chapters: book.chapters.map((chapter) => ({
      title: chapter.title,
      paragraphs: [...chapter.paragraphs],
    })),
  };
}

export function createListing(
  input: CreateBookInput,
  chapters: Chapter[],
): BookDetail {
  const id = `book_${randomBytes(8).toString("hex")}`;
  const used = new Set(data.books.map((book) => book.assetCode));
  const book: StoredBook = {
    id,
    title: input.title,
    author: input.author,
    synopsis: input.synopsis,
    price: input.price,
    theme: input.theme,
    offerer: input.offerer,
    offererName: input.offererName,
    assetCode: generateAssetCode(id, used),
    chapters,
    wordCount: countWords(chapters),
    seededReads: 0,
    createdAt: new Date().toISOString(),
  };

  data.books.push(book);
  persist();
  return toDetail(book);
}

export function findPurchaseByBookAndReader(
  bookId: string,
  reader: string,
): StoredPurchase | undefined {
  return data.purchases.find(
    (purchase) =>
      purchase.bookId === bookId && purchase.reader === reader,
  );
}

export function findPurchaseByTx(
  txHash: string,
): StoredPurchase | undefined {
  return data.purchases.find(
    (purchase) => purchase.txHash?.toLowerCase() === txHash.toLowerCase(),
  );
}

export function findPurchaseByAccessToken(
  accessToken: string,
): StoredPurchase | undefined {
  return data.purchases.find(
    (purchase) => purchase.accessToken === accessToken,
  );
}

export function addPurchase(params: {
  bookId: string;
  reader: string;
  amount: string;
  platformFee: string;
  offererAmount: string;
  txHash: string;
  accessToken: string;
}): PurchaseAccess {
  const book = getBook(params.bookId);
  if (!book) throw new Error("El libro no existe.");
  const purchase: StoredPurchase = {
    id: `purchase_${randomBytes(8).toString("hex")}`,
    bookId: book.id,
    bookTitle: book.title,
    reader: params.reader,
    amount: params.amount,
    platformFee: params.platformFee,
    offererAmount: params.offererAmount,
    txHash: params.txHash.toLowerCase(),
    createdAt: new Date().toISOString(),
    hasReview: false,
    accessToken: params.accessToken,
  };

  data.purchases.push(purchase);
  persist();
  return { purchase: toPurchase(purchase), accessToken: purchase.accessToken };
}

export function getPurchaseById(
  purchaseId: string,
): StoredPurchase | undefined {
  return data.purchases.find((purchase) => purchase.id === purchaseId);
}

export function hasReviewFor(
  bookId: string,
  reader: string,
): boolean {
  return data.reviews.some(
    (review) => review.bookId === bookId && review.reader === reader,
  );
}

export function completeReview(
  purchaseId: string,
  input: {
    rating: number;
    text: string;
    readerName?: string;
    token: ReadingToken;
  },
): ReviewResult {
  const purchase = getPurchaseById(purchaseId);
  if (!purchase) throw new Error("La compra no existe.");
  const book = getBook(purchase.bookId);
  if (!book) throw new Error("El libro no existe.");

  const review: StoredReview = {
    id: `review_${randomBytes(8).toString("hex")}`,
    bookId: book.id,
    reader: purchase.reader,
    readerName: input.readerName,
    rating: input.rating,
    text: input.text,
    createdAt: new Date().toISOString(),
    tokenAssetCode: input.token.assetCode,
    tokenTxHash: input.token.txHash,
  };

  purchase.hasReview = true;
  purchase.token = cloneToken(input.token);
  data.reviews.push(review);
  persist();

  return {
    review: cloneReview(review),
    token: cloneToken(input.token),
  };
}

export function listReviews(bookId: string): PublicReview[] {
  return reviewsForBook(bookId).map(cloneReview);
}

export function getLibrary(address: string): LibraryResponse {
  const purchases = data.purchases
    .filter((purchase) => purchase.reader === address)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const listings = sortBooks(
    data.books.filter((book) => book.offerer === address),
  ).map(toSummary);
  const reviews = data.reviews
    .filter((review) => review.reader === address)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(cloneReview);
  const tokens = purchases.flatMap((purchase) =>
    purchase.token ? [cloneToken(purchase.token)] : [],
  );

  return {
    purchases: purchases.map((purchase) => {
      const publicPurchase = toPurchase(purchase);
      delete publicPurchase.txHash;
      return publicPurchase;
    }),
    listings,
    reviews,
    tokens,
  };
}

initializeStore();
