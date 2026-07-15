import { describe, expect, it } from 'vitest';
import {
  compareSpanishNames,
  translateCityName,
  translateCountryName,
} from './locationTranslations';

describe('locationTranslations', () => {
  it('traduce países conocidos mediante ISO2', () => {
    expect(translateCountryName('DE', 'Germany')).toBe('Alemania');
    expect(translateCountryName('GB', 'United Kingdom')).toBe('Reino Unido');
    expect(translateCountryName('US', 'United States')).toBe('Estados Unidos');
    expect(translateCountryName('NL', 'Netherlands')).toBe('Países Bajos');
  });

  it('conserva el nombre original si el ISO2 no es válido', () => {
    expect(translateCountryName('XX', 'Atlantis')).toBe('Atlantis');
    expect(translateCountryName('', 'Atlantis')).toBe('Atlantis');
  });

  it('traduce ciudades conocidas y conserva desconocidas', () => {
    expect(translateCityName('London')).toBe('Londres');
    expect(translateCityName('Munich')).toBe('Múnich');
    expect(translateCityName('Zaragoza')).toBe('Zaragoza');
  });

  it('ordena nombres según reglas españolas', () => {
    const names = ['Zamora', 'Ávila', 'Madrid', 'Sevilla'];
    const sorted = [...names].sort(compareSpanishNames);

    expect(sorted).toEqual(['Ávila', 'Madrid', 'Sevilla', 'Zamora']);
  });
});
