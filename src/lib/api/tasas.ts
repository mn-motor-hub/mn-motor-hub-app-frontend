import { BASE_URL, apiFetch } from './client';
import type { Tasa } from '@/types';

interface GetTasasResponse { data: Tasa[] }

/**
 * El backend refresca estos valores por cron cada 1 hora (ver
 * tasas.service.ts#fetchOnline en el backend), así que un revalidate de
 * 5 minutos ya es más granular de lo que el dato puede cambiar.
 */
export async function getTasas(): Promise<Tasa[]> {
  const res = await apiFetch(`${BASE_URL}/api/tasas`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Error al obtener las tasas de cambio.');
  const body: GetTasasResponse = await res.json();
  return body.data;
}
