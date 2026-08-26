import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { SaleFilters } from '@/components/features/ventas/SaleFilters';
import { SalesTable } from '@/components/features/ventas/SalesTable';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import { getSales } from '@/lib/api/sales';
import type { SaleEstado } from '@/types';
import styles from './ventas.module.css';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    cliente?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }>;
}

export default async function VentasPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <Navbar title="Ventas" breadcrumb={[{ label: 'Dashboard' }, { label: 'Ventas' }]} />
      <div className={styles.content}>
        <SaleFilters
          rightSlot={
            <Link href="/ventas/nueva" className={styles.newSaleLink}>
              <Plus size={16} aria-hidden="true" />
              Nueva venta
            </Link>
          }
        />

        <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton />}>
          <SalesSection params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function SalesSection({
  params,
}: {
  params: Awaited<PageProps['searchParams']>;
}) {
  const page = parsePage(params.page);

  const { data, meta } = await getSales({
    page,
    limit: 20,
    cliente: params.cliente || undefined,
    estado: parseEstado(params.estado),
    fechaDesde: params.fechaDesde || undefined,
    fechaHasta: params.fechaHasta || undefined,
  });

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <p className={styles.count}>
          {meta.total} venta{meta.total !== 1 ? 's' : ''} encontrada{meta.total !== 1 ? 's' : ''}
        </p>
        {meta.totalPages > 0 && (
          <p className={styles.pageInfo}>
            Página {meta.page} de {meta.totalPages}
          </p>
        )}
      </div>

      <SalesTable data={data} />

      <Pagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        basePath="/ventas"
        searchParams={params}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className={styles.skeletonTable} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  );
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function parseEstado(raw: string | undefined): SaleEstado | undefined {
  return raw === 'en_proceso' || raw === 'confirmada' || raw === 'anulada' ? raw : undefined;
}
