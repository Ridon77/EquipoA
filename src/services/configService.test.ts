import { beforeEach, describe, expect, it } from 'vitest';
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../config/defaultConfig';
import { OFFICIAL_PARAMETER_MAPPING } from '../config/officialParameterMapping';
import { SUBMIT_WEBHOOK_URL } from '../config/submitEndpoint';
import {
  loadConfig,
  migrateConfig,
  resetConfig,
  saveConfig,
} from './configService';
import type { AppConfig } from '../types';

const customConfig: AppConfig = {
  countriesApiUrl: 'https://example.com/countries',
  submitApiUrl: 'https://example.com/submit',
  submitTimeoutMs: 5000,
  parameterMapping: {
    nombre: 'name',
    email: 'mail',
    empresa: 'company',
    pais: 'country',
    ciudad: 'city',
    mensaje: 'request',
  },
  requiredFields: {
    nombre: true,
    email: true,
    empresa: false,
    pais: true,
    ciudad: false,
    mensaje: true,
  },
};

const normalizedCustomConfig: AppConfig = {
  ...customConfig,
  submitApiUrl: SUBMIT_WEBHOOK_URL,
  parameterMapping: { ...OFFICIAL_PARAMETER_MAPPING },
};

describe('configService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('recupera DEFAULT_CONFIG si no hay localStorage', () => {
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
    expect(loadConfig().parameterMapping).toEqual(OFFICIAL_PARAMETER_MAPPING);
  });

  it('guarda configuración forzando URL y mapeo oficiales', () => {
    saveConfig(customConfig);

    expect(localStorage.getItem(CONFIG_STORAGE_KEY)).toBe(
      JSON.stringify(normalizedCustomConfig),
    );
  });

  it('recupera configuración guardada con mapeo oficial', () => {
    saveConfig(customConfig);

    expect(loadConfig()).toEqual(normalizedCustomConfig);
  });

  it('restaura valores predeterminados', () => {
    saveConfig(customConfig);
    resetConfig();

    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
    expect(localStorage.getItem(CONFIG_STORAGE_KEY)).toBeNull();
  });

  it('usa DEFAULT_CONFIG si el contenido guardado es inválido', () => {
    localStorage.setItem(CONFIG_STORAGE_KEY, '{ invalid json');

    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('migra configuraciones antiguas al mapeo oficial y persiste', () => {
    const legacyStored = {
      countriesApiUrl: 'https://legacy.example.com/countries',
      submitApiUrl: 'https://legacy.example.com/submit',
      submitTimeoutMs: 8000,
      parameterMapping: {
        nombre: 'nombre',
        email: 'email',
        pais: 'pais',
        ciudad: 'ciudad',
        mensaje: 'mensaje',
      },
    };

    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(legacyStored));

    expect(loadConfig()).toEqual({
      countriesApiUrl: legacyStored.countriesApiUrl,
      submitApiUrl: SUBMIT_WEBHOOK_URL,
      submitTimeoutMs: legacyStored.submitTimeoutMs,
      parameterMapping: { ...OFFICIAL_PARAMETER_MAPPING },
      requiredFields: DEFAULT_CONFIG.requiredFields,
    });

    const persisted = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) ?? '{}');
    expect(persisted.parameterMapping).toEqual(OFFICIAL_PARAMETER_MAPPING);
    expect(persisted.submitApiUrl).toBe(SUBMIT_WEBHOOK_URL);
  });

  it('normaliza empresa personalizada al valor oficial', () => {
    const migrated = migrateConfig({
      parameterMapping: {
        nombre: 'name',
        email: 'mail',
        empresa: 'companyName',
        pais: 'country',
        ciudad: 'city',
        mensaje: 'request',
      },
    });

    expect(migrated.parameterMapping.empresa).toBe('Empresa');
    expect(migrated.parameterMapping).toEqual(OFFICIAL_PARAMETER_MAPPING);
    expect(migrated.submitApiUrl).toBe(SUBMIT_WEBHOOK_URL);
  });

  it('sustituye requiredFields corruptos por valores predeterminados', () => {
    const migrated = migrateConfig({
      requiredFields: {
        nombre: 'yes',
        email: false,
      } as never,
    });

    expect(migrated.requiredFields.nombre).toBe(true);
    expect(migrated.requiredFields.email).toBe(false);
  });

  it('fuerza País obligatorio si Ciudad es obligatoria', () => {
    const migrated = migrateConfig({
      requiredFields: {
        ...DEFAULT_CONFIG.requiredFields,
        pais: false,
        ciudad: true,
      },
    });

    expect(migrated.requiredFields.ciudad).toBe(true);
    expect(migrated.requiredFields.pais).toBe(true);
  });
});
