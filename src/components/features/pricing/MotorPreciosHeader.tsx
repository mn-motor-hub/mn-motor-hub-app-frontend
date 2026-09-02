import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatDate } from '@/lib/utils/format';
import type { BrechaStatus } from '@/types';
import styles from './MotorPreciosHeader.module.css';

interface MotorPreciosHeaderProps {
  status: BrechaStatus;
}

type Estado = {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
  icon: 'ok' | 'alerta' | null;
};

/**
 * El estado se deriva entero acá: el backend no devuelve un "estado" y no hace
 * falta que lo haga.
 *
 * El orden de las ramas importa. `brechaPct` viene null por dos motivos
 * distintos —tasa BCV vencida, o sin dato P2P— y el backend pone
 * `dentroDeBanda` en null junto con ella. Preguntar por `tasaBcvStale` primero
 * es lo que evita reportar un problema de P2P cuando el problema es del BCV.
 */
function estadoDe(status: BrechaStatus): Estado {
  if (status.tasaBcvStale) {
    return { label: 'Tasa BCV desactualizada', variant: 'danger', icon: 'alerta' };
  }
  if (status.brechaPct == null) {
    return { label: 'Sin dato P2P', variant: 'neutral', icon: null };
  }
  if (status.dentroDeBanda) {
    return { label: 'Dentro de banda', variant: 'success', icon: 'ok' };
  }
  const dias = status.diasConsecutivosFueraDeBanda;
  return {
    label: dias > 0 ? `Fuera de banda hace ${dias} día${dias !== 1 ? 's' : ''}` : 'Fuera de banda',
    variant: 'warning',
    icon: 'alerta',
  };
}

/** Qué mostrar en la celda de brecha, que es la que tiene los tres estados. */
function brechaTexto(status: BrechaStatus): string {
  if (status.tasaBcvStale) return 'Tasa desactualizada';
  if (status.brechaPct == null) return 'Sin dato P2P';
  return `${status.brechaPct.toFixed(2)}%`;
}

export function MotorPreciosHeader({ status }: MotorPreciosHeaderProps) {
  const estado = estadoDe(status);
  const sinBrecha = status.brechaPct == null;

  return (
    <section className={styles.header} aria-label="Estado del factor de reposición cambiaria">
      <div className={styles.topRow}>
        <h2 className={styles.title}>Factor de reposición cambiaria</h2>
        <Badge variant={estado.variant}>
          <span className={styles.badgeContent}>
            {estado.icon === 'ok' && <CheckCircle2 size={12} aria-hidden="true" />}
            {estado.icon === 'alerta' && <AlertTriangle size={12} aria-hidden="true" />}
            {estado.label}
          </span>
        </Badge>
      </div>

      <div className={styles.figures}>
        <div className={styles.figure}>
          <span className={styles.figureLabel}>K vigente</span>
          <span className={styles.figureValue}>{status.factorKConfigurado.toFixed(2)}</span>
          {/*
            brechaImplicitaK ya es (K - 1) * 100 resuelto por el backend. No se
            recalcula acá: si algún día cambia la fórmula, cambia en un lugar.
          */}
          <span className={styles.figureHint}>
            Cubre una brecha de {status.brechaImplicitaK.toFixed(2)}%
          </span>
        </div>

        <div className={styles.figure}>
          <span className={styles.figureLabel}>Brecha de hoy</span>
          <span className={`${styles.figureValue} ${sinBrecha ? styles.figureValueMuted : ''}`}>
            {brechaTexto(status)}
          </span>
          <span className={styles.figureHint}>
            BCV vs P2P
          </span>
        </div>

        <div className={styles.figure}>
          <span className={styles.figureLabel}>Banda objetivo</span>
          <span className={styles.figureValue}>
            {status.bandaMin}% – {status.bandaMax}%
          </span>
          <span className={styles.figureHint}>
            {sinBrecha ? 'Sin brecha para comparar' : 'Rango aceptable'}
          </span>
        </div>

        <div className={styles.figure}>
          <span className={styles.figureLabel}>Revisión</span>
          <span className={styles.figureValue}>{formatDate(status.proximaRevision)}</span>
          <span className={styles.figureHint}>
            La última fue el {formatDate(status.ultimaRevision)}
          </span>
        </div>
      </div>

      {status.tasaBcvStale && (
        <p className={styles.notice} role="status">
          La tasa BCV en uso viene de un fetch vencido, así que no se calcula la brecha de hoy
          contra un dato viejo. Revisá el estado del scraper en la pantalla de tasas antes de
          tocar el factor K.
        </p>
      )}
    </section>
  );
}
