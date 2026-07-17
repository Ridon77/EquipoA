import { OFFICIAL_PARAMETER_MAPPING } from '../config/officialParameterMapping';
import type { ParameterMapping } from '../types';

/**
 * Normaliza el mapeo de parámetros al contrato oficial de n8n.
 * Variantes en minúscula/mayúscula, con tilde (`País`) o vacías se sustituyen
 * por los valores oficiales (`Nombre`, `Email`, `Empresa`, `Pais`, …).
 */
export function normalizeParameterMapping(
  _mapping?: Partial<ParameterMapping> | null,
): ParameterMapping {
  // El webhook depende de estos nombres exactos.
  return { ...OFFICIAL_PARAMETER_MAPPING };
}
