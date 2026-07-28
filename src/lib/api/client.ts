import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/** Nombre de la cookie de sesión. Único lugar donde se escribe este string. */
export const SESSION_COOKIE = 'mn_session';

/**
 * Header Authorization a partir de la cookie httpOnly.
 * Solo funciona en contexto de servidor (Server Component, Server Action o
 * Route Handler): `cookies()` no existe en el navegador. Por eso ningún
 * Client Component puede llamar a src/lib/api/ directamente.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Wrapper de fetch para todos los módulos de src/lib/api/.
 * Inyecta el Authorization y centraliza el 401: si el token venció o falta,
 * manda a /login en vez de dejar que cada módulo invente su propio manejo.
 *
 * OJO: el 401 se resuelve con redirect(), que funciona lanzando una excepción
 * NEXT_REDIRECT. Un `.catch()` aguas arriba se la traga y anula la
 * redirección — por eso los catch de las pages usan unstable_rethrow().
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(input, {
    ...init,
    headers: { ...authHeaders, ...((init.headers as Record<string, string>) ?? {}) },
  });

  if (res.status === 401) redirect('/login');

  return res;
}
