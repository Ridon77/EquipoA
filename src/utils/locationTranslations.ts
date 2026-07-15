import { cityTranslationsEs } from '../data/cityTranslationsEs';

const spanishRegionNames = new Intl.DisplayNames(['es'], {
  type: 'region',
});

export function translateCountryName(
  iso2: string,
  originalName: string,
): string {
  const code = iso2.trim().toUpperCase();

  if (code.length !== 2) {
    return originalName;
  }

  try {
    const translated = spanishRegionNames.of(code);
    if (!translated || translated.toUpperCase() === code) {
      return originalName;
    }

    return translated;
  } catch {
    return originalName;
  }
}

export function translateCityName(originalName: string): string {
  return cityTranslationsEs[originalName] || originalName;
}

export function compareSpanishNames(a: string, b: string): number {
  return a.localeCompare(b, 'es', {
    sensitivity: 'base',
  });
}
