import type { FormData, RequiredFieldsConfig } from '../types';

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

export function validateForm(
  data: FormData,
  requiredFields: RequiredFieldsConfig,
  countryOptions: string[],
  cityOptions: string[],
): FormErrors {
  const trimmed = trimFormData(data);
  const errors: FormErrors = {};

  if (requiredFields.nombre && !trimmed.nombre) {
    errors.nombre = 'Introduzca su nombre.';
  }

  if (requiredFields.email && !trimmed.email) {
    errors.email = 'Introduzca su email.';
  } else if (trimmed.email && !EMAIL_PATTERN.test(trimmed.email)) {
    errors.email = 'Introduzca una dirección de correo válida.';
  }

  if (requiredFields.empresa && !trimmed.empresa) {
    errors.empresa = 'Introduzca su empresa.';
  }

  if (requiredFields.pais && !trimmed.pais) {
    errors.pais = 'Seleccione un país.';
  } else if (trimmed.pais && !countryOptions.includes(trimmed.pais)) {
    errors.pais = 'Seleccione un país válido.';
  }

  if (requiredFields.ciudad && !trimmed.ciudad) {
    errors.ciudad = 'Seleccione una ciudad.';
  } else if (trimmed.ciudad) {
    if (!trimmed.pais) {
      errors.ciudad = 'Seleccione un país.';
    } else if (!cityOptions.includes(trimmed.ciudad)) {
      errors.ciudad =
        'Seleccione una ciudad válida para el país indicado.';
    }
  }

  if (requiredFields.mensaje && !trimmed.mensaje) {
    errors.mensaje = 'Introduzca su solicitud.';
  }

  return errors;
}

export function hasFormErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
