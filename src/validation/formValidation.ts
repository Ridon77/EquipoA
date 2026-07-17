import type { FormData } from '../types';

export type FormField = keyof FormData;

export type FormErrors = Partial<Record<FormField, string>>;

export const formFieldOrder: FormField[] = [
  'nombre',
  'email',
  'empresa',
  'pais',
  'ciudad',
  'mensaje',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function trimFormData(data: FormData): FormData {
  return {
    nombre: data.nombre.trim(),
    email: data.email.trim(),
    empresa: data.empresa.trim(),
    pais: data.pais.trim(),
    ciudad: data.ciudad.trim(),
    mensaje: data.mensaje.trim(),
  };
}

/**
 * Validación local de formato únicamente.
 * La obligatoriedad (`requiredFields`) es solo visual: n8n valida con HTTP 422.
 */
export function validateForm(
  data: FormData,
  countryOptions: string[],
  cityOptions: string[],
): FormErrors {
  const trimmed = trimFormData(data);
  const errors: FormErrors = {};

  if (trimmed.email && !EMAIL_PATTERN.test(trimmed.email)) {
    errors.email = 'Introduzca una dirección de correo válida.';
  }

  if (trimmed.pais && !countryOptions.includes(trimmed.pais)) {
    errors.pais = 'Seleccione un país válido.';
  }

  if (trimmed.ciudad) {
    if (!trimmed.pais) {
      errors.ciudad = 'Seleccione un país.';
    } else if (!cityOptions.includes(trimmed.ciudad)) {
      errors.ciudad =
        'Seleccione una ciudad válida para el país indicado.';
    }
  }

  return errors;
}

export function hasFormErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
