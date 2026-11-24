import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { BookDetail } from "../../shared/types";
import { useFolio } from "../folio-context";
import { api } from "../lib/api";
import {
  formatDate,
  formatXlm,
  readingMinutes,
  shortAddress,
  splitDeposit,
} from "../lib/format";
import { explorerAccountUrl } from "../lib/stellar";
import { getAccessToken, getProgress } from "../lib/storage";
import { BookCover } from "../components/BookCover";
import { CheckoutDialog } from "../components/CheckoutDialog";
import { RatingStars } from "../components/RatingStars";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  ClockIcon,
  ExternalIcon,
  QuoteIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  UsersIcon,
  WalletIcon,
} from "../components/Icons";

export function BookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { wallet, library } = useFolio();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!bookId) return;
    let active = true;

    api
      .getBook(bookId)
      .then((value) => {
        if (active) setBook(value);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el libro.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [bookId]);

  if (error) {
    return (
      <div className="page">
        <div className="state-box state-box--error">
          <strong>Ese libro no está disponible.</strong>
          <p>{error}</p>
          <Link className="btn btn--ink btn--small" to="/">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="page book-page book-page--loading">
        <div className="book-detail__cover">
          <div className="book-cover book-cover--detail book-cover--skeleton" />
        </div>
        <div className="book-detail__info">
          <span className="skeleton-line skeleton-line--sm" />
          <span className="skeleton-line skeleton-line--xl" />
          <span className="skeleton-line" />
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-line--md" />
        </div>
      </div>
    );
  }

  const purchase = library?.purchases.find((item) => item.bookId === book.id);
  const accessToken = getAccessToken(book.id);
  const progress = getProgress(book.id);
  const split = splitDeposit(book.price);
  const canRead = Boolean(accessToken);
  const token = purchase?.token;
  const readerPath = `/leer/${book.id}`;

  function openReader() {
    navigate(readerPath);
  }

  return (
    <div className="page book-page">
      <Link className="back-link" to="/">
        <ArrowLeftIcon size={16} />
        Catálogo
      </Link>

      <section className="book-detail">
        <div className="book-detail__cover">
          <BookCover book={book} size="detail" />
          <div className="book-detail__cover-note">
            <SparkIcon size={15} />
            Al terminar la lectura puedes reclamar el sello de este libro.
          </div>
        </div>

        <div className="book-detail__info">
          <span className="kicker">
            <BookIcon size={14} />
            Edición breve · {readingMinutes(book.wordCount)} min
          </span>

          <h1>{book.title}</h1>
          <p className="book-detail__author">{book.author}</p>

          <div className="book-detail__meta">
            <RatingStars
              value={book.stats.ratingAverage}
              count={book.stats.ratingCount}
              size={16}
              showValue
            />
            <span>
              <UsersIcon size={15} />
              {book.stats.reads} lecturas
            </span>
            <span>
              <ClockIcon size={15} />
              {book.chaptersCount} capítulos
            </span>
          </div>

          <p className="book-detail__synopsis">{book.synopsis}</p>

          <div className="host-row">
            <span className="host-row__avatar" aria-hidden="true">
              {(book.offererName ?? "F").slice(0, 1)}
            </span>
            <div>
              <span className="host-row__label">Compartido por</span>
              <strong>{book.offererName ?? "Anfitrión de Folio"}</strong>
              <a
                href={explorerAccountUrl(book.offerer)}
                target="_blank"
                rel="noreferrer"
                className="host-row__address"
              >
                {shortAddress(book.offerer, 6)}
                <ExternalIcon size={12} />
              </a>
            </div>
          </div>

          <div className="chapters-preview">
            <span className="field-label">Contenido</span>
            <ol>
              {book.chapterTitles.map((title, index) => (
                <li key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {title}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="buy-card">
          <span className="buy-card__label">Depósito de lectura</span>
          <div className="buy-card__price">
            <strong>{formatXlm(book.price)}</strong>
            <span>XLM</span>
          </div>

          <div className="buy-card__split">
            <span>
              Al anfitrión <strong>{formatXlm(split.offerer, 2)} XLM</strong>
            </span>
            <span>
              Comisión Folio <strong>{formatXlm(split.fee, 2)} XLM</strong>
            </span>
          </div>

          {canRead ? (
            <>
              <button className="btn btn--ink btn--wide" onClick={openReader}>
                {progress > 0 ? "Continuar lectura" : "Empezar a leer"}
                <ArrowRightIcon size={17} />
              </button>
            </>
          ) : purchase ? (
            <p className="buy-card__note buy-card__note--strong">
              Ya compraste este libro. El acceso está guardado en el navegador
              donde hiciste la compra.
            </p>
          ) : (
            <button
              className="btn btn--ink btn--wide"
              onClick={() =>
                wallet.address
                  ? setCheckoutOpen(true)
                  : void wallet.connect()
              }
              disabled={wallet.connecting}
            >
              <WalletIcon size={17} />
              {wallet.address
                ? wallet.connecting
                  ? "Conectando…"
                  : "Obtener acceso"
                : "Conectar wallet"}
            </button>
          )}

          <p className="buy-card__note">
            <ShieldIcon size={14} />
            Pago directo en Stellar Testnet. Sin custodia ni suscripciones.
          </p>

          {token && (
            <div className="buy-card__token">
              <CheckIcon size={16} />
              <div>
                <strong>Sello conseguido</strong>
                <span>{token.assetCode}</span>
              </div>
            </div>
          )}
        </aside>
      </section>

      <section className="reviews-section">
        <div className="section-head section-head--compact">
          <div>
            <span className="kicker kicker--muted">
              <QuoteIcon size={14} />
              Reseñas verificadas
            </span>
            <h2>Lo que dejaron otras lecturas</h2>
          </div>
          {book.stats.ratingCount > 0 && (
            <div className="review-average">
              <strong>{book.stats.ratingAverage.toFixed(1)}</strong>
              <RatingStars value={book.stats.ratingAverage} size={15} />
              <span>{book.stats.ratingCount} reseñas</span>
            </div>
          )}
        </div>

        {book.reviews.length === 0 ? (
          <div className="state-box state-box--soft">
            <StarIcon size={26} />
            <strong>Todavía no hay reseñas.</strong>
            <p>Sé la primera persona en terminar este libro y dejar una.</p>
          </div>
        ) : (
          <div className="review-grid">
            {book.reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card__head">
                  <span className="review-card__avatar" aria-hidden="true">
                    {(review.readerName ?? review.reader).slice(0, 1)}
                  </span>
                  <div>
                    <strong>
                      {review.readerName ?? shortAddress(review.reader, 4)}
                    </strong>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                  <RatingStars value={review.rating} size={13} />
                </div>
                <p>{review.text}</p>
                {review.tokenAssetCode && (
                  <span className="review-card__token">
                    <SparkIcon size={13} />
                    Sello verificado
                  </span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {checkoutOpen && (
        <CheckoutDialog
          book={book}
          onClose={() => setCheckoutOpen(false)}
          onPurchased={() => {
            setCheckoutOpen(false);
            openReader();
          }}
        />
      )}
    </div>
  );
}
