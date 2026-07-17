export interface FormData {
  nombre: string;
  email: string;
  empresa: string;
  pais: string;
  ciudad: string;
  mensaje: string;
}

export interface ParameterMapping {
  nombre: string;
  email: string;
  empresa: string;
  pais: string;
  ciudad: string;
  mensaje: string;
}

export interface RequiredFieldsConfig {
  nombre: boolean;
  email: boolean;
  empresa: boolean;
  pais: boolean;
  ciudad: boolean;
  mensaje: boolean;
}

export interface AppConfig {
  countriesApiUrl: string;
  submitApiUrl: string;
  submitTimeoutMs: number;
  parameterMapping: ParameterMapping;
  requiredFields: RequiredFieldsConfig;
}

export type ApiResult =
  | {
      kind: 'success';
      message: string;
      advisorName: string;
      advisorEmail: string;
    }
  | { kind: 'processError'; message: string }
  | {
      kind: 'validationError';
      status: 422;
      message: string;
      missingFields: string[];
      invalidFields: string[];
    }
  | { kind: 'technicalError' };

export type ViewState = 'form' | 'success' | 'technicalError';

export const emptyFormData = (): FormData => ({
  nombre: '',
  email: '',
  empresa: '',
  pais: '',
  ciudad: '',
  mensaje: '',
});
