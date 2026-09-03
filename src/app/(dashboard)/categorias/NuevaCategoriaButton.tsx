'use client'; // react-hook-form + estado del modal

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button, Input } from '@mn/design-system/ui';
import { createCategoriaAction } from './actions';
import { createCategoriaSchema, type CreateCategoriaData } from '@/lib/schemas/categoria.schema';
import styles from './categorias.module.css';

export function NuevaCategoriaButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateCategoriaData>({
    resolver: zodResolver(createCategoriaSchema),
    mode: 'onChange',
    defaultValues: { nombre: '' },
  });

  function handleClose() {
    setOpen(false);
    setSubmitError(null);
    reset({ nombre: '' });
  }

  const onSubmit = handleSubmit(async ({ nombre }) => {
    setSubmitError(null);
    const result = await createCategoriaAction(nombre);

    if (result.ok) {
      handleClose();
      router.refresh();
      return;
    }

    setSubmitError(result.error);
  });

  return (
    <>
      <button onClick={() => setOpen(true)} className={styles.addButton}>
        <Plus size={16} aria-hidden="true" />
        Agregar categoría
      </button>

      <Modal
        open={open}
        onOpenChange={(v) => { if (!isSubmitting && !v) handleClose(); }}
        title="Nueva categoría"
        size="sm"
      >
        <form onSubmit={onSubmit} noValidate className={styles.modalForm}>
          <Input
            label="Nombre"
            required
            autoFocus
            placeholder="Ej: EMPACADURAS"
            error={errors.nombre?.message}
            helper="El código se genera automáticamente"
            {...register('nombre')}
          />

          {submitError && (
            <p className={styles.modalError} role="alert">
              {submitError}
            </p>
          )}

          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="accent" type="submit" loading={isSubmitting} disabled={!isValid}>
              Crear categoría
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
