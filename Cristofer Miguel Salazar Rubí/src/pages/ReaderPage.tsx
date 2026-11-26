import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  BookContent,
  BookDetail,
  ReadingToken,
} from "../../shared/types";
import { useFolio } from "../folio-context";
import { api } from "../lib/api";
import { formatXlm, readingMinutes } from "../lib/format";
import {
  getAccessToken,
  getProgress,
  getReaderPreferences,
  saveProgress,
  saveReaderPreferences,
  type ReaderPreferences,
} from "../lib/storage";
import { BookCover } from "../components/BookCover";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  LockIcon,
  MenuIcon,
  SparkIcon,
} from "../components/Icons";
import { ReviewDialog } from "../components/ReviewDialog";
import { TokenCard } from "../components/TokenCard";

export function ReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { library, wallet } = useFolio();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [content, setContent] = useState<BookContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [token, setToken] = useState<ReadingToken | null>(null);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [preferences, setPreferences] = useState<ReaderPreferences>(() =>
    getReaderPreferences(),
  );

  const accessToken = bookId ? getAccessToken(bookId) : null;
  const purchase = library?.purchases.find((item) => item.bookId === bookId);

  useEffect(() => {
    if (!bookId) return;
    let active = true;

    api
      .getBook(bookId)
      .then((value) => {
        if (active) {
          setBook(value);
          setChapterIndex(
            Math.min(getProgress(bookId), Math.max(value.chaptersCount - 1, 0)),
          );
        }
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

  useEffect(() => {
    if (!bookId || !accessToken) return;
    let active = true;

    api
      .getContent(bookId, accessToken)
      .then((value) => {
        if (active) setContent(value);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo abrir el contenido.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, bookId]);

  const chapter = content?.chapters[chapterIndex];
  const totalChapters = content?.chapters.length ?? book?.chaptersCount ?? 0;
  const progressPercent =
    totalChapters > 0 ? ((chapterIndex + 1) / totalChapters) * 100 : 0;
  const isLast = totalChapters > 0 && chapterIndex === totalChapters - 1;
  const activeToken = token ?? purchase?.token ?? null;
  const reviewed = Boolean(activeToken || purchase?.hasReview);

  const readingTime = useMemo(
    () => (book ? readingMinutes(book.wordCount) : 0),
    [book],
  );

  function goToChapter(index: number) {
    if (!bookId || !content) return;
    const next = Math.min(Math.max(index, 0), content.chapters.length - 1);
    setChapterIndex(next);
    saveProgress(bookId, next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updatePreferences(next: ReaderPreferences) {
    setPreferences(next);
    saveReaderPreferences(next);
  }

  if (error && !content) {
    return (
      <div className="page">
        <div className="state-box state-box--error">
          <strong>No pudimos abrir esta lectura.</strong>
          <p>{error}</p>
          <Link className="btn btn--ink btn--small" to={`/libro/${bookId}`}>
            Volver al libro
          </Link>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="reader-loading">
        <span className="spinner" />
        Abriendo el libro…
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="page">
        <div className="reader-locked">
          <BookCover book={book} size="detail" />
          <div>
            <span className="kicker">
              <LockIcon size={14} />
              Lectura bloqueada
            </span>
            <h1>{book.title}</h1>
            <p>
              Este libro todavía no está desbloqueado en este navegador. Haz el
              depósito de lectura para abrirlo y, al terminar, reclamar su
              sello.
            </p>
            <div className="reader-locked__actions">
              <Link className="btn btn--ink" to={`/libro/${book.id}`}>
                Ver el libro
                <ArrowRightIcon size={16} />
              </Link>
              {purchase && (
                <span className="reader-locked__note">
                  {wallet.address
                    ? "Ya tienes una compra registrada. Vuelve a abrir el acceso desde este dispositivo."
                    : "Conecta la wallet con la que hiciste el depósito."}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="reader-loading">
        <span className="spinner" />
        Cargando capítulos…
      </div>
    );
  }

  return (
    <div className={`reader reader--${preferences.theme}`}>
      {!sidebarOpen && (
        <button
          className="reader-sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir capítulos"
        >
          <MenuIcon size={20} />
        </button>
      )}

      <aside className={`reader-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="reader-sidebar__head">
          <Link className="back-link" to={`/libro/${book.id}`}>
            <ArrowLeftIcon size={16} />
            {book.title}
          </Link>
          <button
            className="reader-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar capítulos"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="reader-progress">
          <div className="reader-progress__bar">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <span>
            {chapterIndex + 1} de {totalChapters} · {Math.round(progressPercent)}
            %
          </span>
        </div>

        <ol className="reader-chapters">
          {content.chapters.map((item, index) => (
            <li key={item.title}>
              <button
                className={index === chapterIndex ? "is-active" : ""}
                onClick={() => goToChapter(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.title}
              </button>
            </li>
          ))}
        </ol>

        <div className="reader-sidebar__foot">
          <span>
            <BookIcon size={14} />
            {readingTime} min de lectura
          </span>
          {reviewed ? (
            <button className="reader-token-link" onClick={() => setTokenOpen(true)}>
              <SparkIcon size={14} />
              Ver mi sello
            </button>
          ) : (
            <span className="reader-sidebar__hint">
              Termina el libro para reclamar tu sello.
            </span>
          )}
        </div>
      </aside>

      <div className="reader-main">
        <div className="reader-toolbar">
          <div className="reader-toolbar__left">
            <span className="reader-toolbar__book">{book.title}</span>
            <span className="reader-toolbar__author">{book.author}</span>
          </div>

          <div className="reader-toolbar__right">
            <div className="font-control" aria-label="Tamaño de letra">
              <button
                onClick={() =>
                  updatePreferences({
                    ...preferences,
                    fontSize: Math.max(16, preferences.fontSize - 1),
                  })
                }
                aria-label="Reducir letra"
              >
                A−
              </button>
              <button
                onClick={() =>
                  updatePreferences({
                    ...preferences,
                    fontSize: Math.min(26, preferences.fontSize + 1),
                  })
                }
                aria-label="Aumentar letra"
              >
                A+
              </button>
            </div>

            <div className="theme-control" aria-label="Tema de lectura">
              {(["paper", "sepia", "night"] as const).map((theme) => (
                <button
                  key={theme}
                  className={preferences.theme === theme ? "is-active" : ""}
                  onClick={() => updatePreferences({ ...preferences, theme })}
                  aria-label={`Tema ${theme}`}
                />
              ))}
            </div>
          </div>
        </div>

        <article
          className="reader-page"
          style={{ fontSize: `${preferences.fontSize}px` }}
        >
          <span className="reader-chapter-number">
            Capítulo {String(chapterIndex + 1).padStart(2, "0")}
          </span>
          <h1>{chapter?.title}</h1>

          <div className="reader-text">
            {chapter?.paragraphs.map((paragraph, index) => {
              const isSubhead =
                !paragraph.includes("\n") &&
                paragraph.length <= 64 &&
                !/[.,;:!?…]/.test(paragraph);

              return isSubhead ? (
                <h3 className="reader-subhead" key={index}>
                  {paragraph}
                </h3>
              ) : (
                <p key={index}>{paragraph}</p>
              );
            })}
          </div>

          <div className="reader-nav">
            <button
              className="btn btn--outline"
              onClick={() => goToChapter(chapterIndex - 1)}
              disabled={chapterIndex === 0}
            >
              <ChevronLeftIcon size={16} />
              Anterior
            </button>

            {isLast ? (
              reviewed ? (
                <button className="btn btn--gold" onClick={() => setTokenOpen(true)}>
                  <SparkIcon size={16} />
                  Ver mi sello
                </button>
              ) : (
                <button
                  className="btn btn--gold"
                  onClick={() => setReviewOpen(true)}
                >
                  <SparkIcon size={16} />
                  Terminar y dejar reseña
                </button>
              )
            ) : (
              <button
                className="btn btn--ink"
                onClick={() => goToChapter(chapterIndex + 1)}
              >
                Siguiente capítulo
                <ChevronRightIcon size={16} />
              </button>
            )}
          </div>
        </article>
      </div>

      {isLast && !reviewed && (
        <div className="reader-finish-banner">
          <div>
            <strong>Llegaste al final.</strong>
            <span>
              Deja tu reseña para recibir el sello de {book.title} en tu wallet.
            </span>
          </div>
          <button className="btn btn--gold btn--small" onClick={() => setReviewOpen(true)}>
            <SparkIcon size={15} />
            Reclamar sello
          </button>
        </div>
      )}

      {reviewOpen && (
        <ReviewDialog
          book={book}
          accessToken={accessToken}
          onClose={() => setReviewOpen(false)}
          onClaimed={(claimed) => {
            setToken(claimed);
            setReviewOpen(false);
            setTokenOpen(true);
          }}
        />
      )}

      {tokenOpen && activeToken && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setTokenOpen(false);
        }}>
          <div className="dialog token-dialog" role="dialog" aria-modal="true">
            <button
              className="dialog__close"
              onClick={() => setTokenOpen(false)}
              aria-label="Cerrar"
            >
              <CloseIcon size={20} />
            </button>
            <span className="kicker">
              <CheckIcon size={14} />
              Lectura completada
            </span>
            <h2>Tu sello de lectura</h2>
            <p>
              Este token vive en tu wallet y acredita que terminaste{" "}
              <strong>{book.title}</strong>.
            </p>
            <TokenCard token={activeToken} />
            <Link className="btn btn--ink btn--wide" to="/biblioteca">
              Ir a mi biblioteca
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      )}

      {error && content && (
        <p className="reader-toast" role="alert">
          <AlertIcon size={16} />
          {error}
        </p>
      )}

      {purchase && !purchase.hasReview && (
        <span className="reader-price-note">
          Depósito: {formatXlm(purchase.amount)} XLM
        </span>
      )}
    </div>
  );
}
