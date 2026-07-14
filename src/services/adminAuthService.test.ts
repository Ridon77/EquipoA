import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  authenticateAdmin,
  clearAdminSession,
  consumeSessionExpiredNotice,
  createAdminSession,
  getAdminSessionExpiration,
  getConfiguredSessionMinutes,
  getLoginBlockState,
  isAdminAuthenticated,
  isAdminAuthConfigured,
  logoutAdmin,
  markSessionExpiredNotice,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from './adminAuthService';
import { CONFIG_STORAGE_KEY } from '../config/defaultConfig';

const VALID_HASH =
  '006a516c76cd0a40d62017cfe52907d8210c14f031fb1e7fd7580ea9e11243a9';

describe('adminAuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.stubEnv('VITE_ADMIN_USERNAME', 'Admin');
    vi.stubEnv('VITE_ADMIN_PASSWORD_HASH', VALID_HASH);
    vi.stubEnv('VITE_ADMIN_SESSION_MINUTES', '30');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('detecta credenciales configuradas', () => {
    expect(isAdminAuthConfigured()).toBe(true);
    expect(getConfiguredSessionMinutes()).toBe(30);
  });

  it('autentica credenciales válidas', async () => {
    await expect(authenticateAdmin('Admin', 'EquipoA')).resolves.toBe(true);
    expect(isAdminAuthenticated()).toBe(true);
    expect(getAdminSessionExpiration()).not.toBeNull();
  });

  it('rechaza usuario incorrecto', async () => {
    await expect(authenticateAdmin('Otro', 'EquipoA')).resolves.toBe(false);
    expect(isAdminAuthenticated()).toBe(false);
  });

  it('rechaza contraseña incorrecta', async () => {
    await expect(authenticateAdmin('Admin', 'Incorrecta')).resolves.toBe(false);
    expect(isAdminAuthenticated()).toBe(false);
  });

  it('falla cuando faltan variables de entorno', async () => {
    vi.stubEnv('VITE_ADMIN_USERNAME', '');
    vi.stubEnv('VITE_ADMIN_PASSWORD_HASH', '');

    expect(isAdminAuthConfigured()).toBe(false);
    await expect(authenticateAdmin('Admin', 'EquipoA')).rejects.toThrow(
      'ADMIN_AUTH_NOT_CONFIGURED',
    );
  });

  it('crea y lee una sesión válida', () => {
    createAdminSession(1_000);
    expect(isAdminAuthenticated(1_500)).toBe(true);
    expect(getAdminSessionExpiration()).toBe(1_000 + 30 * 60 * 1000);
  });

  it('invalida una sesión expirada', () => {
    createAdminSession(1_000);
    expect(isAdminAuthenticated(1_000 + 30 * 60 * 1000 + 1)).toBe(false);
    expect(consumeSessionExpiredNotice()).toBe(true);
  });

  it('invalida una sesión corrupta', () => {
    sessionStorage.setItem('equipo-a-admin-session', '{invalid');
    expect(isAdminAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('equipo-a-admin-session')).toBeNull();
  });

  it('elimina la sesión al cerrar sesión', () => {
    createAdminSession();
    logoutAdmin();
    expect(isAdminAuthenticated()).toBe(false);
  });

  it('no elimina la configuración de localStorage al cerrar sesión', () => {
    localStorage.setItem(CONFIG_STORAGE_KEY, '{"countriesApiUrl":"x"}');
    createAdminSession();
    logoutAdmin();
    expect(localStorage.getItem(CONFIG_STORAGE_KEY)).toBe('{"countriesApiUrl":"x"}');
  });

  it('incrementa intentos fallidos y bloquea al quinto', () => {
    expect(getLoginBlockState().blocked).toBe(false);

    for (let attempt = 1; attempt < 5; attempt += 1) {
      const state = recordFailedLoginAttempt();
      expect(state.blocked).toBe(false);
    }

    const blocked = recordFailedLoginAttempt();
    expect(blocked.blocked).toBe(true);
    expect(blocked.remainingSeconds).toBeGreaterThan(0);
  });

  it('reinicia el bloqueo cuando finaliza el tiempo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordFailedLoginAttempt();
    }

    expect(getLoginBlockState().blocked).toBe(true);

    vi.advanceTimersByTime(61_000);
    expect(getLoginBlockState().blocked).toBe(false);

    vi.useRealTimers();
  });

  it('limpia los intentos tras un login correcto', async () => {
    await authenticateAdmin('Admin', 'Incorrecta');
    await authenticateAdmin('Admin', 'EquipoA');

    expect(getLoginBlockState().blocked).toBe(false);
    expect(sessionStorage.getItem('equipo-a-admin-login-attempts')).toBeNull();
  });

  it('expone aviso de sesión caducada', () => {
    markSessionExpiredNotice();
    expect(consumeSessionExpiredNotice()).toBe(true);
    expect(consumeSessionExpiredNotice()).toBe(false);
  });

  it('usa 30 minutos por defecto con timeout inválido', () => {
    vi.stubEnv('VITE_ADMIN_SESSION_MINUTES', 'invalid');
    createAdminSession(0);
    expect(getAdminSessionExpiration()).toBe(30 * 60 * 1000);
  });

  it('clearAdminSession elimina solo la sesión', () => {
    createAdminSession();
    clearAdminSession();
    expect(isAdminAuthenticated()).toBe(false);
  });

  it('resetLoginAttempts elimina el contador', () => {
    recordFailedLoginAttempt();
    resetLoginAttempts();
    expect(sessionStorage.getItem('equipo-a-admin-login-attempts')).toBeNull();
  });
});
