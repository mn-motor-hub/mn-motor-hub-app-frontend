'use client';

import { useFormContext } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import type { ConfirmFormData } from '@/lib/schemas/stock-import.schema';
import type { StockImportParseResponse, StockImportParsedItem, Categoria } from '@/types';
import styles from './InvoiceItemsPreview.module.css';

export interface InvoiceItemsPreviewProps {
  parseResult: StockImportParseResponse;
  categorias: Categoria[];
}

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

export function InvoiceItemsPreview({ parseResult, categorias }: InvoiceItemsPreviewProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.heading}>Ítems de la factura</h2>
        <span className={styles.itemCount}>{parseResult.items.length} ítems</span>
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
}: {
  item: StockImportParsedItem;
  index: number;
  categorias: Categoria[];
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ConfirmFormData>();

  const itemErrors = errors.items?.[index];
  const isNew = item.match === null;
  const needsRevision = item.requiere_revision;

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
        <InfoCell label="Precio costo" value={fmtUSD(item.precio_unitario_usd)} />
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
        {isNew ? (
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

            <Field label="Categoría" required error={itemErrors?.categoria_id?.message}>
              <select
                className={[styles.select, itemErrors?.categoria_id ? styles.inputError : '']
                  .filter(Boolean)
                  .join(' ')}
                {...register(`items.${index}.categoria_id`, { valueAsNumber: true })}
              >
                <option value="">— Seleccioná —</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Precio de venta (USD)"
              required
              error={itemErrors?.precio_venta_nuevo?.message}
            >
              <input
                type="number"
                step="0.01"
                min="0.01"
                className={[styles.input, itemErrors?.precio_venta_nuevo ? styles.inputError : '']
                  .filter(Boolean)
                  .join(' ')}
                {...register(`items.${index}.precio_venta_nuevo`, { valueAsNumber: true })}
              />
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
        ) : (
          <Field
            label="Precio de venta nuevo (USD)"
            required
            error={itemErrors?.precio_venta_nuevo?.message}
          >
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={[
                styles.input,
                styles.inputPrecio,
                itemErrors?.precio_venta_nuevo ? styles.inputError : '',
              ]
                .filter(Boolean)
                .join(' ')}
              {...register(`items.${index}.precio_venta_nuevo`, { valueAsNumber: true })}
            />
          </Field>
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
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        <span className={styles.fieldLabelText}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </span>
        {children}
      </label>
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
}
