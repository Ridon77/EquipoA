interface SuccessViewProps {
  onNewRequest: () => void;
}

export function SuccessView({ onNewRequest }: SuccessViewProps) {
  return (
    <div className="status-panel" role="status" aria-live="polite">
      <p>La solicitud se ha procesado correctamente.</p>
      <button type="button" onClick={onNewRequest}>
        Nueva solicitud
      </button>
    </div>
  );
}
