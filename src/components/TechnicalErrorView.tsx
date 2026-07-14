interface TechnicalErrorViewProps {
  onBackToForm: () => void;
}

export function TechnicalErrorView({ onBackToForm }: TechnicalErrorViewProps) {
  return (
    <div className="status-panel" role="alert" aria-live="assertive">
      <p>
        No ha sido posible conectarse con el servicio. Por favor, póngase en
        contacto con el administrador.
      </p>
      <button type="button" onClick={onBackToForm}>
        Volver al formulario
      </button>
    </div>
  );
}
