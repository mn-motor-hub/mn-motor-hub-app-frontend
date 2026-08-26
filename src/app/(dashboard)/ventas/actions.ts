'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { getAutoParts } from '@/lib/api/auto-parts';
import { anularSale, createSale, getTasaEfectiva } from '@/lib/api/sales';
import { USER_NAME_COOKIE } from '@/lib/api/client';
import type { CreateSaleFormData } from '@/lib/schemas/sale.schema';
import type { ActionResult, AutoPart, Sale, TasaEfectivaPreview } from '@/types';

/**
 * Estas acciones existen porque el token vive en una cookie httpOnly: el
 * navegador no puede leerlo, así que ningún Client Component puede llamar a
 * src/lib/api/ directamente (mismo motivo que en finanzas/actions.ts).
 */

export async function createSaleAction(
  data: CreateSaleFormData,
): Promise<ActionResult<Sale>> {
  try {
    const createdBy = (await cookies()).get(USER_NAME_COOKIE)?.value;
    if (!createdBy) {
      return {
        ok: false,
        error: 'No se pudo identificar al usuario de la sesión. Volvé a iniciar sesión.',
      };
    }

    const sale = await createSale({
      clienteNombre: data.clienteNombre,
      clienteTelefono: data.clienteTelefono || undefined,
      createdBy,
      formaPago: data.formaPago,
      montoEnFormaPago: data.montoEnFormaPago,
      items: data.items.map((item) => ({
        autoPartId: item.autoPartId,
        cantidad: item.cantidad,
      })),
    });

    revalidatePath('/ventas');
    return { ok: true, data: sale };
  } catch (err) {
    // Si el token venció, apiFetch ya disparó redirect('/login') — eso es un throw
    // de control de flujo (NEXT_REDIRECT), no un error de negocio. Sin este rethrow
    // quedaba atrapado acá y se mostraba como si la venta hubiera fallado sin
    // ningún mensaje claro, en vez de mandar al usuario a loguearse de nuevo.
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al registrar la venta.') };
  }
}

export async function anularSaleAction(id: number): Promise<ActionResult<Sale>> {
  try {
    const sale = await anularSale(id);
    revalidatePath('/ventas');
    revalidatePath(`/ventas/${id}`);
    return { ok: true, data: sale };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al anular la venta.') };
  }
}

export async function getTasaEfectivaAction(): Promise<ActionResult<TasaEfectivaPreview>> {
  try {
    return { ok: true, data: await getTasaEfectiva() };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al obtener la tasa de cambio.') };
  }
}

/** Buscador de auto_parts para el formulario de venta — typeahead acotado a 8 resultados. */
export async function searchAutoPartsAction(q: string): Promise<ActionResult<AutoPart[]>> {
  try {
    if (!q.trim()) return { ok: true, data: [] };
    const result = await getAutoParts({ q, limit: 8 });
    return { ok: true, data: result.data };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al buscar repuestos.') };
  }
}

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
