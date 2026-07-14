import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
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

  return (
    <main>
      <h1>Administración</h1>

      <p className="admin-warning" role="note">
        Esta página no dispone todavía de autenticación. Su dirección no debe
        considerarse un mecanismo de seguridad.
      </p>

      {successMessage && (
        <p className="admin-success" role="status" aria-live="polite">
          {successMessage}
        </p>
      )}

      <form className="admin-form" onSubmit={handleSave} noValidate>
        <label htmlFor="countriesApiUrl">
          URL de la API de países
          <input
            id="countriesApiUrl"
            name="countriesApiUrl"
            type="url"
            value={config.countriesApiUrl}
            onChange={(event) =>
              handleUrlChange('countriesApiUrl', event.target.value)
            }
            aria-invalid={errors.countriesApiUrl ? true : undefined}
          />
          {errors.countriesApiUrl && (
            <span className="field-error" role="alert">
              {errors.countriesApiUrl}
            </span>
          )}
        </label>

        <label htmlFor="submitApiUrl">
          URL de la API de envío
          <input
            id="submitApiUrl"
            name="submitApiUrl"
            type="url"
            value={config.submitApiUrl}
            onChange={(event) =>
              handleUrlChange('submitApiUrl', event.target.value)
            }
            aria-invalid={errors.submitApiUrl ? true : undefined}
          />
          {errors.submitApiUrl && (
            <span className="field-error" role="alert">
              {errors.submitApiUrl}
            </span>
          )}
        </label>

        <label htmlFor="submitTimeoutMs">
          Timeout (milisegundos)
          <input
            id="submitTimeoutMs"
            name="submitTimeoutMs"
            type="number"
            min={1}
            step={1}
            value={config.submitTimeoutMs}
            onChange={(event) => handleTimeoutChange(event.target.value)}
            aria-invalid={errors.submitTimeoutMs ? true : undefined}
          />
          {errors.submitTimeoutMs && (
            <span className="field-error" role="alert">
              {errors.submitTimeoutMs}
            </span>
          )}
        </label>

        <table>
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
                    value={config.parameterMapping[field]}
                    onChange={(event) =>
                      handleParameterChange(field, event.target.value)
                    }
                    aria-invalid={getParameterError(field) ? true : undefined}
                  />
                  {getParameterError(field) && (
                    <span className="field-error" role="alert">
                      {getParameterError(field)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="actions">
          <button type="submit">Guardar configuración</button>
          <button type="button" onClick={handleRestore}>
            Restaurar valores predeterminados
          </button>
          <Link to="/">Volver al formulario</Link>
        </div>
      </form>
    </main>
  );
}
