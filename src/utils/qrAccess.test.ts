import { beforeEach, describe, expect, it } from 'vitest';
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../config/defaultConfig';
import { QR_FORM_CONFIG } from '../config/qrFormConfig';
import { SUBMIT_WEBHOOK_URL } from '../config/submitEndpoint';
import { loadConfig, saveConfig } from '../services/configService';
import type { AppConfig } from '../types';
import {
  applyQrFormConfig,
  isQrAccess,
  shouldApplyQrFormConfig,
} from './qrAccess';

describe('isQrAccess', () => {
  it('detecta source=qr', () => {
    expect(isQrAccess('?source=qr')).toBe(true);
    expect(isQrAccess('source=qr')).toBe(true);
  });

  it('ignora accesos normales o source distintos', () => {
    expect(isQrAccess('')).toBe(false);
    expect(isQrAccess('?')).toBe(false);
    expect(isQrAccess('?source=manual')).toBe(false);
  });
});

describe('shouldApplyQrFormConfig', () => {
  const withUrl = {
    ...DEFAULT_CONFIG,
    submitApiUrl: 'https://ejemplo.example/webhook',
  };

  it('aplica con acceso QR aunque la URL esté informada', () => {
    expect(shouldApplyQrFormConfig(withUrl, true)).toBe(true);
  });

  it('aplica con submitApiUrl vacía', () => {
    expect(
      shouldApplyQrFormConfig({ ...DEFAULT_CONFIG, submitApiUrl: '' }, false),
    ).toBe(true);
  });

  it('aplica con submitApiUrl solo espacios', () => {
    expect(
      shouldApplyQrFormConfig(
        { ...DEFAULT_CONFIG, submitApiUrl: '   ' },
        false,
      ),
    ).toBe(true);
  });

  it('aplica con submitApiUrl undefined', () => {
    expect(shouldApplyQrFormConfig(undefined, false)).toBe(true);
    expect(
      shouldApplyQrFormConfig(
        { ...DEFAULT_CONFIG, submitApiUrl: undefined } as unknown as AppConfig,
        false,
      ),
    ).toBe(true);
  });

  it('aplica con submitApiUrl null', () => {
    expect(shouldApplyQrFormConfig(null, false)).toBe(true);
    expect(
      shouldApplyQrFormConfig(
        { ...DEFAULT_CONFIG, submitApiUrl: null } as unknown as AppConfig,
        false,
      ),
    ).toBe(true);
  });

  it('conserva la configuración con URL válida en acceso normal', () => {
    expect(shouldApplyQrFormConfig(withUrl, false)).toBe(false);
  });
});

describe('applyQrFormConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sobrescribe la configuración previa con el preset QR', () => {
    saveConfig({
      ...DEFAULT_CONFIG,
      submitApiUrl: 'https://ejemplo.incorrecto/webhook',
      parameterMapping: {
        ...DEFAULT_CONFIG.parameterMapping,
        nombre: 'oldName',
      },
      requiredFields: {
        ...DEFAULT_CONFIG.requiredFields,
        email: false,
      },
    });

    const applied = applyQrFormConfig();

    expect(applied).toEqual(QR_FORM_CONFIG);
    expect(loadConfig()).toEqual(QR_FORM_CONFIG);
    expect(JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) ?? '{}')).toEqual(
      QR_FORM_CONFIG,
    );
  });

  it('es idempotente', () => {
    applyQrFormConfig();
    applyQrFormConfig();

    expect(loadConfig()).toEqual(QR_FORM_CONFIG);
  });

  it('guarda los valores exactos del preset', () => {
    applyQrFormConfig();
    const config = loadConfig();

    expect(config.countriesApiUrl).toBe(
      'https://countriesnow.space/api/v0.1/countries',
    );
    expect(config.submitApiUrl).toBe(SUBMIT_WEBHOOK_URL);
    expect(config.submitTimeoutMs).toBe(10000);
    expect(config.parameterMapping).toEqual({
      nombre: 'Nombre',
      email: 'Email',
      empresa: 'Empresa',
      pais: 'Pais',
      ciudad: 'Ciudad',
      mensaje: 'Mensaje',
    });
    expect(config.requiredFields).toEqual({
      nombre: true,
      email: true,
      empresa: false,
      pais: false,
      ciudad: false,
      mensaje: true,
    });
  });
});
