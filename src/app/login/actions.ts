'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BASE_URL, SESSION_COOKIE, USER_NAME_COOKIE } from '@/lib/api/client';

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

export interface LoginState {
  error: string | null;
}

/**
 * Autentica contra el backend y guarda el token en una cookie httpOnly.
 *
 * httpOnly: el JS del navegador no puede leerla, así que un XSS no se lleva el
 * token. La contrapartida es que ningún Client Component puede armar el header
 * Authorization por su cuenta — todo fetch al backend pasa por el servidor.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Ingresá tu email y contraseña.' };
  }

  let res: Response;
  try {
    // Sin apiFetch: todavía no hay sesión que adjuntar, y un 401 acá es una
    // credencial inválida que se muestra en el form, no un motivo de redirect.
    res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'No se pudo conectar con el servidor. Intentá de nuevo.' };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    // El backend explica por qué falló mejor que cualquier texto genérico.
    return { error: body?.message ?? `No se pudo iniciar sesión (HTTP ${res.status}).` };
  }

  // El backend responde { token, user } en la raíz, sin envelope `data`
  // (verificado en auth.service.ts / auth.controller.ts). `user.name` es el
  // único dato de sesión legible que se persiste — lo necesita el módulo de
  // ventas como `createdBy` sin pedírselo de nuevo al usuario en el form.
  const body = (await res.json().catch(() => null)) as
    | { token?: string; user?: { name?: string } }
    | null;
  const token = body?.token;
  const userName = body?.user?.name;

  if (!token) {
    return { error: 'El servidor no devolvió un token de sesión.' };
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SEVEN_DAYS_IN_SECONDS,
    path: '/',
  };

  cookieStore.set(SESSION_COOKIE, token, cookieOptions);
  if (userName) cookieStore.set(USER_NAME_COOKIE, userName, cookieOptions);

  redirect('/inventario');
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(USER_NAME_COOKIE);
  redirect('/login');
}
