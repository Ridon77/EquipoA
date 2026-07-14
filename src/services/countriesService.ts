import type { CountriesApiResponse, CountryData } from '../types/countries';

let sessionCache: CountryData[] | null = null;

function isCountriesApiItem(value: unknown): value is { country: string; cities: string[] } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.country === 'string' &&
    Array.isArray(item.cities) &&
    item.cities.every((city) => typeof city === 'string')
  );
}

function parseCountriesResponse(data: unknown): CountryData[] | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const response = data as Partial<CountriesApiResponse>;

  if (response.error === true || !Array.isArray(response.data)) {
    return null;
  }

  const countryMap = new Map<string, Set<string>>();

  for (const item of response.data) {
    if (!isCountriesApiItem(item) || item.country.trim() === '') {
      continue;
    }

    const country = item.country.trim();
    const existing = countryMap.get(country) ?? new Set<string>();

    for (const city of item.cities) {
      const trimmedCity = city.trim();
      if (trimmedCity !== '') {
        existing.add(trimmedCity);
      }
    }

    countryMap.set(country, existing);
  }

  if (countryMap.size === 0) {
    return null;
  }

  return Array.from(countryMap.entries())
    .map(([country, citiesSet]) => ({
      country,
      cities: Array.from(citiesSet).sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' }),
      ),
    }))
    .sort((a, b) =>
      a.country.localeCompare(b.country, 'es', { sensitivity: 'base' }),
    );
}

export function clearCountriesCache(): void {
  sessionCache = null;
}

export async function fetchCountries(apiUrl: string): Promise<CountryData[]> {
  if (sessionCache) {
    return sessionCache;
  }

  if (!apiUrl.trim()) {
    throw new Error('La URL de la API de países no está configurada.');
  }

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error('No se pudieron cargar los países.');
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error('La respuesta de países no es válida.');
  }

  const parsed = parseCountriesResponse(json);
  if (!parsed) {
    throw new Error('La respuesta de países no es válida.');
  }

  sessionCache = parsed;
  return parsed;
}

export function getCitiesForCountry(
  countries: CountryData[],
  countryName: string,
): string[] {
  const match = countries.find((entry) => entry.country === countryName);
  return match?.cities ?? [];
}
