'use client'; // estado del modal de confirmación

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { anularSaleAction } from '@/app/(dashboard)/ventas/actions';
import { formatCurrencyUsd, formatDate } from '@/lib/utils/format';
import type { Sale } from '@/types';
import styles from './AnularSaleButton.module.css';

export interface AnularSaleButtonProps {
  sale: Sale;
  /** 'icon' para una fila de tabla, 'button' para la página de detalle. */
  variant?: 'icon' | 'button';
}

/** No se renderiza nada si la venta ya está anulada — no hay nada para anular. */
export function AnularSaleButton({ sale, variant = 'button' }: AnularSaleButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (sale.estado !== 'completada') return null;

  async function handleAnular() {
    setBusy(true);
    setError(null);

    const result = await anularSaleAction(sale.id);
    if (result.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
    setBusy(false);
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setOpen(true)}
          aria-label={`Anular venta de ${sale.clienteNombre}`}
        >
          <Ban size={16} aria-hidden="true" />
        </button>
      ) : (
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          <Ban size={16} aria-hidden="true" />
          Anular venta
        </Button>
      )}

      <Modal
        open={open}
        onOpenChange={(v) => {
          if (!v && !busy) setOpen(false);
        }}
        title="Anular venta"
        size="sm"
      >
        <div className={styles.confirmBody}>
          <p className={styles.confirmText}>
            ¿Anular esta venta? Es un borrado lógico, pero la operación de negocio no se puede
            revertir desde acá.
          </p>
          <p className={styles.confirmDetail}>
            <span className={styles.confirmDetailDesc}>{sale.clienteNombre}</span>
            <span className={styles.confirmDetailAmount}>
              {formatCurrencyUsd(sale.totalUsd)} · {formatDate(sale.fecha)}
            </span>
          </p>

          {error && (
            <p className={styles.confirmError} role="alert">
              {error}
            </p>
          )}

          <div className={styles.confirmActions}>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" loading={busy} onClick={handleAnular}>
              Anular venta
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
