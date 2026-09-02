import { BASE_URL, apiFetch } from './client';
import type {
  ApiItemResponse,
  ApiListResponse,
  PaginationMeta,
  Tasa,
  TasaFetchLog,
  TasaResultado,
  TasaSalud,
} from '@/types';

interface GetTasasResponse {
  data: Tasa[];
}

/**
 * El backend refresca por cron una vez al día a las 17:00 hora de Venezuela,
 * después de que el BCV publica, y solo reintenta cada hora mientras alguna
 * tasa siga fallando (ver tasas.scheduler.ts en el backend). Con esa cadencia
 * un revalidate de 5 minutos ya es más granular de lo que el dato puede cambiar.
 *
 * El tag existe para el único caso que sí puede adelantarse al cron: el botón
 * de "Actualizar tasas ahora" invalida esta entrada con revalidateTag para que
 * el widget del sidebar no siga mostrando el valor viejo hasta 5 minutos.
 */
export const TASAS_TAG = 'tasas';

export async function getTasas(): Promise<Tasa[]> {
  const res = await apiFetch(`${BASE_URL}/api/tasas`, {
    next: { revalidate: 300, tags: [TASAS_TAG] },
  });
  if (!res.ok) throw new Error('Error al obtener las tasas de cambio.');
  const body: GetTasasResponse = await res.json();
  return body.data;
}

/**
 * Panel de salud: una fila por tasa activa, ordenada por `orden`.
 *
 * `cache: 'no-store'` — excepción justificada al patrón de `revalidate` que
 * exige CLAUDE.md. La pregunta que responde este endpoint es "¿hace cuánto que
 * esto no se actualiza?"; servir una respuesta cacheada sería contradictorio
 * con su propósito: mostraría una tasa como al día cuando ya no lo está.
 * Mismo criterio que financial-movements.ts.
 */
export async function getTasasSalud(): Promise<TasaSalud[]> {
  const res = await apiFetch(`${BASE_URL}/api/tasas/salud`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener la salud de las tasas.');
  const body: ApiItemResponse<TasaSalud[]> = await res.json();
  return body.data;
}

/**
 * Histórico paginado de intentos, más reciente primero.
 * `cache: 'no-store'` por el mismo motivo que getTasasSalud.
 */
export async function getTasasHistorial(params?: {
  clave?: string;
  resultado?: TasaResultado;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: TasaFetchLog[]; meta: PaginationMeta }> {
  const url = new URL(`${BASE_URL}/api/tasas/historial`);
  if (params?.clave) url.searchParams.set('clave', params.clave);
  if (params?.resultado) url.searchParams.set('resultado', params.resultado);
  if (params?.desde) url.searchParams.set('desde', params.desde);
  if (params?.hasta) url.searchParams.set('hasta', params.hasta);
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.limit) url.searchParams.set('limit', String(params.limit));

  const res = await apiFetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener el historial de tasas.');
  const body: ApiListResponse<TasaFetchLog> = await res.json();
  return body;
}

/**
 * Refresca las tasas contra las fuentes en vivo (BCV y Binance) y devuelve el
 * estado ya actualizado, con el mismo shape que GET /api/tasas.
 *
 * OJO: tarda de 1 a 3 s con red normal y hasta 25 s si una fuente está caída
 * —ese es el timeout del backend—, además de pegarle al BCV desde una sola IP.
 * Va únicamente detrás de una acción explícita del usuario. **Nunca en el
 * montaje de una pantalla ni en el render de un Server Component**: la pantalla
 * lee de la base, que es instantáneo. Scrapear en cada carga mete 25 s en el
 * camino del usuario y es la mejor forma de que el BCV nos bloquee.
 */
export async function fetchTasasOnline(): Promise<Tasa[]> {
  const res = await apiFetch(`${BASE_URL}/api/tasas/fetch`, { method: 'POST' });
  if (!res.ok) throw new Error('No se pudieron actualizar las tasas desde las fuentes.');
  const body: GetTasasResponse = await res.json();
  return body.data;
}
