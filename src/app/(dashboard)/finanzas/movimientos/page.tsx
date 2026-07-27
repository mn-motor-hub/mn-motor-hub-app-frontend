import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { MovementFilters } from '@/components/features/finanzas/MovementFilters';
import { MovementsTable } from '@/components/features/finanzas/MovementsTable';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import { getFinancialMovements } from '@/lib/api/financial-movements';
import { getFinancialCategories } from '@/lib/api/financial-categories';
import type { FinancialCategory, FinancialMovementStatus, FinancialType } from '@/types';
import styles from './movimientos.module.css';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    financialCategoryId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function MovimientosPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <Navbar
        title="Movimientos"
        breadcrumb={[
          { label: 'Dashboard' },
          { label: 'Finanzas', href: '/finanzas' },
          { label: 'Movimientos' },
        ]}
      />
      <div className={styles.content}>
        <Suspense fallback={<FiltersSkeleton />}>
          <FiltersSection />
        </Suspense>

        <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton />}>
          <MovementsSection params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function FiltersSection() {
  const categorias = await getFinancialCategories({ active: true }).catch(
    (): FinancialCategory[] => [],
  );
  return <MovementFilters categorias={categorias} />;
}

async function MovementsSection({
  params,
}: {
  params: Awaited<PageProps['searchParams']>;
}) {
  const page = parsePage(params.page);

  const [movementsData, categorias] = await Promise.all([
    getFinancialMovements({
      page,
      limit: 20,
      type: parseType(params.type),
      status: parseStatus(params.status),
      financialCategoryId: parseId(params.financialCategoryId),
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
    }),
    getFinancialCategories({ active: true }).catch((): FinancialCategory[] => []),
  ]);

  const { data, meta } = movementsData;

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <p className={styles.count}>
          {meta.total} movimiento{meta.total !== 1 ? 's' : ''} encontrado
          {meta.total !== 1 ? 's' : ''}
        </p>
        {meta.totalPages > 0 && (
          <p className={styles.pageInfo}>
            Página {meta.page} de {meta.totalPages}
          </p>
        )}
      </div>

      <MovementsTable data={data} categorias={categorias} />

      <Pagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        basePath="/finanzas/movimientos"
        searchParams={params}
      />
    </div>
  );
}

function FiltersSkeleton() {
  return <div className={styles.skeletonFilters} aria-hidden="true" />;
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

function parseType(raw: string | undefined): FinancialType | undefined {
  return raw === 'ingreso' || raw === 'gasto' ? raw : undefined;
}

function parseStatus(raw: string | undefined): FinancialMovementStatus | undefined {
  return raw === 'confirmado' || raw === 'planificado' ? raw : undefined;
}

function parseId(raw: string | undefined): number | undefined {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}
