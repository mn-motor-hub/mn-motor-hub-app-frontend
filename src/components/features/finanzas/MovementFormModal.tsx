'use client'; // FormProvider + estado del modal

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { createFinancialCategory } from '@/lib/api/financial-categories';
import {
  createFinancialMovement,
  updateFinancialMovement,
} from '@/lib/api/financial-movements';
import {
  createMovementFormSchema,
  type CreateFinancialMovementData,
} from '@/lib/schemas/financial-movement.schema';
import type { FinancialCategory, FinancialMovement, FinancialType } from '@/types';
import styles from './MovementFormModal.module.css';

export interface MovementFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: FinancialCategory[];
  /** Si viene, el modal edita ese movimiento en vez de crear uno nuevo. */
  movement?: FinancialMovement;
}

export function MovementFormModal({
  open,
  onOpenChange,
  categorias,
  movement,
}: MovementFormModalProps) {
  const router = useRouter();
  const isEdit = movement !== undefined;

  // Solo se guardan las creadas inline; la lista completa se deriva en render.
  // Tras router.refresh() la categoría nueva llega también por props, así que se
  // deduplica por id en vez de sincronizar estado con un efecto.
  const [nuevasCategorias, setNuevasCategorias] = useState<FinancialCategory[]>([]);

  const categoriasLocal = useMemo(() => {
    const porId = new Map(categorias.map((c) => [c.id, c]));
    for (const nueva of nuevasCategorias) {
      if (!porId.has(nueva.id)) porId.set(nueva.id, nueva);
    }
    return [...porId.values()];
  }, [categorias, nuevasCategorias]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(() => createMovementFormSchema(categoriasLocal), [categoriasLocal]);

  // El componente se monta recién al abrirse (ver NewMovementButton), así que
  // estos defaults se aplican en cada apertura sin necesidad de un reset().
  const form = useForm<CreateFinancialMovementData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: buildDefaults(movement),
  });

  const handleCategoriaCreada = useCallback((categoria: FinancialCategory) => {
    setNuevasCategorias((prev) => [...prev, categoria]);
  }, []);

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (movement) {
        await updateFinancialMovement(movement.id, data);
      } else {
        // `status` no se expone en creación: el backend lo deriva de la fecha.
        await createFinancialMovement(data);
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Error inesperado al guardar el movimiento.',
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}
      title={isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}
      size="md"
    >
      <FormProvider {...form}>
        <form onSubmit={onSubmit} noValidate className={styles.form}>
          <TypeToggle />
          <AmountAndDate />
          <DescriptionField />
          <CategorySelect categorias={categoriasLocal} onCategoriaCreada={handleCategoriaCreada} />
          <RegisteredByField />
          {isEdit && <StatusToggle />}

          {submitError && (
            <p className={styles.submitError} role="alert">
              {submitError}
            </p>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} disabled={!form.formState.isValid}>
              {isEdit ? 'Guardar cambios' : 'Registrar movimiento'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}

// ── Tipo: ingreso / gasto ────────────────────────────────────────────────────

function TypeToggle() {
  const { register, watch, setValue } = useFormContext<CreateFinancialMovementData>();
  const type = watch('type');
  const prevType = useRef(type);

  // Si cambia el tipo, la categoría elegida deja de ser válida: se limpia para
  // que el usuario no mande una combinación que el backend va a rechazar.
  // El ref evita que se dispare en el montaje y borre la categoría precargada
  // cuando el modal abre en modo edición.
  useEffect(() => {
    if (prevType.current === type) return;
    prevType.current = type;
    setValue('financialCategoryId', 0, { shouldValidate: true });
  }, [type, setValue]);

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Tipo</legend>
      <div className={styles.segmented}>
        {(['gasto', 'ingreso'] as FinancialType[]).map((option) => (
          <label
            key={option}
            className={`${styles.segment} ${type === option ? styles.segmentActive : ''}`}
          >
            <input type="radio" value={option} {...register('type')} className={styles.srOnly} />
            {option === 'gasto' ? 'Gasto' : 'Ingreso'}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ── Monto + fecha ────────────────────────────────────────────────────────────

function AmountAndDate() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateFinancialMovementData>();

  return (
    <div className={styles.row}>
      <Input
        label="Monto (USD)"
        type="number"
        step="0.01"
        min="0.01"
        inputMode="decimal"
        placeholder="0.00"
        required
        error={errors.amount?.message}
        {...register('amount', { valueAsNumber: true })}
      />
      <Input
        label="Fecha"
        type="date"
        required
        // Una fecha futura es válida: el backend la clasifica como planificado.
        helper="Una fecha futura se registra como planificado"
        error={errors.date?.message}
        {...register('date')}
      />
    </div>
  );
}

function DescriptionField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateFinancialMovementData>();

  return (
    <Input
      label="Descripción"
      required
      placeholder="Ej: Alquiler del local"
      error={errors.description?.message}
      {...register('description')}
    />
  );
}

function RegisteredByField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateFinancialMovementData>();

  return (
    <Input
      label="Registrado por"
      required
      placeholder="Ej: Luigi"
      error={errors.registeredBy?.message}
      {...register('registeredBy')}
    />
  );
}

// ── Estado (solo en edición) ─────────────────────────────────────────────────

function StatusToggle() {
  const { register, watch } = useFormContext<CreateFinancialMovementData>();
  const status = watch('status');

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Estado</legend>
      <div className={styles.segmented}>
        {(['confirmado', 'planificado'] as const).map((option) => (
          <label
            key={option}
            className={`${styles.segment} ${status === option ? styles.segmentActive : ''}`}
          >
            <input type="radio" value={option} {...register('status')} className={styles.srOnly} />
            {option === 'confirmado' ? 'Confirmado' : 'Planificado'}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ── Categoría, con creación inline ───────────────────────────────────────────

function CategorySelect({
  categorias,
  onCategoriaCreada,
}: {
  categorias: FinancialCategory[];
  onCategoriaCreada: (categoria: FinancialCategory) => void;
}) {
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreateFinancialMovementData>();

  const type = watch('type');
  const disponibles = categorias.filter((c) => c.type === type && c.active);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function closeCreateForm() {
    setShowCreateForm(false);
    setNombre('');
    setCreateError(null);
  }

  async function handleCreate() {
    if (!nombre.trim()) {
      setCreateError('El nombre de la categoría es requerido.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      // Llamada directa al cliente API: este componente ya es 'use client' por el
      // FormProvider, así que un Server Action solo agregaría un salto extra.
      const nueva = await createFinancialCategory({ name: nombre.trim(), type });
      onCategoriaCreada(nueva);
      setValue('financialCategoryId', nueva.id, { shouldValidate: true });
      closeCreateForm();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear la categoría.');
    } finally {
      setCreating(false);
    }
  }

  const error = errors.financialCategoryId?.message;

  return (
    <div className={styles.field}>
      <label htmlFor="categoria-select" className={styles.label}>
        Categoría <span className={styles.required}>*</span>
      </label>

      <Controller
        name="financialCategoryId"
        control={control}
        render={({ field }) => (
          <select
            id="categoria-select"
            className={[styles.select, error ? styles.selectError : ''].filter(Boolean).join(' ')}
            value={field.value > 0 ? String(field.value) : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '__create__') {
                setShowCreateForm(true);
                setCreateError(null);
                return;
              }
              setShowCreateForm(false);
              field.onChange(value ? Number(value) : 0);
            }}
            aria-describedby={error ? 'categoria-error' : undefined}
          >
            <option value="">— Seleccioná una categoría de {type} —</option>
            {disponibles.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
            <option value="__create__">+ Crear categoría nueva</option>
          </select>
        )}
      />

      {error && (
        <span id="categoria-error" className={styles.error} role="alert">
          {error}
        </span>
      )}

      {showCreateForm && (
        <div className={styles.createForm}>
          <div className={styles.createFormHeader}>
            <p className={styles.createFormTitle}>Nueva categoría de {type}</p>
            <button
              type="button"
              onClick={closeCreateForm}
              className={styles.createFormClose}
              aria-label="Cancelar creación de categoría"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <Input
            label="Nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mantenimiento del local"
          />

          {createError && (
            <p className={styles.createError} role="alert">
              {createError}
            </p>
          )}

          <div className={styles.createFormActions}>
            <Button type="button" variant="ghost" size="sm" onClick={closeCreateForm}>
              Cancelar
            </Button>
            <Button type="button" size="sm" loading={creating} onClick={handleCreate}>
              Crear categoría
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaults(movement?: FinancialMovement): Partial<CreateFinancialMovementData> {
  if (movement) {
    return {
      type: movement.type,
      amount: movement.amount,
      date: movement.date.slice(0, 10),
      description: movement.description,
      financialCategoryId: movement.financialCategoryId,
      registeredBy: movement.registeredBy,
      status: movement.status,
    };
  }
  return {
    type: 'gasto',
    date: todayISO(),
    description: '',
    financialCategoryId: 0,
    registeredBy: '',
  };
}

/** Hoy en local como YYYY-MM-DD — toISOString() correría el día por UTC. */
function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
