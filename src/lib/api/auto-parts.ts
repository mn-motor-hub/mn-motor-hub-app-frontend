import { BASE_URL } from './client';
import type { AutoPart, ApiListResponse, ApiItemResponse, PaginationMeta } from '@/types';

export async function getAutoParts(params?: {
  page?: number;
  limit?: number;
  categoriaId?: number;
  marca?: string;
  stockBajo?: boolean;
}): Promise<{ data: AutoPart[]; meta: PaginationMeta }> {
  const url = new URL(`${BASE_URL}/api/auto-parts`);
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.categoriaId) url.searchParams.set('categoriaId', String(params.categoriaId));
  if (params?.marca) url.searchParams.set('marca', params.marca);
  if (params?.stockBajo) url.searchParams.set('stockBajo', 'true');

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error al obtener repuestos');
  const body: ApiListResponse<AutoPart> = await res.json();
  return body;
}

export async function getAutoPart(id: number): Promise<AutoPart> {
  const res = await fetch(`${BASE_URL}/api/auto-parts/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Error al obtener repuesto #${id}`);
  const body: ApiItemResponse<AutoPart> = await res.json();
  return body.data;
}
