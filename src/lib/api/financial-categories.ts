import { BASE_URL } from './client';
import type { ApiItemResponse, ApiListResponse, FinancialCategory, FinancialType } from '@/types';

export async function getFinancialCategories(params?: {
  type?: FinancialType;
  active?: boolean;
}): Promise<FinancialCategory[]> {
  const url = new URL(`${BASE_URL}/api/financial-categories`);
  if (params?.type) url.searchParams.set('type', params.type);
  if (params?.active !== undefined) url.searchParams.set('active', String(params.active));

  // Catálogo casi-estático, mismo criterio que categorias.ts
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Error al obtener las categorías financieras.');
  const body: ApiListResponse<FinancialCategory> = await res.json();
  return body.data;
}

export async function createFinancialCategory(data: {
  name: string;
  type: FinancialType;
}): Promise<FinancialCategory> {
  const res = await fetch(`${BASE_URL}/api/financial-categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await categoryError(res, 'Error al crear la categoría financiera.');
  const body: ApiItemResponse<FinancialCategory> = await res.json();
  return body.data;
}

/**
 * `type` no es modificable: cambiarlo invalidaría los movimientos históricos ya
 * validados contra el tipo original. El backend responde 400 si viaja en el body.
 */
export async function updateFinancialCategory(
  id: number,
  data: { name?: string; active?: boolean },
): Promise<FinancialCategory> {
  const res = await fetch(`${BASE_URL}/api/financial-categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await categoryError(res, `Error al actualizar la categoría #${id}.`);
  const body: ApiItemResponse<FinancialCategory> = await res.json();
  return body.data;
}

/** Baja lógica — el backend marca `active: false` y responde 204. */
export async function deleteFinancialCategory(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/financial-categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw await categoryError(res, `Error al eliminar la categoría #${id}.`);
}

async function categoryError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  if (res.status === 404) return new Error(body?.message ?? 'La categoría no existe.');
  return new Error(body?.message ?? `${fallback} (HTTP ${res.status})`);
}
