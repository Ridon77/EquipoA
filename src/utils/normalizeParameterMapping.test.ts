import { describe, expect, it } from 'vitest';
import { OFFICIAL_PARAMETER_MAPPING } from '../config/officialParameterMapping';
import { normalizeParameterMapping } from './normalizeParameterMapping';

describe('normalizeParameterMapping', () => {
  it('devuelve el mapeo oficial', () => {
    expect(normalizeParameterMapping()).toEqual(OFFICIAL_PARAMETER_MAPPING);
  });

  it('convierte variantes en minúscula y mayúscula', () => {
    expect(
      normalizeParameterMapping({
        nombre: 'nombre',
        email: 'EMAIL',
        empresa: 'EMPRESA',
        pais: 'pais',
        ciudad: 'CIUDAD',
        mensaje: 'mensaje',
      }),
    ).toEqual(OFFICIAL_PARAMETER_MAPPING);
  });

  it('convierte País con tilde en Pais', () => {
    expect(
      normalizeParameterMapping({
        ...OFFICIAL_PARAMETER_MAPPING,
        pais: 'País',
      }).pais,
    ).toBe('Pais');
  });

  it('usa valores oficiales ante vacíos o incompletos', () => {
    expect(
      normalizeParameterMapping({
        nombre: '  ',
        email: '',
      }),
    ).toEqual(OFFICIAL_PARAMETER_MAPPING);
  });

  it('usa valores oficiales ante null o undefined', () => {
    expect(normalizeParameterMapping(null)).toEqual(OFFICIAL_PARAMETER_MAPPING);
    expect(normalizeParameterMapping(undefined)).toEqual(
      OFFICIAL_PARAMETER_MAPPING,
    );
  });
});
