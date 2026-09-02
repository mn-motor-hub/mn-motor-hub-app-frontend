import { Badge } from '@/components/ui/Badge/Badge';
import { formatBs, formatDateTime, formatTimeAgo } from '@/lib/utils/format';
import type { TasaSalud } from '@/types';
import styles from './TasaSaludCard.module.css';

interface TasaSaludCardProps {
  salud: TasaSalud;
}

type Estado = {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
};

/**
 * El semáforo se calcula entero en el frontend a partir de los campos de
 * GET /api/tasas/salud — el backend no devuelve un "estado" y no hace falta
 * que lo haga.
 */
function estadoDe(salud: TasaSalud): Estado {
  // Una tasa manual no depende de un scraper: no tiene sentido decir que está
  // desactualizada ni que está fallando.
  if (salud.tipo === 'manual') return { label: 'Manual', variant: 'neutral' };
  if (salud.stale) return { label: 'Desactualizada', variant: 'danger' };
  if (salud.fallosConsecutivos > 0) return { label: 'Fallando', variant: 'warning' };
  return { label: 'Al día', variant: 'success' };
}

export function TasaSaludCard({ salud }: TasaSaludCardProps) {
  const estado = estadoDe(salud);

  return (
    <article
      className={`${styles.card} ${styles[estado.variant]}`}
      aria-label={`${salud.label}: ${estado.label}`}
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <h3 className={styles.label}>{salud.label}</h3>
          <span className={styles.clave}>{salud.clave}</span>
        </div>
        <Badge variant={estado.variant}>{estado.label}</Badge>
      </header>

      <p className={styles.valor}>
        {salud.valorEfectivo != null ? formatBs(salud.valorEfectivo) : 'Sin valor'}
      </p>

      {/*
        ultimoExito y ultimoIntento van siempre separados y nunca colapsados en
        un solo "última actualización": el job puede seguir intentando cada hora
        mientras el último éxito queda clavado días atrás, y con un solo campo
        ese problema es invisible. Es la razón de ser de esta pantalla.
      */}
      <dl className={styles.timestamps}>
        <div className={styles.timestamp}>
          <dt className={styles.timestampLabel}>Último éxito</dt>
          <dd className={styles.timestampValue}>
            {salud.ultimoExito ? (
              <>
                <span className={styles.relative}>{formatTimeAgo(salud.ultimoExito)}</span>
                <span className={styles.absolute}>{formatDateTime(salud.ultimoExito)}</span>
              </>
            ) : (
              <span className={styles.never}>Nunca</span>
            )}
          </dd>
        </div>

        <div className={styles.timestamp}>
          <dt className={styles.timestampLabel}>Último intento</dt>
          <dd className={styles.timestampValue}>
            {salud.ultimoIntento ? (
              <>
                <span className={styles.relative}>{formatTimeAgo(salud.ultimoIntento)}</span>
                <span className={styles.absolute}>{formatDateTime(salud.ultimoIntento)}</span>
              </>
            ) : (
              <span className={styles.never}>Nunca</span>
            )}
          </dd>
        </div>
      </dl>

      {salud.fallosConsecutivos > 0 && (
        <div className={styles.failure}>
          <p className={styles.failureCount}>
            {salud.fallosConsecutivos} intento{salud.fallosConsecutivos !== 1 ? 's' : ''} seguido
            {salud.fallosConsecutivos !== 1 ? 's' : ''} fallando
            {salud.diasSinActualizar != null && salud.diasSinActualizar > 0 && (
              <> · {salud.diasSinActualizar} día{salud.diasSinActualizar !== 1 ? 's' : ''} sin
                actualizar</>
            )}
          </p>
          {salud.ultimoError && (
            <p className={styles.failureReason}>
              {salud.ultimoError.motivo ?? 'No se pudo obtener el valor de la fuente.'}
              {salud.ultimoError.codigo && (
                <span className={styles.errorCode}>{salud.ultimoError.codigo}</span>
              )}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
