import type { FormField, FormErrors } from '../validation';

/** Nombres de campo API (n8n) → campos internos del formulario. */
export const apiFieldToFormField: Record<string, FormField> = {
  Nombre: 'nombre',
  Email: 'email',
  Empresa: 'empresa',
  Pais: 'pais',
  País: 'pais',
  Ciudad: 'ciudad',
  Mensaje: 'mensaje',
};

const MISSING_FIELD_MESSAGE = 'Este campo es obligatorio.';
const INVALID_EMAIL_MESSAGE = 'Introduzca una dirección de correo válida.';
const INVALID_FIELD_MESSAGE = 'Revise el formato de este campo.';

/**
 * Convierte listas de nombres API en errores de campo del formulario.
 * Los nombres desconocidos se ignoran en el mapeo (siguen en el resumen).
 * Si un campo aparece en ambas listas, prevalece el mensaje de obligatorio.
 */
export function mapValidationToFormErrors(
  missingFields: string[],
  invalidFields: string[],
): FormErrors {
  const errors: FormErrors = {};

  for (const name of missingFields) {
    const field = apiFieldToFormField[name];
    if (field) {
      errors[field] = MISSING_FIELD_MESSAGE;
    }
  }

  for (const name of invalidFields) {
    const field = apiFieldToFormField[name];
    if (field && !errors[field]) {
      errors[field] =
        field === 'email' ? INVALID_EMAIL_MESSAGE : INVALID_FIELD_MESSAGE;
    }
  }

  return errors;
}
