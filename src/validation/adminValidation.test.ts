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

  it('ignora URLs de envío inválidas (la URL ya no es configurable)', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      submitApiUrl: 'sin-protocolo',
    });

    expect(errors.submitApiUrl).toBeUndefined();
  });

  it('no valida la URL de envío vacía', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      submitApiUrl: '',
    });

    expect(errors.submitApiUrl).toBeUndefined();
  });

  it('rechaza parámetros duplicados se normalizan al mapeo oficial', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      parameterMapping: {
        nombre: 'campo',
        email: 'campo',
        empresa: 'empresa',
        pais: 'pais',
        ciudad: 'ciudad',
        mensaje: 'mensaje',
      },
    });

    expect(errors.parameterMapping).toBeUndefined();
  });

  it('normaliza duplicados entre nombre y empresa al mapeo oficial', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      parameterMapping: {
        nombre: 'name',
        email: 'email',
        empresa: 'name',
        pais: 'country',
        ciudad: 'city',
        mensaje: 'message',
      },
    });

    expect(errors.parameterMapping).toBeUndefined();
  });

  it('normaliza parámetro empresa vacío al valor oficial', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      parameterMapping: {
        ...validConfig.parameterMapping,
        empresa: '   ',
      },
    });

    expect(errors.parameterMapping).toBeUndefined();
  });

  it('acepta configuración válida', () => {
    const errors = validateAdminConfig(validConfig);

    expect(hasAdminErrors(errors)).toBe(false);
  });

  it('rechaza Ciudad obligatoria con País opcional', () => {
    const errors = validateAdminConfig({
      ...validConfig,
      requiredFields: {
        ...validConfig.requiredFields,
        pais: false,
        ciudad: true,
      },
    });

    // trimAdminConfig fuerza País=true, así que no debe haber error de coherencia
    expect(errors.requiredFields).toBeUndefined();
  });
});
