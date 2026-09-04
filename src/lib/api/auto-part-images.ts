import { BASE_URL, apiFetch } from './client';
import type { AutoPartImage } from '@/types';

function base(autoPartId: number): string {
  return `${BASE_URL}/api/auto-parts/${autoPartId}/images`;
}

async function mensajeDeError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
}

/**
 * Listado completo, incluidas las inactivas: el panel las necesita para poder
 * reactivarlas.
 *
 * `no-store` y no `revalidate`: cada `masterUrl` es una URL firmada que expira
 * a los 300 s. Cachear la respuesta serviría links muertos apenas pase ese
 * rato, y el usuario vería miniaturas rotas sin entender por qué.
 */
export async function getAutoPartImages(autoPartId: number): Promise<AutoPartImage[]> {
  const res = await apiFetch(base(autoPartId), { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(await mensajeDeError(res, `Error al obtener las imágenes (${res.status}).`));
  }

  const json = (await res.json()) as { data: AutoPartImage[] };
  return json.data;
}

/**
 * Sube una imagen nueva. El backend genera el derivado con marca de agua de
 * forma síncrona, así que la request puede tardar varios segundos.
 */
export async function uploadAutoPartImage(
  autoPartId: number,
  archivo: File,
  flags: { destinoCatalogo?: boolean; destinoMercadoLibre?: boolean; esPrincipal?: boolean } = {},
): Promise<AutoPartImage> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  for (const [clave, valor] of Object.entries(flags)) {
    if (valor !== undefined) formData.append(clave, String(valor));
  }

  // Sin Content-Type: el runtime lo setea con el boundary correcto.
  const res = await apiFetch(base(autoPartId), { method: 'POST', body: formData });

  if (!res.ok) {
    throw new Error(await mensajeDeError(res, `Error al subir la imagen (${res.status}).`));
  }

  const json = (await res.json()) as { data: AutoPartImage };
  return json.data;
}

/** Pisa el master existente. Irreversible — confirmar antes de llamar. */
export async function replaceAutoPartImage(
  autoPartId: number,
  imageId: number,
  archivo: File,
): Promise<AutoPartImage> {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const res = await apiFetch(`${base(autoPartId)}/${imageId}`, {
    method: 'PUT',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await mensajeDeError(res, `Error al reemplazar la imagen (${res.status}).`));
  }

  const json = (await res.json()) as { data: AutoPartImage };
  return json.data;
}

export interface AutoPartImagePatch {
  activo?: boolean;
  destinoCatalogo?: boolean;
  destinoMercadoLibre?: boolean;
  esPrincipal?: boolean;
  orden?: number;
}

export async function patchAutoPartImage(
  autoPartId: number,
  imageId: number,
  cambios: AutoPartImagePatch,
): Promise<AutoPartImage> {
  const res = await apiFetch(`${base(autoPartId)}/${imageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios),
  });

  if (!res.ok) {
    throw new Error(await mensajeDeError(res, `Error al actualizar la imagen (${res.status}).`));
  }

  const json = (await res.json()) as { data: AutoPartImage };
  return json.data;
}

/**
 * Reordena en una sola operación. `ids` tiene que traer TODAS las imágenes del
 * repuesto, ya ordenadas — el backend rechaza una lista parcial.
 */
export async function reorderAutoPartImages(
  autoPartId: number,
  ids: number[],
): Promise<AutoPartImage[]> {
  const res = await apiFetch(`${base(autoPartId)}/orden`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    throw new Error(await mensajeDeError(res, `Error al reordenar las imágenes (${res.status}).`));
  }

  const json = (await res.json()) as { data: AutoPartImage[] };
  return json.data;
}

/** Baja lógica: se puede revertir con el toggle de activo. */
export async function deleteAutoPartImage(
  autoPartId: number,
  imageId: number,
): Promise<AutoPartImage> {
  const res = await apiFetch(`${base(autoPartId)}/${imageId}`, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(await mensajeDeError(res, `Error al eliminar la imagen (${res.status}).`));
  }

  const json = (await res.json()) as { data: AutoPartImage };
  return json.data;
}
