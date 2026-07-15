import type { AppConfig, ApiResult, FormData, ParameterMapping } from '../types';
import { loadConfig } from './configService';

const GENERIC_PROCESS_ERROR = 'No ha sido posible procesar la solicitud.';

interface ParsedResponseBody {
  json: unknown | null;
  text: string;
}

export function buildSubmitUrl(
  baseUrl: string,
  formData: FormData,
  mapping: ParameterMapping,
): string {
  // Evita ?? cuando la URL base ya termina en '?'.
  const normalizedBase = baseUrl.trim().replace(/\?+$/, '');
  const url = new URL(normalizedBase);

  url.searchParams.set(mapping.nombre, formData.nombre);
  url.searchParams.set(mapping.email, formData.email);
  url.searchParams.set(mapping.empresa, formData.empresa);
  url.searchParams.set(mapping.pais, formData.pais);
  url.searchParams.set(mapping.ciudad, formData.ciudad);
  url.searchParams.set(mapping.mensaje, formData.mensaje);

  return url.toString();
}

async function parseResponseBody(response: Response): Promise<ParsedResponseBody> {
  const text = await response.text();

  if (!text) {
    return { json: null, text: '' };
  }

  try {
    return { json: JSON.parse(text) as unknown, text };
  } catch {
    return { json: null, text };
  }
}

function extractProcessMessage(json: unknown, text: string): string {
  if (typeof json === 'object' && json !== null) {
    const body = json as Record<string, unknown>;

    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error.trim();
    }

    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message.trim();
    }

    if (typeof body.detail === 'string' && body.detail.trim()) {
      return body.detail.trim();
    }
  }

  if (text.trim()) {
    return text.trim();
  }

  return GENERIC_PROCESS_ERROR;
}

function isProcessErrorBody(json: unknown): boolean {
  if (typeof json !== 'object' || json === null) {
    return false;
  }

  const body = json as Record<string, unknown>;

  if (body.success === false) {
    return true;
  }

  return typeof body.error === 'string' && body.error.trim() !== '';
}

function classifySuccessResponse(json: unknown, text: string): ApiResult {
  if (isProcessErrorBody(json)) {
    return {
      kind: 'processError',
      message: extractProcessMessage(json, text),
    };
  }

  return { kind: 'success' };
}

function classifyHttpResponse(
  response: Response,
  json: unknown,
  text: string,
): ApiResult {
  const { status } = response;

  if (status === 404 || (status >= 500 && status <= 599)) {
    return { kind: 'technicalError' };
  }

  if (status === 400 || status === 409 || status === 422) {
    return {
      kind: 'processError',
      message: extractProcessMessage(json, text),
    };
  }

  if (status >= 200 && status <= 299) {
    return classifySuccessResponse(json, text);
  }

  return { kind: 'technicalError' };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function submitForm(
  formData: FormData,
  config: AppConfig = loadConfig(),
): Promise<ApiResult> {
  const submitApiUrl = config.submitApiUrl.trim();

  if (!submitApiUrl) {
    return { kind: 'technicalError' };
  }

  let requestUrl: string;

  try {
    requestUrl = buildSubmitUrl(submitApiUrl, formData, config.parameterMapping);
  } catch {
    return { kind: 'technicalError' };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    config.submitTimeoutMs,
  );

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    const { json, text } = await parseResponseBody(response);
    return classifyHttpResponse(response, json, text);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error al enviar la solicitud:', error);
    }

    if (isAbortError(error)) {
      return { kind: 'technicalError' };
    }

    return { kind: 'technicalError' };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
