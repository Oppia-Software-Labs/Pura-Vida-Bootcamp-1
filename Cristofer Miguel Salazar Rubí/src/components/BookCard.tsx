import { Link } from "react-router-dom";
import type { BookSummary } from "../../shared/types";
import { formatXlm, readingMinutes, shortAddress } from "../lib/format";
import { BookCover } from "./BookCover";
import { ClockIcon, UsersIcon } from "./Icons";
import { RatingStars } from "./RatingStars";

export function BookCard({ book, index = 0 }: { book: BookSummary; index?: number }) {
  return (
    <Link
      to={`/libro/${book.id}`}
      className="book-card"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="book-card__cover">
        <BookCover book={book} />
      </div>

      <div className="book-card__body">
        <div className="book-card__top">
          <RatingStars
            value={book.stats.ratingAverage}
            count={book.stats.ratingCount}
            size={13}
          />
          <span className="book-card__price">
            {formatXlm(book.price)} XLM
          </span>
        </div>

        <h3>{book.title}</h3>
        <p className="book-card__author">{book.author}</p>
        <p className="book-card__synopsis">{book.synopsis}</p>

        <div className="book-card__meta">
          <span>
            <ClockIcon size={14} />
            {readingMinutes(book.wordCount)} min
          </span>
          <span>
            <UsersIcon size={14} />
            {book.stats.reads}
          </span>
          <span className="book-card__host">
            {book.offererName ?? shortAddress(book.offerer, 4)}
          </span>
        </div>
      </div>
    </Link>
  );
}
