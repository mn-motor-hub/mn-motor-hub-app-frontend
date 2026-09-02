'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { PRICING_TAG, aplicarK, getKSugerido } from '@/lib/api/pricing';
import type { ActionResult, KAplicado, KSugerido } from '@/types';

/**
 * Estas acciones existen porque el token vive en una cookie httpOnly: el panel
 * es un Client Component y no puede llamar a src/lib/api/ directamente.
 */

/**
 * Lectura, no mutación: no invalida nada.
 *
 * Un resultado con `kSugerido: null` y `muestraSuficiente: false` es un
 * `ok: true` — el backend respondió correctamente que todavía no hay historial
 * para sugerir. Devolverlo como error haría que la pantalla muestre una falla
 * donde no la hay.
 */
export async function calcularKSugeridoAction(): Promise<ActionResult<KSugerido>> {
  try {
    return { ok: true, data: await getKSugerido() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error al calcular el factor K sugerido.',
    };
  }
}

/**
 * Aplica el K nuevo. Reescala los precios sugeridos del catálogo de acá en
 * adelante, así que el llamador pide confirmación antes.
 *
 * `updateTag` y no `revalidateTag`: es el caso de read-your-own-writes de los
 * docs de Next 16 — quien acaba de aplicar el K tiene que ver el valor nuevo,
 * no el anterior servido stale mientras se refresca de fondo. El tag alcanza
 * también al widget de brecha del dashboard, que lee el mismo endpoint.
 */
export async function aplicarKAction(kNuevo: number): Promise<ActionResult<KAplicado>> {
  try {
    const data = await aplicarK(kNuevo);

    updateTag(PRICING_TAG);
    revalidatePath('/configuracion/motor-de-precios');

    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'No se pudo aplicar el factor K.',
    };
  }
}
