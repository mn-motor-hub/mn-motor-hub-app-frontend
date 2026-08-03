'use client'; // react-hook-form + estado del modal

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { createSubcategoriaAction } from '@/app/(dashboard)/categorias/actions';
import {
  createSubcategoriaSchema,
  type CreateSubcategoriaData,
} from '@/lib/schemas/subcategoria.schema';
import type { Categoria } from '@/types';
import styles from './SubcategoriasTable.module.css';

export interface NuevaSubcategoriaButtonProps {
  categorias: Categoria[];
  /** Si viene, no se muestra el selector — la categoría queda fija (detalle de categoría). */
  fixedCategoriaId?: string;
}

export function NuevaSubcategoriaButton({
  categorias,
  fixedCategoriaId,
}: NuevaSubcategoriaButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateSubcategoriaData>({
    resolver: zodResolver(createSubcategoriaSchema),
    mode: 'onChange',
    defaultValues: { nombre: '', categoriaId: fixedCategoriaId ?? '' },
  });

  // Garantiza que categoriaId quede seteado y validado antes de que el
  // usuario toque el form, ya que en este modo no hay <select> que lo setee.
  useEffect(() => {
    if (fixedCategoriaId) setValue('categoriaId', fixedCategoriaId, { shouldValidate: true });
  }, [fixedCategoriaId, setValue]);

  function handleClose() {
    setOpen(false);
    setSubmitError(null);
    reset({ nombre: '', categoriaId: fixedCategoriaId ?? '' });
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    const result = await createSubcategoriaAction(data);

    if (result.ok) {
      handleClose();
      router.refresh();
      return;
    }

    setSubmitError(result.error);
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={styles.addButton}>
        <Plus size={16} aria-hidden="true" />
        Agregar subcategoría
      </button>

      <Modal
        open={open}
        onOpenChange={(v) => { if (!isSubmitting && !v) handleClose(); }}
        title="Nueva subcategoría"
        size="sm"
      >
        <form onSubmit={onSubmit} noValidate className={styles.modalForm}>
          <Input
            label="Nombre"
            required
            autoFocus
            placeholder="Ej: FILTROS DE ACEITE"
            error={errors.nombre?.message}
            {...register('nombre')}
          />

          {!fixedCategoriaId && (
            <div className={styles.field}>
              <label htmlFor="subcategoria-categoria" className={styles.fieldLabel}>
                Categoría <span className={styles.required}>*</span>
              </label>
              <select
                id="subcategoria-categoria"
                className={[styles.formSelect, errors.categoriaId ? styles.selectError : '']
                  .filter(Boolean)
                  .join(' ')}
                {...register('categoriaId')}
              >
                <option value="">— Seleccioná una categoría —</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              {errors.categoriaId && <span className={styles.error}>{errors.categoriaId.message}</span>}
            </div>
          )}

          {submitError && (
            <p className={styles.modalError} role="alert">
              {submitError}
            </p>
          )}

          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isValid}>
              Crear subcategoría
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
