import { BASE_URL, apiFetch } from './client';
import type {
  BrechaHistoricoPoint,
  BrechaStatus,
  KAplicado,
  KSugerido,
} from '@/types';

interface GetBrechaStatusResponse { data: BrechaStatus }
interface GetBrechaHistoricoResponse { data: BrechaHistoricoPoint[] }
interface GetKSugeridoResponse { data: KSugerido }
interface AplicarKResponse { data: KAplicado }

/** Tag de las lecturas de pricing — se invalidan juntas al aplicar un K nuevo. */
export const PRICING_TAG = 'pricing';

/**
 * El widget del dashboard hace polling cada 30 min (BrechaStatusWidget) — el
 * snapshot subyacente es diario (pricing/brecha.service.ts#snapshotDiario),
 * así que este revalidate solo evita pegarle al backend más seguido de lo
 * que el dato puede cambiar.
 */
export async function getBrechaStatus(): Promise<BrechaStatus> {
  const res = await apiFetch(`${BASE_URL}/api/pricing/brecha-status`, {
    next: { revalidate: 1800, tags: [PRICING_TAG] },
  });
  if (!res.ok) throw new Error('Error al obtener el estado de la brecha cambiaria.');
  const body: GetBrechaStatusResponse = await res.json();
  return body.data;
}

/** Sin filtro de fechas, el backend devuelve los últimos 30 días (inclusive). */
export async function getBrechaHistorico(params?: {
  desde?: string;
  hasta?: string;
}): Promise<BrechaHistoricoPoint[]> {
  const url = new URL(`${BASE_URL}/api/pricing/brecha-historico`);
  if (params?.desde) url.searchParams.set('desde', params.desde);
  if (params?.hasta) url.searchParams.set('hasta', params.hasta);

  const res = await apiFetch(url.toString(), {
    next: { revalidate: 1800, tags: [PRICING_TAG] },
  });
  if (!res.ok) throw new Error('Error al obtener el histórico de brecha cambiaria.');
  const body: GetBrechaHistoricoResponse = await res.json();
  return body.data;
}

/**
 * Calcula el K sugerido a partir de la mediana de la brecha de los últimos días.
 *
 * `cache: 'no-store'` — excepción justificada al patrón de `revalidate`. Esto lo
 * dispara el botón "Calcular K sugerido": el usuario pide el número de ahora, y
 * servirle uno cacheado de hace media hora contradice la acción que ejecutó.
 *
 * Devolver `kSugerido: null` con `muestraSuficiente: false` NO es un error: es
 * la respuesta correcta mientras no haya historial suficiente, y el llamador
 * tiene que tratarla como un estado normal.
 */
export async function getKSugerido(): Promise<KSugerido> {
  const res = await apiFetch(`${BASE_URL}/api/pricing/k-sugerido`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al calcular el factor K sugerido.');
  const body: GetKSugeridoResponse = await res.json();
  return body.data;
}

/**
 * Aplica un factor K nuevo. `kNuevo` va con hasta 2 decimales; el rango válido
 * (1.00–2.00) lo valida el backend con el mismo validador que el PUT genérico
 * de configuraciones, así que no se duplica acá.
 *
 * Reescala todo el catálogo sugerido y no se deshace con un click: quien lo
 * llame tiene que pedir confirmación antes.
 */
export async function aplicarK(kNuevo: number): Promise<KAplicado> {
  const res = await apiFetch(`${BASE_URL}/api/pricing/aplicar-k`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kNuevo }),
  });
  if (!res.ok) throw await aplicarKError(res);
  const body: AplicarKResponse = await res.json();
  return body.data;
}

/**
 * El 400 de esta ruta trae el motivo real —fuera de rango, decimales de más—
 * y es accionable para el usuario. Se propaga en vez de tragarlo con un
 * mensaje genérico.
 */
async function aplicarKError(res: Response): Promise<Error> {
  const fallback = 'No se pudo aplicar el factor K.';
  try {
    const body: unknown = await res.json();
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message?: unknown }).message
        : null;
    return new Error(typeof message === 'string' && message ? message : fallback);
  } catch {
    return new Error(fallback);
  }
}
