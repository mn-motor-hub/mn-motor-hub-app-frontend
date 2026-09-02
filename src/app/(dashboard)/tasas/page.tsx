import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { HistorialFilters } from '@/components/features/tasas/HistorialFilters';
import { HistorialTable } from '@/components/features/tasas/HistorialTable';
import { TasaSaludCard } from '@/components/features/tasas/TasaSaludCard';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import { getTasas, getTasasHistorial, getTasasSalud } from '@/lib/api/tasas';
import { withFallback } from '@/lib/utils/with-fallback';
import type { Tasa, TasaResultado, TasaSalud } from '@/types';
import styles from './tasas.module.css';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    clave?: string;
    resultado?: string;
  }>;
}

/**
 * La pantalla lee de la base y nada más: ni esta página ni sus componentes
 * llaman a POST /api/tasas/fetch. Ese scrapeo tarda hasta 25 s con una fuente
 * caída y le pega al BCV desde una sola IP; disparado en cada carga sería 25 s
 * en el camino del usuario y la vía rápida a que nos bloqueen. Sale únicamente
 * del botón explícito, que vive en actions.ts.
 */
export default async function TasasPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <Navbar title="Tasas" breadcrumb={[{ label: 'Dashboard' }, { label: 'Tasas' }]} />
      <div className={styles.content}>
        <Suspense fallback={<SaludSkeleton />}>
          <SaludSection />
        </Suspense>

        <section className={styles.historialSection}>
          <h2 className={styles.sectionTitle}>Historial de intentos</h2>

          <Suspense fallback={<FiltersSkeleton />}>
            <FiltersSection />
          </Suspense>

          <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton />}>
            <HistorialSection params={params} />
          </Suspense>
        </section>
      </div>
    </>
  );
}

async function SaludSection() {
  const salud = await withFallback<TasaSalud[]>(getTasasSalud(), []);

  if (salud.length === 0) {
    return <p className={styles.saludError}>No se pudo obtener el estado de las tasas.</p>;
  }

  return (
    <section className={styles.saludSection} aria-label="Estado de las tasas">
      <div className={styles.saludGrid}>
        {salud.map((t) => (
          <TasaSaludCard key={t.clave} salud={t} />
        ))}
      </div>
    </section>
  );
}

/**
 * Las opciones del filtro salen de GET /api/tasas (cacheado 5 min) y no de
 * /salud: es la misma clave y label, y evita repetir el fetch `no-store` que
 * ya hizo SaludSection en este mismo render.
 */
async function FiltersSection() {
  const tasas = await withFallback<Tasa[]>(getTasas(), []);
  return <HistorialFilters tasas={tasas} />;
}

async function HistorialSection({ params }: { params: Awaited<PageProps['searchParams']> }) {
  const { data, meta } = await getTasasHistorial({
    page: parsePage(params.page),
    limit: 20,
    clave: params.clave || undefined,
    resultado: parseResultado(params.resultado),
  });

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <p className={styles.count}>
          {meta.total} intento{meta.total !== 1 ? 's' : ''} registrado
          {meta.total !== 1 ? 's' : ''}
        </p>
        {meta.totalPages > 0 && (
          <p className={styles.pageInfo}>
            Página {meta.page} de {meta.totalPages}
          </p>
        )}
      </div>

      <HistorialTable data={data} />

      <Pagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        basePath="/tasas"
        searchParams={params}
      />
    </div>
  );
}

function SaludSkeleton() {
  return (
    <div className={styles.saludGrid} aria-hidden="true">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
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

function parseResultado(raw: string | undefined): TasaResultado | undefined {
  return raw === 'exito' || raw === 'fallo' ? raw : undefined;
}
