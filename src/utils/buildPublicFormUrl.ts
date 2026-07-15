function normalizeBasePath(basePath: string): string {
  if (!basePath || basePath === '/') {
    return '';
  }

  const collapsedSlashes = basePath.replace(/\/+/g, '/');
  const withLeadingSlash = collapsedSlashes.startsWith('/')
    ? collapsedSlashes
    : `/${collapsedSlashes}`;

  return withLeadingSlash.replace(/\/+$/, '');
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

/** URL pública del formulario sin marcador (acceso normal). */
export function buildPublicFormUrl(
  origin: string,
  basePath: string,
): string {
  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedBasePath = normalizeBasePath(basePath);
  const pathPrefix = normalizedBasePath
    ? `${normalizedBasePath}/`
    : '/';

  return `${normalizedOrigin}${pathPrefix}#/`;
}

/** URL pública del formulario destinada al código QR (`source=qr`). */
export function buildPublicFormQrUrl(
  origin: string,
  basePath: string,
): string {
  return `${buildPublicFormUrl(origin, basePath)}?source=qr`;
}
