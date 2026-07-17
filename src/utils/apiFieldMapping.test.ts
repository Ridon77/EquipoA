import { describe, expect, it } from 'vitest';
import { apiFieldToFormField, mapValidationToFormErrors } from './apiFieldMapping';

describe('apiFieldToFormField', () => {
  it('mapea nombres conocidos incluyendo País con y sin tilde', () => {
    expect(apiFieldToFormField.Nombre).toBe('nombre');
    expect(apiFieldToFormField.Email).toBe('email');
    expect(apiFieldToFormField.Empresa).toBe('empresa');
    expect(apiFieldToFormField.Pais).toBe('pais');
    expect(apiFieldToFormField.País).toBe('pais');
    expect(apiFieldToFormField.Ciudad).toBe('ciudad');
    expect(apiFieldToFormField.Mensaje).toBe('mensaje');
  });
});

describe('mapValidationToFormErrors', () => {
  it('marca campos faltantes e inválidos', () => {
    expect(
      mapValidationToFormErrors(['Nombre', 'Mensaje'], ['Email']),
    ).toEqual({
      nombre: 'Este campo es obligatorio.',
      mensaje: 'Este campo es obligatorio.',
      email: 'Introduzca una dirección de correo válida.',
    });
  });

  it('usa mensaje genérico de formato para campos no email', () => {
    expect(mapValidationToFormErrors([], ['Empresa'])).toEqual({
      empresa: 'Revise el formato de este campo.',
    });
  });

  it('prioriza obligatorio si aparece en ambas listas', () => {
    expect(mapValidationToFormErrors(['Email'], ['Email'])).toEqual({
      email: 'Este campo es obligatorio.',
    });
  });

  it('ignora nombres desconocidos sin romper', () => {
    expect(mapValidationToFormErrors(['Desconocido'], ['Otro'])).toEqual({});
  });
});
