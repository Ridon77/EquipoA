import { QR_FORM_CONFIG } from '../config/qrFormConfig';
import { saveConfig } from '../services/configService';
import { clearCountriesCache } from '../services/countriesService';
import type { AppConfig } from '../types';

/**
 * Detecta el marcador de acceso QR en la query del HashRouter
 * (por ejemplo location.search === '?source=qr').
 */
export function isQrAccess(search: string): boolean {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  return params.get('source') === 'qr';
}

/**
 * Decide si debe aplicarse QR_FORM_CONFIG:
 * - siempre en acceso QR
 * - en acceso normal si submitApiUrl está ausente, vacía o solo espacios
 */
export function shouldApplyQrFormConfig(
  config: AppConfig | null | undefined,
  qrAccess: boolean,
): boolean {
  if (qrAccess) {
    return true;
  }

  const submitApiUrl = config?.submitApiUrl;

  return typeof submitApiUrl !== 'string' || submitApiUrl.trim() === '';
}

/** Guarda el preset QR en localStorage e invalida la caché de países. */
export function applyQrFormConfig(): AppConfig {
  saveConfig(QR_FORM_CONFIG);
  clearCountriesCache();
  return QR_FORM_CONFIG;
}
