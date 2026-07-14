interface SuccessViewProps {
  onNewRequest: () => void;
}

export function SuccessView({ onNewRequest }: SuccessViewProps) {
  return (
    <section className="surface-card result-state" role="status" aria-live="polite">
      <div className="result-state__icon result-state__icon--success" aria-hidden="true">
        ✓
      </div>
      <h2 className="result-state__title">
        La solicitud se ha procesado correctamente.
      </h2>
      <p className="result-state__message">
        Hemos recibido la información y el proceso ha finalizado correctamente.
      </p>
      <button
        type="button"
        className="button button--primary"
        onClick={onNewRequest}
      >
        Nueva solicitud
      </button>
    </section>
  );
}
