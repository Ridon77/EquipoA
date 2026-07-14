import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import type { AppConfig, FormData } from '../types';
import { buildSubmitUrl, submitForm } from './submitService';

const formData: FormData = {
  nombre: 'Joan García',
  email: 'joan@example.com',
  pais: 'España',
  ciudad: '',
  mensaje: 'Solicitud con espacios',
};

const customMapping = {
  nombre: 'customerName',
  email: 'customerEmail',
  pais: 'customerCountry',
  ciudad: 'customerCity',
  mensaje: 'customerMessage',
};

const testConfig: AppConfig = {
  ...DEFAULT_CONFIG,
  submitApiUrl: 'https://api.example.com/solicitud',
  submitTimeoutMs: 100,
  parameterMapping: customMapping,
};

describe('buildSubmitUrl', () => {
  it('usa nombres configurados', () => {
    const url = buildSubmitUrl(
      testConfig.submitApiUrl,
      formData,
      customMapping,
    );

    expect(url).toContain('customerName=');
    expect(url).toContain('customerEmail=');
    expect(url).toContain('customerCountry=');
    expect(url).toContain('customerCity=');
    expect(url).toContain('customerMessage=');
  });

  it('codifica espacios', () => {
    const url = buildSubmitUrl(
      testConfig.submitApiUrl,
      formData,
      customMapping,
    );

    expect(url).toContain('customerMessage=Solicitud+con+espacios');
  });

  it('codifica arrobas', () => {
    const url = buildSubmitUrl(
      testConfig.submitApiUrl,
      formData,
      customMapping,
    );

    expect(url).toContain('customerEmail=joan%40example.com');
  });

  it('codifica acentos', () => {
    const url = new URL(
      buildSubmitUrl(testConfig.submitApiUrl, formData, customMapping),
    );

    expect(url.searchParams.get('customerName')).toBe('Joan García');
    expect(url.searchParams.get('customerCountry')).toBe('España');
  });

  it('incluye campos vacíos', () => {
    const url = buildSubmitUrl(
      testConfig.submitApiUrl,
      formData,
      customMapping,
    );

    expect(url).toContain('customerCity=');
  });
});

describe('submitForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function mockFetchResponse(status: number, body: unknown) {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  it('devuelve technical-error si la URL de envío está vacía', async () => {
    const result = await submitForm(formData, {
      ...testConfig,
      submitApiUrl: '',
    });

    expect(result).toEqual({ kind: 'technicalError' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('clasifica HTTP 200 como success', async () => {
    mockFetchResponse(200, { ok: true });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({ kind: 'success' });
  });

  it('clasifica HTTP 200 con success false como process-error', async () => {
    mockFetchResponse(200, { success: false, message: 'Datos inválidos' });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({
      kind: 'processError',
      message: 'Datos inválidos',
    });
  });

  it('clasifica HTTP 400 como process-error', async () => {
    mockFetchResponse(400, { error: 'Petición incorrecta' });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({
      kind: 'processError',
      message: 'Petición incorrecta',
    });
  });

  it('clasifica HTTP 422 como process-error', async () => {
    mockFetchResponse(422, { detail: 'Validación fallida' });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({
      kind: 'processError',
      message: 'Validación fallida',
    });
  });

  it('clasifica HTTP 404 como technical-error', async () => {
    mockFetchResponse(404, { error: 'No encontrado' });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({ kind: 'technicalError' });
  });

  it('clasifica HTTP 500 como technical-error', async () => {
    mockFetchResponse(500, { error: 'Error interno' });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({ kind: 'technicalError' });
  });

  it('clasifica error de fetch como technical-error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({ kind: 'technicalError' });
  });

  it('clasifica timeout como technical-error', async () => {
    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );

    const result = await submitForm(formData, {
      ...testConfig,
      submitTimeoutMs: 20,
    });

    expect(result).toEqual({ kind: 'technicalError' });
  });
});
