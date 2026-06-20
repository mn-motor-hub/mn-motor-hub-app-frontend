'use server';

import { revalidatePath } from 'next/cache';
import { BASE_URL } from '@/lib/api/client';
import type { Categoria } from '@/types';

export async function createCategoriaAction(data: {
  nombre: string;
  prefijo: string;
}): Promise<Categoria> {
  const res = await fetch(`${BASE_URL}/api/categorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    if (res.status === 409)
      throw new Error('Ya existe una categoría con ese nombre o prefijo.');
    if (res.status === 400)
      throw new Error('Datos inválidos. Verificá que el prefijo tenga exactamente 3 caracteres en mayúsculas.');
    throw new Error(`Error inesperado al crear la categoría (HTTP ${res.status}).`);
  }

  const body = await res.json();
  revalidatePath('/categorias');
  return body.data ?? body;
}
