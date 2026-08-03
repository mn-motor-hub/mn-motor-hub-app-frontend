'use client'; // react-hook-form + estado del modal

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { updateConfiguracionAction } from './actions';
import {
  createConfiguracionFormSchema,
  type ConfiguracionFormData,
} from '@/lib/schemas/configuracion.schema';
import type { Configuracion } from '@/types';
import styles from './configuracion.module.css';

export interface EditarConfiguracionButtonProps {
  configuracion: Configuracion;
}

export function EditarConfiguracionButton({ configuracion }: EditarConfiguracionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ConfiguracionFormData>({
    resolver: zodResolver(createConfiguracionFormSchema(configuracion.clave)),
    mode: 'onChange',
    defaultValues: { valor: configuracion.valor },
  });

  function handleClose() {
    setOpen(false);
    setSubmitError(null);
    reset({ valor: configuracion.valor });
  }

  const onSubmit = handleSubmit(async ({ valor }) => {
    setSubmitError(null);
    const result = await updateConfiguracionAction(configuracion.clave, valor);

    if (result.ok) {
      setOpen(false);
      router.refresh();
      setSaved(true);
      // Confirmación temporal — no hay un Toast global en el proyecto todavía
      // y este es el único lugar que lo necesita.
      setTimeout(() => setSaved(false), 3000);
      return;
    }

    setSubmitError(result.error);
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.editButton}
        aria-label={`Editar ${configuracion.clave}`}
      >
        <Pencil size={16} aria-hidden="true" />
        Editar
      </button>

      {saved && (
        <span className={styles.savedBadge} role="status">
          <Check size={14} aria-hidden="true" />
          Guardado
        </span>
      )}

      <Modal
        open={open}
        onOpenChange={(v) => { if (!isSubmitting && !v) handleClose(); }}
        title={`Editar ${configuracion.clave}`}
        size="sm"
      >
        <form onSubmit={onSubmit} noValidate className={styles.modalForm}>
          <Input
            label="Valor"
            type="number"
            step="0.01"
            inputMode="decimal"
            required
            autoFocus
            error={errors.valor?.message}
            helper={configuracion.descripcion}
            {...register('valor', { valueAsNumber: true })}
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
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
