import type { FormData } from '../types';

export type FormField = keyof FormData;

export type FormErrors = Partial<Record<FormField, string>>;

export const formFieldOrder: FormField[] = [
  'nombre',
  'email',
  'pais',
  'ciudad',
  'mensaje',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function trimFormData(data: FormData): FormData {
  return {
    nombre: data.nombre.trim(),
    email: data.email.trim(),
    pais: data.pais.trim(),
    ciudad: data.ciudad.trim(),
    mensaje: data.mensaje.trim(),
  };
}

export function validateForm(
  data: FormData,
  countryOptions: string[],
  cityOptions: string[],
): FormErrors {
  const trimmed = trimFormData(data);
  const errors: FormErrors = {};

  if (!trimmed.nombre) {
    errors.nombre = 'El nombre es obligatorio.';
  }

  if (trimmed.email && !EMAIL_PATTERN.test(trimmed.email)) {
    errors.email = 'El email no tiene un formato válido.';
  }

  if (trimmed.pais && !countryOptions.includes(trimmed.pais)) {
    errors.pais = 'El país seleccionado no es válido.';
  }

  if (trimmed.ciudad) {
    if (!trimmed.pais) {
      errors.ciudad = 'Debe seleccionar un país antes de indicar la ciudad.';
    } else if (!cityOptions.includes(trimmed.ciudad)) {
      errors.ciudad = 'La ciudad seleccionada no es válida para el país indicado.';
    }
  }

  if (!trimmed.mensaje) {
    errors.mensaje = 'La solicitud es obligatoria.';
  }

  return errors;
}

export function hasFormErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
