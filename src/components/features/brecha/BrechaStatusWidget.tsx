'use client'; // fetch periódico con setInterval — necesita efectos del navegador

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge, StatCard } from '@mn/design-system/ui';
import { getBrechaStatusAction } from '@/app/(dashboard)/actions';
import { formatDate } from '@/lib/utils/format';
import type { BrechaStatus } from '@/types';
import styles from './BrechaStatusWidget.module.css';

// El snapshot subyacente es diario (brecha.service.ts#snapshotDiario) — 30 min
// alcanza para que el widget no quede desactualizado en una sesión larga.
const REFRESH_MS = 30 * 60 * 1000;

export interface BrechaStatusWidgetProps {
  /** Fetch inicial resuelto en el Server Component de la page — evita el flash de carga. */
  initialStatus: BrechaStatus | null;
}

export function BrechaStatusWidget({ initialStatus }: BrechaStatusWidgetProps) {
  // Se conserva el último valor bueno en memoria: si un refresh falla, el
  // widget sigue mostrando el dato anterior en vez de romperse o vaciarse.
  const [status, setStatus] = useState<BrechaStatus | null>(initialStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getBrechaStatusAction();
      if (cancelled) return;
      if (result.ok) {
        setStatus(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    }

    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!status) {
    return (
      <section className={styles.widget}>
        <p className={styles.errorText} role="alert">
          {error ?? 'No se pudo cargar el estado de la brecha cambiaria.'}
        </p>
      </section>
    );
  }

  // brechaPct viene null por DOS motivos distintos y no se pueden colapsar: o
  // el scraper P2P no tenía valor, o la tasa BCV está vencida y el backend se
  // niega a calcular una brecha contra un dato viejo. Decir "Sin dato P2P"
  // cuando lo que pasa es lo segundo manda a revisar la fuente equivocada.
  const tasaVencida = status.tasaBcvStale;
  const sinDatoP2p = !tasaVencida && status.brechaPct == null;

  return (
    <section className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Brecha cambiaria (BCV vs P2P)</h2>
        {tasaVencida ? (
          <Badge variant="danger">
            <span className={styles.badgeContent}>
              <AlertTriangle size={12} aria-hidden="true" />
              Tasa BCV desactualizada
            </span>
          </Badge>
        ) : sinDatoP2p ? (
          <Badge variant="neutral">Sin dato P2P</Badge>
        ) : status.dentroDeBanda ? (
          <Badge variant="success">
            <span className={styles.badgeContent}>
              <CheckCircle2 size={12} aria-hidden="true" />
              Dentro de banda
            </span>
          </Badge>
        ) : (
          <Badge variant="warning">
            <span className={styles.badgeContent}>
              <AlertTriangle size={12} aria-hidden="true" />
              Fuera de banda
            </span>
          </Badge>
        )}
      </div>

      <div className={styles.stats}>
        <StatCard
          value={
            tasaVencida
              ? 'Tasa desactualizada'
              : sinDatoP2p
                ? 'Sin dato P2P'
                : `${status.brechaPct!.toFixed(2)}%`
          }
          label="Brecha actual"
          variant={tasaVencida ? 'danger' : undefined}
        />
        <StatCard value={`K = ${status.factorKConfigurado.toFixed(2)}`} label="Factor K configurado" />
        <StatCard value={`${status.bandaMin}% – ${status.bandaMax}%`} label="Banda objetivo" />
        {status.diasConsecutivosFueraDeBanda > 0 && (
          <StatCard
            value={status.diasConsecutivosFueraDeBanda}
            label="Días consecutivos fuera de banda"
            variant="danger"
          />
        )}
      </div>

      <p className={styles.proximaRevision}>
        Próxima revisión: <strong>{formatDate(status.proximaRevision)}</strong>
      </p>

      {error && (
        <p className={styles.errorText} role="alert">
          {error} — mostrando el último valor conocido.
        </p>
      )}
    </section>
  );
}
