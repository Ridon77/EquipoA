export interface FormData {
  nombre: string;
  email: string;
  pais: string;
  ciudad: string;
  mensaje: string;
}

export interface ParameterMapping {
  nombre: string;
  email: string;
  pais: string;
  ciudad: string;
  mensaje: string;
}

export interface AppConfig {
  countriesApiUrl: string;
  submitApiUrl: string;
  submitTimeoutMs: number;
  parameterMapping: ParameterMapping;
}

export type ApiResult =
  | { kind: 'success' }
  | { kind: 'processError'; message: string }
  | { kind: 'technicalError' };

export type ViewState = 'form' | 'success' | 'technicalError';

export const emptyFormData = (): FormData => ({
  nombre: '',
  email: '',
  pais: '',
  ciudad: '',
  mensaje: '',
});
