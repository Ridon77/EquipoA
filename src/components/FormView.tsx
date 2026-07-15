import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { CountryCitySelector } from './CountryCitySelector';
import { ProcessErrorBanner } from './ProcessErrorBanner';
import type { FormData } from '../types';
import type { CountryOption } from '../types/countries';
import type { FormErrors } from '../validation';
import { formFieldOrder } from '../validation';

interface FormViewProps {
  formData: FormData;
  errors: FormErrors;
  countries: CountryOption[];
  countriesLoading: boolean;
  countriesError: string | null;
  onRetryCountries: () => void;
  onChange: (field: keyof FormData, value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  processError?: string;
}

export function FormView({
  formData,
  errors,
  countries,
  countriesLoading,
  countriesError,
  onRetryCountries,
  onChange,
  onSubmit,
  isSubmitting = false,
  processError,
}: FormViewProps) {
  const fieldRefs = {
    nombre: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    empresa: useRef<HTMLInputElement>(null),
    pais: useRef<HTMLInputElement>(null),
    ciudad: useRef<HTMLInputElement>(null),
    mensaje: useRef<HTMLTextAreaElement>(null),
  };

  useEffect(() => {
    for (const field of formFieldOrder) {
      if (errors[field]) {
        fieldRefs[field].current?.focus();
        break;
      }
    }
  }, [errors]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleCountryChange = (countryDisplayName: string) => {
    onChange('pais', countryDisplayName);
  };

  const handleCityChange = (cityDisplayName: string) => {
    onChange('ciudad', cityDisplayName);
  };

  return (
    <form className="form-layout" onSubmit={handleSubmit} noValidate>
      {processError && <ProcessErrorBanner message={processError} />}

      {countriesLoading && (
        <span className="loading-inline" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          Cargando países y ciudades...
        </span>
      )}

      {countriesError && (
        <div
          className="status-panel status-panel--error"
          role="alert"
          aria-live="polite"
        >
          <p className="form-error">{countriesError}</p>
          <button
            type="button"
            className="button button--secondary"
            onClick={onRetryCountries}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="form-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="nombre">
            Introduzca su nombre
          </label>
          <input
            ref={fieldRefs.nombre}
            id="nombre"
            name="nombre"
            type="text"
            className="form-control"
            value={formData.nombre}
            onChange={(event) => onChange('nombre', event.target.value)}
            aria-invalid={errors.nombre ? true : undefined}
            aria-describedby={errors.nombre ? 'nombre-error' : undefined}
          />
          {errors.nombre && (
            <p id="nombre-error" className="form-error" role="alert">
              {errors.nombre}
            </p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="email">
            Introduzca su email
            <span className="form-label__optional">Opcional</span>
          </label>
          <input
            ref={fieldRefs.email}
            id="email"
            name="email"
            type="email"
            className="form-control"
            value={formData.email}
            onChange={(event) => onChange('email', event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="form-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="empresa">
            Introduzca su empresa
            <span className="form-label__optional">Opcional</span>
          </label>
          <input
            ref={fieldRefs.empresa}
            id="empresa"
            name="empresa"
            type="text"
            className="form-control"
            value={formData.empresa}
            onChange={(event) => onChange('empresa', event.target.value)}
          />
        </div>

        <CountryCitySelector
          countries={countries}
          countryValue={formData.pais}
          cityValue={formData.ciudad}
          onCountryChange={handleCountryChange}
          onCityChange={handleCityChange}
          countryError={errors.pais}
          cityError={errors.ciudad}
          disabled={countriesLoading}
          countryRef={fieldRefs.pais}
          cityRef={fieldRefs.ciudad}
        />

        <div className="form-field form-field--full">
          <label className="form-label" htmlFor="mensaje">
            Introduzca su solicitud
          </label>
          <textarea
            ref={fieldRefs.mensaje}
            id="mensaje"
            name="mensaje"
            className="form-textarea"
            rows={4}
            value={formData.mensaje}
            onChange={(event) => onChange('mensaje', event.target.value)}
            aria-invalid={errors.mensaje ? true : undefined}
            aria-describedby={errors.mensaje ? 'mensaje-error' : undefined}
          />
          {errors.mensaje && (
            <p id="mensaje-error" className="form-error" role="alert">
              {errors.mensaje}
            </p>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="button button--primary button--full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Enviando...
            </>
          ) : (
            'Enviar'
          )}
        </button>
      </div>
    </form>
  );
}
