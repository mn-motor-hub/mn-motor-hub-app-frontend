import { BASE_URL, apiFetch } from './client';
import type { Categoria } from '@/types';

interface GetCategoriasResponse { data: Categoria[] }
interface GetCategoriaResponse  { data: Categoria }

export async function getCategorias(): Promise<Categoria[]> {
  const res = await apiFetch(`${BASE_URL}/api/categorias`, { next: { revalidate: 300 } });
  if (!res.ok) throw await categoriaError(res, 'Error al obtener categorías.');
  const body: GetCategoriasResponse = await res.json();
  return body.data;
}

export async function getCategoria(id: string): Promise<Categoria> {
  const res = await apiFetch(`${BASE_URL}/api/categorias/${id}`, { next: { revalidate: 300 } });
  if (!res.ok) throw await categoriaError(res, `Error al obtener la categoría #${id}.`);
  const body: GetCategoriaResponse = await res.json();
  return body.data;
}

export async function createCategoria(nombre: string): Promise<Categoria> {
  const res = await apiFetch(`${BASE_URL}/api/categorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre }),
  });
  if (!res.ok) throw await categoriaError(res, 'Error al crear la categoría.');
  const body: GetCategoriaResponse = await res.json();
  return body.data;
}

export async function updateCategoria(
  id: string,
  data: { nombre?: string; activo?: boolean },
): Promise<Categoria> {
  const res = await apiFetch(`${BASE_URL}/api/categorias/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await categoriaError(res, `Error al actualizar la categoría #${id}.`);
  const body: GetCategoriaResponse = await res.json();
  return body.data;
}

async function categoriaError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  if (res.status === 404) return new Error(body?.message ?? 'La categoría no existe.');
  if (res.status === 409) return new Error(body?.message ?? 'Ya existe una categoría con ese nombre.');
  if (res.status === 400) return new Error(body?.message ?? 'Datos inválidos.');
  return new Error(body?.message ?? `${fallback} (HTTP ${res.status})`);
}
