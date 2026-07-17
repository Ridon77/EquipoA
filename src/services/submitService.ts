import type { AppConfig, ApiResult, FormData, ParameterMapping } from '../types';
import { normalizeFieldList } from '../utils/normalizeFieldList';
import { loadConfig } from './configService';

const GENERIC_PROCESS_ERROR = 'No ha sido posible procesar la solicitud.';
const DEFAULT_VALIDATION_MESSAGE = 'Revise los datos indicados.';

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

function asRecord(json: unknown): Record<string, unknown> | null {
  if (typeof json !== 'object' || json === null) {
    return null;
  }

  return json as Record<string, unknown>;
}

function firstStringField(
  body: Record<string, unknown> | null,
  keys: string[],
): string | undefined {
  if (!body) {
    return undefined;
  }

  for (const key of keys) {
    const value = body[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function firstArrayField(
  body: Record<string, unknown> | null,
  keys: string[],
): unknown {
  if (!body) {
    return undefined;
  }

  for (const key of keys) {
    if (key in body) {
      return body[key];
    }
  }

  return undefined;
}

function extractProcessMessage(json: unknown, text: string): string {
  const body = asRecord(json);

  if (body) {
    const message = firstStringField(body, ['error', 'message', 'detail', 'Error']);
    if (message) {
      return message;
    }
  }

  if (text.trim()) {
    return text.trim();
  }

  return GENERIC_PROCESS_ERROR;
}

function extractValidationMessage(json: unknown): string {
  const body = asRecord(json);
  return (
    firstStringField(body, ['Error', 'error', 'message']) ??
    DEFAULT_VALIDATION_MESSAGE
  );
}

function classifyValidationError(json: unknown): ApiResult {
  const body = asRecord(json);

  return {
    kind: 'validationError',
    status: 422,
    message: extractValidationMessage(json),
    missingFields: normalizeFieldList(
      firstArrayField(body, [
        'Campos_miss',
        'campos_faltantes',
        'CamposFaltantes',
        'missingFields',
      ]),
    ),
    invalidFields: normalizeFieldList(
      firstArrayField(body, [
        'campos_incorrectos',
        'campos_invalidos',
        'CamposInvalidos',
        'invalidFields',
      ]),
    ),
  };
}

function isProcessErrorBody(json: unknown): boolean {
  const body = asRecord(json);
  if (!body) {
    return false;
  }

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

  if (status === 422) {
    return classifyValidationError(json);
  }

  if (status === 400 || status === 409) {
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
