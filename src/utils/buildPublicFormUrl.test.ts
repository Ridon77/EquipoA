import { describe, expect, it } from 'vitest';
import {
  buildPublicFormQrUrl,
  buildPublicFormUrl,
} from './buildPublicFormUrl';

describe('buildPublicFormUrl', () => {
  it('genera la URL del formulario en la raíz', () => {
    expect(buildPublicFormUrl('http://localhost:5173', '/')).toBe(
      'http://localhost:5173/#/',
    );
  });

  it('normaliza la ruta base de Vite para GitHub Pages', () => {
    expect(
      buildPublicFormUrl('https://example.com', '/EquipoA/'),
    ).toBe('https://example.com/EquipoA/#/');
  });

  it('evita barras duplicadas', () => {
    expect(
      buildPublicFormUrl('https://example.com/', '//EquipoA//'),
    ).toBe('https://example.com/EquipoA/#/');
  });

  it('devuelve una URL absoluta sin datos del formulario', () => {
    const url = buildPublicFormUrl('https://example.com', '/EquipoA/');

    expect(url.startsWith('https://')).toBe(true);
    expect(url).not.toContain('/admin');
    expect(url).not.toContain('nombre=');
  });
});

describe('buildPublicFormQrUrl', () => {
  it('añade el marcador source=qr', () => {
    expect(buildPublicFormQrUrl('http://localhost:5173', '/')).toBe(
      'http://localhost:5173/#/?source=qr',
    );
  });

  it('funciona con subruta de GitHub Pages', () => {
    expect(
      buildPublicFormQrUrl('https://example.com', '/EquipoA/'),
    ).toBe('https://example.com/EquipoA/#/?source=qr');
  });

  it('no incluye rutas administrativas ni datos personales', () => {
    const url = buildPublicFormQrUrl('https://example.com', '/EquipoA/');

    expect(url).toContain('source=qr');
    expect(url).not.toContain('/admin');
    expect(url).not.toContain('email=');
    expect(url).not.toContain('Nombre=');
  });
});
