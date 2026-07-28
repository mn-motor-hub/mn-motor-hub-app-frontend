import { unstable_rethrow } from 'next/navigation';

/**
 * Devuelve `fallback` si la promesa falla, pero deja pasar los errores de
 * control de flujo de Next (redirect, notFound).
 *
 * Un `.catch(() => [])` común atraparía también el redirect a /login que
 * dispara apiFetch ante un 401: la página se renderizaría con datos vacíos en
 * vez de mandar al usuario a iniciar sesión. unstable_rethrow los reconoce y
 * los vuelve a lanzar.
 */
export async function withFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    unstable_rethrow(err);
    return fallback;
  }
}
