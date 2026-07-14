interface TechnicalErrorViewProps {
  onBackToForm: () => void;
}

export function TechnicalErrorView({ onBackToForm }: TechnicalErrorViewProps) {
  return (
    <section className="surface-card result-state" role="alert" aria-live="assertive">
      <div className="result-state__icon result-state__icon--error" aria-hidden="true">
        !
      </div>
      <h2 className="result-state__title">Error de conexión</h2>
      <p className="result-state__message">
        No ha sido posible conectarse con el servicio. Por favor, póngase en
        contacto con el administrador.
      </p>
      <button
        type="button"
        className="button button--secondary"
        onClick={onBackToForm}
      >
        Volver al formulario
      </button>
    </section>
  );
}
