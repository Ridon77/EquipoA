import { CONFIG_STORAGE_KEY, defaultConfig } from '../config/defaultConfig';
import { SUBMIT_WEBHOOK_URL } from '../config/submitEndpoint';
import type { AppConfig, ParameterMapping, RequiredFieldsConfig } from '../types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function migrateParameterMapping(stored: unknown): ParameterMapping {
  const source = isObject(stored) ? stored : {};

  return {
    nombre:
      typeof source.nombre === 'string'
        ? source.nombre
        : defaultConfig.parameterMapping.nombre,
    email:
      typeof source.email === 'string'
        ? source.email
        : defaultConfig.parameterMapping.email,
    empresa:
      typeof source.empresa === 'string'
        ? source.empresa
        : defaultConfig.parameterMapping.empresa,
    pais:
      typeof source.pais === 'string'
        ? source.pais
        : defaultConfig.parameterMapping.pais,
    ciudad:
      typeof source.ciudad === 'string'
        ? source.ciudad
        : defaultConfig.parameterMapping.ciudad,
    mensaje:
      typeof source.mensaje === 'string'
        ? source.mensaje
        : defaultConfig.parameterMapping.mensaje,
  };
}

function migrateRequiredFields(stored: unknown): RequiredFieldsConfig {
  const source = isObject(stored) ? stored : {};

  return {
    nombre:
      typeof source.nombre === 'boolean'
        ? source.nombre
        : defaultConfig.requiredFields.nombre,
    email:
      typeof source.email === 'boolean'
        ? source.email
        : defaultConfig.requiredFields.email,
    empresa:
      typeof source.empresa === 'boolean'
        ? source.empresa
        : defaultConfig.requiredFields.empresa,
    pais:
      typeof source.pais === 'boolean'
        ? source.pais
        : defaultConfig.requiredFields.pais,
    ciudad:
      typeof source.ciudad === 'boolean'
        ? source.ciudad
        : defaultConfig.requiredFields.ciudad,
    mensaje:
      typeof source.mensaje === 'boolean'
        ? source.mensaje
        : defaultConfig.requiredFields.mensaje,
  };
}

function isLoadableConfig(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.countriesApiUrl === 'string' &&
    isObject(value.parameterMapping)
  );
}

export function migrateConfig(stored: Partial<AppConfig> | Record<string, unknown>): AppConfig {
  const source = isObject(stored) ? stored : {};
  const requiredFields = migrateRequiredFields(source.requiredFields);

  // Ciudad obligatoria implica País obligatorio.
  if (requiredFields.ciudad) {
    requiredFields.pais = true;
  }

  return {
    countriesApiUrl:
      typeof source.countriesApiUrl === 'string'
        ? source.countriesApiUrl
        : defaultConfig.countriesApiUrl,
    // La URL de envío es fija: nunca se toma del almacenamiento local.
    submitApiUrl: SUBMIT_WEBHOOK_URL,
    submitTimeoutMs:
      typeof source.submitTimeoutMs === 'number'
        ? source.submitTimeoutMs
        : defaultConfig.submitTimeoutMs,
    parameterMapping: migrateParameterMapping(source.parameterMapping),
    requiredFields,
  };
}

export function loadConfig(): AppConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!stored) {
      return defaultConfig;
    }

    const parsed: unknown = JSON.parse(stored);
    if (isLoadableConfig(parsed)) {
      return migrateConfig(parsed);
    }
  } catch {
    // Fall back to default configuration.
  }

  return defaultConfig;
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(
    CONFIG_STORAGE_KEY,
    JSON.stringify({
      ...config,
      submitApiUrl: SUBMIT_WEBHOOK_URL,
    }),
  );
}

export function resetConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}
