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
