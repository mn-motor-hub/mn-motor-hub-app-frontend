'use client'; // edición inline por fila (estado local + Server Action)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Check, X } from 'lucide-react';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@mn/design-system/ui';
import { formatCurrencyUsd } from '@/lib/utils/format';
import { updateSupplierRefAction } from '@/app/(dashboard)/inventario/actions';
import {
  editSupplierRefSchema,
  type EditSupplierRefFormData,
} from '@/lib/schemas/supplier-ref.schema';
import type { SupplierRef } from '@/types';
import styles from './SupplierRefList.module.css';

interface SupplierRefListProps {
  autoPartId: number;
  refs: SupplierRef[];
}

export function SupplierRefList({ autoPartId, refs }: SupplierRefListProps) {
  if (refs.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay referencias de proveedores para este repuesto.</p>
      </div>
    );
  }

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Proveedor</Th>
          <Th>Código externo</Th>
          <Th>Precio compra</Th>
          <Th>Notas</Th>
          <Th>Estado</Th>
          <Th aria-label="Acciones" />
        </Tr>
      </Thead>
      <Tbody>
        {refs.map((item) => (
          <SupplierRefRow key={item.id} autoPartId={autoPartId} item={item} />
        ))}
      </Tbody>
    </Table>
  );
}

// ── Fila individual — muestra/edita en el lugar ─────────────────────────────

function defaultsFrom(item: SupplierRef): EditSupplierRefFormData {
  return {
    referenciaProveedor: item.referenciaProveedor ?? '',
    precioCompra: item.precioCompra ?? undefined,
    notas: item.notas ?? '',
  };
}

function SupplierRefRow({ autoPartId, item }: { autoPartId: number; item: SupplierRef }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditSupplierRefFormData>({
    resolver: zodResolver(editSupplierRefSchema),
    defaultValues: defaultsFrom(item),
  });

  function handleCancel() {
    setEditing(false);
    setSubmitError(null);
    reset(defaultsFrom(item));
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    const result = await updateSupplierRefAction(autoPartId, item.id, {
      referenciaProveedor: data.referenciaProveedor,
      precioCompra: data.precioCompra,
      notas: data.notas,
    });

    if (result.ok) {
      setEditing(false);
      // El prop `item` no refleja lo recién guardado hasta que router.refresh()
      // resuelva — sincroniza el form ahora para que una reapertura inmediata
      // no muestre los valores originales del mount.
      reset(data);
      router.refresh();
      return;
    }
    setSubmitError(result.error);
  });

  function handleEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  }

  const estadoBadge = item.activo ? (
    <Badge variant="success">Activo</Badge>
  ) : (
    <Badge variant="neutral">Inactivo</Badge>
  );

  if (!editing) {
    return (
      <Tr>
        <Td className={styles.proveedor}>{item.supplier?.nombre ?? '—'}</Td>
        <Td className={styles.code}>{item.referenciaProveedor ?? '—'}</Td>
        <Td>
          {item.precioCompra != null ? (
            formatCurrencyUsd(Number(item.precioCompra))
          ) : (
            <span className={styles.muted}>—</span>
          )}
        </Td>
        <Td className={styles.notas}>{item.notas ?? <span className={styles.muted}>—</span>}</Td>
        <Td>{estadoBadge}</Td>
        <Td>
          <button
            type="button"
            className={styles.rowActionButton}
            onClick={() => setEditing(true)}
            aria-label={`Editar referencia de ${item.supplier?.nombre ?? 'proveedor'}`}
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
        </Td>
      </Tr>
    );
  }

  return (
    <Tr>
      <Td className={styles.proveedor}>{item.supplier?.nombre ?? '—'}</Td>
      <Td>
        <input
          type="text"
          className={styles.rowInput}
          placeholder="Código externo"
          aria-label="Código externo"
          onKeyDown={handleEnter}
          {...register('referenciaProveedor')}
        />
        {errors.referenciaProveedor && (
          <span className={styles.rowError}>{errors.referenciaProveedor.message}</span>
        )}
      </Td>
      <Td>
        <input
          type="number"
          step="0.01"
          min="0"
          className={styles.rowInput}
          placeholder="0.00"
          aria-label="Precio compra"
          onKeyDown={handleEnter}
          {...register('precioCompra', { valueAsNumber: true })}
        />
        {errors.precioCompra && <span className={styles.rowError}>{errors.precioCompra.message}</span>}
      </Td>
      <Td>
        <input
          type="text"
          className={styles.rowInput}
          placeholder="Notas"
          aria-label="Notas"
          onKeyDown={handleEnter}
          {...register('notas')}
        />
      </Td>
      <Td>{estadoBadge}</Td>
      <Td>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.rowActionButton}
            onClick={onSubmit}
            disabled={isSubmitting}
            aria-label="Guardar"
          >
            <Check size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.rowActionButtonCancel}
            onClick={handleCancel}
            disabled={isSubmitting}
            aria-label="Cancelar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {submitError && <span className={styles.rowError}>{submitError}</span>}
      </Td>
    </Tr>
  );
}
