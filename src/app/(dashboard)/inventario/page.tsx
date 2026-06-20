import { Suspense } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { AutoPartTable } from '@/components/features/inventario/AutoPartTable';
import { AutoPartFilters } from '@/components/features/inventario/AutoPartFilters';
import { getAutoParts } from '@/lib/api/auto-parts';
import { getCategorias } from '@/lib/api/categorias';
import type { Categoria } from '@/types';
import styles from './inventario.module.css';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    categoriaId?: string;
    marca?: string;
    stockBajo?: string;
  }>;
}

export default async function InventarioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? '1');

  const [partsData, categorias] = await Promise.all([
    getAutoParts({
      page,
      limit: 20,
      categoriaId: params.categoriaId ? Number(params.categoriaId) : undefined,
      marca: params.marca || undefined,
      stockBajo: params.stockBajo === 'true' || undefined,
    }),
    getCategorias().catch((): Categoria[] => []),
  ]);

  return (
    <>
      <Navbar title="Inventario" breadcrumb={[{ label: 'Dashboard' }, { label: 'Inventario' }]} />
      <div className={styles.content}>
        <Suspense>
          <AutoPartFilters categorias={categorias} />
        </Suspense>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <p className={styles.count}>
              {partsData.meta.total} repuesto{partsData.meta.total !== 1 ? 's' : ''} encontrado
              {partsData.meta.total !== 1 ? 's' : ''}
            </p>
            <p className={styles.pagination}>
              Página {partsData.meta.page} de {partsData.meta.totalPages}
            </p>
          </div>

          <AutoPartTable data={partsData.data} />

          <Suspense>
            <PaginationControls meta={partsData.meta} searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

function PaginationControls({
  meta,
  searchParams,
}: {
  meta: { page: number; totalPages: number };
  searchParams: Record<string, string | undefined>;
}) {
  function buildUrl(page: number) {
    const p = new URLSearchParams();
    if (searchParams.categoriaId) p.set('categoriaId', searchParams.categoriaId);
    if (searchParams.marca) p.set('marca', searchParams.marca);
    if (searchParams.stockBajo) p.set('stockBajo', searchParams.stockBajo);
    p.set('page', String(page));
    return `/inventario?${p.toString()}`;
  }

  return (
    <div className={styles.paginationRow}>
      {meta.page > 1 && (
        <Link href={buildUrl(meta.page - 1)} className={styles.pageLink}>← Anterior</Link>
      )}
      {meta.page < meta.totalPages && (
        <Link href={buildUrl(meta.page + 1)} className={styles.pageLink}>Siguiente →</Link>
      )}
    </div>
  );
}
