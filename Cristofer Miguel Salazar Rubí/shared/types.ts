export type BookTheme =
  | "forest"
  | "ember"
  | "ocean"
  | "plum"
  | "sand"
  | "noir";

export interface Chapter {
  title: string;
  paragraphs: string[];
}

export interface PublicReview {
  id: string;
  bookId: string;
  reader: string;
  readerName?: string;
  rating: number;
  text: string;
  createdAt: string;
  tokenAssetCode?: string;
}

export interface BookStats {
  ratingAverage: number;
  ratingCount: number;
  reads: number;
}

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  price: string;
  theme: BookTheme;
  offerer: string;
  offererName?: string;
  assetCode: string;
  chaptersCount: number;
  wordCount: number;
  createdAt: string;
  stats: BookStats;
}

export interface BookDetail extends BookSummary {
  chapterTitles: string[];
  reviews: PublicReview[];
}

export interface BookContent {
  bookId: string;
  title: string;
  chapters: Chapter[];
}

export interface CreateBookInput {
  title: string;
  author: string;
  synopsis: string;
  price: string;
  theme: BookTheme;
  offerer: string;
  offererName?: string;
  content: string;
}

export interface PurchaseQuote {
  bookId: string;
  reader: string;
  amount: string;
  platformFee: string;
  offererAmount: string;
  feePercent: number;
  xdr: string;
  assetCode: string;
  issuer: string;
  offerer: string;
}

export interface ReadingToken {
  assetCode: string;
  issuer: string;
  bookId: string;
  bookTitle: string;
  txHash: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  bookId: string;
  bookTitle: string;
  reader: string;
  amount: string;
  platformFee: string;
  offererAmount: string;
  txHash: string;
  createdAt: string;
  hasReview: boolean;
  token?: ReadingToken;
}

export interface PurchaseAccess {
  purchase: Purchase;
  accessToken: string;
}

export interface ReviewResult {
  review: PublicReview;
  token: ReadingToken;
}

export interface LibraryResponse {
  purchases: Purchase[];
  listings: BookSummary[];
  reviews: PublicReview[];
  tokens: ReadingToken[];
}

export interface PlatformConfig {
  network: "testnet";
  horizonUrl: string;
  platformAddress: string;
  issuer: string;
  feePercent: number;
  friendbotUrl: string;
  explorerUrl: string;
}

export interface SeedReview {
  readerName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface SeedBook {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  price: string;
  theme: BookTheme;
  offererName: string;
  chapters: Chapter[];
  reads: number;
  reviews: SeedReview[];
}
