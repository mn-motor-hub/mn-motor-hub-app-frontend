'use server';

import { revalidatePath } from 'next/cache';
import { updateConfiguracion } from '@/lib/api/configuraciones';
import type { ActionResult, Configuracion } from '@/types';

export async function updateConfiguracionAction(
  clave: string,
  valor: number,
): Promise<ActionResult<Configuracion>> {
  try {
    const data = await updateConfiguracion(clave, valor);
    revalidatePath('/configuracion');
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Error al actualizar la configuración.',
    };
  }
}
