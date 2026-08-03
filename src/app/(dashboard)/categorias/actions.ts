'use server';

import { revalidatePath } from 'next/cache';
import { createCategoria, updateCategoria } from '@/lib/api/categorias';
import { createSubcategoria } from '@/lib/api/subcategorias';
import type { ActionResult, Categoria, Subcategoria } from '@/types';

export async function createCategoriaAction(nombre: string): Promise<ActionResult<Categoria>> {
  try {
    const data = await createCategoria(nombre);
    revalidatePath('/categorias');
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al crear la categoría.') };
  }
}

export async function updateCategoriaAction(
  id: string,
  data: { nombre?: string; activo?: boolean },
): Promise<ActionResult<Categoria>> {
  try {
    const categoria = await updateCategoria(id, data);
    revalidatePath('/categorias');
    revalidatePath(`/categorias/${id}`);
    return { ok: true, data: categoria };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al actualizar la categoría.') };
  }
}

export async function createSubcategoriaAction(data: {
  nombre: string;
  categoriaId: string;
}): Promise<ActionResult<Subcategoria>> {
  try {
    const subcategoria = await createSubcategoria(data);
    revalidatePath('/categorias');
    revalidatePath('/categorias/subcategorias');
    revalidatePath(`/categorias/${data.categoriaId}`);
    return { ok: true, data: subcategoria };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al crear la subcategoría.') };
  }
}

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
