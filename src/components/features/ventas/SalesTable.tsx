'use client'; // useReactTable es un hook de TanStack

import Link from 'next/link';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table/Table';
import { AnularSaleButton } from './AnularSaleButton';
import { ConfirmarSaleButton } from './ConfirmarSaleButton';
import { SaleEstadoBadge } from './SaleEstadoBadge';
import { formatCurrencyUsd, formatDate } from '@/lib/utils/format';
import type { Sale } from '@/types';
import styles from './SalesTable.module.css';

const columnHelper = createColumnHelper<Sale>();

interface SalesTableProps {
  data: Sale[];
}

export function SalesTable({ data }: SalesTableProps) {
  const columns = [
    columnHelper.accessor('fecha', {
      header: 'Fecha',
      cell: (info) => <span className={styles.date}>{formatDate(info.getValue())}</span>,
    }),
    columnHelper.accessor('clienteNombre', {
      header: 'Cliente',
      cell: (info) => (
        <Link href={`/ventas/${info.row.original.id}`} className={styles.clienteLink}>
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor('totalUsd', {
      header: () => <span className={styles.amountHeader}>Total</span>,
      cell: (info) => <span className={styles.amount}>{formatCurrencyUsd(info.getValue())}</span>,
    }),
    columnHelper.accessor('formaPago', {
      header: 'Forma de pago',
      cell: (info) => (info.getValue() === 'usd' ? 'USD' : 'Bs'),
    }),
    columnHelper.accessor('estado', {
      header: 'Estado',
      cell: (info) => <SaleEstadoBadge estado={info.getValue()} />,
    }),
    columnHelper.accessor('createdBy', {
      header: 'Registrado por',
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: 'acciones',
      header: 'Acciones',
      cell: (info) => (
        <div className={styles.actions}>
          <Link href={`/ventas/${info.row.original.id}`} className={styles.detailLink}>
            Ver
          </Link>
          <ConfirmarSaleButton sale={info.row.original} variant="icon" />
          <AnularSaleButton sale={info.row.original} variant="icon" />
        </div>
      ),
    }),
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No se encontraron ventas con los filtros actuales.</p>
      </div>
    );
  }

  return (
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
              <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
