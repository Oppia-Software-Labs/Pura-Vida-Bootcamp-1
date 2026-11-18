import { Link } from "react-router-dom";
import { ArrowLeftIcon, BookIcon } from "../components/Icons";

export function NotFoundPage() {
  return (
    <div className="page">
      <div className="state-box state-box--tall">
        <span className="state-box__icon">
          <BookIcon size={28} />
        </span>
        <strong>Esta página se perdió entre los libros.</strong>
        <p>Vuelve al catálogo y encuentra tu próxima lectura.</p>
        <Link className="btn btn--ink" to="/">
          <ArrowLeftIcon size={16} />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
