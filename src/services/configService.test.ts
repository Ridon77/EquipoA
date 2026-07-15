import { beforeEach, describe, expect, it } from 'vitest';
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../config/defaultConfig';
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

describe('configService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('recupera DEFAULT_CONFIG si no hay localStorage', () => {
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('guarda configuración', () => {
    saveConfig(customConfig);

    expect(localStorage.getItem(CONFIG_STORAGE_KEY)).toBe(
      JSON.stringify(customConfig),
    );
  });

  it('recupera configuración guardada', () => {
    saveConfig(customConfig);

    expect(loadConfig()).toEqual(customConfig);
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

  it('migra configuraciones antiguas sin empresa ni requiredFields', () => {
    const legacyStored = {
      countriesApiUrl: 'https://legacy.example.com/countries',
      submitApiUrl: 'https://legacy.example.com/submit',
      submitTimeoutMs: 8000,
      parameterMapping: {
        nombre: 'name',
        email: 'mail',
        pais: 'country',
        ciudad: 'city',
        mensaje: 'request',
      },
    };

    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(legacyStored));

    expect(loadConfig()).toEqual({
      ...legacyStored,
      parameterMapping: {
        ...legacyStored.parameterMapping,
        empresa: 'empresa',
      },
      requiredFields: DEFAULT_CONFIG.requiredFields,
    });
  });

  it('conserva empresa personalizada al migrar', () => {
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

    expect(migrated.parameterMapping.empresa).toBe('companyName');
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
