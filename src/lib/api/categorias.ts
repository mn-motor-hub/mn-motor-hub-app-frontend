import { BASE_URL } from './client';
import type { Categoria } from '@/types';

interface GetCategoriasResponse { data: Categoria[] }
interface GetCategoriaResponse  { data: Categoria }

export async function getCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${BASE_URL}/api/categorias`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Error al obtener categorías');
  const body: GetCategoriasResponse = await res.json();
  return body.data;
}

export async function getCategoria(id: number): Promise<Categoria> {
  const res = await fetch(`${BASE_URL}/api/categorias/${id}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Error al obtener categoría #${id}`);
  const body: GetCategoriaResponse = await res.json();
  return body.data;
}
