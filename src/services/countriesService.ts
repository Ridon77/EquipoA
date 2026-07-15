import type { CountriesNowResponse, CountryOption } from '../types/countries';
import {
  compareSpanishNames,
  translateCityName,
  translateCountryName,
} from '../utils/locationTranslations';

interface CacheEntry {
  apiUrl: string;
  countries: CountryOption[];
}

let sessionCache: CacheEntry | null = null;

function isCountriesNowItem(
  value: unknown,
): value is {
  country: string;
  iso2?: unknown;
  iso3?: unknown;
  cities: unknown[];
} {
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

function normalizeIso2(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const iso2 = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(iso2) ? iso2 : null;
}

function parseCountriesResponse(data: unknown): CountryOption[] | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const response = data as Partial<CountriesNowResponse>;

  if (response.error === true || !Array.isArray(response.data)) {
    return null;
  }

  const countryMap = new Map<string, CountryOption>();

  for (const item of response.data) {
    if (!isCountriesNowItem(item) || item.country.trim() === '') {
      continue;
    }

    const iso2 = normalizeIso2(item.iso2);
    if (!iso2) {
      continue;
    }

    const originalName = item.country.trim();
    const cityMap = new Map<string, { originalName: string; displayName: string }>();

    const existing = countryMap.get(iso2);
    if (existing) {
      for (const city of existing.cities) {
        cityMap.set(city.originalName.toLowerCase(), city);
      }
    }

    for (const city of item.cities) {
      const originalCity = city.trim();
      if (originalCity === '') {
        continue;
      }

      const key = originalCity.toLowerCase();
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          originalName: originalCity,
          displayName: translateCityName(originalCity),
        });
      }
    }

    countryMap.set(iso2, {
      iso2,
      originalName: existing?.originalName ?? originalName,
      displayName: existing?.displayName ?? translateCountryName(iso2, originalName),
      cities: Array.from(cityMap.values()).sort((a, b) =>
        compareSpanishNames(a.displayName, b.displayName),
      ),
    });
  }

  if (countryMap.size === 0) {
    return null;
  }

  return Array.from(countryMap.values()).sort((a, b) =>
    compareSpanishNames(a.displayName, b.displayName),
  );
}

export function clearCountriesCache(): void {
  sessionCache = null;
}

export async function fetchCountries(
  apiUrl: string,
  signal?: AbortSignal,
): Promise<CountryOption[]> {
  const trimmedUrl = apiUrl.trim();

  if (!trimmedUrl) {
    throw new Error('La URL de la API de países no está configurada.');
  }

  if (sessionCache && sessionCache.apiUrl === trimmedUrl) {
    return sessionCache.countries;
  }

  if (sessionCache && sessionCache.apiUrl !== trimmedUrl) {
    clearCountriesCache();
  }

  const response = await fetch(trimmedUrl, { signal });

  if (!response.ok) {
    throw new Error(
      'No se pudieron cargar los países y ciudades. Inténtalo de nuevo.',
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error(
      'No se pudieron cargar los países y ciudades. Inténtalo de nuevo.',
    );
  }

  const parsed = parseCountriesResponse(json);
  if (!parsed) {
    throw new Error(
      'No se pudieron cargar los países y ciudades. Inténtalo de nuevo.',
    );
  }

  sessionCache = { apiUrl: trimmedUrl, countries: parsed };
  return parsed;
}

export function findCountryOption(
  countries: CountryOption[],
  countryValue: string,
): CountryOption | undefined {
  const trimmed = countryValue.trim();
  if (!trimmed) {
    return undefined;
  }

  return countries.find(
    (entry) =>
      entry.displayName === trimmed ||
      entry.originalName === trimmed ||
      entry.iso2 === trimmed.toUpperCase(),
  );
}

export function getCitiesForCountry(
  countries: CountryOption[],
  countryValue: string,
): string[] {
  const match = findCountryOption(countries, countryValue);
  return match?.cities.map((city) => city.displayName) ?? [];
}

export function getCountryDisplayNames(countries: CountryOption[]): string[] {
  return countries.map((entry) => entry.displayName);
}
