'use server';

import { getTasas } from '@/lib/api/tasas';
import type { ActionResult, Tasa } from '@/types';

/**
 * El token vive en una cookie httpOnly que el Sidebar (Client Component, hace
 * polling con setInterval) no puede leer — mismo motivo que las acciones de
 * finanzas/actions.ts. No hace falta revalidatePath: es una lectura, no una
 * mutación.
 */
export async function getTasasAction(): Promise<ActionResult<Tasa[]>> {
  try {
    return { ok: true, data: await getTasas() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error al obtener las tasas de cambio.',
    };
  }
}
