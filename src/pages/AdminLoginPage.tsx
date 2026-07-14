import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  AUTH_MESSAGES,
  authenticateAdmin,
  consumeSessionExpiredNotice,
  getLoginBlockState,
  isAdminAuthConfigured,
  isAdminAuthenticated,
} from '../services/adminAuthService';

const logoUrl = `${import.meta.env.BASE_URL}equipo-a-logo.png`;

type FieldErrors = {
  username?: string;
  password?: string;
};

export function AdminLoginPage() {
  const usernameId = useId();
  const passwordId = useId();
  const usernameErrorId = `${usernameId}-error`;
  const passwordErrorId = `${passwordId}-error`;
  const formErrorId = useId();
  const usernameRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSucceeded, setLoginSucceeded] = useState(false);
  const [blockState, setBlockState] = useState(() => getLoginBlockState());

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (consumeSessionExpiredNotice()) {
      setSessionExpiredMessage(AUTH_MESSAGES.sessionExpired);
    }
  }, []);

  useEffect(() => {
    if (!blockState.blocked) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nextState = getLoginBlockState();
      setBlockState(nextState);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [blockState.blocked]);

  if (loginSucceeded || isAdminAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    const nextFieldErrors: FieldErrors = {};

    if (!trimmedUsername) {
      nextFieldErrors.username = AUTH_MESSAGES.missingUsername;
    }

    if (!password) {
      nextFieldErrors.password = AUTH_MESSAGES.missingPassword;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError(null);
      setSessionExpiredMessage(null);

      if (!trimmedUsername) {
        usernameRef.current?.focus();
      } else {
        document.getElementById(passwordId)?.focus();
      }

      return;
    }

    const currentBlock = getLoginBlockState();

    if (currentBlock.blocked) {
      setBlockState(currentBlock);
      setFormError(
        `${AUTH_MESSAGES.tooManyAttempts} (${currentBlock.remainingSeconds} s)`,
      );
      return;
    }

    if (!isAdminAuthConfigured()) {
      setFieldErrors({});
      setFormError(AUTH_MESSAGES.missingConfig);
      formErrorRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSessionExpiredMessage(null);
    setIsSubmitting(true);

    try {
      const authenticated = await authenticateAdmin(trimmedUsername, password);

      if (authenticated) {
        setPassword('');
        setLoginSucceeded(true);
        return;
      }

      setPassword('');
      setFormError(AUTH_MESSAGES.invalidCredentials);
      setBlockState(getLoginBlockState());
      formErrorRef.current?.focus();
    } catch (error) {
      if (error instanceof Error && error.message === 'LOGIN_BLOCKED') {
        const nextBlock = getLoginBlockState();
        setBlockState(nextBlock);
        setFormError(
          `${AUTH_MESSAGES.tooManyAttempts} (${nextBlock.remainingSeconds} s)`,
        );
      } else if (
        error instanceof Error &&
        error.message === 'ADMIN_AUTH_NOT_CONFIGURED'
      ) {
        setFormError(AUTH_MESSAGES.missingConfig);
      } else {
        if (import.meta.env.DEV) {
          console.error('Error al validar el acceso administrativo', error);
        }

        setFormError(AUTH_MESSAGES.unexpectedError);
      }

      setPassword('');
      formErrorRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBlocked = blockState.blocked;
  const submitDisabled = isSubmitting || isBlocked;

  return (
    <div className="login-page">
      <section className="surface-card surface-card--compact">
        <div className="login-brand">
          <img className="login-brand__logo" src={logoUrl} alt="Equipo A" />
          <div className="login-brand__text">
            <p className="login-brand__name">Equipo A</p>
          </div>
        </div>

        <header className="login-header">
          <h1 className="login-header__title">Acceso a administración</h1>
          <p className="login-header__description">
            Introduzca sus credenciales para acceder a la configuración de la
            aplicación.
          </p>
        </header>

        {sessionExpiredMessage && (
          <div
            className="status-panel status-panel--warning"
            role="status"
            aria-live="polite"
          >
            {sessionExpiredMessage}
          </div>
        )}

        {formError && (
          <div
            ref={formErrorRef}
            id={formErrorId}
            className="status-panel status-panel--error"
            role="alert"
            tabIndex={-1}
            aria-live="assertive"
          >
            {formError}
          </div>
        )}

        {isBlocked && !formError && (
          <div
            className="status-panel status-panel--error"
            role="alert"
            aria-live="assertive"
          >
            {AUTH_MESSAGES.tooManyAttempts} ({blockState.remainingSeconds} s)
          </div>
        )}

        <form className="form-layout" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor={usernameId}>
              Usuario
            </label>
            <input
              ref={usernameRef}
              id={usernameId}
              name="username"
              type="text"
              autoComplete="username"
              className="form-control"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                if (fieldErrors.username) {
                  setFieldErrors((current) => ({
                    ...current,
                    username: undefined,
                  }));
                }
              }}
              disabled={isSubmitting || isBlocked}
              aria-invalid={fieldErrors.username ? true : undefined}
              aria-describedby={
                fieldErrors.username ? usernameErrorId : undefined
              }
            />
            {fieldErrors.username && (
              <p id={usernameErrorId} className="form-error" role="alert">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={passwordId}>
              Contraseña
            </label>
            <input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="current-password"
              className="form-control"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }
              }}
              disabled={isSubmitting || isBlocked}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={
                fieldErrors.password ? passwordErrorId : undefined
              }
            />
            {fieldErrors.password && (
              <p id={passwordErrorId} className="form-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="button button--primary button--full"
              disabled={submitDisabled}
            >
              {isSubmitting ? 'Comprobando...' : 'Acceder'}
            </button>
            <Link className="button button--secondary button--full" to="/">
              Volver al formulario
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
