import { useEffect, useRef } from 'react';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SuccessPageProps {
  message?: string;
  advisorName?: string;
  advisorEmail?: string;
  onNewRequest: () => void;
}

function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function SuccessPage({
  message,
  advisorName = '',
  advisorEmail = '',
  onNewRequest,
}: SuccessPageProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const trimmedName = advisorName.trim();
  const trimmedEmail = advisorEmail.trim();
  const hasValidEmail = isValidEmail(trimmedEmail);
  const hasAdvisorCard = Boolean(trimmedName || hasValidEmail);
  const confirmation =
    message?.trim() || 'Hemos recibido correctamente tu solicitud.';

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <section
      className="surface-card result-state success-page"
      role="status"
      aria-live="polite"
    >
      <div
        className="result-state__icon result-state__icon--success"
        aria-hidden="true"
      >
        ✓
      </div>

      <h1 ref={titleRef} className="result-state__title" tabIndex={-1}>
        Gracias por contactar con Equipo A
      </h1>

      <p className="success-page__confirmation">{confirmation}</p>

      <p className="result-state__message">
        {trimmedName
          ? `${trimmedName}, miembro de nuestro equipo de consultoría, ya está revisando tu consulta.`
          : 'Una persona de nuestro equipo de consultoría ya está revisando tu consulta.'}
      </p>

      {hasAdvisorCard && (
        <div className="success-page__advisor-card">
          <p className="success-page__advisor-label">Tu contacto en Equipo A</p>
          <div className="success-page__advisor-body">
            <span className="success-page__advisor-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                focusable="false"
              >
                <path
                  d="M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              {trimmedName && (
                <p className="success-page__advisor-name">{trimmedName}</p>
              )}
              {hasValidEmail && (
                <a
                  className="success-page__advisor-email"
                  href={`mailto:${trimmedEmail}`}
                >
                  {trimmedEmail}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="success-page__steps">
        <h2 className="success-page__steps-title">¿Qué ocurrirá ahora?</h2>
        <ol className="success-page__steps-list">
          <li>Revisaremos la información que nos has enviado.</li>
          <li>Te contactaremos por correo electrónico.</li>
          <li>Concertaremos una reunión de 30 minutos.</li>
        </ol>
        <p className="success-page__next">
          Revisa tu correo electrónico. Nos pondremos en contacto contigo para
          concertar una reunión de 30 minutos y conocer mejor tus necesidades.
        </p>
      </div>

      <p className="success-page__contact">
        {trimmedName && hasValidEmail ? (
          <>
            ¿Has olvidado algún detalle importante? No te preocupes. Puedes
            escribir directamente a {trimmedName} en{' '}
            <a href={`mailto:${trimmedEmail}`}>{trimmedEmail}</a>.
          </>
        ) : (
          'Si necesitas añadir información, responde al correo de confirmación cuando lo recibas.'
        )}
      </p>

      <p className="success-page__closing">
        Gracias por confiar en Equipo A. Estamos deseando ayudarte a avanzar.
      </p>

      <div className="success-page__actions">
        <button
          type="button"
          className="button button--primary button--full"
          onClick={onNewRequest}
        >
          Enviar una nueva solicitud
        </button>
        {hasValidEmail && (
          <a
            className="button button--secondary button--full"
            href={`mailto:${trimmedEmail}`}
          >
            {trimmedName ? `Escribir a ${trimmedName}` : 'Escribir al asesor'}
          </a>
        )}
      </div>
    </section>
  );
}

/** @deprecated Usa SuccessPage. Conservado por compatibilidad de imports. */
export const SuccessView = SuccessPage;
