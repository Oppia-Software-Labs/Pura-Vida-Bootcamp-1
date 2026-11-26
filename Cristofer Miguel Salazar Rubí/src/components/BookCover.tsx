import type { BookSummary } from "../../shared/types";

interface BookCoverProps {
  book: Pick<BookSummary, "title" | "author" | "theme">;
  size?: "card" | "detail" | "reader" | "mini";
  className?: string;
}

function titleSize(title: string): string {
  if (title.length > 42) return "1.05rem";
  if (title.length > 30) return "1.25rem";
  if (title.length > 20) return "1.5rem";
  return "1.75rem";
}

export function BookCover({
  book,
  size = "card",
  className = "",
}: BookCoverProps) {
  return (
    <div
      className={`book-cover book-cover--${size} book-cover--${book.theme} ${className}`.trim()}
    >
      <span className="book-cover__spine" aria-hidden="true" />
      <span className="book-cover__kicker">Folio · edición breve</span>

      <div className="book-cover__title-wrap">
        <h3
          className="book-cover__title"
          style={{ fontSize: size === "mini" ? "0.95rem" : titleSize(book.title) }}
        >
          {book.title}
        </h3>
        <p className="book-cover__author">{book.author}</p>
      </div>

      <span className="book-cover__mark" aria-hidden="true">
        F
      </span>
      <span className="book-cover__rule" aria-hidden="true" />
    </div>
  );
}
