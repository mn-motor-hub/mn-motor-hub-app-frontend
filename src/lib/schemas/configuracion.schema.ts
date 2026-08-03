import { z } from 'zod';

/**
 * Rangos válidos por clave, espejando las validaciones del backend.
 * Una clave sin entrada acá solo se valida como número finito — así una
 * configuración nueva aparece en el form sin tener que tocar este archivo.
 */
const RANGOS: Record<string, { min: number; max: number }> = {
  margen_ganancia_default: { min: 0, max: 500 },
};

export function createConfiguracionFormSchema(clave: string) {
  const rango = RANGOS[clave];
  let valor = z.number({ message: 'Ingresá un valor' });
  if (rango) {
    valor = valor
      .min(rango.min, `El valor debe ser mayor o igual a ${rango.min}`)
      .max(rango.max, `El valor debe ser menor o igual a ${rango.max}`);
  }
  return z.object({ valor });
}

export type ConfiguracionFormData = z.infer<ReturnType<typeof createConfiguracionFormSchema>>;
