import { BASE_URL, apiFetch } from './client';
import type { BrechaHistoricoPoint, BrechaStatus } from '@/types';

interface GetBrechaStatusResponse { data: BrechaStatus }
interface GetBrechaHistoricoResponse { data: BrechaHistoricoPoint[] }

/**
 * El widget del dashboard hace polling cada 30 min (BrechaStatusWidget) — el
 * snapshot subyacente es diario (pricing/brecha.service.ts#snapshotDiario),
 * así que este revalidate solo evita pegarle al backend más seguido de lo
 * que el dato puede cambiar.
 */
export async function getBrechaStatus(): Promise<BrechaStatus> {
  const res = await apiFetch(`${BASE_URL}/api/pricing/brecha-status`, {
    next: { revalidate: 1800 },
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

  const res = await apiFetch(url.toString(), { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error('Error al obtener el histórico de brecha cambiaria.');
  const body: GetBrechaHistoricoResponse = await res.json();
  return body.data;
}
