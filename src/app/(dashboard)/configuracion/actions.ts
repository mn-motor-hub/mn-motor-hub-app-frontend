'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { updateConfiguracion } from '@/lib/api/configuraciones';
import { PRICING_TAG } from '@/lib/api/pricing';
import type { ActionResult, Configuracion } from '@/types';

export async function updateConfiguracionAction(
  clave: string,
  valor: number,
): Promise<ActionResult<Configuracion>> {
  try {
    const data = await updateConfiguracion(clave, valor);

    revalidatePath('/configuracion');
    // Este editor también se usa desde los ajustes avanzados del motor de
    // precios, y varias de estas claves —K, banda min/max— alimentan
    // brecha-status, que está cacheado 30 min. Sin invalidar el tag, editar K
    // a mano dejaba el encabezado mostrando el valor anterior media hora.
    // Se invalida para cualquier clave: el costo es un refetch, y adivinar
    // cuáles son "de pricing" acá duplicaría esa lista en un segundo lugar.
    updateTag(PRICING_TAG);
    revalidatePath('/configuracion/motor-de-precios');

    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error al actualizar la configuración.',
    };
  }
}
