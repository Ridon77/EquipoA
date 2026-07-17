import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import { SUBMIT_WEBHOOK_URL } from '../config/submitEndpoint';
import type { AppConfig, FormData } from '../types';
import { buildSubmitUrl, submitForm } from './submitService';

const formData: FormData = {
  nombre: 'Joan García',
  email: 'joan@example.com',
  empresa: 'Tecnología y Gestión, S.L.',
  pais: 'España',
  ciudad: '',
  mensaje: 'Solicitud con espacios',
};

const customMapping = {
  nombre: 'customerName',
  email: 'customerEmail',
  empresa: 'companyName',
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
  it('usa siempre SUBMIT_WEBHOOK_URL', () => {
    const url = buildSubmitUrl(formData, customMapping);

    expect(url.startsWith(`${SUBMIT_WEBHOOK_URL}?`)).toBe(true);
    expect(url).not.toContain('api.example.com');
  });

  it('usa nombres configurados', () => {
    const url = buildSubmitUrl(formData, customMapping);

    expect(url).toContain('customerName=');
    expect(url).toContain('customerEmail=');
    expect(url).toContain('companyName=');
    expect(url).toContain('customerCountry=');
    expect(url).toContain('customerCity=');
    expect(url).toContain('customerMessage=');
  });

  it('codifica espacios', () => {
    const url = buildSubmitUrl(formData, customMapping);

    expect(url).toContain('customerMessage=Solicitud+con+espacios');
  });

  it('no genera ??', () => {
    const url = buildSubmitUrl(formData, {
      nombre: 'Nombre',
      email: 'Email',
      empresa: 'Empresa',
      pais: 'Pais',
      ciudad: 'Ciudad',
      mensaje: 'Mensaje',
    });

    expect(url).not.toContain('??');
    expect(url.startsWith(`${SUBMIT_WEBHOOK_URL}?`)).toBe(true);
  });

  it('codifica arrobas', () => {
    const url = buildSubmitUrl(formData, customMapping);

    expect(url).toContain('customerEmail=joan%40example.com');
  });

  it('codifica acentos y caracteres especiales de empresa', () => {
    const url = new URL(buildSubmitUrl(formData, customMapping));

    expect(url.searchParams.get('customerName')).toBe('Joan García');
    expect(url.searchParams.get('customerCountry')).toBe('España');
    expect(url.searchParams.get('companyName')).toBe(
      'Tecnología y Gestión, S.L.',
    );
  });

  it('incluye campos vacíos', () => {
    const url = buildSubmitUrl(formData, customMapping);

    expect(url).toContain('customerCity=');
  });

  it('incluye empresa aunque esté vacía', () => {
    const url = buildSubmitUrl({ ...formData, empresa: '' }, customMapping);

    expect(url).toContain('companyName=');
  });
});

describe('submitForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
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

  it('ignora submitApiUrl del config y usa SUBMIT_WEBHOOK_URL', async () => {
    mockFetchResponse(200, { ok: true });

    await submitForm(formData, {
      ...testConfig,
      submitApiUrl: 'https://otro-dominio.example/webhook',
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const calledUrl = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(calledUrl.startsWith(`${SUBMIT_WEBHOOK_URL}?`)).toBe(true);
    expect(calledUrl).not.toContain('otro-dominio');
  });

  it('envía aunque submitApiUrl esté vacía en config', async () => {
    mockFetchResponse(200, { ok: true });

    const result = await submitForm(formData, {
      ...testConfig,
      submitApiUrl: '',
    });

    expect(result).toEqual({ kind: 'success' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('no usa AbortController ni timeout de cliente', async () => {
    const abortSpy = vi.fn();
    vi.stubGlobal(
      'AbortController',
      vi.fn(() => ({
        abort: abortSpy,
        signal: { aborted: false },
      })),
    );

    mockFetchResponse(200, { ok: true });

    await submitForm(formData, {
      ...testConfig,
      submitTimeoutMs: 1,
    });

    expect(AbortController).not.toHaveBeenCalled();
    expect(abortSpy).not.toHaveBeenCalled();
    const fetchInit = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(fetchInit?.signal).toBeUndefined();
  });

  it('procesa una respuesta lenta correctamente', async () => {
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise((resolve) => {
          window.setTimeout(() => {
            resolve(
              new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }),
            );
          }, 30);
        }),
    );

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({ kind: 'success' });
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

  it('clasifica HTTP 422 como validation-error', async () => {
    mockFetchResponse(422, {
      ok: false,
      Error: 'Faltan campos obligatorios o existen campos con formato incorrecto.',
      Campos_miss: ['Nombre', 'Mensaje', 'Nombre', '', null],
      campos_incorrectos: ['Email', '  Email  '],
    });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({
      kind: 'validationError',
      status: 422,
      message:
        'Faltan campos obligatorios o existen campos con formato incorrecto.',
      missingFields: ['Nombre', 'Mensaje'],
      invalidFields: ['Email'],
    });
  });

  it('clasifica HTTP 422 sin colecciones como validation-error vacío', async () => {
    mockFetchResponse(422, { Error: 'Revise los datos indicados.' });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({
      kind: 'validationError',
      status: 422,
      message: 'Revise los datos indicados.',
      missingFields: [],
      invalidFields: [],
    });
  });

  it('no clasifica HTTP 422 como technical-error', async () => {
    mockFetchResponse(422, {
      Campos_miss: null,
      campos_incorrectos: undefined,
    });

    const result = await submitForm(formData, testConfig);

    expect(result.kind).toBe('validationError');
    expect(result).not.toEqual({ kind: 'technicalError' });
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
});
