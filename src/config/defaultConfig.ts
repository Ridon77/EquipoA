import type { AppConfig } from '../types';

export const defaultConfig: AppConfig = {
  countriesApiUrl: 'https://countriesnow.space/api/v0.1/countries',
  submitApiUrl: '',
  submitTimeoutMs: 10000,
  parameterMapping: {
    nombre: 'nombre',
    email: 'email',
    pais: 'pais',
    ciudad: 'ciudad',
    mensaje: 'mensaje',
  },
};

export const DEFAULT_CONFIG = defaultConfig;

export const CONFIG_STORAGE_KEY = 'app-config';
