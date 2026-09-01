'use server';

import { getBrechaStatus } from '@/lib/api/pricing';
import type { ActionResult, BrechaStatus } from '@/types';

/**
 * El token vive en una cookie httpOnly que BrechaStatusWidget (Client
 * Component, hace polling con setInterval) no puede leer — mismo motivo que
 * Sidebar/actions.ts. No hace falta revalidatePath: es una lectura, no una
 * mutación.
 */
export async function getBrechaStatusAction(): Promise<ActionResult<BrechaStatus>> {
  try {
    return { ok: true, data: await getBrechaStatus() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error al obtener el estado de la brecha cambiaria.',
    };
  }
}
