'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';
import type { StockImportConfirmResponse } from '@/types';
import styles from './ImportSuccessView.module.css';

export interface ImportSuccessViewProps {
  result: StockImportConfirmResponse;
  facturaNumero: string;
  onNewImport: () => void;
}

export function ImportSuccessView({ result, facturaNumero, onNewImport }: ImportSuccessViewProps) {
  const { resumen, items } = result;

  return (
    <div className={styles.container}>
      {/* ── Success header ───────────────────────────── */}
      <div className={styles.header}>
        <CheckCircle2 size={48} className={styles.successIcon} aria-hidden="true" />
        <div>
          <h2 className={styles.title}>Importación completada</h2>
          <p className={styles.subtitle}>
            Factura <span className={styles.facturaCode}>{facturaNumero}</span> procesada
            correctamente.
          </p>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────── */}
      <div className={styles.stats}>
        <StatCard value={resumen.total_items} label="Ítems procesados" />
        <StatCard value={resumen.items_actualizados} label="Actualizados" variant="updated" />
        <StatCard value={resumen.items_nuevos} label="Creados" variant="created" />
      </div>

      {/* ── Item list ────────────────────────────────── */}
      {items.length > 0 && (
        <div className={styles.itemsSection}>
          <p className={styles.itemsHeading}>Detalle por ítem</p>
          <ul className={styles.itemList}>
            {items.map((item, i) => (
              <li key={`${item.codigo_interno}-${i}`} className={styles.itemRow}>
                <span
                  className={[
                    styles.accionBadge,
                    item.accion === 'creado' ? styles.badgeCreado : styles.badgeActualizado,
                  ].join(' ')}
                >
                  {item.accion === 'creado' ? 'Nuevo' : 'Actualizado'}
                </span>
                <span className={styles.codigoInterno}>{item.codigo_interno}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────── */}
      <div className={styles.actions}>
        <button type="button" onClick={onNewImport} className={styles.newImportButton}>
          <RotateCcw size={16} aria-hidden="true" />
          Importar otra factura
        </button>
        <Link href="/inventario" className={styles.viewInventoryLink}>
          Ver inventario
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  variant,
}: {
  value: number;
  label: string;
  variant?: 'updated' | 'created';
}) {
  return (
    <div
      className={[
        styles.statCard,
        variant === 'updated' ? styles.statUpdated : '',
        variant === 'created' ? styles.statCreated : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
