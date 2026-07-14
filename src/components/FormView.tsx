import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { ProcessErrorBanner } from './ProcessErrorBanner';
import { SearchableSelect } from './SearchableSelect';
import type { FormData } from '../types';
import type { FormErrors } from '../validation';
import { formFieldOrder } from '../validation';

interface FormViewProps {
  formData: FormData;
  errors: FormErrors;
  countryOptions: string[];
  cityOptions: string[];
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
  countryOptions,
  cityOptions,
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

  return (
    <form onSubmit={handleSubmit} noValidate>
      {processError && <ProcessErrorBanner message={processError} />}

      {countriesLoading && (
        <p role="status" aria-live="polite">
          Cargando países...
        </p>
      )}

      {countriesError && (
        <div className="process-error" role="alert" aria-live="polite">
          <p>{countriesError}</p>
          <button type="button" onClick={onRetryCountries}>
            Reintentar
          </button>
        </div>
      )}

      <label htmlFor="nombre">
        Introduzca su nombre
        <input
          ref={fieldRefs.nombre}
          id="nombre"
          name="nombre"
          type="text"
          value={formData.nombre}
          onChange={(event) => onChange('nombre', event.target.value)}
          aria-invalid={errors.nombre ? true : undefined}
          aria-describedby={errors.nombre ? 'nombre-error' : undefined}
        />
        {errors.nombre && (
          <span id="nombre-error" className="field-error" role="alert">
            {errors.nombre}
          </span>
        )}
      </label>

      <label htmlFor="email">
        Introduzca su email
        <input
          ref={fieldRefs.email}
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(event) => onChange('email', event.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" className="field-error" role="alert">
            {errors.email}
          </span>
        )}
      </label>

      <label htmlFor="empresa">
        Introduzca su empresa
        <input
          ref={fieldRefs.empresa}
          id="empresa"
          name="empresa"
          type="text"
          value={formData.empresa}
          onChange={(event) => onChange('empresa', event.target.value)}
        />
      </label>

      <SearchableSelect
        id="pais"
        label="Introduzca su país"
        value={formData.pais}
        options={countryOptions}
        onChange={(value) => onChange('pais', value)}
        disabled={countriesLoading}
        error={errors.pais}
        inputRef={fieldRefs.pais}
      />

      <SearchableSelect
        id="ciudad"
        label="Introduzca su ciudad"
        value={formData.ciudad}
        options={cityOptions}
        onChange={(value) => onChange('ciudad', value)}
        disabled={countriesLoading || formData.pais.trim() === ''}
        error={errors.ciudad}
        inputRef={fieldRefs.ciudad}
      />

      <label htmlFor="mensaje">
        Introduzca su solicitud
        <textarea
          ref={fieldRefs.mensaje}
          id="mensaje"
          name="mensaje"
          rows={4}
          value={formData.mensaje}
          onChange={(event) => onChange('mensaje', event.target.value)}
          aria-invalid={errors.mensaje ? true : undefined}
          aria-describedby={errors.mensaje ? 'mensaje-error' : undefined}
        />
        {errors.mensaje && (
          <span id="mensaje-error" className="field-error" role="alert">
            {errors.mensaje}
          </span>
        )}
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
