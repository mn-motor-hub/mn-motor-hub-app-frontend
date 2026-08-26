import { BASE_URL, apiFetch } from './client';
import type {
  ApiItemResponse,
  ApiListResponse,
  PaginationMeta,
  Sale,
  SaleEstado,
  TasaEfectivaPreview,
} from '@/types';

export interface CreateSalePayload {
  clienteNombre: string;
  clienteDocumento: string;
  clienteTelefono?: string;
  createdBy: string;
  formaPago: 'usd' | 'bs';
  montoEnFormaPago: number;
  items: { autoPartId: number; cantidad: number }[];
}

export async function getSales(params?: {
  fechaDesde?: string;
  fechaHasta?: string;
  cliente?: string;
  estado?: SaleEstado;
  page?: number;
  limit?: number;
}): Promise<{ data: Sale[]; meta: PaginationMeta }> {
  const url = new URL(`${BASE_URL}/api/sales`);
  if (params?.fechaDesde) url.searchParams.set('fechaDesde', params.fechaDesde);
  if (params?.fechaHasta) url.searchParams.set('fechaHasta', params.fechaHasta);
  if (params?.cliente) url.searchParams.set('cliente', params.cliente);
  if (params?.estado) url.searchParams.set('estado', params.estado);
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.limit) url.searchParams.set('limit', String(params.limit));

  const res = await apiFetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error al obtener las ventas.');
  const body: ApiListResponse<Sale> = await res.json();
  return body;
}

export async function getSale(id: number): Promise<Sale> {
  const res = await apiFetch(`${BASE_URL}/api/sales/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) throw await saleError(res, `Error al obtener la venta #${id}.`);
  const body: ApiItemResponse<Sale> = await res.json();
  return body.data;
}

export async function createSale(data: CreateSalePayload): Promise<Sale> {
  const res = await apiFetch(`${BASE_URL}/api/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await saleError(res, 'Error al registrar la venta.');
  const body: ApiItemResponse<Sale> = await res.json();
  return body.data;
}

/** Borrado lógico. 409 si la venta ya estaba anulada — se propaga el mensaje del backend. */
export async function anularSale(id: number): Promise<Sale> {
  const res = await apiFetch(`${BASE_URL}/api/sales/${id}/anular`, { method: 'PATCH' });
  if (!res.ok) throw await saleError(res, `Error al anular la venta #${id}.`);
  const body: ApiItemResponse<Sale> = await res.json();
  return body.data;
}

/**
 * Transición en_proceso → confirmada (el usuario interno verificó el pago).
 * 409 si ya estaba confirmada o si está anulada — se propaga el mensaje del backend.
 */
export async function confirmarSale(id: number): Promise<Sale> {
  const res = await apiFetch(`${BASE_URL}/api/sales/${id}/confirmar`, { method: 'PATCH' });
  if (!res.ok) throw await saleError(res, `Error al confirmar la venta #${id}.`);
  const body: ApiItemResponse<Sale> = await res.json();
  return body.data;
}

/**
 * Preview de tasa para el formulario de carga (formaPago = 'bs'). Solo para
 * mostrar en pantalla: nunca se manda `tasaVentaEfectiva` de vuelta al POST,
 * el backend recalcula todo internamente al confirmar la venta.
 *
 * `no-store`: el usuario dispara esta llamada al elegir "bs" en el momento de
 * cobrar — mostrar un valor con hasta 5 minutos de desfasaje (como el resto de
 * las tasas, ver tasas.ts) no tiene sentido para una decisión de cobro puntual.
 */
export async function getTasaEfectiva(): Promise<TasaEfectivaPreview> {
  const res = await apiFetch(`${BASE_URL}/api/sales/tasa-efectiva`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener la tasa de cambio.');
  const body: ApiItemResponse<TasaEfectivaPreview> = await res.json();
  return body.data;
}

async function saleError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  if (res.status === 409) {
    return new Error(body?.message ?? 'La operación no es válida para el estado actual de la venta.');
  }
  if (res.status === 404) return new Error(body?.message ?? 'La venta no existe.');
  if (res.status === 400) return new Error(body?.message ?? 'Los datos de la venta no son válidos.');
  return new Error(body?.message ?? `${fallback} (HTTP ${res.status})`);
}
