'use client'; // estado de la petición en vuelo y del error

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { refreshTasasAction } from '@/app/(dashboard)/tasas/actions';
import styles from './RefreshTasasButton.module.css';

/**
 * Dispara el scrapeo en vivo. Solo desde este click: la pantalla se carga de la
 * base, que es instantáneo, y llamar al fetch en el montaje metería hasta 25 s
 * en el camino del usuario además de martillar al BCV desde una sola IP.
 *
 * El botón queda deshabilitado durante toda la operación —que puede llegar a
 * esos 25 s si una fuente está caída— para que no se acumulen scrapeos.
 */
export function RefreshTasasButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El refresh del Server Component también cuenta como "en curso": sin esto el
  // botón se rehabilita antes de que aparezcan los valores nuevos.
  const [isPending, startTransition] = useTransition();

  const inFlight = busy || isPending;

  async function handleClick() {
    setBusy(true);
    setError(null);

    const result = await refreshTasasAction();

    if (result.ok) {
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
    setBusy(false);
  }

  return (
    <div className={styles.wrapper}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        loading={inFlight}
        aria-label="Actualizar las tasas desde las fuentes ahora"
      >
        {!inFlight && <RefreshCw size={14} aria-hidden="true" />}
        {inFlight ? 'Consultando fuentes…' : 'Actualizar tasas ahora'}
      </Button>

      {inFlight && (
        <p className={styles.hint} role="status">
          Puede tardar hasta 25 s si una fuente no responde.
        </p>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
