import { describe, expect, it } from 'vitest';
import { matchesPartialText } from './filterOptions';

describe('matchesPartialText', () => {
  it('coincide por cualquier parte del texto', () => {
    expect(matchesPartialText('España', 'aña')).toBe(true);
    expect(matchesPartialText('España', 'esp')).toBe(true);
    expect(matchesPartialText('Alemania', 'man')).toBe(true);
  });

  it('no exige que coincida con el inicio', () => {
    expect(matchesPartialText('Países Bajos', 'baj')).toBe(true);
    expect(matchesPartialText('Estados Unidos', 'unid')).toBe(true);
  });

  it('ignora mayúsculas y espacios extremos', () => {
    expect(matchesPartialText('Múnich', '  MÚN  ')).toBe(true);
  });

  it('sin consulta muestra todas las opciones', () => {
    expect(matchesPartialText('España', '')).toBe(true);
  });
});
