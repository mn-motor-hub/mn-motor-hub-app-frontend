'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { TASAS_TAG, fetchTasasOnline } from '@/lib/api/tasas';
import type { ActionResult, TasaFetchResult } from '@/types';

/**
 * Refresco manual de las tasas contra las fuentes en vivo.
 *
 * Existe como Server Action porque el token vive en una cookie httpOnly que el
 * botón —Client Component— no puede leer, mismo motivo que finanzas/actions.ts.
 *
 * Es la ÚNICA vía por la que se dispara POST /api/tasas/fetch: nace siempre de
 * un click, nunca de un montaje ni de un render. El scrapeo tarda hasta 25 s si
 * una fuente está caída y sale de una sola IP contra el BCV.
 *
 * `ok: true` NO quiere decir que se actualizó todo: el backend responde 200 con
 * los fallos en `meta` porque 2 de 3 tasas actualizadas es trabajo hecho. Los
 * fallos viajan dentro de `data` para que el botón pueda decir cuál fuente se
 * cayó; tratarlos como éxito liso es dejar al usuario mirando "listo" sobre una
 * tasa que sigue vieja.
 */
export async function refreshTasasAction(): Promise<ActionResult<TasaFetchResult>> {
  try {
    const data = await fetchTasasOnline();

    // El POST ya escribió en la base: se invalida la pantalla y también la
    // entrada cacheada de GET /api/tasas que alimenta el widget del sidebar.
    //
    // updateTag y no revalidateTag: este es exactamente el caso de
    // read-your-own-writes que describen los docs de Next 16 — el usuario
    // apretó "actualizar ahora" y tiene que ver el valor nuevo, no el viejo
    // servido stale mientras se refresca de fondo.
    updateTag(TASAS_TAG);
    revalidatePath('/tasas');

    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudieron actualizar las tasas desde las fuentes.',
    };
  }
}
