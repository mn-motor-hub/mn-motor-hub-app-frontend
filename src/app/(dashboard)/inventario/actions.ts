'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { getPrecioSugerido, updateAutoPart } from '@/lib/api/auto-parts';
import {
  deleteAutoPartImage,
  getAutoPartImages,
  patchAutoPartImage,
  replaceAutoPartImage,
  reorderAutoPartImages,
  uploadAutoPartImage,
  type AutoPartImagePatch,
} from '@/lib/api/auto-part-images';
import { updateSupplierRef } from '@/lib/api/supplier-refs';
import type { ActionResult, AutoPart, AutoPartImage, PrecioSugerido, SupplierRef } from '@/types';

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

export async function getPrecioSugeridoAction(id: number): Promise<ActionResult<PrecioSugerido>> {
  try {
    return { ok: true, data: await getPrecioSugerido(id) };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al obtener el precio sugerido.') };
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

// ─── Imágenes ─────────────────────────────────────────────────
//
// Todas revalidan la ficha del repuesto además de devolver el dato: el listado
// se dibuja en el Server Component, y el cliente hace router.refresh() para
// volver a pedirlo con URLs firmadas nuevas.

export async function listAutoPartImagesAction(
  autoPartId: number,
): Promise<ActionResult<AutoPartImage[]>> {
  try {
    return { ok: true, data: await getAutoPartImages(autoPartId) };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al obtener las imágenes.') };
  }
}

/**
 * El File cruza el límite cliente→servidor como argumento: React lo serializa,
 * así que no hace falta degradar los flags a campos de texto de un FormData.
 */
export async function uploadAutoPartImageAction(
  autoPartId: number,
  archivo: File,
  flags?: { destinoCatalogo?: boolean; destinoMercadoLibre?: boolean; esPrincipal?: boolean },
): Promise<ActionResult<AutoPartImage>> {
  try {
    const imagen = await uploadAutoPartImage(autoPartId, archivo, flags ?? {});
    revalidatePath(`/inventario/${autoPartId}`);
    return { ok: true, data: imagen };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al subir la imagen.') };
  }
}

export async function replaceAutoPartImageAction(
  autoPartId: number,
  imageId: number,
  archivo: File,
): Promise<ActionResult<AutoPartImage>> {
  try {
    const imagen = await replaceAutoPartImage(autoPartId, imageId, archivo);
    revalidatePath(`/inventario/${autoPartId}`);
    return { ok: true, data: imagen };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al reemplazar la imagen.') };
  }
}

export async function patchAutoPartImageAction(
  autoPartId: number,
  imageId: number,
  cambios: AutoPartImagePatch,
): Promise<ActionResult<AutoPartImage>> {
  try {
    const imagen = await patchAutoPartImage(autoPartId, imageId, cambios);
    revalidatePath(`/inventario/${autoPartId}`);
    return { ok: true, data: imagen };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al actualizar la imagen.') };
  }
}

export async function reorderAutoPartImagesAction(
  autoPartId: number,
  ids: number[],
): Promise<ActionResult<AutoPartImage[]>> {
  try {
    const imagenes = await reorderAutoPartImages(autoPartId, ids);
    revalidatePath(`/inventario/${autoPartId}`);
    return { ok: true, data: imagenes };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al reordenar las imágenes.') };
  }
}

export async function deleteAutoPartImageAction(
  autoPartId: number,
  imageId: number,
): Promise<ActionResult<AutoPartImage>> {
  try {
    const imagen = await deleteAutoPartImage(autoPartId, imageId);
    revalidatePath(`/inventario/${autoPartId}`);
    return { ok: true, data: imagen };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: message(err, 'Error al eliminar la imagen.') };
  }
}

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
