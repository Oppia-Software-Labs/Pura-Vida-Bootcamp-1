import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BookTheme } from "../../shared/types";
import { useFolio } from "../folio-context";
import { api, ApiError } from "../lib/api";
import { formatXlm, splitDeposit } from "../lib/format";
import { BookCover } from "../components/BookCover";
import {
  AlertIcon,
  BookIcon,
  CheckIcon,
  PenIcon,
  ShieldIcon,
  SparkIcon,
  WalletIcon,
} from "../components/Icons";

const THEMES: Array<{ id: BookTheme; label: string }> = [
  { id: "forest", label: "Bosque" },
  { id: "ember", label: "Terracota" },
  { id: "ocean", label: "Océano" },
  { id: "plum", label: "Ciruela" },
  { id: "sand", label: "Arena" },
  { id: "noir", label: "Noir" },
];

const CONTENT_PLACEHOLDER = `## Primer capítulo
Escribe aquí el primer párrafo.

Otro párrafo del mismo capítulo.

## Segundo capítulo
Así se separa un capítulo nuevo.`;

export function PublishPage() {
  const navigate = useNavigate();
  const { wallet } = useFolio();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [price, setPrice] = useState("8");
  const [theme, setTheme] = useState<BookTheme>("forest");
  const [offererName, setOffererName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const split = useMemo(() => splitDeposit(price || "0"), [price]);
  const chapterCount = useMemo(() => {
    const matches = content.match(/^##\s+.+$/gm);
    return matches?.length ?? (content.trim() ? 1 : 0);
  }, [content]);
  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content],
  );

  const canSubmit =
    title.trim().length >= 2 &&
    author.trim().length >= 2 &&
    synopsis.trim().length >= 20 &&
    content.trim().length >= 200 &&
    Number(price) >= 1 &&
    Number(price) <= 10000 &&
    Boolean(wallet.address);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!wallet.address || !canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const book = await api.createBook({
        title: title.trim(),
        author: author.trim(),
        synopsis: synopsis.trim(),
        price: price.trim(),
        theme,
        offerer: wallet.address,
        offererName: offererName.trim() || undefined,
        content: content.trim(),
      });

      navigate(`/libro/${book.id}`);
    } catch (publishError) {
      setError(
        publishError instanceof ApiError
          ? publishError.message
          : publishError instanceof Error
            ? publishError.message
            : "No se pudo publicar el libro.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!wallet.address) {
    return (
      <div className="page">
        <div className="state-box state-box--tall">
          <span className="state-box__icon">
            <PenIcon size={28} />
          </span>
          <strong>Conecta tu wallet para publicar.</strong>
          <p>
            La wallet que conectes será la que reciba el 95% de cada depósito
            de lectura.
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

  return (
    <div className="page publish-page">
      <header className="page-head">
        <div>
          <span className="kicker">
            <PenIcon size={14} />
            Estudio de publicación
          </span>
          <h1>Pon tu biblioteca a circular.</h1>
          <p>
            Publica una edición breve, define el depósito y recibe el 95% de
            cada lectura directo en tu wallet.
          </p>
        </div>
      </header>

      <div className="publish-layout">
        <form className="publish-form" onSubmit={submit}>
          <section className="form-section">
            <div className="form-section__head">
              <span className="form-section__number">01</span>
              <div>
                <h2>La ficha del libro</h2>
                <p>Cómo lo va a descubrir la próxima persona.</p>
              </div>
            </div>

            <label className="field">
              <span className="field-label">Título</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Cartas desde el trópico"
                maxLength={120}
                disabled={submitting}
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Autoría</span>
                <input
                  type="text"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder="Nombre de quien escribió"
                  maxLength={80}
                  disabled={submitting}
                />
              </label>

              <label className="field">
                <span className="field-label">Tu nombre de anfitrión</span>
                <input
                  type="text"
                  value={offererName}
                  onChange={(event) => setOffererName(event.target.value)}
                  placeholder="Ej. Biblioteca La Trastienda"
                  maxLength={40}
                  disabled={submitting}
                />
              </label>
            </div>

            <label className="field">
              <span className="field-label">Sinopsis</span>
              <textarea
                value={synopsis}
                onChange={(event) => setSynopsis(event.target.value)}
                placeholder="De qué trata, por qué vale la pena, qué encontrará quien lo lea."
                rows={4}
                maxLength={600}
                disabled={submitting}
              />
              <span className="field-count">{synopsis.trim().length}/600</span>
            </label>
          </section>

          <section className="form-section">
            <div className="form-section__head">
              <span className="form-section__number">02</span>
              <div>
                <h2>El texto</h2>
                <p>Una edición breve. Separa capítulos con una línea que empiece por ##.</p>
              </div>
            </div>

            <label className="field">
              <span className="field-label">Contenido</span>
              <textarea
                className="content-editor"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={CONTENT_PLACEHOLDER}
                rows={12}
                maxLength={300000}
                disabled={submitting}
              />
              <span className="field-count">
                {wordCount} palabras · {chapterCount} capítulos · {content.length}
                /300000
              </span>
            </label>
          </section>

          <section className="form-section">
            <div className="form-section__head">
              <span className="form-section__number">03</span>
              <div>
                <h2>El depósito</h2>
                <p>Cuánto cuesta abrir la lectura. Tú decides el precio.</p>
              </div>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Depósito en XLM</span>
                <div className="amount-field">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="8"
                    disabled={submitting}
                  />
                  <span>XLM</span>
                </div>
              </label>

              <div className="field">
                <span className="field-label">Portada</span>
                <div className="theme-picker">
                  {THEMES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`theme-picker__swatch theme-picker__swatch--${option.id} ${
                        theme === option.id ? "is-active" : ""
                      }`}
                      onClick={() => setTheme(option.id)}
                      aria-label={option.label}
                      aria-pressed={theme === option.id}
                      title={option.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="split-preview">
              <div>
                <span>Recibes tú</span>
                <strong>{formatXlm(split.offerer, 2)} XLM</strong>
              </div>
              <div>
                <span>Comisión Folio</span>
                <strong>{formatXlm(split.fee, 2)} XLM</strong>
              </div>
              <div>
                <span>Depósito total</span>
                <strong>{formatXlm(price || "0")} XLM</strong>
              </div>
            </div>
          </section>

          {error && (
            <p className="form-error" role="alert">
              <AlertIcon size={16} />
              {error}
            </p>
          )}

          <div className="publish-submit">
            <button
              className="btn btn--ink btn--wide"
              type="submit"
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <span className="spinner" />
              ) : (
                <SparkIcon size={17} />
              )}
              {submitting ? "Publicando…" : "Publicar en Folio"}
            </button>
            <p>
              <ShieldIcon size={14} />
              Los pagos van directo a tu wallet. Folio no custodia los depósitos.
            </p>
          </div>
        </form>

        <aside className="publish-preview">
          <span className="field-label">Vista previa</span>
          <BookCover
            book={{
              title: title || "Tu libro",
              author: author || "Tu nombre",
              theme,
            }}
            size="detail"
          />

          <div className="publish-preview__meta">
            <div>
              <BookIcon size={16} />
              <span>{chapterCount || 0} capítulos</span>
            </div>
            <div>
              <SparkIcon size={16} />
              <span>{wordCount} palabras</span>
            </div>
            <div>
              <CheckIcon size={16} />
              <span>Sello de lectura incluido</span>
            </div>
          </div>

          <div className="publish-preview__note">
            <strong>Así funciona el depósito</strong>
            <p>
              Quien lea paga {formatXlm(price || "0")} XLM. El 95% llega a tu
              wallet en la misma transacción; el 5% se queda en Folio.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
