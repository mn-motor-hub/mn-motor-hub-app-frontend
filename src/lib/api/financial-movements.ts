import { BASE_URL } from './client';
import type {
  CreateFinancialMovementData,
  UpdateFinancialMovementData,
} from '@/lib/schemas/financial-movement.schema';
import type {
  ApiItemResponse,
  ApiListResponse,
  FinancialMovement,
  FinancialMovementStatus,
  FinancialSummary,
  FinancialType,
  PaginationMeta,
} from '@/types';

/**
 * Los GET de este archivo usan `cache: 'no-store'` — excepción justificada al
 * patrón de `revalidate` que exige CLAUDE.md, mismo criterio que suppliers.ts.
 *
 * Motivo: es un módulo de control financiero de bajo tráfico donde la exactitud
 * del dato en el momento importa más que la performance de cache. Alguien carga
 * un gasto y espera verlo reflejado de inmediato en el listado y en el resumen;
 * servir un total desactualizado en un balance es peor que el costo del fetch.
 */

export async function getFinancialMovements(params?: {
  type?: FinancialType;
  financialCategoryId?: number;
  status?: FinancialMovementStatus;
  dateFrom?: string;
  dateTo?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: FinancialMovement[]; meta: PaginationMeta }> {
  const url = new URL(`${BASE_URL}/api/financial-movements`);
  if (params?.type) url.searchParams.set('type', params.type);
  if (params?.financialCategoryId)
    url.searchParams.set('financialCategoryId', String(params.financialCategoryId));
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.dateFrom) url.searchParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) url.searchParams.set('dateTo', params.dateTo);
  if (params?.active !== undefined) url.searchParams.set('active', String(params.active));
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener los movimientos financieros.');
  const body: ApiListResponse<FinancialMovement> = await res.json();
  return body;
}

export async function getFinancialMovement(id: number): Promise<FinancialMovement> {
  const res = await fetch(`${BASE_URL}/api/financial-movements/${id}`, { cache: 'no-store' });
  if (!res.ok) throw await movementError(res, `Error al obtener el movimiento #${id}.`);
  const body: ApiItemResponse<FinancialMovement> = await res.json();
  return body.data;
}

/** El resumen del mes. Sin `month`/`year` el backend usa el mes en curso. */
export async function getFinancialSummary(params?: {
  month?: number;
  year?: number;
}): Promise<FinancialSummary> {
  const url = new URL(`${BASE_URL}/api/financial-movements/summary`);
  if (params?.month) url.searchParams.set('month', String(params.month));
  if (params?.year) url.searchParams.set('year', String(params.year));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw await movementError(res, 'Error al obtener el resumen financiero.');
  const body: ApiItemResponse<FinancialSummary> = await res.json();
  return body.data;
}

export async function createFinancialMovement(
  data: CreateFinancialMovementData,
): Promise<FinancialMovement> {
  const res = await fetch(`${BASE_URL}/api/financial-movements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await movementError(res, 'Error al registrar el movimiento.');
  const body: ApiItemResponse<FinancialMovement> = await res.json();
  return body.data;
}

export async function updateFinancialMovement(
  id: number,
  data: UpdateFinancialMovementData,
): Promise<FinancialMovement> {
  const res = await fetch(`${BASE_URL}/api/financial-movements/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await movementError(res, `Error al actualizar el movimiento #${id}.`);
  const body: ApiItemResponse<FinancialMovement> = await res.json();
  return body.data;
}

/** Baja lógica — el backend marca `active: false` y responde 204. */
export async function deleteFinancialMovement(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/financial-movements/${id}`, { method: 'DELETE' });
  if (!res.ok) throw await movementError(res, `Error al eliminar el movimiento #${id}.`);
}

/**
 * El backend devuelve 400 con mensaje explícito cuando el tipo del movimiento no
 * coincide con el de su categoría, o cuando la categoría está inactiva. Ese texto
 * es más útil que cualquier mensaje genérico, así que se propaga tal cual.
 */
async function movementError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  if (res.status === 404) return new Error(body?.message ?? 'El movimiento no existe.');
  if (res.status === 400) return new Error(body?.message ?? 'Los datos del movimiento no son válidos.');
  return new Error(body?.message ?? `${fallback} (HTTP ${res.status})`);
}
