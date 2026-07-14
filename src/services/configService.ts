import { CONFIG_STORAGE_KEY, defaultConfig } from '../config/defaultConfig';
import type { AppConfig } from '../types';

function isValidConfig(value: unknown): value is AppConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const config = value as Record<string, unknown>;

  return (
    typeof config.countriesApiUrl === 'string' &&
    typeof config.submitApiUrl === 'string' &&
    typeof config.submitTimeoutMs === 'number' &&
    typeof config.parameterMapping === 'object' &&
    config.parameterMapping !== null
  );
}

export function loadConfig(): AppConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!stored) {
      return defaultConfig;
    }

    const parsed: unknown = JSON.parse(stored);
    if (isValidConfig(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to default configuration.
  }

  return defaultConfig;
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function resetConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}
