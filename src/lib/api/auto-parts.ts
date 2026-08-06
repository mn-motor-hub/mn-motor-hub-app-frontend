import { BASE_URL, apiFetch } from './client';
import type { AutoPart, ApiListResponse, ApiItemResponse, PaginationMeta } from '@/types';

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
