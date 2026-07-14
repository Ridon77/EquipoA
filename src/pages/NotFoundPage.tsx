import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="surface-card result-state">
      <div className="result-state__icon result-state__icon--error" aria-hidden="true">
        404
      </div>
      <h1 className="result-state__title">Página no encontrada</h1>
      <p className="result-state__message">
        La dirección solicitada no existe o ya no está disponible.
      </p>
      <Link className="button button--primary" to="/">
        Volver al formulario
      </Link>
    </section>
  );
}
