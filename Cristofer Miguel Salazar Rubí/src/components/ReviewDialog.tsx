import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { BookDetail, ReadingToken } from "../../shared/types";
import { useFolio } from "../folio-context";
import { api, ApiError } from "../lib/api";
import { BookCover } from "./BookCover";
import {
  AlertIcon,
  ArrowRightIcon,
  CloseIcon,
  SparkIcon,
  StarIcon,
} from "./Icons";
import { TokenCard } from "./TokenCard";

interface ReviewDialogProps {
  book: BookDetail;
  accessToken: string;
  onClose: () => void;
  onClaimed: (token: ReadingToken) => void;
}

export function ReviewDialog({
  book,
  accessToken,
  onClose,
  onClaimed,
}: ReviewDialogProps) {
  const { refreshLibrary } = useFolio();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [readerName, setReaderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<ReadingToken | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === 0 || text.trim().length < 20) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.submitReview({
        bookId: book.id,
        accessToken,
        rating,
        text: text.trim(),
        readerName: readerName.trim() || undefined,
      });

      setToken(result.token);
      onClaimed(result.token);
      refreshLibrary();
    } catch (reviewError) {
      setError(
        reviewError instanceof ApiError
          ? reviewError.message
          : reviewError instanceof Error
            ? reviewError.message
            : "No se pudo guardar la reseña.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const activeRating = hovered || rating;

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="dialog review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
      >
        <button
          className="dialog__close"
          onClick={onClose}
          disabled={submitting}
          aria-label="Cerrar"
        >
          <CloseIcon size={20} />
        </button>

        {token ? (
          <div className="review-success">
            <span className="kicker">
              <SparkIcon size={14} />
              Reseña publicada
            </span>
            <h2 id="review-title">Tu sello está en la wallet.</h2>
            <p>
              Gracias por cerrar el círculo. La reseña queda visible para otras
              personas y el sello prueba que terminaste este libro.
            </p>

            <TokenCard token={token} />

            <div className="review-success__actions">
              <Link className="btn btn--ink" to="/biblioteca" onClick={onClose}>
                Ver mi biblioteca
                <ArrowRightIcon size={16} />
              </Link>
              <button className="btn btn--outline" onClick={onClose}>
                Seguir leyendo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="review-head">
              <BookCover book={book} size="mini" />
              <div>
                <span className="kicker kicker--muted">
                  <StarIcon size={14} />
                  Último paso
                </span>
                <h2 id="review-title">Deja tu reseña y recibe el sello</h2>
                <p>{book.title}</p>
              </div>
            </div>

            <form onSubmit={submit}>
              <div className="rating-picker">
                <span className="field-label">Tu valoración</span>
                <div
                  className="rating-picker__stars"
                  onMouseLeave={() => setHovered(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      className={star <= activeRating ? "is-active" : ""}
                      aria-label={`${star} de 5 estrellas`}
                      aria-pressed={rating === star}
                    >
                      <StarIcon size={28} filled={star <= activeRating} />
                    </button>
                  ))}
                  <span>
                    {activeRating > 0
                      ? ["Malo", "Flojo", "Correcto", "Muy bueno", "Excepcional"][
                          activeRating - 1
                        ]
                      : "Elige una puntuación"}
                  </span>
                </div>
              </div>

              <label className="field">
                <span className="field-label">Tu reseña</span>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="¿Qué te dejó este libro? Escribe algo que ayude a la próxima persona."
                  rows={5}
                  maxLength={2000}
                  disabled={submitting}
                />
                <span className="field-count">{text.trim().length}/2000 · mínimo 20</span>
              </label>

              <label className="field">
                <span className="field-label">Tu nombre (opcional)</span>
                <input
                  type="text"
                  value={readerName}
                  onChange={(event) => setReaderName(event.target.value)}
                  placeholder="Cómo quieres aparecer en la reseña"
                  maxLength={40}
                  disabled={submitting}
                />
              </label>

              {error && (
                <p className="form-error" role="alert">
                  <AlertIcon size={16} />
                  {error}
                </p>
              )}

              <button
                className="btn btn--ink btn--wide"
                type="submit"
                disabled={
                  submitting || rating === 0 || text.trim().length < 20
                }
              >
                {submitting ? (
                  <span className="spinner" />
                ) : (
                  <SparkIcon size={17} />
                )}
                {submitting ? "Emitiendo tu sello…" : "Publicar reseña y reclamar sello"}
              </button>

              <p className="review-dialog__note">
                El sello se emite una sola vez por libro y queda en tu wallet de
                Stellar Testnet.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
