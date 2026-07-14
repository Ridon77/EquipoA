import { hashPassword, isWebCryptoAvailable } from '../utils/hashPassword';

export interface AdminSession {
  authenticated: true;
  expiresAt: number;
}

export interface LoginBlockState {
  blocked: boolean;
  remainingSeconds: number;
}

export interface LoginAttemptsState {
  count: number;
  lockedUntil: number | null;
}

const SESSION_STORAGE_KEY = 'equipo-a-admin-session';
const LOGIN_ATTEMPTS_KEY = 'equipo-a-admin-login-attempts';
const SESSION_EXPIRED_NOTICE_KEY = 'equipo-a-admin-session-expired';

const DEFAULT_SESSION_MINUTES = 30;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export const AUTH_MESSAGES = {
  missingUsername: 'Introduzca el usuario.',
  missingPassword: 'Introduzca la contraseña.',
  invalidCredentials: 'El usuario o la contraseña no son correctos.',
  missingConfig:
    'El acceso administrativo no está configurado. Póngase en contacto con el administrador de la aplicación.',
  unexpectedError: 'No ha sido posible validar el acceso. Inténtelo de nuevo.',
  tooManyAttempts:
    'Se han producido demasiados intentos. Espere un minuto antes de volver a intentarlo.',
  sessionExpired: 'La sesión ha caducado. Vuelva a identificarse.',
} as const;

function parseSessionMinutes(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_MINUTES;
  }

  return parsed;
}

function getAdminCredentialsConfig(): {
  username: string;
  passwordHash: string;
  sessionMinutes: number;
} {
  return {
    username: import.meta.env.VITE_ADMIN_USERNAME?.trim() ?? '',
    passwordHash:
      import.meta.env.VITE_ADMIN_PASSWORD_HASH?.trim().toLowerCase() ?? '',
    sessionMinutes: parseSessionMinutes(
      import.meta.env.VITE_ADMIN_SESSION_MINUTES,
    ),
  };
}

export function isAdminAuthConfigured(): boolean {
  const { username, passwordHash } = getAdminCredentialsConfig();
  return username.length > 0 && passwordHash.length > 0;
}

function readRawSession(): AdminSession | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>;

    if (
      parsed.authenticated !== true ||
      typeof parsed.expiresAt !== 'number' ||
      !Number.isFinite(parsed.expiresAt)
    ) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return {
      authenticated: true,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function readLoginAttempts(): LoginAttemptsState {
  const raw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);

  if (!raw) {
    return { count: 0, lockedUntil: null };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LoginAttemptsState>;
    const count =
      typeof parsed.count === 'number' && parsed.count >= 0
        ? parsed.count
        : 0;
    const lockedUntil =
      typeof parsed.lockedUntil === 'number' && parsed.lockedUntil > 0
        ? parsed.lockedUntil
        : null;

    return { count, lockedUntil };
  } catch {
    sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    return { count: 0, lockedUntil: null };
  }
}

function writeLoginAttempts(state: LoginAttemptsState): void {
  if (state.count === 0 && state.lockedUntil === null) {
    sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    return;
  }

  sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(state));
}

export function getLoginBlockState(now = Date.now()): LoginBlockState {
  const attempts = readLoginAttempts();

  if (!attempts.lockedUntil || attempts.lockedUntil <= now) {
    if (attempts.lockedUntil && attempts.lockedUntil <= now) {
      writeLoginAttempts({ count: 0, lockedUntil: null });
    }

    return { blocked: false, remainingSeconds: 0 };
  }

  return {
    blocked: true,
    remainingSeconds: Math.ceil((attempts.lockedUntil - now) / 1000),
  };
}

export function recordFailedLoginAttempt(now = Date.now()): LoginBlockState {
  const blockState = getLoginBlockState(now);

  if (blockState.blocked) {
    return blockState;
  }

  const attempts = readLoginAttempts();
  const nextCount = attempts.count + 1;

  if (nextCount >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_SECONDS * 1000;
    writeLoginAttempts({ count: nextCount, lockedUntil });
    return {
      blocked: true,
      remainingSeconds: LOCKOUT_SECONDS,
    };
  }

  writeLoginAttempts({ count: nextCount, lockedUntil: null });
  return { blocked: false, remainingSeconds: 0 };
}

export function resetLoginAttempts(): void {
  sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
}

export function createAdminSession(now = Date.now()): void {
  const { sessionMinutes } = getAdminCredentialsConfig();
  const session: AdminSession = {
    authenticated: true,
    expiresAt: now + sessionMinutes * 60 * 1000,
  };

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getAdminSessionExpiration(): number | null {
  const session = readRawSession();
  return session?.expiresAt ?? null;
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function markSessionExpiredNotice(): void {
  sessionStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, '1');
}

export function consumeSessionExpiredNotice(): boolean {
  const hasNotice = sessionStorage.getItem(SESSION_EXPIRED_NOTICE_KEY) === '1';

  if (hasNotice) {
    sessionStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);
  }

  return hasNotice;
}

export function isAdminAuthenticated(now = Date.now()): boolean {
  const session = readRawSession();

  if (!session) {
    return false;
  }

  if (session.expiresAt <= now) {
    clearAdminSession();
    markSessionExpiredNotice();
    return false;
  }

  return true;
}

export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<boolean> {
  if (!isAdminAuthConfigured()) {
    throw new Error('ADMIN_AUTH_NOT_CONFIGURED');
  }

  if (!isWebCryptoAvailable()) {
    throw new Error('WEB_CRYPTO_UNAVAILABLE');
  }

  const blockState = getLoginBlockState();

  if (blockState.blocked) {
    throw new Error('LOGIN_BLOCKED');
  }

  const { username: configuredUsername, passwordHash } =
    getAdminCredentialsConfig();
  const passwordDigest = await hashPassword(password);

  if (
    username.toLowerCase() === configuredUsername.toLowerCase() &&
    passwordDigest === passwordHash
  ) {
    createAdminSession();
    resetLoginAttempts();
    return true;
  }

  recordFailedLoginAttempt();
  return false;
}

export function getConfiguredSessionMinutes(): number {
  return getAdminCredentialsConfig().sessionMinutes;
}

export function logoutAdmin(): void {
  clearAdminSession();
}
