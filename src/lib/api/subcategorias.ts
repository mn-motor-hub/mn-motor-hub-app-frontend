import { BASE_URL, apiFetch } from './client';
import type { Subcategoria } from '@/types';

interface GetSubcategoriasResponse { data: Subcategoria[] }
interface GetSubcategoriaResponse  { data: Subcategoria }

export async function listSubcategorias(params?: { categoriaId?: string }): Promise<Subcategoria[]> {
  const url = new URL(`${BASE_URL}/api/subcategorias`);
  if (params?.categoriaId) url.searchParams.set('categoriaId', params.categoriaId);

  const res = await apiFetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw await subcategoriaError(res, 'Error al obtener las subcategorías.');
  const body: GetSubcategoriasResponse = await res.json();
  return body.data;
}

export async function createSubcategoria(data: {
  nombre: string;
  categoriaId: string;
}): Promise<Subcategoria> {
  const res = await apiFetch(`${BASE_URL}/api/subcategorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await subcategoriaError(res, 'Error al crear la subcategoría.');
  const body: GetSubcategoriaResponse = await res.json();
  return body.data;
}

async function subcategoriaError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  if (res.status === 404) return new Error(body?.message ?? 'La categoría seleccionada no existe.');
  if (res.status === 409) return new Error(body?.message ?? 'Ya existe una subcategoría con ese código.');
  if (res.status === 400) return new Error(body?.message ?? 'Datos inválidos.');
  return new Error(body?.message ?? `${fallback} (HTTP ${res.status})`);
}
