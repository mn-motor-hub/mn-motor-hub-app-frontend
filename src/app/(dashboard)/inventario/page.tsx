import { Suspense } from 'react';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { AutoPartTable } from '@/components/features/inventario/AutoPartTable';
import { AutoPartFilters } from '@/components/features/inventario/AutoPartFilters';
import { getAutoParts } from '@/lib/api/auto-parts';
import { getCategorias } from '@/lib/api/categorias';
import { listSubcategorias } from '@/lib/api/subcategorias';
import type { AutoPart, Categoria, Subcategoria } from '@/types';
import styles from './inventario.module.css';
import { withFallback } from '@/lib/utils/with-fallback';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    categoriaId?: string;
    subcategoriaId?: string;
    q?: string;
    stockBajo?: string;
  }>;
}

export default async function InventarioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? '1');

  const [categorias, subcategorias] = await Promise.all([
    withFallback<Categoria[]>(getCategorias(), []),
    withFallback<Subcategoria[]>(listSubcategorias(), []),
  ]);

  // El backend solo filtra por un subcategoria_id exacto — no hay categoriaId
  // ni lista de ids. Si el usuario eligió una subcategoría puntual, se manda
  // tal cual (filtro real, paginación correcta). Si solo eligió categoría, se
  // trae la página normal y se recorta client-side contra las subcategorías
  // de esa categoría — el conteo y la paginación siguen reflejando el total
  // del backend (sin el recorte), no el total ya filtrado.
  const partsData = await getAutoParts({
    page,
    limit: 20,
    subcategoriaId: params.subcategoriaId || undefined,
    q: params.q || undefined,
    stockBajo: params.stockBajo === 'true' || undefined,
  });

  const categoriaIdFiltro = !params.subcategoriaId ? params.categoriaId : undefined;
  const visibleData = categoriaIdFiltro
    ? filterByCategoria(partsData.data, subcategorias, categoriaIdFiltro)
    : partsData.data;

  return (
    <>
      <Navbar title="Inventario" breadcrumb={[{ label: 'Dashboard' }, { label: 'Inventario' }]} />
      <div className={styles.content}>
        <Suspense>
          <AutoPartFilters
            categorias={categorias}
            subcategorias={subcategorias}
            rightSlot={
              <Link href="/inventario/importar" className={styles.importLink}>
                <Upload size={16} aria-hidden="true" />
                Importar factura
              </Link>
            }
          />
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

          <AutoPartTable data={visibleData} categorias={categorias} />

          <Suspense>
            <PaginationControls meta={partsData.meta} searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

function filterByCategoria(
  data: AutoPart[],
  subcategorias: Subcategoria[],
  categoriaId: string,
): AutoPart[] {
  const idsDeCategoria = new Set(
    subcategorias.filter((s) => s.categoriaId === categoriaId).map((s) => s.id),
  );
  return data.filter((part) => idsDeCategoria.has(part.subcategoriaId));
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
    if (searchParams.subcategoriaId) p.set('subcategoriaId', searchParams.subcategoriaId);
    if (searchParams.q) p.set('q', searchParams.q);
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
