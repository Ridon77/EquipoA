import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import { SUBMIT_WEBHOOK_URL } from '../config/submitEndpoint';
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
  requiredFieldAriaLabels,
  trimAdminConfig,
  validateAdminConfig,
} from '../validation';
import type { AdminErrors, ParameterField } from '../validation';

const RESTORE_CONFIRMATION =
  '¿Desea restaurar los valores predeterminados? Se perderá la configuración guardada.';

export function AdminPage() {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [errors, setErrors] = useState<AdminErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCountriesUrlChange = (value: string) => {
    setConfig((current) => ({ ...current, countriesApiUrl: value }));
    setSuccessMessage(null);

    if (errors.countriesApiUrl) {
      setErrors((current) => ({ ...current, countriesApiUrl: undefined }));
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

  const handleRequiredFieldChange = (
    field: ParameterField,
    checked: boolean,
  ) => {
    setConfig((current) => {
      const requiredFields = {
        ...current.requiredFields,
        [field]: checked,
      };

      if (field === 'ciudad' && checked) {
        requiredFields.pais = true;
      }

      if (field === 'pais' && !checked && requiredFields.ciudad) {
        return current;
      }

      return {
        ...current,
        requiredFields,
      };
    });
    setSuccessMessage(null);

    if (errors.requiredFields) {
      setErrors((current) => ({ ...current, requiredFields: undefined }));
    }
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = trimAdminConfig({
      ...config,
      submitApiUrl: SUBMIT_WEBHOOK_URL,
    });
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

  const isCountryRequiredLocked = config.requiredFields.ciudad;

  return (
    <>
      <header className="admin-header">
        <h1 className="admin-header__title">Administración</h1>
        <p className="admin-header__description">
          Configure los servicios externos, el mapeo de parámetros y los campos
          obligatorios del formulario.
        </p>
      </header>

      <section className="surface-card surface-card--admin">
        <div className="status-panel status-panel--warning" role="note">
          Esta página no dispone de autenticación. Conocer la URL `/admin` es
          suficiente para acceder a la configuración. No debe considerarse un
          mecanismo de seguridad.
        </div>

        {successMessage && (
          <div className="status-panel status-panel--success" role="status" aria-live="polite">
            {successMessage}
          </div>
        )}

        {errors.requiredFields && (
          <div className="status-panel status-panel--error" role="alert">
            {errors.requiredFields}
          </div>
        )}

        <form className="form-layout" onSubmit={handleSave} noValidate>
          <section className="admin-section">
            <h2 className="admin-section__title">Configuración de servicios</h2>
            <p className="admin-section__description">
              Defina la URL utilizada para cargar países. La URL de envío está
              fijada por la aplicación.
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
                  handleCountriesUrlChange(event.target.value)
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
                value={SUBMIT_WEBHOOK_URL}
                readOnly
              />
              <p className="form-help">
                La URL de envío está definida por la aplicación y no puede
                modificarse.
              </p>
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section__title">Mapeo de parámetros</h2>
            <p className="admin-section__description">
              Los nombres de parámetro enviados a n8n usan mayúscula inicial
              (`Nombre`, `Email`, `Empresa`, `Pais`, `Ciudad`, `Mensaje`). País
              visible ≠ parámetro REST (`Pais` sin tilde). Al guardar se
              normalizan automáticamente.
            </p>
            <p className="form-help">
              Esta configuración indica visualmente qué campos se solicitan como
              obligatorios. La validación definitiva se realiza al enviar el
              formulario.
            </p>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campo del formulario</th>
                    <th>Nombre del parámetro API</th>
                    <th>Obligatorio</th>
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
                      <td className="data-table__checkbox-cell">
                        <label className="admin-checkbox">
                          <input
                            id={`required-${field}`}
                            name={`required-${field}`}
                            type="checkbox"
                            checked={config.requiredFields[field]}
                            disabled={field === 'pais' && isCountryRequiredLocked}
                            aria-label={requiredFieldAriaLabels[field]}
                            onChange={(event) =>
                              handleRequiredFieldChange(
                                field,
                                event.target.checked,
                              )
                            }
                          />
                          <span aria-hidden="true">Obligatorio</span>
                        </label>
                        {field === 'pais' && isCountryRequiredLocked && (
                          <p className="form-help">
                            País es obligatorio porque Ciudad depende de un país
                            seleccionado.
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
