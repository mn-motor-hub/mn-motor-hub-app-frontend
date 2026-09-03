'use client'; // estado del modal de confirmación

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@mn/design-system/ui';
import { confirmarSaleAction } from '@/app/(dashboard)/ventas/actions';
import { formatCurrencyUsd, formatDate } from '@/lib/utils/format';
import type { Sale } from '@/types';
import styles from './ConfirmarSaleButton.module.css';

export interface ConfirmarSaleButtonProps {
  sale: Sale;
  /** 'icon' para una fila de tabla, 'button' para la página de detalle. */
  variant?: 'icon' | 'button';
}

/** Solo tiene sentido mientras la venta está esperando verificación de pago. */
export function ConfirmarSaleButton({ sale, variant = 'button' }: ConfirmarSaleButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (sale.estado !== 'en_proceso') return null;

  async function handleConfirmar() {
    setBusy(true);
    setError(null);

    const result = await confirmarSaleAction(sale.id);
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
          aria-label={`Confirmar venta de ${sale.clienteNombre}`}
        >
          <CheckCircle2 size={16} aria-hidden="true" />
        </button>
      ) : (
        <Button variant="accent" type="button" onClick={() => setOpen(true)}>
          <CheckCircle2 size={16} aria-hidden="true" />
          Confirmar venta
        </Button>
      )}

      <Modal
        open={open}
        onOpenChange={(v) => {
          if (!v && !busy) setOpen(false);
        }}
        title="Confirmar venta"
        size="sm"
      >
        <div className={styles.confirmBody}>
          <p className={styles.confirmText}>
            ¿Confirmás que se verificó el pago de esta venta? Al confirmarla se habilita
            emitir el comprobante.
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
            <Button variant="accent" type="button" loading={busy} onClick={handleConfirmar}>
              Confirmar venta
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
