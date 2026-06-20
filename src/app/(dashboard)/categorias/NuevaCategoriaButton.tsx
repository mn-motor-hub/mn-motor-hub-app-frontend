'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { createCategoriaAction } from './actions';
import styles from './categorias.module.css';

export function NuevaCategoriaButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [prefijo, setPrefijo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setOpen(false);
    setNombre('');
    setPrefijo('');
    setError(null);
  }

  function validate(): string | null {
    if (!nombre.trim()) return 'El nombre es requerido.';
    if (prefijo.length !== 3) return 'El prefijo debe tener exactamente 3 caracteres.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createCategoriaAction({ nombre: nombre.trim(), prefijo });
      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={styles.addButton}>
        <Plus size={16} aria-hidden="true" />
        Agregar categoría
      </button>

      <Modal
        open={open}
        onOpenChange={(v) => { if (!v) handleClose(); }}
        title="Nueva categoría"
        size="sm"
      >
        <form onSubmit={handleSubmit} noValidate className={styles.modalForm}>
          <Input
            label="Nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: EMPACADURAS"
            autoFocus
          />
          <Input
            label="Prefijo"
            required
            value={prefijo}
            onChange={(e) => setPrefijo(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="Ej: EMP"
            maxLength={3}
            helper="3 caracteres — genera códigos del tipo MNM-EMP-00001"
          />

          {error && (
            <p className={styles.modalError} role="alert">
              {error}
            </p>
          )}

          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Crear categoría
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
