import type { AppConfig } from '../types';
import { SUBMIT_WEBHOOK_URL } from './submitEndpoint';

/** Configuración fija aplicada al acceder al formulario mediante el código QR. */
export const QR_FORM_CONFIG: AppConfig = {
  countriesApiUrl: 'https://countriesnow.space/api/v0.1/countries',
  submitApiUrl: SUBMIT_WEBHOOK_URL,
  /** Ignorado: el envío ya no usa timeout de cliente. Conservado por compatibilidad. */
  submitTimeoutMs: 10000,
  parameterMapping: {
    nombre: 'Nombre',
    email: 'Email',
    empresa: 'Empresa',
    pais: 'Pais',
    ciudad: 'Ciudad',
    mensaje: 'Mensaje',
  },
  requiredFields: {
    nombre: true,
    email: true,
    empresa: false,
    pais: false,
    ciudad: false,
    mensaje: true,
  },
};
