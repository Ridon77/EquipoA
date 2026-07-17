import type { AppConfig, ParameterMapping, RequiredFieldsConfig } from '../types';
import { normalizeParameterMapping } from '../utils/normalizeParameterMapping';

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

export const requiredFieldAriaLabels: Record<ParameterField, string> = {
  nombre: 'Marcar Nombre como obligatorio',
  email: 'Marcar Email como obligatorio',
  empresa: 'Marcar Empresa como obligatorio',
  pais: 'Marcar País como obligatorio',
  ciudad: 'Marcar Ciudad como obligatoria',
  mensaje: 'Marcar Mensaje como obligatorio',
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
  parameterMapping?: Partial<Record<ParameterField, string>>;
  requiredFields?: string;
};

export function trimAdminConfig(config: AppConfig): AppConfig {
  const requiredFields: RequiredFieldsConfig = {
    ...config.requiredFields,
  };

  if (requiredFields.ciudad) {
    requiredFields.pais = true;
  }

  return {
    countriesApiUrl: config.countriesApiUrl.trim(),
    submitApiUrl: config.submitApiUrl,
    submitTimeoutMs: config.submitTimeoutMs,
    parameterMapping: normalizeParameterMapping({
      nombre: config.parameterMapping.nombre.trim(),
      email: config.parameterMapping.email.trim(),
      empresa: config.parameterMapping.empresa.trim(),
      pais: config.parameterMapping.pais.trim(),
      ciudad: config.parameterMapping.ciudad.trim(),
      mensaje: config.parameterMapping.mensaje.trim(),
    }),
    requiredFields,
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

  for (const field of parameterFieldOrder) {
    if (typeof trimmed.requiredFields[field] !== 'boolean') {
      errors.requiredFields =
        'La configuración de campos obligatorios no es válida.';
      break;
    }
  }

  if (trimmed.requiredFields.ciudad && !trimmed.requiredFields.pais) {
    errors.requiredFields =
      'País debe ser obligatorio cuando Ciudad es obligatoria.';
  }

  return errors;
}

export function hasAdminErrors(errors: AdminErrors): boolean {
  return Object.keys(errors).length > 0;
}
