import type { AppConfig } from '../types';
import { OFFICIAL_PARAMETER_MAPPING } from './officialParameterMapping';
import { SUBMIT_WEBHOOK_URL } from './submitEndpoint';

export const defaultConfig: AppConfig = {
  countriesApiUrl: 'https://countriesnow.space/api/v0.1/countries',
  submitApiUrl: SUBMIT_WEBHOOK_URL,
  /** Ignorado: el envío ya no usa timeout de cliente. Conservado por compatibilidad. */
  submitTimeoutMs: 10000,
  parameterMapping: { ...OFFICIAL_PARAMETER_MAPPING },
  requiredFields: {
    nombre: true,
    email: false,
    empresa: false,
    pais: false,
    ciudad: false,
    mensaje: true,
  },
};

export const DEFAULT_CONFIG = defaultConfig;

export const CONFIG_STORAGE_KEY = 'app-config';
