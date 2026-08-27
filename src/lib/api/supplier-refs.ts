import { BASE_URL, apiFetch } from './client';
import type { SupplierRef, ApiItemResponse } from '@/types';

interface GetSupplierRefsResponse { data: SupplierRef[] }

export async function getSupplierRefs(autoPartId: number): Promise<SupplierRef[]> {
  const url = new URL(`${BASE_URL}/api/supplier-refs`);
  url.searchParams.set('autoPartId', String(autoPartId));

  const res = await apiFetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error al obtener referencias de proveedor');
  const body: GetSupplierRefsResponse = await res.json();
  return body.data;
}

export async function getAllSupplierRefs(): Promise<SupplierRef[]> {
  const res = await apiFetch(`${BASE_URL}/api/supplier-refs`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error al obtener referencias de proveedores');
  const body: GetSupplierRefsResponse = await res.json();
  return body.data;
}

export async function createSupplierRef(payload: {
  autoPartId: number;
  supplierId: number;
  referenciaProveedor?: string;
  precioCompra?: number;
  notas?: string;
}): Promise<SupplierRef> {
  const res = await apiFetch(`${BASE_URL}/api/supplier-refs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await supplierRefError(res, 'Error al crear referencia de proveedor');
  const body: ApiItemResponse<SupplierRef> = await res.json();
  return body.data;
}

export async function updateSupplierRef(
  id: number,
  data: { supplierId?: number; referenciaProveedor?: string; precioCompra?: number; notas?: string },
): Promise<SupplierRef> {
  const res = await apiFetch(`${BASE_URL}/api/supplier-refs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await supplierRefError(res, `Error al actualizar la referencia #${id}.`);
  const body: ApiItemResponse<SupplierRef> = await res.json();
  return body.data;
}

async function supplierRefError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  if (res.status === 404) return new Error(body?.message ?? 'La referencia de proveedor no existe.');
  if (res.status === 400) return new Error(body?.message ?? 'Datos inválidos.');
  return new Error(body?.message ?? `${fallback} (HTTP ${res.status})`);
}
