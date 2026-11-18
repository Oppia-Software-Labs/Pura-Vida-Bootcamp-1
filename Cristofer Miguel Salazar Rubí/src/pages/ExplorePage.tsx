import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { BookSummary } from "../../shared/types";
import { api } from "../lib/api";
import { plural, readingMinutes } from "../lib/format";
import { BookCard } from "../components/BookCard";
import { BookCover } from "../components/BookCover";
import {
  ArrowRightIcon,
  BookIcon,
  ClockIcon,
  CoinsIcon,
  PenIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  UsersIcon,
} from "../components/Icons";

type SortOrder = "recent" | "rating" | "price";

export function ExplorePage() {
  const [books, setBooks] = useState<BookSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("recent");

  useEffect(() => {
    let active = true;

    api
      .getBooks()
      .then((value) => {
        if (active) setBooks(value);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar el catálogo.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!books || books.length === 0) {
      return { books: 0, reads: 0, rating: 0 };
    }

    const reads = books.reduce((sum, book) => sum + book.stats.reads, 0);
    const rated = books.filter((book) => book.stats.ratingCount > 0);
    const rating =
      rated.reduce((sum, book) => sum + book.stats.ratingAverage, 0) /
      Math.max(rated.length, 1);

    return { books: books.length, reads, rating };
  }, [books]);

  const visibleBooks = useMemo(() => {
    if (!books) return [];

    const needle = search.trim().toLowerCase();
    const filtered = needle
      ? books.filter((book) =>
          `${book.title} ${book.author} ${book.synopsis} ${book.offererName ?? ""}`
            .toLowerCase()
            .includes(needle),
        )
      : [...books];

    return filtered.sort((a, b) => {
      if (sort === "rating") {
        return b.stats.ratingAverage - a.stats.ratingAverage;
      }
      if (sort === "price") {
        return Number(a.price) - Number(b.price);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [books, search, sort]);

  const featured = books?.slice(0, 3) ?? [];

  return (
    <div className="page explore-page">
      <section className="hero">
        <div className="hero__copy">
          <span className="kicker">
            <SparkIcon size={14} />
            Lectura entre personas
          </span>

          <h1>
            Los libros también
            <br />
            <em>viajan.</em>
          </h1>

          <p className="hero__lead">
            Lee de persona a persona, paga directo a quien comparte su
            biblioteca y gana un sello on-chain cuando terminas la lectura.
          </p>

          <div className="hero__actions">
            <a className="btn btn--ink" href="#catalogo">
              Encontrar una lectura
              <ArrowRightIcon size={17} />
            </a>
            <Link className="btn btn--outline" to="/publicar">
              <PenIcon size={16} />
              Publicar mi libro
            </Link>
          </div>

          <div className="hero__stats">
            <div>
              <strong>{stats.books}</strong>
              <span>{plural(stats.books, "libro", "libros")}</span>
            </div>
            <div>
              <strong>{stats.reads}</strong>
              <span>lecturas</span>
            </div>
            <div>
              <strong>{stats.rating.toFixed(1)}</strong>
              <span>valoración media</span>
            </div>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="hero-stack">
            {featured.map((book, index) => (
              <div
                className={`hero-stack__item hero-stack__item--${index + 1}`}
                key={book.id}
              >
                <BookCover book={book} size="detail" />
              </div>
            ))}
            <span className="hero-stack__stamp">
              <SparkIcon size={16} />
              Sello de lectura al terminar
            </span>
          </div>
        </div>
      </section>

      <section className="value-strip" aria-label="Cómo funciona Folio">
        <div>
          <BookIcon size={20} />
          <span>
            <strong>95%</strong> para el anfitrión
          </span>
        </div>
        <div>
          <CoinsIcon size={20} />
          <span>
            <strong>5%</strong> de comisión
          </span>
        </div>
        <div>
          <ShieldIcon size={20} />
          <span>Pagos directos, sin custodia</span>
        </div>
        <div>
          <SparkIcon size={20} />
          <span>Un sello por libro terminado</span>
        </div>
      </section>

      <section className="catalog" id="catalogo">
        <div className="section-head">
          <div>
            <span className="kicker kicker--muted">
              <BookIcon size={14} />
              En cartelera
            </span>
            <h2>Historias disponibles ahora</h2>
          </div>

          <div className="catalog__tools">
            <label className="search-box">
              <SearchIcon size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por título, autor o anfitrión"
                aria-label="Buscar libros"
              />
            </label>

            <select
              className="select"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
              aria-label="Ordenar catálogo"
            >
              <option value="recent">Más recientes</option>
              <option value="rating">Mejor valorados</option>
              <option value="price">Menor depósito</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="state-box state-box--error" role="alert">
            <strong>No pudimos abrir el catálogo.</strong>
            <p>{error}</p>
          </div>
        )}

        {!books && !error && (
          <div className="book-grid" aria-label="Cargando libros">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="book-card book-card--skeleton" key={index}>
                <span />
                <div>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        )}

        {books && visibleBooks.length === 0 && (
          <div className="state-box">
            <SearchIcon size={28} />
            <strong>No encontramos ese libro.</strong>
            <p>Prueba con otro título, autor o nombre de anfitrión.</p>
          </div>
        )}

        {visibleBooks.length > 0 && (
          <div className="book-grid">
            {visibleBooks.map((book, index) => (
              <BookCard book={book} index={index} key={book.id} />
            ))}
          </div>
        )}
      </section>

      <section className="how-section">
        <div className="how-section__head">
          <span className="kicker kicker--muted">
            <SparkIcon size={14} />
            Cómo funciona
          </span>
          <h2>Tres pasos entre dos personas</h2>
          <p>
            Sin suscripciones ni intermediarios. Tú pagas el acceso, el
            anfitrión recibe el 95% y Folio retiene el 5% para mantener la
            infraestructura.
          </p>
        </div>

        <ol className="how-grid">
          <li>
            <span className="how-grid__number">01</span>
            <BookIcon size={24} />
            <h3>Encuentra</h3>
            <p>
              Explora ediciones breves compartidas por lectores. Cada libro
              muestra su depósito, duración y valoraciones.
            </p>
          </li>
          <li>
            <span className="how-grid__number">02</span>
            <CoinsIcon size={24} />
            <h3>Deposita</h3>
            <p>
              Un solo pago divide el depósito: el 95% va directo al anfitrión y
              el 5% a Folio. Sin cuentas intermedias.
            </p>
          </li>
          <li>
            <span className="how-grid__number">03</span>
            <SparkIcon size={24} />
            <h3>Lee y sella</h3>
            <p>
              Al terminar, deja una reseña. Folio emite un sello único de ese
              libro en tu wallet como prueba de lectura.
            </p>
          </li>
        </ol>
      </section>

      <section className="host-cta">
        <div>
          <span className="kicker kicker--light">
            <PenIcon size={14} />
            Para anfitriones
          </span>
          <h2>Tu biblioteca puede circular.</h2>
          <p>
            Publica un texto, define el depósito y recibe el 95% de cada
            lectura. Tú conservas la decisión de qué compartir.
          </p>
        </div>
        <Link className="btn btn--paper" to="/publicar">
          Publicar un libro
          <ArrowRightIcon size={17} />
        </Link>
      </section>

      <section className="mini-notes">
        <div>
          <StarIcon size={18} />
          <span>
            Reseñas verificadas: solo quien terminó el libro puede escribir la
            suya.
          </span>
        </div>
        <div>
          <ClockIcon size={18} />
          <span>
            Ediciones breves de {readingMinutes(1200)}–
            {readingMinutes(2400)} minutos para leer sin prisa.
          </span>
        </div>
        <div>
          <UsersIcon size={18} />
          <span>
            Cada depósito mueve XLM en Testnet y queda visible en Stellar
            Expert.
          </span>
        </div>
      </section>
    </div>
  );
}
