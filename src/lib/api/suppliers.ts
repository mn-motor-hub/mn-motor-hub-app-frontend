import { BASE_URL } from './client';
import type { Supplier } from '@/types';

export async function getSuppliers(): Promise<Supplier[]> {
  const res = await fetch(`${BASE_URL}/api/suppliers`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener la lista de proveedores.');
  const body: { data: Supplier[] } = await res.json();
  return body.data;
}

export async function createSupplier(data: {
  nombre: string;
  rif?: string;
}): Promise<Supplier> {
  const res = await fetch(`${BASE_URL}/api/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear el proveedor.');
  const body: { data: Supplier } = await res.json();
  return body.data;
}
