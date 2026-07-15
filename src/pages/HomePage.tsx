import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormQrOverlay } from '../components/FormQrOverlay';
import { FormView } from '../components/FormView';
import { QrTriggerIcon } from '../components/QrIcons';
import { SuccessView } from '../components/SuccessView';
import { TechnicalErrorView } from '../components/TechnicalErrorView';
import { QR_FORM_CONFIG } from '../config/qrFormConfig';
import { useCountries } from '../hooks/useCountries';
import {
  getCitiesForCountry,
  getCountryDisplayNames,
} from '../services/countriesService';
import { loadConfig } from '../services/configService';
import { submitForm } from '../services/submitService';
import { buildPublicFormQrUrl } from '../utils/buildPublicFormUrl';
import {
  applyQrFormConfig,
  isQrAccess,
  shouldApplyQrFormConfig,
} from '../utils/qrAccess';
import { emptyFormData } from '../types';
import type { FormData, RequiredFieldsConfig, ViewState } from '../types';
import {
  hasFormErrors,
  trimFormData,
  validateForm,
} from '../validation';
import type { FormErrors } from '../validation';

export function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const qrTriggerRef = useRef<HTMLButtonElement>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [formData, setFormData] = useState<FormData>(emptyFormData());
  const [errors, setErrors] = useState<FormErrors>({});
  const [processError, setProcessError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiredFields, setRequiredFields] = useState<RequiredFieldsConfig>(
    () => loadConfig().requiredFields,
  );
  const [isConfigInitializing, setIsConfigInitializing] = useState(true);
  const { countries, loading, error, retry } = useCountries();

  useLayoutEffect(() => {
    const qrAccess = isQrAccess(location.search);
    const storedConfig = loadConfig();

    if (shouldApplyQrFormConfig(storedConfig, qrAccess)) {
      applyQrFormConfig();
      setRequiredFields(QR_FORM_CONFIG.requiredFields);
      retry();
      if (qrAccess) {
        navigate('/', { replace: true });
      }
    } else {
      setRequiredFields(storedConfig.requiredFields);
    }

    setIsConfigInitializing(false);
  }, [location.search, navigate, retry]);

  const countryOptions = useMemo(
    () => getCountryDisplayNames(countries),
    [countries],
  );

  const cityOptions = useMemo(
    () => getCitiesForCountry(countries, formData.pais),
    [countries, formData.pais],
  );

  const publicFormUrl = useMemo(
    () =>
      buildPublicFormQrUrl(window.location.origin, import.meta.env.BASE_URL),
    [],
  );

  const handleCloseQr = () => {
    setIsQrOpen(false);
    qrTriggerRef.current?.focus();
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((current) => {
      if (field === 'pais' && value !== current.pais) {
        return { ...current, pais: value, ciudad: '' };
      }

      return { ...current, [field]: value };
    });

    if (field === 'pais') {
      setErrors((current) => {
        const next = { ...current };
        delete next.pais;
        delete next.ciudad;
        return next;
      });
      return;
    }

    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  const handleValidSubmit = async (data: FormData) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setProcessError(undefined);

    try {
      const result = await submitForm(data);

      switch (result.kind) {
        case 'success':
          setProcessError(undefined);
          setErrors({});
          setViewState('success');
          break;
        case 'processError':
          setProcessError(result.message);
          break;
        case 'technicalError':
          setProcessError(undefined);
          setViewState('technicalError');
          break;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) {
      return;
    }

    const trimmed = trimFormData(formData);
    const currentRequiredFields = loadConfig().requiredFields;
    const validationErrors = validateForm(
      trimmed,
      currentRequiredFields,
      countryOptions,
      cityOptions,
    );

    setFormData(trimmed);
    setRequiredFields(currentRequiredFields);

    if (hasFormErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    void handleValidSubmit(trimmed);
  };

  const handleNewRequest = () => {
    setFormData(emptyFormData());
    setErrors({});
    setProcessError(undefined);
    setViewState('form');
  };

  const handleBackToForm = () => {
    setViewState('form');
  };

  if (isConfigInitializing) {
    return (
      <section className="surface-card">
        <span className="loading-inline" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          Preparando el formulario...
        </span>
      </section>
    );
  }

  if (viewState === 'success') {
    return <SuccessView onNewRequest={handleNewRequest} />;
  }

  if (viewState === 'technicalError') {
    return <TechnicalErrorView onBackToForm={handleBackToForm} />;
  }

  return (
    <>
      <header className="page-intro">
        <div className="page-intro__top">
          <div>
            <p className="page-eyebrow">Automatización de procesos</p>
            <h1 className="page-title">Cuéntanos qué proceso quieres mejorar</h1>
            <p className="page-subtitle">
              Completa el formulario y nuestro equipo analizará tu solicitud.
            </p>
          </div>
          <button
            ref={qrTriggerRef}
            type="button"
            className="qr-trigger"
            aria-label="Mostrar código QR del formulario"
            onClick={() => setIsQrOpen(true)}
          >
            <QrTriggerIcon />
          </button>
        </div>
      </header>

      <section className="surface-card">
        <FormView
          formData={formData}
          errors={errors}
          requiredFields={requiredFields}
          countries={countries}
          countriesLoading={loading}
          countriesError={error}
          onRetryCountries={retry}
          onChange={handleChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          processError={processError}
        />
      </section>

      <FormQrOverlay
        isOpen={isQrOpen}
        formUrl={publicFormUrl}
        onClose={handleCloseQr}
      />
    </>
  );
}
