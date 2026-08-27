'use client'; // Modal + react-hook-form

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { SearchableSelect } from '@/components/ui/Select/Select';
import { updateAutoPartAction } from '@/app/(dashboard)/inventario/actions';
import { editAutoPartSchema, type EditAutoPartFormData } from '@/lib/schemas/auto-part.schema';
import type { AutoPart, Categoria, Subcategoria } from '@/types';
import styles from './EditAutoPartButton.module.css';

export interface EditAutoPartButtonProps {
  part: AutoPart;
  categorias: Categoria[];
  subcategorias: Subcategoria[];
}

function defaultsFrom(part: AutoPart): EditAutoPartFormData {
  return {
    nombre: part.nombre,
    descripcion: part.descripcion ?? '',
    marca: part.marca ?? '',
    subcategoriaId: part.subcategoriaId,
    precioVenta: part.precioVenta != null ? Number(part.precioVenta) : 0,
  };
}

export function EditAutoPartButton({ part, categorias, subcategorias }: EditAutoPartButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Categoría padre de la subcategoría actual — solo filtra el select de
  // subcategorías acá; no se manda al backend (auto_parts guarda subcategoria_id, no categoria_id).
  const [categoriaId, setCategoriaId] = useState(
    () => subcategorias.find((s) => s.id === part.subcategoriaId)?.categoriaId ?? '',
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EditAutoPartFormData>({
    resolver: zodResolver(editAutoPartSchema),
    mode: 'onChange',
    defaultValues: defaultsFrom(part),
  });

  function handleClose() {
    setOpen(false);
    setSubmitError(null);
    setCategoriaId(subcategorias.find((s) => s.id === part.subcategoriaId)?.categoriaId ?? '');
    reset(defaultsFrom(part));
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    const result = await updateAutoPartAction(part.id, {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      marca: data.marca || undefined,
      subcategoriaId: data.subcategoriaId,
      precioVenta: data.precioVenta,
    });

    if (result.ok) {
      setOpen(false);
      // El prop `part` no refleja lo recién guardado hasta que router.refresh()
      // resuelva — sincroniza el form ahora para que una reapertura inmediata
      // no muestre los valores originales del mount.
      reset(data);
      router.refresh();
      return;
    }
    setSubmitError(result.error);
  });

  const subcategoriasDeCategoria = categoriaId
    ? subcategorias.filter((s) => s.categoriaId === categoriaId)
    : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.editButton}
        aria-label={`Editar ${part.nombre}`}
      >
        <Pencil size={16} aria-hidden="true" />
        Editar
      </button>

      <Modal
        open={open}
        onOpenChange={(v) => { if (!isSubmitting && !v) handleClose(); }}
        title="Editar repuesto"
        size="md"
      >
        <form onSubmit={onSubmit} noValidate className={styles.form}>
          <Input
            label="Nombre"
            required
            autoFocus
            error={errors.nombre?.message}
            {...register('nombre')}
          />

          <div className={styles.field}>
            <label htmlFor="edit-autopart-descripcion" className={styles.fieldLabel}>
              Descripción
            </label>
            <textarea
              id="edit-autopart-descripcion"
              rows={3}
              className={styles.textarea}
              {...register('descripcion')}
            />
          </div>

          <Input label="Marca" {...register('marca')} />

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="edit-autopart-categoria" className={styles.fieldLabel}>
                Categoría
              </label>
              <select
                id="edit-autopart-categoria"
                className={styles.select}
                value={categoriaId}
                onChange={(e) => {
                  // Cambiar la categoría invalida la subcategoría elegida.
                  setCategoriaId(e.target.value);
                  setValue('subcategoriaId', '', { shouldValidate: true });
                }}
              >
                <option value="">— Seleccioná una categoría —</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Subcategoría <span className={styles.required}>*</span>
              </label>
              <Controller
                control={control}
                name="subcategoriaId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={subcategoriasDeCategoria.map((s) => ({ value: s.id, label: s.nombre }))}
                    placeholder={
                      categoriaId ? 'Seleccioná una subcategoría' : 'Elegí primero una categoría'
                    }
                    searchPlaceholder="Buscar subcategoría…"
                    disabled={!categoriaId}
                    error={Boolean(errors.subcategoriaId)}
                    aria-label="Subcategoría"
                  />
                )}
              />
              {errors.subcategoriaId && (
                <span className={styles.error}>{errors.subcategoriaId.message}</span>
              )}
            </div>
          </div>

          <Input
            label="Precio de venta (USD)"
            type="number"
            step="0.01"
            min="0"
            required
            error={errors.precioVenta?.message}
            {...register('precioVenta', { valueAsNumber: true })}
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
            <Button type="submit" loading={isSubmitting} disabled={!isValid}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
