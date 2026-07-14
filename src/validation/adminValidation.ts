import type { AppConfig, ParameterMapping } from '../types';

const URL_PATTERN = /^https?:\/\/.+/;

export type ParameterField = keyof ParameterMapping;

export const parameterFieldLabels: Record<ParameterField, string> = {
  nombre: 'Nombre',
  email: 'Email',
  empresa: 'Empresa',
  pais: 'País',
  ciudad: 'Ciudad',
  mensaje: 'Mensaje',
};

export const parameterFieldOrder: ParameterField[] = [
  'nombre',
  'email',
  'empresa',
  'pais',
  'ciudad',
  'mensaje',
];

export type AdminErrors = {
  countriesApiUrl?: string;
  submitApiUrl?: string;
  submitTimeoutMs?: string;
  parameterMapping?: Partial<Record<ParameterField, string>>;
};

export function trimAdminConfig(config: AppConfig): AppConfig {
  return {
    countriesApiUrl: config.countriesApiUrl.trim(),
    submitApiUrl: config.submitApiUrl.trim(),
    submitTimeoutMs: config.submitTimeoutMs,
    parameterMapping: {
      nombre: config.parameterMapping.nombre.trim(),
      email: config.parameterMapping.email.trim(),
      empresa: config.parameterMapping.empresa.trim(),
      pais: config.parameterMapping.pais.trim(),
      ciudad: config.parameterMapping.ciudad.trim(),
      mensaje: config.parameterMapping.mensaje.trim(),
    },
  };
}

export function validateAdminConfig(config: AppConfig): AdminErrors {
  const trimmed = trimAdminConfig(config);
  const errors: AdminErrors = {};
  const parameterMappingErrors: Partial<Record<ParameterField, string>> = {};

  if (!trimmed.countriesApiUrl || !URL_PATTERN.test(trimmed.countriesApiUrl)) {
    errors.countriesApiUrl =
      'La URL de la API de países debe comenzar por http:// o https://.';
  }

  if (trimmed.submitApiUrl && !URL_PATTERN.test(trimmed.submitApiUrl)) {
    errors.submitApiUrl =
      'La URL de la API de envío debe comenzar por http:// o https://.';
  }

  if (
    !Number.isInteger(trimmed.submitTimeoutMs) ||
    trimmed.submitTimeoutMs <= 0
  ) {
    errors.submitTimeoutMs = 'El timeout debe ser un entero positivo.';
  }

  for (const field of parameterFieldOrder) {
    if (!trimmed.parameterMapping[field]) {
      parameterMappingErrors[field] = 'El nombre del parámetro es obligatorio.';
    }
  }

  const valueToFields = new Map<string, ParameterField[]>();

  for (const field of parameterFieldOrder) {
    const value = trimmed.parameterMapping[field];
    if (!value) {
      continue;
    }

    const fields = valueToFields.get(value) ?? [];
    fields.push(field);
    valueToFields.set(value, fields);
  }

  for (const fields of valueToFields.values()) {
    if (fields.length <= 1) {
      continue;
    }

    for (const field of fields) {
      parameterMappingErrors[field] =
        'Los nombres de parámetro no pueden repetirse.';
    }
  }

  if (Object.keys(parameterMappingErrors).length > 0) {
    errors.parameterMapping = parameterMappingErrors;
  }

  return errors;
}

export function hasAdminErrors(errors: AdminErrors): boolean {
  return Object.keys(errors).length > 0;
}
