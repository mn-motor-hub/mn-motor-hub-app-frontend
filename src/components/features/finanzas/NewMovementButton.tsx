'use client'; // controla el estado de apertura del modal

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { MovementFormModal } from './MovementFormModal';
import type { FinancialCategory } from '@/types';
import styles from './NewMovementButton.module.css';

export interface NewMovementButtonProps {
  categorias: FinancialCategory[];
}

export function NewMovementButton({ categorias }: NewMovementButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={styles.button}>
        <Plus size={16} aria-hidden="true" />
        Nuevo movimiento
      </button>

      {/* Se monta recién al abrir: así el form arranca limpio en cada apertura
          sin necesidad de un reset() en efecto. */}
      {open && (
        <MovementFormModal open onOpenChange={setOpen} categorias={categorias} />
      )}
    </>
  );
}
