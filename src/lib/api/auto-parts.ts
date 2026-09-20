import { BASE_URL, apiFetch } from './client';
import type {
  AutoPart,
  ApiListResponse,
  ApiItemResponse,
  PaginationMeta,
  PrecioSugerido,
  ReprecioMasivoPreviewItem,
  ReprecioMasivoResultado,
} from '@/types';

export async function getAutoParts(params?: {
  page?: number;
  limit?: number;
  // Único filtro de categorización que el backend soporta hoy (igualdad
  // simple sobre auto_parts.subcategoria_id) — no hay categoriaId ni lista.
  subcategoriaId?: string;
  // OR-ILIKE contra nombre, descripción, código interno, categoría y subcategoría.
  q?: string;
  stockBajo?: boolean;
}): Promise<{ data: AutoPart[]; meta: PaginationMeta }> {
  const url = new URL(`${BASE_URL}/api/auto-parts`);
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.subcategoriaId) url.searchParams.set('subcategoriaId', params.subcategoriaId);
  if (params?.q) url.searchParams.set('q', params.q);
  if (params?.stockBajo) url.searchParams.set('stockBajo', 'true');

  const res = await apiFetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error al obtener repuestos');
  const body: ApiListResponse<AutoPart> = await res.json();
  return body;
}

export async function getAutoPart(id: number): Promise<AutoPart> {
  const res = await apiFetch(`${BASE_URL}/api/auto-parts/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Error al obtener repuesto #${id}`);
  const body: ApiItemResponse<AutoPart> = await res.json();
  return body.data;
}

export async function updateAutoPart(
  id: number,
  data: {
    nombre?: string;
    descripcion?: string;
    marca?: string;
    subcategoriaId?: string;
    precioVenta?: number;
  },
): Promise<AutoPart> {
  const res = await apiFetch(`${BASE_URL}/api/auto-parts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await autoPartError(res, `Error al actualizar el repuesto #${id}.`);
  const body: ApiItemResponse<AutoPart> = await res.json();
  return body.data;
}

/**
 * El usuario dispara esta llamada al abrir el modal de edición — `no-store`
 * mismo criterio que getTasaEfectiva: el costo/margen/K pueden haber
 * cambiado desde el último revalidate y es una decisión puntual de edición.
 */
export async function getPrecioSugerido(id: number): Promise<PrecioSugerido> {
  const res = await apiFetch(`${BASE_URL}/api/auto-parts/${id}/precio-sugerido`, {
    cache: 'no-store',
  });
  if (!res.ok) throw await autoPartError(res, `Error al obtener el precio sugerido del repuesto #${id}.`);
  const body: ApiItemResponse<PrecioSugerido> = await res.json();
  return body.data;
}

async function autoPartError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  if (res.status === 404) return new Error(body?.message ?? 'El repuesto no existe.');
  if (res.status === 400) return new Error(body?.message ?? 'Datos inválidos.');
  return new Error(body?.message ?? `${fallback} (HTTP ${res.status})`);
}

interface GetReprecioMasivoPreviewResponse { data: ReprecioMasivoPreviewItem[] }
interface AplicarReprecioMasivoResponse { data: ReprecioMasivoResultado }

/**
 * Sin paginar (catálogo elegible hoy: 43 filas) — ya viene filtrado por el
 * backend contra `reprecio_masivo_umbral_pct`. Una lista vacía es una
 * respuesta válida: nadie supera el umbral hoy.
 *
 * `no-store`: precede una escritura financiera masiva — mismo criterio que
 * `getPrecioSugerido` y `getKSugerido`. El usuario decide sobre el estado de
 * ahora, no sobre un catálogo cacheado hasta 60s atrás.
 */
export async function getReprecioMasivoPreview(): Promise<ReprecioMasivoPreviewItem[]> {
  const res = await apiFetch(`${BASE_URL}/api/auto-parts/reprecio-masivo/preview`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Error al obtener la vista previa del repricing masivo.');
  const body: GetReprecioMasivoPreviewResponse = await res.json();
  return body.data;
}

/**
 * Aplica el precio sugerido a los repuestos elegidos. El backend recalcula la
 * desviación de nuevo al aplicar: un id que en la preview superaba el umbral
 * puede volver en `omitidos` si otro cambio lo tocó entretanto — no es un
 * error, es el camino esperado.
 */
export async function aplicarReprecioMasivo(ids: number[]): Promise<ReprecioMasivoResultado> {
  const res = await apiFetch(`${BASE_URL}/api/auto-parts/reprecio-masivo/aplicar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw await reprecioMasivoError(res);
  const body: AplicarReprecioMasivoResponse = await res.json();
  return body.data;
}

/** El 400 de esta ruta trae el motivo real (ids vacío, no enteros) — se propaga. */
async function reprecioMasivoError(res: Response): Promise<Error> {
  const fallback = 'No se pudo aplicar el repricing masivo.';
  try {
    const body: unknown = await res.json();
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message?: unknown }).message
        : null;
    return new Error(typeof message === 'string' && message ? message : fallback);
  } catch {
    return new Error(fallback);
  }
}
