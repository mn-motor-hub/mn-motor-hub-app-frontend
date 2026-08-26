import { BASE_URL, apiFetch } from './client';
import type { Configuracion } from '@/types';

interface GetConfiguracionesResponse { data: Configuracion[] }
interface GetConfiguracionResponse  { data: Configuracion }

export async function listConfiguraciones(): Promise<Configuracion[]> {
  const res = await apiFetch(`${BASE_URL}/api/configuraciones`, { next: { revalidate: 300 } });
  if (!res.ok) throw await configuracionError(res, 'Error al obtener las configuraciones.');
  const body: GetConfiguracionesResponse = await res.json();
  return body.data;
}

export async function getConfiguracion(clave: string): Promise<Configuracion> {
  const res = await apiFetch(`${BASE_URL}/api/configuraciones/${clave}`, { next: { revalidate: 300 } });
  if (!res.ok) throw await configuracionError(res, `Error al obtener la configuración "${clave}".`);
  const body: GetConfiguracionResponse = await res.json();
  return body.data;
}

/**
 * `valor` llega como number desde el form (input numérico, validado con rangos),
 * pero la columna en el backend es varchar — el PUT rechaza con 400 si se manda
 * un number crudo ("valor debe ser string"). La conversión se hace acá, no en
 * el form, para que el resto del módulo siga trabajando con un número.
 */
export async function updateConfiguracion(clave: string, valor: number): Promise<Configuracion> {
  const res = await apiFetch(`${BASE_URL}/api/configuraciones/${clave}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valor: String(valor) }),
  });
  if (!res.ok) throw await configuracionError(res, `Error al actualizar la configuración "${clave}".`);
  const body: GetConfiguracionResponse = await res.json();
  return body.data;
}

async function configuracionError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  if (res.status === 404) return new Error(body?.message ?? 'La configuración no existe.');
  if (res.status === 400) return new Error(body?.message ?? 'Valor inválido.');
  return new Error(body?.message ?? `${fallback} (HTTP ${res.status})`);
}
