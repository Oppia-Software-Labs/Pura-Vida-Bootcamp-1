import { StarIcon } from "./Icons";

interface RatingStarsProps {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function RatingStars({
  value,
  count,
  size = 14,
  showValue = false,
  className = "",
}: RatingStarsProps) {
  const rounded = Math.round(value);
  const label =
    count === undefined
      ? `${value.toFixed(1)} de 5`
      : `${value.toFixed(1)} de 5, ${count} reseñas`;

  return (
    <span
      className={`rating-stars ${className}`.trim()}
      aria-label={label}
      title={label}
    >
      <span className="rating-stars__icons" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon
            key={index}
            size={size}
            filled={index < rounded}
            className={index < rounded ? "is-filled" : ""}
          />
        ))}
      </span>
      {showValue && (
        <span className="rating-stars__value">
          {count === 0 ? "Nuevo" : value.toFixed(1)}
        </span>
      )}
      {count !== undefined && count > 0 && (
        <span className="rating-stars__count">({count})</span>
      )}
    </span>
  );
}
