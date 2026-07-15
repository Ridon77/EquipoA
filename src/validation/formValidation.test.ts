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
  it('usa los valores predeterminados de obligatoriedad', () => {
    expect(defaultRequired).toEqual({
      nombre: true,
      email: false,
      empresa: false,
      pais: false,
      ciudad: false,
      mensaje: true,
    });
  });

  it('requiere nombre cuando es obligatorio', () => {
    const errors = validateForm(
      { ...baseForm, nombre: '   ' },
      defaultRequired,
      countries,
      citiesForSpain,
    );

    expect(errors.nombre).toBe('Introduzca su nombre.');
  });

  it('permite nombre vacío cuando es opcional', () => {
    const errors = validateForm(
      { ...baseForm, nombre: '' },
      { ...defaultRequired, nombre: false },
      countries,
      citiesForSpain,
    );

    expect(errors.nombre).toBeUndefined();
  });

  it('requiere mensaje cuando es obligatorio', () => {
    const errors = validateForm(
      { ...baseForm, mensaje: '' },
      defaultRequired,
      countries,
      citiesForSpain,
    );

    expect(errors.mensaje).toBe('Introduzca su solicitud.');
  });

  it('permite empresa vacía por defecto', () => {
    const errors = validateForm(baseForm, defaultRequired, countries, citiesForSpain);

    expect(errors.empresa).toBeUndefined();
    expect(hasFormErrors(errors)).toBe(false);
  });

  it('requiere empresa cuando está configurada', () => {
    const errors = validateForm(
      baseForm,
      { ...defaultRequired, empresa: true },
      countries,
      citiesForSpain,
    );

    expect(errors.empresa).toBe('Introduzca su empresa.');
  });

  it('permite email vacío cuando es opcional', () => {
    const errors = validateForm(baseForm, defaultRequired, countries, citiesForSpain);

    expect(errors.email).toBeUndefined();
  });

  it('rechaza email incorrecto aunque sea opcional', () => {
    const errors = validateForm(
      { ...baseForm, email: 'correo-invalido' },
      defaultRequired,
      countries,
      citiesForSpain,
    );

    expect(errors.email).toBe('Introduzca una dirección de correo válida.');
  });

  it('requiere email cuando es obligatorio', () => {
    const errors = validateForm(
      baseForm,
      { ...defaultRequired, email: true },
      countries,
      citiesForSpain,
    );

    expect(errors.email).toBe('Introduzca su email.');
  });

  it('permite país y ciudad vacíos por defecto', () => {
    const errors = validateForm(baseForm, defaultRequired, countries, citiesForSpain);

    expect(errors.pais).toBeUndefined();
    expect(errors.ciudad).toBeUndefined();
  });

  it('requiere país cuando es obligatorio', () => {
    const errors = validateForm(
      baseForm,
      { ...defaultRequired, pais: true },
      countries,
      citiesForSpain,
    );

    expect(errors.pais).toBe('Seleccione un país.');
  });

  it('requiere ciudad cuando es obligatoria', () => {
    const errors = validateForm(
      { ...baseForm, pais: 'España' },
      { ...defaultRequired, pais: true, ciudad: true },
      countries,
      citiesForSpain,
    );

    expect(errors.ciudad).toBe('Seleccione una ciudad.');
  });

  it('rechaza ciudad incompatible con el país', () => {
    const errors = validateForm(
      { ...baseForm, pais: 'España', ciudad: 'París' },
      defaultRequired,
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
      defaultRequired,
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
