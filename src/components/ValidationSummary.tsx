import { useEffect, useRef } from 'react';

export interface ValidationSummaryProps {
  missingFields: string[];
  invalidFields: string[];
}

function FieldList({ fields }: { fields: string[] }) {
  return (
    <ul className="validation-summary__list">
      {fields.map((field) => (
        <li key={field} className="validation-summary__item">
          {field}
        </li>
      ))}
    </ul>
  );
}

export function ValidationSummary({
  missingFields,
  invalidFields,
}: ValidationSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const hasStructuredFields =
    missingFields.length > 0 || invalidFields.length > 0;

  useEffect(() => {
    summaryRef.current?.focus();
  }, [missingFields, invalidFields]);

  return (
    <div
      ref={summaryRef}
      id="validation-summary"
      className="validation-summary status-panel status-panel--warning"
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
    >
      <span className="validation-summary__icon" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          focusable="false"
        >
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div className="validation-summary__content">
        <h2 className="validation-summary__title">
          Necesitamos que revise algunos datos
        </h2>

        {hasStructuredFields ? (
          <>
            <p className="validation-summary__intro">
              Para poder atender su solicitud correctamente, necesitamos que
              complete la información pendiente y revise los datos indicados.
            </p>

            {missingFields.length > 0 && (
              <section className="validation-summary__section">
                <p className="validation-summary__section-title">
                  {missingFields.length === 1
                    ? 'Complete el siguiente campo obligatorio:'
                    : 'Complete los siguientes campos obligatorios:'}
                </p>
                <FieldList fields={missingFields} />
              </section>
            )}

            {invalidFields.length > 0 && (
              <section className="validation-summary__section">
                <p className="validation-summary__section-title">
                  {invalidFields.length === 1
                    ? 'Revise el formato del siguiente campo:'
                    : 'Revise el formato de los siguientes campos:'}
                </p>
                <FieldList fields={invalidFields} />
              </section>
            )}

            <p className="validation-summary__footer">
              Esta información es necesaria para poder tramitar su solicitud
              adecuadamente. Cuando haya realizado los cambios, podrá volver a
              enviarla.
            </p>
          </>
        ) : (
          <>
            <p className="validation-summary__intro">
              No ha sido posible validar la solicitud. Revise la información
              introducida y vuelva a intentarlo.
            </p>
            <p className="validation-summary__footer">
              Si el problema continúa, póngase en contacto con el administrador.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
