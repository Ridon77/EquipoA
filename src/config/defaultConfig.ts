import type { AppConfig } from '../types';
import { SUBMIT_WEBHOOK_URL } from './submitEndpoint';

export const defaultConfig: AppConfig = {
  countriesApiUrl: 'https://countriesnow.space/api/v0.1/countries',
  submitApiUrl: SUBMIT_WEBHOOK_URL,
  /** Ignorado: el envío ya no usa timeout de cliente. Conservado por compatibilidad. */
  submitTimeoutMs: 10000,
  parameterMapping: {
    nombre: 'nombre',
    email: 'email',
    empresa: 'empresa',
    pais: 'pais',
    ciudad: 'ciudad',
    mensaje: 'mensaje',
  },
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
