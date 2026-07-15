import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import { hasFormErrors, validateForm } from './formValidation';
import type { FormData } from '../types';

const baseForm: FormData = {
  nombre: 'Joan',
  email: '',
  empresa: '',
  pais: '',
  ciudad: '',
  mensaje: 'Solicitud de prueba',
};

const countries = ['España', 'Francia'];
const citiesForSpain = ['Madrid', 'Barcelona'];

describe('validateForm', () => {
  it('requiere nombre', () => {
    const errors = validateForm(
      { ...baseForm, nombre: '   ' },
      countries,
      citiesForSpain,
    );

    expect(errors.nombre).toBe('El nombre es obligatorio.');
  });

  it('requiere mensaje', () => {
    const errors = validateForm(
      { ...baseForm, mensaje: '' },
      countries,
      citiesForSpain,
    );

    expect(errors.mensaje).toBe('La solicitud es obligatoria.');
  });

  it('permite empresa vacía', () => {
    const errors = validateForm(baseForm, countries, citiesForSpain);

    expect(errors.empresa).toBeUndefined();
    expect(hasFormErrors(errors)).toBe(false);
  });

  it('permite email vacío', () => {
    const errors = validateForm(baseForm, countries, citiesForSpain);

    expect(errors.email).toBeUndefined();
  });

  it('rechaza email incorrecto', () => {
    const errors = validateForm(
      { ...baseForm, email: 'correo-invalido' },
      countries,
      citiesForSpain,
    );

    expect(errors.email).toBe('El email no tiene un formato válido.');
  });

  it('permite país y ciudad vacíos', () => {
    const errors = validateForm(baseForm, countries, citiesForSpain);

    expect(errors.pais).toBeUndefined();
    expect(errors.ciudad).toBeUndefined();
  });

  it('rechaza ciudad incompatible con el país', () => {
    const errors = validateForm(
      { ...baseForm, pais: 'España', ciudad: 'París' },
      countries,
      citiesForSpain,
    );

    expect(errors.ciudad).toBe(
      'Seleccione una ciudad válida para el país indicado.',
    );
  });

  it('rechaza país no listado', () => {
    const errors = validateForm(
      { ...baseForm, pais: 'Atlantis' },
      countries,
      citiesForSpain,
    );

    expect(errors.pais).toBe('Seleccione un país válido.');
  });
});

describe('DEFAULT_CONFIG', () => {
  it('está disponible como configuración predeterminada', () => {
    expect(DEFAULT_CONFIG.countriesApiUrl).toContain('countriesnow.space');
    expect(DEFAULT_CONFIG.submitTimeoutMs).toBeGreaterThan(0);
  });
});
