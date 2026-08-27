'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { updateAutoPart } from '@/lib/api/auto-parts';
import { updateSupplierRef } from '@/lib/api/supplier-refs';
import type { ActionResult, AutoPart, SupplierRef } from '@/types';

export async function updateAutoPartAction(
  id: number,
  data: {
    nombre?: string;
    descripcion?: string;
    marca?: string;
    subcategoriaId?: string;
    precioVenta?: number;
  },
): Promise<ActionResult<AutoPart>> {
  try {
    const part = await updateAutoPart(id, data);
    revalidatePath('/inventario');
    revalidatePath(`/inventario/${id}`);
    return { ok: true, data: part };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al actualizar el repuesto.') };
  }
}

export async function updateSupplierRefAction(
  autoPartId: number,
  refId: number,
  data: { referenciaProveedor?: string; precioCompra?: number; notas?: string },
): Promise<ActionResult<SupplierRef>> {
  try {
    const ref = await updateSupplierRef(refId, data);
    revalidatePath(`/inventario/${autoPartId}`);
    return { ok: true, data: ref };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al actualizar la referencia de proveedor.') };
  }
}

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
