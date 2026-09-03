'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@mn/design-system/ui';
import { SearchableSelect } from '@/components/ui/Select/Select';
import { classifySubcategoriasAction } from '@/app/(dashboard)/inventario/importar/actions';
import type { ConfirmFormData } from '@/lib/schemas/stock-import.schema';
import type {
  StockImportParseResponse,
  StockImportParsedItem,
  Categoria,
  Subcategoria,
  ClassifySubcategoriaCandidato,
} from '@/types';
import { roundTwo, margenFraction } from './StockImportFlow';
import styles from './InvoiceItemsPreview.module.css';

export interface InvoiceItemsPreviewProps {
  parseResult: StockImportParseResponse;
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  margenDefault: number;
  /** Ítems marcados requiere_revision por el clasificador de IA, por índice. */
  revisionOverrides: Record<number, boolean>;
  onRevisionChange: (updates: Record<number, boolean>) => void;
}

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

// `busy` identifica qué llamada al clasificador está en curso: el índice del
// ítem si fue un pedido individual, 'all' si fue el batch global, o null.
type SuggestBusy = number | 'all' | null;

export function InvoiceItemsPreview({
  parseResult,
  categorias,
  subcategorias,
  margenDefault,
  revisionOverrides,
  onRevisionChange,
}: InvoiceItemsPreviewProps) {
  const { getValues } = useFormContext<ConfirmFormData>();

  const [candidatos, setCandidatos] = useState<Record<number, ClassifySubcategoriaCandidato[]>>({});
  const [busy, setBusy] = useState<SuggestBusy>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  async function handleSuggest(indices: number[]) {
    setBusy(indices.length > 1 ? 'all' : indices[0]);
    setSuggestError(null);

    const payload = indices.map((i) => {
      const item = parseResult.items[i];
      const fd = getValues(`items.${i}`);
      const nombre = item.match
        ? item.match.nombre || item.descripcion
        : fd.nombre?.trim() || item.descripcion;
      return { tempId: String(i), nombre, descripcion: item.descripcion };
    });

    const result = await classifySubcategoriasAction(payload);

    // Ante falla o candidatos: [] no se rompe el flujo — el select manual sigue disponible.
    if (result.ok) {
      const candidatosUpdates: Record<number, ClassifySubcategoriaCandidato[]> = {};
      const revisionUpdates: Record<number, boolean> = {};
      for (const r of result.data) {
        const i = Number(r.tempId);
        candidatosUpdates[i] = r.candidatos;
        revisionUpdates[i] = r.requiereRevision;
      }
      setCandidatos((prev) => ({ ...prev, ...candidatosUpdates }));
      onRevisionChange(revisionUpdates);
    } else {
      setSuggestError(result.error);
    }

    setBusy(null);
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.heading}>Ítems de la factura</h2>
        <span className={styles.itemCount}>{parseResult.items.length} ítems</span>
      </div>

      <div className={styles.suggestBar}>
        <Button
          type="button"
          variant="primary"
          size="md"
          className={styles.suggestButtonGlobal}
          loading={busy === 'all'}
          disabled={busy !== null}
          onClick={() => handleSuggest(parseResult.items.map((_, i) => i))}
        >
          <Sparkles size={16} aria-hidden="true" />
          Sugerir categorías con IA
        </Button>
        {suggestError && (
          <span className={styles.suggestErrorText} role="alert">
            {suggestError}
          </span>
        )}
      </div>

      {parseResult.tiene_items_con_revision && (
        <div className={styles.globalWarning} role="note">
          <AlertTriangle size={16} aria-hidden="true" />
          Algunos ítems requieren revisión manual. Confirmá cada uno antes de poder importar el lote.
        </div>
      )}

      <div className={styles.list}>
        {parseResult.items.map((item, i) => (
          <ItemCard
            key={`${item.codigo_proveedor}-${i}`}
            item={item}
            index={i}
            categorias={categorias}
            subcategorias={subcategorias}
            margenDefault={margenDefault}
            classifyRevision={revisionOverrides[i] === true}
            candidatos={candidatos[i]}
            suggestDisabled={busy !== null}
            suggestLoading={busy === i}
            onSuggest={() => handleSuggest([i])}
          />
        ))}
      </div>
    </section>
  );
}

// ── ItemCard ─────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  index,
  categorias,
  subcategorias,
  margenDefault,
  classifyRevision,
  candidatos,
  suggestDisabled,
  suggestLoading,
  onSuggest,
}: {
  item: StockImportParsedItem;
  index: number;
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  margenDefault: number;
  classifyRevision: boolean;
  candidatos: ClassifySubcategoriaCandidato[] | undefined;
  suggestDisabled: boolean;
  suggestLoading: boolean;
  onSuggest: () => void;
}) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ConfirmFormData>();

  const itemErrors = errors.items?.[index];
  const isNew = item.match === null;
  // reusa el mismo indicador que la revisión de duplicados/precio: el mismo
  // badge, el mismo borde de card, y la misma sección de "motivo + checkbox".
  const needsRevision = item.requiere_revision || classifyRevision;

  const selectedCategoriaId = useWatch({ control, name: `items.${index}.categoria_id` });
  const selectedCategoria = categorias.find((c) => c.id === selectedCategoriaId);

  const selectedSubcategoriaId = useWatch({ control, name: `items.${index}.subcategoria_id` });
  const selectedSubcategoria = subcategorias.find((s) => s.id === selectedSubcategoriaId);

  // precio_venta_nuevo se recalcula en vivo con precio_compra × (1 + margen) mientras
  // el usuario no lo haya tocado a mano; si lo edita, deja de autocalcularse hasta que
  // vuelva a cambiar precio_compra. Ref porque no debe disparar un re-render propio.
  const ventaTouchedRef = useRef(false);
  const isFirstPrecioRender = useRef(true);
  const precioCompra = useWatch({ control, name: `items.${index}.precio_unitario_usd` });

  useEffect(() => {
    if (isFirstPrecioRender.current) {
      isFirstPrecioRender.current = false;
      return;
    }
    if (ventaTouchedRef.current) return;
    if (!Number.isFinite(precioCompra) || precioCompra <= 0) return;
    setValue(
      `items.${index}.precio_venta_nuevo`,
      roundTwo(precioCompra * (1 + margenFraction(item, margenDefault))),
      { shouldValidate: true },
    );
  }, [precioCompra, index, item, margenDefault, setValue]);

  // Al elegir subcategoría (select manual o candidato sugerido) se completa la
  // categoría padre, salvo que el usuario ya la haya editado a mano — en ese
  // caso no se vuelve a pisar. Si se limpia la subcategoría, la categoría
  // queda como está (no se borra). Solo aplica a ítems nuevos: es el único
  // caso donde categoria_id existe como campo del form.
  const categoriaTouchedRef = useRef(false);
  const isFirstSubcatRender = useRef(true);

  useEffect(() => {
    if (isFirstSubcatRender.current) {
      isFirstSubcatRender.current = false;
      return;
    }
    if (!isNew) return;
    if (!selectedSubcategoriaId) return;
    if (categoriaTouchedRef.current) return;
    const parent = subcategorias.find((s) => s.id === selectedSubcategoriaId);
    if (!parent) return;
    setValue(`items.${index}.categoria_id`, parent.categoriaId, { shouldValidate: true });
  }, [selectedSubcategoriaId, isNew, subcategorias, index, setValue]);

  const costoRegister = register(`items.${index}.precio_unitario_usd`, { valueAsNumber: true });
  const ventaRegister = register(`items.${index}.precio_venta_nuevo`, { valueAsNumber: true });
  const categoriaRegister = register(`items.${index}.categoria_id`);

  return (
    <div
      className={[styles.card, needsRevision ? styles.cardRevision : ''].filter(Boolean).join(' ')}
    >
      {/* ── Badges + description ─────────────────────── */}
      <div className={styles.cardHeader}>
        <div className={styles.badges}>
          {isNew ? (
            <span className={`${styles.badge} ${styles.badgeNew}`}>Ítem nuevo</span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeExisting}`}>Ítem existente</span>
          )}
          {needsRevision && (
            <span className={`${styles.badge} ${styles.badgeRevision}`}>
              <AlertTriangle size={11} aria-hidden="true" />
              Requiere revisión
            </span>
          )}
        </div>
        <p className={styles.description}>{item.descripcion}</p>
      </div>

      {/* ── Common info ──────────────────────────────── */}
      <div className={styles.infoRow}>
        <InfoCell label="Cód. proveedor" value={item.codigo_proveedor} mono />
        <InfoCell label="Cantidad" value={String(item.cantidad)} />
      </div>

      {/* ── Catalog info (existing items) ───────────── */}
      {item.match && (
        <div className={styles.catalogSection}>
          <p className={styles.catalogSectionTitle}>En catálogo</p>
          <div className={styles.infoRow}>
            <InfoCell label="Código interno" value={item.match.codigo_interno} mono />
            <InfoCell label="Nombre" value={item.match.nombre} />
            <InfoCell label="Stock actual" value={String(item.match.stock_actual)} />
            <InfoCell label="Precio venta actual" value={fmtUSD(item.match.precio_venta_actual)} />
            <InfoCell label="Margen actual" value={fmtPct(item.match.margen_actual)} />
          </div>
        </div>
      )}

      {/* ── Edit section ─────────────────────────────── */}
      <div className={styles.editSection}>
        <div className={styles.priceRow}>
          <Field
            label="Precio de costo (USD)"
            required
            error={itemErrors?.precio_unitario_usd?.message}
          >
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={[styles.input, itemErrors?.precio_unitario_usd ? styles.inputError : '']
                .filter(Boolean)
                .join(' ')}
              {...costoRegister}
              onChange={(e) => {
                // Cambió el costo: reactivar el autocálculo de precio de venta.
                ventaTouchedRef.current = false;
                costoRegister.onChange(e);
              }}
            />
          </Field>

          <Field
            label="Precio de venta (USD)"
            required
            error={itemErrors?.precio_venta_nuevo?.message}
            hint="Se recalcula con el margen mientras no lo edites"
          >
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={[styles.input, itemErrors?.precio_venta_nuevo ? styles.inputError : '']
                .filter(Boolean)
                .join(' ')}
              {...ventaRegister}
              onChange={(e) => {
                ventaTouchedRef.current = true;
                ventaRegister.onChange(e);
              }}
            />
          </Field>
        </div>

        <Field
          label="Subcategoría"
          required={isNew}
          warning={needsRevision}
          error={itemErrors?.subcategoria_id?.message}
          hint={
            needsRevision
              ? 'Sugerencia de IA sin confirmar — revisá antes de continuar'
              : selectedSubcategoria?.nombre
          }
        >
          <div className={styles.subcategoriaRow}>
            <Controller
              control={control}
              name={`items.${index}.subcategoria_id`}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  options={subcategorias.map((s) => ({ value: s.id, label: s.nombre }))}
                  placeholder="Seleccioná una subcategoría"
                  searchPlaceholder="Buscar subcategoría…"
                  emptyOptionLabel="— Sin subcategoría —"
                  error={Boolean(itemErrors?.subcategoria_id)}
                  aria-label="Subcategoría"
                />
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={styles.suggestButtonSmall}
              loading={suggestLoading}
              disabled={suggestDisabled}
              onClick={onSuggest}
              aria-label="Sugerir subcategoría con IA para este ítem"
            >
              <Sparkles size={14} aria-hidden="true" />
            </Button>
          </div>
        </Field>

        {candidatos && candidatos.length > 0 && (
          <div className={styles.candidatosRow}>
            {candidatos.map((c) => (
              <button
                key={c.subcategoriaId}
                type="button"
                className={[
                  styles.candidatoChip,
                  selectedSubcategoriaId === c.subcategoriaId ? styles.candidatoChipActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() =>
                  setValue(`items.${index}.subcategoria_id`, c.subcategoriaId, {
                    shouldValidate: true,
                  })
                }
              >
                {c.nombre}
                <span className={styles.candidatoScore}>{Math.round(c.score * 100)}%</span>
              </button>
            ))}
          </div>
        )}

        {isNew && (
          <div className={styles.newItemGrid}>
            <Field label="Nombre" required error={itemErrors?.nombre?.message}>
              <input
                type="text"
                className={[styles.input, itemErrors?.nombre ? styles.inputError : '']
                  .filter(Boolean)
                  .join(' ')}
                {...register(`items.${index}.nombre`)}
              />
            </Field>

            <Field
              label="Categoría"
              required
              error={itemErrors?.categoria_id?.message}
              hint={selectedCategoria?.descripcion}
            >
              <select
                className={[styles.select, itemErrors?.categoria_id ? styles.inputError : '']
                  .filter(Boolean)
                  .join(' ')}
                {...categoriaRegister}
                onChange={(e) => {
                  // Edición manual: el auto-fill desde subcategoría deja de pisarla.
                  categoriaTouchedRef.current = true;
                  categoriaRegister.onChange(e);
                }}
              >
                <option value="">— Seleccioná —</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Marca (opcional)">
              <input
                type="text"
                className={styles.input}
                {...register(`items.${index}.marca`)}
              />
            </Field>

            <Field label="Ubicación en stock">
              <input
                type="text"
                className={styles.input}
                placeholder="PRINCIPAL"
                {...register(`items.${index}.ubicacion_stock`)}
              />
            </Field>
          </div>
        )}
      </div>

      {/* ── Revision section — impossible to miss ───── */}
      {needsRevision && (
        <div className={styles.revisionSection}>
          <div className={styles.revisionMotivo}>
            <AlertTriangle size={15} className={styles.revisionIcon} aria-hidden="true" />
            <p className={styles.revisionMotivoText}>
              <strong>Motivo de revisión:</strong>{' '}
              {item.motivo_revision ?? 'Este ítem fue marcado para revisión manual.'}
            </p>
          </div>

          <label className={styles.revisionCheckLabel}>
            <input
              type="checkbox"
              className={styles.revisionCheckbox}
              {...register(`items.${index}.revisado`)}
            />
            <span className={styles.revisionCheckText}>Revisé este ítem y es correcto</span>
          </label>

          {itemErrors?.revisado && (
            <span className={styles.fieldError} role="alert">
              {itemErrors.revisado.message}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <span className={styles.infoCell}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={[styles.infoValue, mono ? styles.mono : ''].filter(Boolean).join(' ')}>
        {value}
      </span>
    </span>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  warning,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Resalta el campo cuando la sugerencia de IA no es confiable (requiere_revision). */
  warning?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        <span className={styles.fieldLabelText}>
          {label}
          {required && <span className={styles.required}> *</span>}
          {warning && (
            <span className={styles.fieldWarningBadge}>
              <AlertTriangle size={11} aria-hidden="true" />
              Sugerido por IA
            </span>
          )}
        </span>
        {children}
      </label>
      {error ? (
        <span className={styles.fieldError}>{error}</span>
      ) : hint ? (
        <span className={warning ? styles.fieldHintWarning : styles.fieldHint}>{hint}</span>
      ) : null}
    </div>
  );
}
