export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase('es');
}

/** Coincide si la consulta aparece en cualquier parte del texto (sin exigir el inicio). */
export function matchesPartialText(text: string, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return normalizeSearchText(text).includes(normalizedQuery);
}
