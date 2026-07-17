import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import { hasFormErrors, validateForm } from './formValidation';
import type { FormData, RequiredFieldsConfig } from '../types';

const baseForm: FormData = {
  nombre: 'Joan',
  email: '',
  empresa: '',
  pais: '',
  ciudad: '',
  mensaje: 'Solicitud de prueba',
};

const defaultRequired: RequiredFieldsConfig = {
  ...DEFAULT_CONFIG.requiredFields,
};

const countries = ['España', 'Francia'];
const citiesForSpain = ['Madrid', 'Barcelona'];

describe('validateForm', () => {
  it('documenta los valores predeterminados de obligatoriedad visual', () => {
    expect(defaultRequired).toEqual({
      nombre: true,
      email: false,
      empresa: false,
      pais: false,
      ciudad: false,
      mensaje: true,
    });
  });

  it('permite campos visualmente obligatorios vacíos', () => {
    const errors = validateForm(
      {
        nombre: '',
        email: '',
        empresa: '',
        pais: '',
        ciudad: '',
        mensaje: '',
      },
      countries,
      citiesForSpain,
    );

    expect(errors).toEqual({});
    expect(hasFormErrors(errors)).toBe(false);
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

  it('rechaza email incorrecto cuando tiene valor', () => {
    const errors = validateForm(
      { ...baseForm, email: 'correo-invalido' },
      countries,
      citiesForSpain,
    );

    expect(errors.email).toBe('Introduzca una dirección de correo válida.');
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
    expect(DEFAULT_CONFIG.requiredFields.nombre).toBe(true);
    expect(DEFAULT_CONFIG.requiredFields.mensaje).toBe(true);
  });
});
