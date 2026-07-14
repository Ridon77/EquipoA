import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import type { AppConfig } from '../types';
import { hasAdminErrors, validateAdminConfig } from './adminValidation';

const validConfig: AppConfig = {
  ...DEFAULT_CONFIG,
  submitApiUrl: 'https://api.example.com/submit',
};

describe('validateAdminConfig', () => {
  it('rechaza URLs inválidas de países', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      countriesApiUrl: 'ftp://invalido.test',
    });

    expect(errors.countriesApiUrl).toBeDefined();
    expect(hasAdminErrors(errors)).toBe(true);
  });

  it('rechaza URLs inválidas de envío', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      submitApiUrl: 'sin-protocolo',
    });

    expect(errors.submitApiUrl).toBeDefined();
  });

  it('permite URL de envío vacía', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      submitApiUrl: '',
    });

    expect(errors.submitApiUrl).toBeUndefined();
  });

  it('rechaza parámetros duplicados', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      parameterMapping: {
        nombre: 'campo',
        email: 'campo',
        pais: 'pais',
        ciudad: 'ciudad',
        mensaje: 'mensaje',
      },
    });

    expect(errors.parameterMapping?.nombre).toBe(
      'Los nombres de parámetro no pueden repetirse.',
    );
    expect(errors.parameterMapping?.email).toBe(
      'Los nombres de parámetro no pueden repetirse.',
    );
  });

  it('acepta configuración válida', () => {
    const errors = validateAdminConfig(validConfig);

    expect(hasAdminErrors(errors)).toBe(false);
  });
});
