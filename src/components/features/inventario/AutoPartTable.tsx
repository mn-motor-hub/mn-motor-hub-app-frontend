'use client'; // useReactTable es un hook de TanStack

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table/Table';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatCurrencyUsd } from '@/lib/utils/format';
import type { AutoPart } from '@/types';
import styles from './AutoPartTable.module.css';

const columnHelper = createColumnHelper<AutoPart>();

const columns = [
  columnHelper.accessor('codigoInterno', {
    header: 'Código',
    cell: (info) => <span className={styles.code}>{info.getValue()}</span>,
  }),
  columnHelper.accessor('nombre', {
    header: 'Nombre',
    cell: (info) => <span className={styles.nombre}>{info.getValue()}</span>,
  }),
  columnHelper.accessor('marca', {
    header: 'Marca',
    cell: (info) => info.getValue() ?? <span className={styles.muted}>—</span>,
  }),
  columnHelper.accessor('categoria', {
    header: 'Categoría',
    cell: (info) => {
      const cat = info.getValue();
      return cat ? <Badge variant="info">{cat.nombre}</Badge> : <span className={styles.muted}>—</span>;
    },
  }),
  columnHelper.accessor('precioVenta', {
    header: 'Precio',
    cell: (info) => {
      const val = info.getValue();
      return val != null ? formatCurrencyUsd(Number(val)) : <span className={styles.muted}>—</span>;
    },
  }),
  columnHelper.accessor('stockActual', {
    header: 'Stock',
    cell: (info) => {
      const row = info.row.original;
      const isBelowMin = info.getValue() <= row.stockMinimo;
      return (
        <span className={isBelowMin ? styles.stockLow : styles.stockOk}>
          {info.getValue()}
        </span>
      );
    },
  }),
  columnHelper.accessor('activo', {
    header: 'Estado',
    cell: (info) =>
      info.getValue() ? (
        <Badge variant="success">Activo</Badge>
      ) : (
        <Badge variant="neutral">Inactivo</Badge>
      ),
  }),
  columnHelper.display({
    id: 'acciones',
    header: 'Ver',
    cell: (info) => (
      <Link href={`/inventario/${info.row.original.id}`} className={styles.viewLink}>
        <Eye size={16} />
      </Link>
    ),
  }),
];

interface AutoPartTableProps {
  data: AutoPart[];
}

export function AutoPartTable({ data }: AutoPartTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No se encontraron repuestos con los filtros actuales.</p>
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
              <Td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
