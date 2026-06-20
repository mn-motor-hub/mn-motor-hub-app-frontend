import { BASE_URL } from './client';
import type { SupplierRef, ApiItemResponse } from '@/types';

interface GetSupplierRefsResponse { data: SupplierRef[] }

export async function getSupplierRefs(autoPartId: number): Promise<SupplierRef[]> {
  const url = new URL(`${BASE_URL}/api/supplier-refs`);
  url.searchParams.set('autoPartId', String(autoPartId));

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error al obtener referencias de proveedor');
  const body: GetSupplierRefsResponse = await res.json();
  return body.data;
}

export async function getAllSupplierRefs(): Promise<SupplierRef[]> {
  const res = await fetch(`${BASE_URL}/api/supplier-refs`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error al obtener referencias de proveedores');
  const body: GetSupplierRefsResponse = await res.json();
  return body.data;
}

export async function createSupplierRef(payload: {
  autoPartId: number;
  proveedor: string;
  referenciaProveedor?: string;
  precioCompra?: number;
  notas?: string;
}): Promise<SupplierRef> {
  const res = await fetch(`${BASE_URL}/api/supplier-refs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al crear referencia de proveedor');
  const body: ApiItemResponse<SupplierRef> = await res.json();
  return body.data;
}
