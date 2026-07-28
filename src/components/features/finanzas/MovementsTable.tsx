'use client'; // useReactTable es un hook de TanStack + estado de los modales

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table/Table';
import { Badge } from '@/components/ui/Badge/Badge';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { MovementFormModal } from './MovementFormModal';
import { deleteMovementAction } from '@/app/(dashboard)/finanzas/actions';
import { formatCurrencyUsd, formatDate } from '@/lib/utils/format';
import type { FinancialCategory, FinancialMovement } from '@/types';
import styles from './MovementsTable.module.css';

const columnHelper = createColumnHelper<FinancialMovement>();

interface MovementsTableProps {
  data: FinancialMovement[];
  categorias: FinancialCategory[];
}

export function MovementsTable({ data, categorias }: MovementsTableProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<FinancialMovement | null>(null);
  const [deleting, setDeleting] = useState<FinancialMovement | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const columns = [
    columnHelper.accessor('date', {
      header: 'Fecha',
      cell: (info) => <span className={styles.date}>{formatDate(info.getValue())}</span>,
    }),
    columnHelper.accessor('type', {
      header: 'Tipo',
      cell: (info) =>
        info.getValue() === 'ingreso' ? (
          <Badge variant="info">Ingreso</Badge>
        ) : (
          <Badge variant="warning">Gasto</Badge>
        ),
    }),
    columnHelper.accessor('categoryName', {
      header: 'Categoría',
      cell: (info) => info.getValue() ?? <span className={styles.muted}>—</span>,
    }),
    columnHelper.accessor('description', {
      header: 'Descripción',
      cell: (info) => <span className={styles.description}>{info.getValue()}</span>,
    }),
    columnHelper.accessor('amount', {
      header: () => <span className={styles.amountHeader}>Monto</span>,
      cell: (info) => (
        <span className={styles.amount}>{formatCurrencyUsd(info.getValue())}</span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Estado',
      cell: (info) =>
        info.getValue() === 'confirmado' ? (
          <Badge variant="success">Confirmado</Badge>
        ) : (
          <Badge variant="neutral">Planificado</Badge>
        ),
    }),
    columnHelper.accessor('registeredBy', {
      header: 'Registrado por',
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: 'acciones',
      header: 'Acciones',
      cell: (info) => (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => setEditing(info.row.original)}
            aria-label={`Editar ${info.row.original.description}`}
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionDanger}`}
            onClick={() => {
              setDeleting(info.row.original);
              setDeleteError(null);
            }}
            aria-label={`Eliminar ${info.row.original.description}`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  async function handleDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    setDeleteError(null);

    const result = await deleteMovementAction(deleting.id);
    if (result.ok) {
      setDeleting(null);
      router.refresh();
    } else {
      setDeleteError(result.error);
    }
    setDeletingBusy(false);
  }

  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No se encontraron movimientos con los filtros actuales.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows.map((row) => (
            <Tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>

      {editing && (
        <MovementFormModal
          open
          onOpenChange={(v) => { if (!v) setEditing(null); }}
          categorias={categorias}
          movement={editing}
        />
      )}

      <Modal
        open={deleting !== null}
        onOpenChange={(v) => { if (!v && !deletingBusy) setDeleting(null); }}
        title="Eliminar movimiento"
        size="sm"
      >
        <div className={styles.confirmBody}>
          <p className={styles.confirmText}>
            ¿Eliminar este movimiento? Esta acción se puede revertir después.
          </p>
          {deleting && (
            <p className={styles.confirmDetail}>
              <span className={styles.confirmDetailDesc}>{deleting.description}</span>
              <span className={styles.confirmDetailAmount}>
                {formatCurrencyUsd(deleting.amount)} · {formatDate(deleting.date)}
              </span>
            </p>
          )}
          <p className={styles.confirmNote}>
            El movimiento se marca como inactivo y deja de sumar en los totales, pero el
            registro no se borra de la base.
          </p>

          {deleteError && (
            <p className={styles.confirmError} role="alert">
              {deleteError}
            </p>
          )}

          <div className={styles.confirmActions}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleting(null)}
              disabled={deletingBusy}
            >
              Cancelar
            </Button>
            <Button type="button" loading={deletingBusy} onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
