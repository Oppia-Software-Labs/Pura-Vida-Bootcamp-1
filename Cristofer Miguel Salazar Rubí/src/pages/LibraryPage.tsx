import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { BookSummary } from "../../shared/types";
import { useFolio } from "../folio-context";
import { api } from "../lib/api";
import {
  formatDate,
  formatXlm,
  readingMinutes,
  shortAddress,
} from "../lib/format";
import { getAccessToken, getProgress } from "../lib/storage";
import { BookCover } from "../components/BookCover";
import {
  ArrowRightIcon,
  BookIcon,
  LibraryIcon,
  PenIcon,
  SparkIcon,
  StarIcon,
  WalletIcon,
} from "../components/Icons";
import { RatingStars } from "../components/RatingStars";
import { TokenCard } from "../components/TokenCard";

export function LibraryPage() {
  const {
    wallet,
    library,
    libraryLoading,
    libraryError,
    refreshLibrary,
  } = useFolio();
  const [books, setBooks] = useState<BookSummary[]>([]);

  useEffect(() => {
    let active = true;

    api
      .getBooks()
      .then((value) => {
        if (active) setBooks(value);
      })
      .catch(() => {
        // Library still renders with a neutral cover fallback.
      });

    return () => {
      active = false;
    };
  }, []);

  if (!wallet.address) {
    return (
      <div className="page">
        <div className="state-box state-box--tall">
          <span className="state-box__icon">
            <WalletIcon size={28} />
          </span>
          <strong>Conecta tu wallet para abrir tu biblioteca.</strong>
          <p>
            Ahí viven tus lecturas, los sellos que ya reclamaste y los libros
            que compartes.
          </p>
          <button
            className="btn btn--ink"
            onClick={() => void wallet.connect()}
            disabled={wallet.connecting}
          >
            <WalletIcon size={17} />
            {wallet.connecting ? "Conectando…" : "Conectar wallet"}
          </button>
        </div>
      </div>
    );
  }

  const bookMap = new Map(books.map((book) => [book.id, book]));
  const purchases = library?.purchases ?? [];
  const tokens = library?.tokens ?? [];
  const listings = library?.listings ?? [];
  const reviews = library?.reviews ?? [];

  return (
    <div className="page library-page">
      <header className="page-head">
        <div>
          <span className="kicker">
            <LibraryIcon size={14} />
            Tu espacio
          </span>
          <h1>Mi biblioteca</h1>
          <p>
            {shortAddress(wallet.address, 6)} · lecturas, sellos y libros que
            compartes.
          </p>
        </div>
        <button
          className="btn btn--outline btn--small"
          onClick={refreshLibrary}
          disabled={libraryLoading}
        >
          {libraryLoading ? "Actualizando…" : "Actualizar"}
        </button>
      </header>

      {libraryError && (
        <div className="state-box state-box--error" role="alert">
          <strong>No se pudo cargar tu biblioteca.</strong>
          <p>{libraryError}</p>
        </div>
      )}

      <div className="library-stats">
        <div>
          <strong>{purchases.length}</strong>
          <span>lecturas</span>
        </div>
        <div>
          <strong>{tokens.length}</strong>
          <span>sellos</span>
        </div>
        <div>
          <strong>{listings.length}</strong>
          <span>libros publicados</span>
        </div>
      </div>

      <section className="library-section">
        <div className="section-head section-head--compact">
          <div>
            <span className="kicker kicker--muted">
              <BookIcon size={14} />
              En curso y terminados
            </span>
            <h2>Tus lecturas</h2>
          </div>
          <Link className="text-link" to="/">
            Buscar otro libro
            <ArrowRightIcon size={15} />
          </Link>
        </div>

        {libraryLoading && purchases.length === 0 ? (
          <div className="library-skeleton">
            <span />
            <span />
            <span />
          </div>
        ) : purchases.length === 0 ? (
          <div className="state-box state-box--soft">
            <BookIcon size={26} />
            <strong>Todavía no has desbloqueado un libro.</strong>
            <p>Explora el catálogo y haz tu primer depósito de lectura.</p>
            <Link className="btn btn--ink btn--small" to="/">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="reading-list">
            {purchases.map((purchase) => {
              const book = bookMap.get(purchase.bookId);
              const progress = getProgress(purchase.bookId);
              const hasAccess = Boolean(getAccessToken(purchase.bookId));

              return (
                <article className="reading-row" key={purchase.id}>
                  <BookCover
                    book={
                      book ?? {
                        title: purchase.bookTitle,
                        author: "Folio",
                        theme: "sand",
                      }
                    }
                    size="mini"
                  />

                  <div className="reading-row__main">
                    <div className="reading-row__title">
                      <h3>{purchase.bookTitle}</h3>
                      {purchase.hasReview ? (
                        <span className="pill pill--gold">
                          <SparkIcon size={12} />
                          Sello reclamado
                        </span>
                      ) : (
                        <span className="pill">Por reseñar</span>
                      )}
                    </div>
                    <p>
                      {book ? book.author : "Edición Folio"} ·{" "}
                      {book ? `${readingMinutes(book.wordCount)} min` : "Lectura breve"}
                    </p>
                    <div className="reading-row__progress">
                      <span>
                        {progress > 0
                          ? `Capítulo ${progress + 1}`
                          : "Sin empezar"}
                      </span>
                      <span>{formatDate(purchase.createdAt)}</span>
                    </div>
                  </div>

                  <div className="reading-row__side">
                    <span className="reading-row__amount">
                      {formatXlm(purchase.amount)} XLM
                    </span>
                    {hasAccess ? (
                      <Link
                        className="btn btn--outline btn--small"
                        to={`/leer/${purchase.bookId}`}
                      >
                        {progress > 0 ? "Continuar" : "Leer"}
                        <ArrowRightIcon size={14} />
                      </Link>
                    ) : (
                      <span className="reading-row__locked">
                        Acceso en otro navegador
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="library-section">
        <div className="section-head section-head--compact">
          <div>
            <span className="kicker kicker--muted">
              <SparkIcon size={14} />
              On-chain
            </span>
            <h2>Tus sellos de lectura</h2>
          </div>
        </div>

        {tokens.length === 0 ? (
          <div className="state-box state-box--soft">
            <SparkIcon size={26} />
            <strong>Los sellos aparecen al terminar y reseñar.</strong>
            <p>Cada libro terminado deja un token distinto en tu wallet.</p>
          </div>
        ) : (
          <div className="token-grid">
            {tokens.map((token) => (
              <TokenCard token={token} key={`${token.bookId}-${token.txHash}`} />
            ))}
          </div>
        )}
      </section>

      <section className="library-section">
        <div className="section-head section-head--compact">
          <div>
            <span className="kicker kicker--muted">
              <PenIcon size={14} />
              Como anfitrión
            </span>
            <h2>Tus libros publicados</h2>
          </div>
          <Link className="text-link" to="/publicar">
            Publicar otro
            <ArrowRightIcon size={15} />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="state-box state-box--soft">
            <PenIcon size={26} />
            <strong>Aún no compartes ningún libro.</strong>
            <p>
              Publica un texto, define el depósito y recibe el 95% de cada
              lectura.
            </p>
            <Link className="btn btn--ink btn--small" to="/publicar">
              Publicar mi primer libro
            </Link>
          </div>
        ) : (
          <div className="listing-grid">
            {listings.map((listing) => (
              <Link
                className="listing-card"
                to={`/libro/${listing.id}`}
                key={listing.id}
              >
                <BookCover book={listing} size="mini" />
                <div>
                  <h3>{listing.title}</h3>
                  <p>{listing.stats.reads} lecturas</p>
                  <span className="listing-card__price">
                    {formatXlm(listing.price)} XLM por lectura
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {reviews.length > 0 && (
        <section className="library-section">
          <div className="section-head section-head--compact">
            <div>
              <span className="kicker kicker--muted">
                <StarIcon size={14} />
                Tu voz
              </span>
              <h2>Tus reseñas</h2>
            </div>
          </div>
          <div className="review-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card__head">
                  <div>
                    <strong>
                      {review.readerName ?? shortAddress(review.reader, 4)}
                    </strong>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                  <RatingStars value={review.rating} size={13} />
                </div>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
