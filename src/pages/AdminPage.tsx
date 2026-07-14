import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../services/adminAuthService';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import { clearCountriesCache } from '../services/countriesService';
import {
  loadConfig,
  resetConfig,
  saveConfig,
} from '../services/configService';
import type { AppConfig } from '../types';
import {
  hasAdminErrors,
  parameterFieldLabels,
  parameterFieldOrder,
  trimAdminConfig,
  validateAdminConfig,
} from '../validation';
import type { AdminErrors, ParameterField } from '../validation';

const RESTORE_CONFIRMATION =
  '¿Desea restaurar los valores predeterminados? Se perderá la configuración guardada.';

export function AdminPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [errors, setErrors] = useState<AdminErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleUrlChange = (
    field: 'countriesApiUrl' | 'submitApiUrl',
    value: string,
  ) => {
    setConfig((current) => ({ ...current, [field]: value }));
    setSuccessMessage(null);

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleTimeoutChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    setConfig((current) => ({
      ...current,
      submitTimeoutMs: Number.isNaN(parsed) ? 0 : parsed,
    }));
    setSuccessMessage(null);

    if (errors.submitTimeoutMs) {
      setErrors((current) => ({ ...current, submitTimeoutMs: undefined }));
    }
  };

  const handleParameterChange = (field: ParameterField, value: string) => {
    setConfig((current) => ({
      ...current,
      parameterMapping: {
        ...current.parameterMapping,
        [field]: value,
      },
    }));
    setSuccessMessage(null);

    if (errors.parameterMapping?.[field]) {
      setErrors((current) => {
        const nextMapping = { ...current.parameterMapping };
        delete nextMapping[field];

        return {
          ...current,
          parameterMapping:
            Object.keys(nextMapping).length > 0 ? nextMapping : undefined,
        };
      });
    }
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = trimAdminConfig(config);
    const validationErrors = validateAdminConfig(trimmed);

    setConfig(trimmed);

    if (hasAdminErrors(validationErrors)) {
      setErrors(validationErrors);
      setSuccessMessage(null);
      return;
    }

    saveConfig(trimmed);
    clearCountriesCache();
    setErrors({});
    setSuccessMessage('Configuración guardada correctamente');
  };

  const handleRestore = () => {
    if (!window.confirm(RESTORE_CONFIRMATION)) {
      return;
    }

    resetConfig();
    clearCountriesCache();
    setConfig(DEFAULT_CONFIG);
    setErrors({});
    setSuccessMessage(null);
  };

  const getParameterError = (field: ParameterField): string | undefined =>
    errors.parameterMapping?.[field];

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  return (
    <>
      <header className="admin-header">
        <div className="admin-header__top">
          <div>
            <h1 className="admin-header__title">Administración</h1>
            <p className="admin-header__description">
              Configure los servicios externos y el mapeo de parámetros de
              envío.
            </p>
          </div>
          <div className="admin-header__actions">
            <span className="admin-session-badge">
              Sesión administrativa activa
            </span>
            <button
              type="button"
              className="button button--secondary"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <section className="surface-card surface-card--admin">
        <div className="status-panel status-panel--warning" role="note">
          El acceso administrativo se valida en el navegador. No sustituye a una
          autenticación con backend y no debe utilizarse para proteger secretos.
        </div>

        {successMessage && (
          <div className="status-panel status-panel--success" role="status" aria-live="polite">
            {successMessage}
          </div>
        )}

        <form className="form-layout" onSubmit={handleSave} noValidate>
          <section className="admin-section">
            <h2 className="admin-section__title">Configuración de servicios</h2>
            <p className="admin-section__description">
              Defina las URLs utilizadas para cargar países y enviar solicitudes.
            </p>

            <div className="form-field">
              <label className="form-label" htmlFor="countriesApiUrl">
                URL de la API de países
              </label>
              <input
                id="countriesApiUrl"
                name="countriesApiUrl"
                type="url"
                className="form-control"
                value={config.countriesApiUrl}
                onChange={(event) =>
                  handleUrlChange('countriesApiUrl', event.target.value)
                }
                aria-invalid={errors.countriesApiUrl ? true : undefined}
              />
              {errors.countriesApiUrl && (
                <p className="form-error" role="alert">
                  {errors.countriesApiUrl}
                </p>
              )}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="submitApiUrl">
                URL de la API de envío
              </label>
              <input
                id="submitApiUrl"
                name="submitApiUrl"
                type="url"
                className="form-control"
                value={config.submitApiUrl}
                onChange={(event) =>
                  handleUrlChange('submitApiUrl', event.target.value)
                }
                aria-invalid={errors.submitApiUrl ? true : undefined}
              />
              {errors.submitApiUrl && (
                <p className="form-error" role="alert">
                  {errors.submitApiUrl}
                </p>
              )}
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section__title">Tiempo máximo de espera</h2>
            <p className="admin-section__description">
              Tiempo en milisegundos antes de cancelar una petición de envío.
            </p>

            <div className="form-field">
              <label className="form-label" htmlFor="submitTimeoutMs">
                Timeout (milisegundos)
              </label>
              <input
                id="submitTimeoutMs"
                name="submitTimeoutMs"
                type="number"
                min={1}
                step={1}
                className="form-control"
                value={config.submitTimeoutMs}
                onChange={(event) => handleTimeoutChange(event.target.value)}
                aria-invalid={errors.submitTimeoutMs ? true : undefined}
              />
              {errors.submitTimeoutMs && (
                <p className="form-error" role="alert">
                  {errors.submitTimeoutMs}
                </p>
              )}
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section__title">Mapeo de parámetros</h2>
            <p className="admin-section__description">
              Asocie cada campo del formulario con el nombre del parámetro en la API.
            </p>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campo del formulario</th>
                    <th>Nombre del parámetro API</th>
                  </tr>
                </thead>
                <tbody>
                  {parameterFieldOrder.map((field) => (
                    <tr key={field}>
                      <td>{parameterFieldLabels[field]}</td>
                      <td>
                        <label htmlFor={`param-${field}`} className="sr-only">
                          Parámetro para {parameterFieldLabels[field]}
                        </label>
                        <input
                          id={`param-${field}`}
                          name={`param-${field}`}
                          type="text"
                          className="form-control"
                          value={config.parameterMapping[field]}
                          onChange={(event) =>
                            handleParameterChange(field, event.target.value)
                          }
                          aria-invalid={getParameterError(field) ? true : undefined}
                        />
                        {getParameterError(field) && (
                          <p className="form-error" role="alert">
                            {getParameterError(field)}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section__title">Acciones</h2>
            <div className="actions">
              <button type="submit" className="button button--primary">
                Guardar configuración
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={handleRestore}
              >
                Restaurar valores predeterminados
              </button>
              <Link className="button button--ghost" to="/">
                Volver al formulario
              </Link>
            </div>
          </section>
        </form>
      </section>
    </>
  );
}
