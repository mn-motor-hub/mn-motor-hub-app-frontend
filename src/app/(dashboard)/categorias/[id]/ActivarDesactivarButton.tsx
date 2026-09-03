'use client'; // acción inmediata + estado de carga/error

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Power } from 'lucide-react';
import { Button } from '@mn/design-system/ui';
import { updateCategoriaAction } from '../actions';
import styles from './detail.module.css';

export interface ActivarDesactivarButtonProps {
  categoriaId: string;
  activo: boolean;
}

export function ActivarDesactivarButton({ categoriaId, activo }: ActivarDesactivarButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const result = await updateCategoriaAction(categoriaId, { activo: !activo });
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className={styles.toggleWrapper}>
      <Button
        type="button"
        variant={activo ? 'danger' : 'accent'}
        size="sm"
        loading={loading}
        onClick={handleClick}
      >
        <Power size={16} aria-hidden="true" />
        {activo ? 'Desactivar categoría' : 'Activar categoría'}
      </Button>
      {error && (
        <p className={styles.toggleError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
