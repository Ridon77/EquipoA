import { useEffect, useRef } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { CountryCitySelector } from './CountryCitySelector';
import { ProcessErrorBanner } from './ProcessErrorBanner';
import { ValidationSummary } from './ValidationSummary';
import type { FormData, RequiredFieldsConfig } from '../types';
import type { CountryOption } from '../types/countries';
import type { FormErrors } from '../validation';
import { formFieldOrder } from '../validation';

export interface ApiValidationSummary {
  missingFields: string[];
  invalidFields: string[];
}

interface FormViewProps {
  formData: FormData;
  errors: FormErrors;
  requiredFields: RequiredFieldsConfig;
  countries: CountryOption[];
  countriesLoading: boolean;
  countriesError: string | null;
  onRetryCountries: () => void;
  onChange: (field: keyof FormData, value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  processError?: string;
  validationError?: ApiValidationSummary;
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required: boolean;
}) {
  return (
    <label className="form-label" htmlFor={htmlFor}>
      {children}
      {required ? (
        <span className="form-label__required" aria-hidden="true">
          {' '}
          *
        </span>
      ) : (
        <span className="form-label__optional">Opcional</span>
      )}
    </label>
  );
}

export function FormView({
  formData,
  errors,
  requiredFields,
  countries,
  countriesLoading,
  countriesError,
  onRetryCountries,
  onChange,
  onSubmit,
  isSubmitting = false,
  processError,
  validationError,
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
    // Ante un 422, el foco va al resumen; no al primer campo.
    if (validationError) {
      return;
    }

    for (const field of formFieldOrder) {
      if (errors[field]) {
        fieldRefs[field].current?.focus();
        break;
      }
    }
  }, [errors, validationError]);

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
      {validationError && (
        <ValidationSummary
          missingFields={validationError.missingFields}
          invalidFields={validationError.invalidFields}
        />
      )}
      {!validationError && processError && (
        <ProcessErrorBanner message={processError} />
      )}

      <p className="form-help form-required-legend">
        Los campos marcados con * son obligatorios.
      </p>

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
          <FieldLabel htmlFor="nombre" required={requiredFields.nombre}>
            Nombre
          </FieldLabel>
          <input
            ref={fieldRefs.nombre}
            id="nombre"
            name="nombre"
            type="text"
            className="form-control"
            value={formData.nombre}
            aria-required={requiredFields.nombre || undefined}
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
          <FieldLabel htmlFor="email" required={requiredFields.email}>
            Email
          </FieldLabel>
          <input
            ref={fieldRefs.email}
            id="email"
            name="email"
            type="email"
            className="form-control"
            value={formData.email}
            aria-required={requiredFields.email || undefined}
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
          <FieldLabel htmlFor="empresa" required={requiredFields.empresa}>
            Empresa
          </FieldLabel>
          <input
            ref={fieldRefs.empresa}
            id="empresa"
            name="empresa"
            type="text"
            className="form-control"
            value={formData.empresa}
            aria-required={requiredFields.empresa || undefined}
            onChange={(event) => onChange('empresa', event.target.value)}
            aria-invalid={errors.empresa ? true : undefined}
            aria-describedby={errors.empresa ? 'empresa-error' : undefined}
          />
          {errors.empresa && (
            <p id="empresa-error" className="form-error" role="alert">
              {errors.empresa}
            </p>
          )}
        </div>

        <CountryCitySelector
          countries={countries}
          countryValue={formData.pais}
          cityValue={formData.ciudad}
          onCountryChange={handleCountryChange}
          onCityChange={handleCityChange}
          countryError={errors.pais}
          cityError={errors.ciudad}
          countryRequired={requiredFields.pais}
          cityRequired={requiredFields.ciudad}
          disabled={countriesLoading}
          countryRef={fieldRefs.pais}
          cityRef={fieldRefs.ciudad}
        />

        <div className="form-field form-field--full">
          <FieldLabel htmlFor="mensaje" required={requiredFields.mensaje}>
            Solicitud
          </FieldLabel>
          <textarea
            ref={fieldRefs.mensaje}
            id="mensaje"
            name="mensaje"
            className="form-textarea"
            rows={4}
            value={formData.mensaje}
            aria-required={requiredFields.mensaje || undefined}
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
        {isSubmitting && (
          <span className="loading-inline" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            Estamos procesando su solicitud. Este proceso puede tardar unos
            minutos.
          </span>
        )}
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
