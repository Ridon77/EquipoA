import { describe, expect, it } from 'vitest';
import { hashPassword } from './hashPassword';

describe('hashPassword', () => {
  it('calcula SHA-256 en hexadecimal minúsculas', async () => {
    await expect(hashPassword('EquipoA')).resolves.toBe(
      '006a516c76cd0a40d62017cfe52907d8210c14f031fb1e7fd7580ea9e11243a9',
    );
  });

  it('produce hashes distintos para contraseñas distintas', async () => {
    const first = await hashPassword('EquipoA');
    const second = await hashPassword('OtraClave');

    expect(first).not.toBe(second);
  });
});
