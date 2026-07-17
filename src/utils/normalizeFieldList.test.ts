import { describe, expect, it } from 'vitest';
import { normalizeFieldList } from './normalizeFieldList';

describe('normalizeFieldList', () => {
  it('normaliza strings válidos', () => {
    expect(normalizeFieldList(['Nombre', 'Email'])).toEqual([
      'Nombre',
      'Email',
    ]);
  });

  it('trata null y no-arrays como vacíos', () => {
    expect(normalizeFieldList(null)).toEqual([]);
    expect(normalizeFieldList(undefined)).toEqual([]);
    expect(normalizeFieldList('Nombre')).toEqual([]);
    expect(normalizeFieldList({})).toEqual([]);
  });

  it('elimina vacíos, no string y duplicados', () => {
    expect(
      normalizeFieldList([' Nombre ', '', '  ', 1, null, 'Nombre', 'Mensaje']),
    ).toEqual(['Nombre', 'Mensaje']);
  });
});
