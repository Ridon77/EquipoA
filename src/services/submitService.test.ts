import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import { OFFICIAL_PARAMETER_MAPPING } from '../config/officialParameterMapping';
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

const testConfig: AppConfig = {
  ...DEFAULT_CONFIG,
  submitApiUrl: 'https://api.example.com/solicitud',
  submitTimeoutMs: 100,
  parameterMapping: {
    nombre: 'customerName',
    email: 'customerEmail',
    empresa: 'companyName',
    pais: 'customerCountry',
    ciudad: 'customerCity',
    mensaje: 'customerMessage',
  },
};

describe('buildSubmitUrl', () => {
  it('usa siempre SUBMIT_WEBHOOK_URL', () => {
    const url = buildSubmitUrl(formData);

    expect(url.startsWith(`${SUBMIT_WEBHOOK_URL}?`)).toBe(true);
    expect(url).not.toContain('api.example.com');
  });

  it('usa el mapeo oficial con mayúscula inicial', () => {
    const url = buildSubmitUrl(formData, testConfig.parameterMapping);

    expect(url).toContain('Nombre=');
    expect(url).toContain('Email=');
    expect(url).toContain('Empresa=');
    expect(url).toContain('Pais=');
    expect(url).toContain('Ciudad=');
    expect(url).toContain('Mensaje=');
    expect(url).not.toContain('nombre=');
    expect(url).not.toContain('customerName=');
  });

  it('codifica espacios', () => {
    const url = buildSubmitUrl(formData);

    expect(url).toContain('Mensaje=Solicitud+con+espacios');
  });

  it('no genera ??', () => {
    const url = buildSubmitUrl(formData);

    expect(url).not.toContain('??');
    expect(url.startsWith(`${SUBMIT_WEBHOOK_URL}?`)).toBe(true);
  });

  it('codifica arrobas', () => {
    const url = buildSubmitUrl(formData);

    expect(url).toContain('Email=joan%40example.com');
  });

  it('codifica acentos y caracteres especiales de empresa', () => {
    const url = new URL(buildSubmitUrl(formData));

    expect(url.searchParams.get('Nombre')).toBe('Joan García');
    expect(url.searchParams.get('Pais')).toBe('España');
    expect(url.searchParams.get('Empresa')).toBe(
      'Tecnología y Gestión, S.L.',
    );
  });

  it('incluye campos vacíos con claves oficiales', () => {
    const url = buildSubmitUrl(formData);

    expect(url).toContain('Ciudad=');
    expect(new URL(url).searchParams.has('Ciudad')).toBe(true);
  });

  it('incluye empresa aunque esté vacía', () => {
    const url = buildSubmitUrl({ ...formData, empresa: '' });

    expect(url).toContain('Empresa=');
  });

  it('ignora un mapeo personalizado en minúscula', () => {
    const url = buildSubmitUrl(formData, {
      nombre: 'nombre',
      email: 'email',
      empresa: 'empresa',
      pais: 'pais',
      ciudad: 'ciudad',
      mensaje: 'mensaje',
    });

    expect(url).toContain(`${OFFICIAL_PARAMETER_MAPPING.nombre}=`);
    expect(url).not.toMatch(/[?&]nombre=/);
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
    expect(calledUrl).toContain('Nombre=');
    expect(calledUrl).not.toContain('otro-dominio');
  });

  it('envía aunque submitApiUrl esté vacía en config', async () => {
    mockFetchResponse(200, { ok: true });

    const result = await submitForm(formData, {
      ...testConfig,
      submitApiUrl: '',
    });

    expect(result).toEqual({
      kind: 'success',
      message: '',
      advisorName: '',
      advisorEmail: '',
    });
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

    expect(result).toEqual({
      kind: 'success',
      message: '',
      advisorName: '',
      advisorEmail: '',
    });
  });

  it('clasifica HTTP 200 como success', async () => {
    mockFetchResponse(200, { ok: true });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({
      kind: 'success',
      message: '',
      advisorName: '',
      advisorEmail: '',
    });
  });

  it('clasifica HTTP 200 con ok true y datos de asesor', async () => {
    mockFetchResponse(200, {
      ok: true,
      mensaje: 'Lead recibido correctamente',
      Asesor: '  Silvia Mata  ',
      email_asesor: 'sm@prueba.com',
    });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({
      kind: 'success',
      message: 'Lead recibido correctamente',
      advisorName: 'Silvia Mata',
      advisorEmail: 'sm@prueba.com',
    });
  });

  it('clasifica HTTP 200 con ok false como process-error', async () => {
    mockFetchResponse(200, {
      ok: false,
      mensaje: 'No se pudo registrar',
    });

    const result = await submitForm(formData, testConfig);

    expect(result.kind).toBe('processError');
  });

  it('ignora tipos no string en Asesor y email_asesor', async () => {
    mockFetchResponse(200, {
      ok: true,
      mensaje: 'Lead recibido correctamente',
      Asesor: { name: 'Silvia' },
      email_asesor: ['sm@prueba.com'],
    });

    const result = await submitForm(formData, testConfig);

    expect(result).toEqual({
      kind: 'success',
      message: 'Lead recibido correctamente',
      advisorName: '',
      advisorEmail: '',
    });
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
