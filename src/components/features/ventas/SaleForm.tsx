'use client'; // FormProvider + useFieldArray + búsqueda debounced de auto_parts

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import {
  createSaleAction,
  getTasaEfectivaAction,
  searchAutoPartsAction,
} from '@/app/(dashboard)/ventas/actions';
import { createSaleSchema, type CreateSaleFormData } from '@/lib/schemas/sale.schema';
import { formatBs, formatCurrencyUsd } from '@/lib/utils/format';
import type { AutoPart, TasaEfectivaPreview } from '@/types';
import styles from './SaleForm.module.css';

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * `errors.items` puede ser un array (un objeto de errores por ítem) en vez de
 * un FieldError plano con `.message` — por eso `Object.values(errors)[0]?.message`
 * no alcanza para mostrar algo útil. Busca el primer mensaje real recorriendo
 * objetos y arrays anidados.
 */
function findFirstErrorMessage(node: unknown): string | undefined {
  if (!node || typeof node !== 'object') return undefined;
  if ('message' in node && typeof (node as { message?: unknown }).message === 'string') {
    return (node as { message: string }).message;
  }
  for (const value of Object.values(node as Record<string, unknown>)) {
    const found = findFirstErrorMessage(value);
    if (found) return found;
  }
  return undefined;
}

const DEFAULT_VALUES: CreateSaleFormData = {
  clienteNombre: '',
  clienteDocumento: '',
  clienteTelefono: '',
  formaPago: 'usd',
  montoEnFormaPago: 0,
  items: [],
};

export function SaleForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateSaleFormData>({
    resolver: zodResolver(createSaleSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  // `formState.isValid` queda desincronizado de `formState.errors` en este
  // form: combina useFieldArray (items) con useWatch leído desde componentes
  // hermanos (ItemsSection, FormaPagoSection) que disparan setValue con
  // shouldValidate. RHF no siempre recalcula el flag derivado `isValid` en ese
  // escenario, aunque `errors` sí queda correcto en cada validación — así que
  // el submit se habilita a partir de `errors` directamente, no de `isValid`.
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  const onSubmit = form.handleSubmit(
    async (data) => {
      setSubmitError(null);
      setSubmitting(true);

      const result = await createSaleAction(data);
      if (result.ok) {
        router.push(`/ventas/${result.data.id}`);
        return;
      }

      setSubmitError(result.error);
      setSubmitting(false);
    },
    // handleSubmit siempre revalida contra el schema al enviar, sin importar
    // el estado de `errors` que habilitó el botón. Sin este handler, si esa
    // revalidación encuentra algo inválido el submit no hace absolutamente
    // nada — ni guarda ni avisa. Acá al menos se muestra el primer motivo real.
    (invalidFields) => {
      setSubmitError(
        findFirstErrorMessage(invalidFields) ??
          'Revisá los datos del formulario: hay campos inválidos.',
      );
    },
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <ClienteSection />
        <ItemsSection />
        <FormaPagoSection />

        {submitError && (
          <p className={styles.submitError} role="alert">
            {submitError}
          </p>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/ventas')}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={submitting} disabled={hasErrors}>
            Registrar venta
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

// ── Cliente ──────────────────────────────────────────────────────────────────

function ClienteSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateSaleFormData>();

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Cliente</h2>
      <div className={styles.row}>
        <Input
          label="Nombre"
          required
          placeholder="Ej: Juan Pérez"
          error={errors.clienteNombre?.message}
          {...register('clienteNombre')}
        />
        <Input
          label="Cédula o RIF"
          required
          placeholder="Ej: V-12345678"
          error={errors.clienteDocumento?.message}
          {...register('clienteDocumento')}
        />
        <Input
          label="Teléfono (opcional)"
          placeholder="Ej: 0414-1234567"
          {...register('clienteTelefono')}
        />
      </div>
    </section>
  );
}

// ── Ítems ────────────────────────────────────────────────────────────────────

function ItemsSection() {
  const { control, register, setValue } = useFormContext<CreateSaleFormData>();
  const { fields, remove, append } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' }) ?? [];

  function handleAdd(part: AutoPart) {
    const existingIndex = items.findIndex((item) => item.autoPartId === part.id);
    if (existingIndex >= 0) {
      setValue(`items.${existingIndex}.cantidad`, items[existingIndex].cantidad + 1, {
        shouldValidate: true,
      });
      return;
    }
    // precioVenta es numeric(10,2) en Postgres — el driver `pg` lo devuelve
    // como string sin importar el tipo de la entidad TypeORM (confirmado con
    // backend-mn). id/stockActual sí son columnas integer, llegan como number.
    append({
      autoPartId: part.id,
      cantidad: 1,
      nombre: part.nombre,
      codigoInterno: part.codigoInterno,
      precioVentaUsd: part.precioVenta == null ? null : Number(part.precioVenta),
      stockActual: part.stockActual,
    });
  }

  const totalUsd = items.reduce(
    (sum, item) => sum + item.cantidad * (item.precioVentaUsd ?? 0),
    0,
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Ítems</h2>

      <AutoPartSearch onAdd={handleAdd} addedIds={items.map((i) => i.autoPartId)} />

      {fields.length === 0 ? (
        <p className={styles.emptyItemsHint}>Agregá al menos un ítem para poder registrar la venta.</p>
      ) : (
        <div className={styles.itemsList}>
          {fields.map((field, index) => (
            <div key={field.id} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <span className={styles.itemNombre}>{items[index]?.nombre}</span>
                <span className={styles.itemCodigo}>{items[index]?.codigoInterno}</span>
              </div>

              <input
                type="number"
                min={1}
                step={1}
                className={styles.cantidadInput}
                aria-label={`Cantidad de ${items[index]?.nombre}`}
                {...register(`items.${index}.cantidad`, { valueAsNumber: true })}
              />

              <span className={styles.itemSubtotal}>
                {formatCurrencyUsd((items[index]?.cantidad ?? 0) * (items[index]?.precioVentaUsd ?? 0))}
              </span>

              <button
                type="button"
                className={styles.removeButton}
                onClick={() => remove(index)}
                aria-label={`Quitar ${items[index]?.nombre}`}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total estimado (USD)</span>
        <span className={styles.totalValue}>{formatCurrencyUsd(totalUsd)}</span>
      </div>
    </section>
  );
}

function AutoPartSearch({
  onAdd,
  addedIds,
}: {
  onAdd: (part: AutoPart) => void;
  addedIds: number[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutoPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Buscador vía Server Action (no fetch directo desde Client Component) con
  // debounce: cada tecla no dispara una llamada, solo la última tras 350ms.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const result = await searchAutoPartsAction(query);
      if (result.ok) {
        setResults(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className={styles.searchWrapper}>
      <div className={styles.searchInputWrapper}>
        <Search size={16} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="text"
          placeholder="Buscar repuesto por nombre o código..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading && <p className={styles.searchHint}>Buscando...</p>}
      {error && (
        <p className={styles.searchError} role="alert">
          {error}
        </p>
      )}
      {!loading && !error && query.trim() && results.length === 0 && (
        <p className={styles.searchHint}>Sin resultados para “{query}”.</p>
      )}

      {results.length > 0 && (
        <ul className={styles.resultsList}>
          {results.map((part) => {
            const sinStock = part.stockActual <= 0;
            return (
              <li key={part.id} className={styles.resultItem}>
                <button
                  type="button"
                  className={styles.resultButton}
                  disabled={sinStock}
                  onClick={() => {
                    onAdd(part);
                    setQuery('');
                    setResults([]);
                  }}
                >
                  <span className={styles.resultInfo}>
                    <span className={styles.resultNombre}>{part.nombre}</span>
                    <span className={styles.resultMeta}>
                      {part.codigoInterno} · Stock: {part.stockActual}
                      {addedIds.includes(part.id) ? ' · Ya agregado' : ''}
                      {sinStock ? ' · Sin stock' : ''}
                    </span>
                  </span>
                  <span className={styles.resultPrecio}>
                    {part.precioVenta != null ? formatCurrencyUsd(Number(part.precioVenta)) : '—'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Forma de pago ────────────────────────────────────────────────────────────

function FormaPagoSection() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CreateSaleFormData>();

  const formaPago = useWatch({ control, name: 'formaPago' });
  const items = useWatch({ control, name: 'items' }) ?? [];
  const totalUsd = items.reduce(
    (sum, item) => sum + item.cantidad * (item.precioVentaUsd ?? 0),
    0,
  );

  const [tasaPreview, setTasaPreview] = useState<TasaEfectivaPreview | null>(null);
  const [tasaLoading, setTasaLoading] = useState(false);
  const [tasaError, setTasaError] = useState<string | null>(null);
  // El usuario puede ajustar el monto a mano: una vez que lo toca, dejamos de
  // pisarlo con el prefill automático (mismo criterio que precio_venta_nuevo
  // en InvoiceItemsPreview.tsx).
  const montoTouchedRef = useRef(false);

  useEffect(() => {
    if (formaPago !== 'bs') return;
    let cancelled = false;
    setTasaLoading(true);
    setTasaError(null);

    getTasaEfectivaAction().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setTasaPreview(result.data);
        if (!montoTouchedRef.current) {
          setValue(
            'montoEnFormaPago',
            roundTwo(totalUsd * result.data.tasaVentaEfectiva),
            { shouldValidate: true },
          );
        }
      } else {
        setTasaError(result.error);
      }
      setTasaLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // Se recalcula solo al entrar a "bs" o al cambiar el total, no en cada
    // render de tasaPreview/tasaLoading (evitaría un loop de fetch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formaPago, totalUsd]);

  useEffect(() => {
    if (formaPago !== 'usd') return;
    if (montoTouchedRef.current) return;
    setValue('montoEnFormaPago', roundTwo(totalUsd), { shouldValidate: true });
  }, [formaPago, totalUsd, setValue]);

  const montoRegister = register('montoEnFormaPago', { valueAsNumber: true });

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Forma de pago</h2>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Moneda de cobro</legend>
        <div className={styles.segmented}>
          {(['usd', 'bs'] as const).map((option) => (
            <label
              key={option}
              className={`${styles.segment} ${formaPago === option ? styles.segmentActive : ''}`}
            >
              <input
                type="radio"
                value={option}
                className={styles.srOnly}
                {...register('formaPago')}
              />
              {option === 'usd' ? 'USD' : 'Bolívares'}
            </label>
          ))}
        </div>
      </fieldset>

      {formaPago === 'bs' && (
        <div className={styles.bsPreview}>
          {tasaLoading && <p className={styles.searchHint}>Consultando tasa...</p>}
          {tasaError && (
            <p className={styles.searchError} role="alert">
              {tasaError}
            </p>
          )}
          {tasaPreview && !tasaLoading && (
            <p className={styles.bsPreviewText}>
              Referencia: {formatBs(totalUsd * tasaPreview.tasaVentaEfectiva)}{' '}
              <span className={styles.bsPreviewRate}>
                (1 USD ≈ {formatBs(tasaPreview.tasaVentaEfectiva)})
              </span>
            </p>
          )}
        </div>
      )}

      <Input
        label={`Monto cobrado (${formaPago === 'usd' ? 'USD' : 'Bs'})`}
        type="number"
        step="0.01"
        min="0.01"
        required
        helper={
          formaPago === 'bs'
            ? 'Prellenado como referencia — ajustalo si el cliente pagó otro monto'
            : undefined
        }
        error={errors.montoEnFormaPago?.message}
        {...montoRegister}
        onChange={(e) => {
          montoTouchedRef.current = true;
          montoRegister.onChange(e);
        }}
      />
    </section>
  );
}
