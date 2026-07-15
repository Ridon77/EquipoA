import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearCountriesCache,
  fetchCountries,
  findCountryOption,
  getCitiesForCountry,
} from './countriesService';

describe('countriesService', () => {
  beforeEach(() => {
    clearCountriesCache();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: false,
          data: [
            {
              country: 'Germany',
              iso2: 'DE',
              cities: ['Berlin', 'Munich', 'Munich'],
            },
            {
              country: 'Spain',
              iso2: 'ES',
              cities: ['Madrid', 'Seville'],
            },
          ],
        }),
      }),
    );
  });

  afterEach(() => {
    clearCountriesCache();
    vi.unstubAllGlobals();
  });

  it('traduce, ordena y elimina duplicados', async () => {
    const countries = await fetchCountries('https://example.com/countries');

    expect(countries.map((entry) => entry.displayName)).toEqual([
      'Alemania',
      'España',
    ]);

    const germany = countries.find((entry) => entry.iso2 === 'DE');
    expect(germany?.cities.map((city) => city.displayName)).toEqual([
      'Berlin',
      'Múnich',
    ]);
  });

  it('reutiliza la caché para la misma URL', async () => {
    await fetchCountries('https://example.com/countries');
    await fetchCountries('https://example.com/countries');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('invalida la caché cuando cambia la URL', async () => {
    await fetchCountries('https://example.com/countries');
    await fetchCountries('https://example.com/countries-v2');

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('localiza un país por nombre original o traducido', async () => {
    const countries = await fetchCountries('https://example.com/countries');

    expect(findCountryOption(countries, 'Alemania')?.iso2).toBe('DE');
    expect(findCountryOption(countries, 'Germany')?.iso2).toBe('DE');
    expect(getCitiesForCountry(countries, 'Alemania')).toContain('Múnich');
  });

  it('rechaza respuestas inválidas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: true, data: [] }),
      }),
    );

    await expect(
      fetchCountries('https://example.com/countries'),
    ).rejects.toThrow(
      'No se pudieron cargar los países y ciudades. Inténtalo de nuevo.',
    );
  });
});
