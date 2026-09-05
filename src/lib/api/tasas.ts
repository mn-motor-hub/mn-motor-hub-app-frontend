import { BASE_URL, apiFetch } from './client';
import type {
  ApiItemResponse,
  ApiListResponse,
  PaginationMeta,
  Tasa,
  TasaFetchFallo,
  TasaFetchLog,
  TasaFetchResult,
  TasaOrigen,
  TasaResultado,
  TasaSalud,
} from '@/types';

interface GetTasasResponse {
  data: Tasa[];
}

/**
 * El backend refresca por cron dos veces al día, 08:00 y 17:00 hora de
 * Venezuela. Son dos y no una porque el BCV publica DESPUÉS de las 17:00 la
 * tasa del próximo día bancario: con una sola corrida a esa hora se llegaba
 * temprano y se traía el valor que ya se tenía. Ante un fallo transitorio
 * reintenta con backoff (15m, 1h, 4h por default) y SOLO contra la fuente que
 * falló; ante uno determinista —certificados que el build no copió, parser
 * roto— no reintenta y marca la tasa para atención humana. En los dos casos el
 * ciclo sigue. Ver tasas.scheduler.ts y tasas.retry-policy.ts en el backend.
 *
 * Con esa cadencia un revalidate de 5 minutos ya es más granular de lo que el
 * dato puede cambiar.
 *
 * El tag existe para el único caso que sí puede adelantarse al cron: el botón
 * de "Actualizar tasas ahora" invalida esta entrada con updateTag para que el
 * widget del sidebar no siga mostrando el valor viejo hasta 5 minutos.
 */
export const TASAS_TAG = 'tasas';

/**
 * Traduce la respuesta de error del backend ({ error, status, message }) a un
 * Error con el texto que el backend eligió, cayendo al genérico si no vino.
 *
 * Existe porque /historial ahora responde 400 ante un filtro inválido y 404
 * ante una clave inexistente, con un mensaje que dice cuál es el problema.
 * Tragárselo y tirar "Error al obtener el historial" convierte un typo en la
 * URL en un fallo indistinguible de que el backend esté caído.
 *
 * Mismo patrón que configuracionError en configuraciones.ts.
 */
async function tasaError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  return new Error(body?.message ?? `${fallback} (HTTP ${res.status})`);
}

export async function getTasas(): Promise<Tasa[]> {
  const res = await apiFetch(`${BASE_URL}/api/tasas`, {
    next: { revalidate: 300, tags: [TASAS_TAG] },
  });
  if (!res.ok) throw await tasaError(res, 'Error al obtener las tasas de cambio.');
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
  if (!res.ok) throw await tasaError(res, 'Error al obtener la salud de las tasas.');
  const body: ApiItemResponse<TasaSalud[]> = await res.json();
  return body.data;
}

/**
 * Histórico paginado de intentos, más reciente primero.
 * `cache: 'no-store'` por el mismo motivo que getTasasSalud.
 *
 * OJO con los errores: un filtro que el backend no entiende es 400 y una clave
 * que no existe es 404 — ya no una lista vacía. Una lista vacía ahora significa
 * de verdad "no hay intentos con estos filtros", que es lo que la tabla dice.
 * Por eso el llamador tiene que tolerar el throw: los filtros vienen de la URL
 * y cualquiera puede escribir `?clave=typo` a mano.
 */
export async function getTasasHistorial(params?: {
  clave?: string;
  resultado?: TasaResultado;
  origen?: TasaOrigen;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: TasaFetchLog[]; meta: PaginationMeta }> {
  const url = new URL(`${BASE_URL}/api/tasas/historial`);
  if (params?.clave) url.searchParams.set('clave', params.clave);
  if (params?.resultado) url.searchParams.set('resultado', params.resultado);
  if (params?.origen) url.searchParams.set('origen', params.origen);
  if (params?.desde) url.searchParams.set('desde', params.desde);
  if (params?.hasta) url.searchParams.set('hasta', params.hasta);
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.limit) url.searchParams.set('limit', String(params.limit));

  const res = await apiFetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw await tasaError(res, 'Error al obtener el historial de tasas.');
  const body: ApiListResponse<TasaFetchLog> = await res.json();
  return body;
}

interface FetchTasasResponse {
  data: Tasa[];
  meta: { fallos: TasaFetchFallo[] };
}

/**
 * Refresca las tasas contra las fuentes en vivo (BCV y Binance).
 *
 * Devuelve el estado ya actualizado Y qué falló. Un 200 con `fallos` no vacío
 * es un éxito PARCIAL, no un error: que Binance esté caído no invalida el BCV
 * que sí se trajo. Por eso el backend responde 200 con `meta.fallos` en vez de
 * un status de error, y por eso acá los fallos se devuelven en vez de
 * descartarse — sin ellos el botón no puede decir qué fuente falló y el usuario
 * ve "actualizado" sobre una tasa que sigue vieja.
 *
 * OJO: tarda de 1 a 3 s con red normal y hasta 25 s si una fuente está caída
 * —ese es el timeout del backend—, además de pegarle al BCV desde una sola IP.
 * Va únicamente detrás de una acción explícita del usuario. **Nunca en el
 * montaje de una pantalla ni en el render de un Server Component**: la pantalla
 * lee de la base, que es instantáneo. Scrapear en cada carga mete 25 s en el
 * camino del usuario y es la mejor forma de que el BCV nos bloquee.
 */
export async function fetchTasasOnline(): Promise<TasaFetchResult> {
  const res = await apiFetch(`${BASE_URL}/api/tasas/fetch`, { method: 'POST' });
  if (!res.ok) {
    throw await tasaError(res, 'No se pudieron actualizar las tasas desde las fuentes.');
  }
  const body: FetchTasasResponse = await res.json();
  return { tasas: body.data, fallos: body.meta.fallos };
}
