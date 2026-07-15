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

/** Guarda el preset QR en localStorage e invalida la caché de países. */
export function applyQrFormConfig(): AppConfig {
  saveConfig(QR_FORM_CONFIG);
  clearCountriesCache();
  return QR_FORM_CONFIG;
}
