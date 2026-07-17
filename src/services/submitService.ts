import { SUBMIT_WEBHOOK_URL } from '../config/submitEndpoint';
import type { AppConfig, ApiResult, FormData, ParameterMapping } from '../types';
import { normalizeFieldList } from '../utils/normalizeFieldList';
import { normalizeParameterMapping } from '../utils/normalizeParameterMapping';
import { loadConfig } from './configService';

const GENERIC_PROCESS_ERROR = 'No ha sido posible procesar la solicitud.';
const DEFAULT_VALIDATION_MESSAGE = 'Revise los datos indicados.';

interface ParsedResponseBody {
  json: unknown | null;
  text: string;
}

/** Construye la URL de envío con la constante fija y el mapeo oficial. */
export function buildSubmitUrl(
  formData: FormData,
  mapping: ParameterMapping = normalizeParameterMapping(),
): string {
  const officialMapping = normalizeParameterMapping(mapping);
  const url = new URL(SUBMIT_WEBHOOK_URL);

  url.searchParams.set(officialMapping.nombre, formData.nombre);
  url.searchParams.set(officialMapping.email, formData.email);
  url.searchParams.set(officialMapping.empresa, formData.empresa);
  url.searchParams.set(officialMapping.pais, formData.pais);
  url.searchParams.set(officialMapping.ciudad, formData.ciudad);
  url.searchParams.set(officialMapping.mensaje, formData.mensaje);

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

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function firstTrimmedString(
  body: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = asTrimmedString(body[key]);
    if (value) {
      return value;
    }
  }

  return '';
}

function isProcessErrorBody(json: unknown): boolean {
  const body = asRecord(json);
  if (!body) {
    return false;
  }

  if (body.ok === false || body.success === false) {
    return true;
  }

  return typeof body.error === 'string' && body.error.trim() !== '';
}

function classifySuccessResponse(json: unknown, text: string): ApiResult {
  const body = asRecord(json);

  if (isProcessErrorBody(json)) {
    return {
      kind: 'processError',
      message: extractProcessMessage(json, text),
    };
  }

  if (body?.ok === true) {
    return {
      kind: 'success',
      message: asTrimmedString(body.mensaje),
      advisorName: firstTrimmedString(body, [
        'Asesor',
        'NombreAsesor',
        'nombre_asesor',
        'nombreAsesor',
        'advisorName',
      ]),
      advisorEmail: firstTrimmedString(body, [
        'email_asesor',
        'EmailAsesor',
        'emailAsesor',
        'advisorEmail',
      ]),
    };
  }

  return {
    kind: 'processError',
    message: extractProcessMessage(json, text),
  };
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

export async function submitForm(
  formData: FormData,
  config: AppConfig = loadConfig(),
): Promise<ApiResult> {
  const requestId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `req-${Date.now()}`;

  let requestUrl: string;

  try {
    requestUrl = buildSubmitUrl(formData, config.parameterMapping);
  } catch {
    return { kind: 'technicalError' };
  }

  if (import.meta.env.DEV) {
    console.debug(`[${requestId}] Inicio de envío a n8n`);
  }

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (import.meta.env.DEV) {
      console.debug(`[${requestId}] Respuesta recibida`, response.status);
    }

    const { json, text } = await parseResponseBody(response);
    return classifyHttpResponse(response, json, text);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[${requestId}] Error al enviar la solicitud:`, error);
    }

    return { kind: 'technicalError' };
  }
}
