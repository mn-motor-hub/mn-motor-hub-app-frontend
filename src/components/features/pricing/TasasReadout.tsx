import Link from 'next/link';
import { formatBs, formatDateTime, formatTimeAgo } from '@/lib/utils/format';
import type { TasaSalud } from '@/types';
import styles from './TasasReadout.module.css';

interface TasasReadoutProps {
  salud: TasaSalud[];
}

/** Las dos tasas que entran en el cálculo de la brecha, en ese orden. */
const CLAVES = ['USD_BCV', 'BINANCE_USDT'] as const;

export function TasasReadout({ salud }: TasasReadoutProps) {
  const tasas = CLAVES.map((clave) => salud.find((t) => t.clave === clave)).filter(
    (t): t is TasaSalud => t != null,
  );

  if (tasas.length === 0) {
    return (
      <p className={styles.empty}>
        No se pudo obtener el estado de las tasas.{' '}
        <Link href="/tasas">Ver la pantalla de tasas</Link>
      </p>
    );
  }

  return (
    <section className={styles.readout} aria-label="Tasas del día">
      {tasas.map((tasa) => (
        <div key={tasa.clave} className={styles.item}>
          <span className={styles.label}>{tasa.label}</span>
          <span className={`${styles.value} ${tasa.stale ? styles.valueStale : ''}`}>
            {tasa.valorEfectivo != null ? formatBs(tasa.valorEfectivo) : 'Sin valor'}
          </span>
          {/*
            La hora que importa es la del último ÉXITO, no la del último intento:
            una tasa que se intentó hace 5 minutos y falló sigue siendo tan vieja
            como su último fetch bueno.
          */}
          {tasa.ultimoExito ? (
            <span className={styles.timestamp}>
              <span className={styles.relative}>{formatTimeAgo(tasa.ultimoExito)}</span>
              <span className={styles.absolute}>{formatDateTime(tasa.ultimoExito)}</span>
            </span>
          ) : (
            <span className={styles.timestamp}>
              <span className={styles.relative}>Nunca se actualizó</span>
            </span>
          )}
          {tasa.stale && <span className={styles.staleTag}>Desactualizada</span>}
        </div>
      ))}
    </section>
  );
}
