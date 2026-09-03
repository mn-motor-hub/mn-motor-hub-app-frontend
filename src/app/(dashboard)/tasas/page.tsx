import { Suspense } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { HistorialFilters } from '@/components/features/tasas/HistorialFilters';
import { HistorialTable } from '@/components/features/tasas/HistorialTable';
import { RefreshTasasButton } from '@/components/features/tasas/RefreshTasasButton';
import { TasaSaludCard } from '@/components/features/tasas/TasaSaludCard';
import { Pagination } from '@mn/design-system/ui';
import { getTasas, getTasasHistorial, getTasasSalud } from '@/lib/api/tasas';
import { withFallback } from '@/lib/utils/with-fallback';
import type {
  PaginationMeta,
  Tasa,
  TasaFetchLog,
  TasaOrigen,
  TasaResultado,
  TasaSalud,
} from '@/types';
import styles from './tasas.module.css';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    clave?: string;
    resultado?: string;
    origen?: string;
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
      <Navbar title="Tasas" breadcrumb={[{ label: 'Panel' }, { label: 'Tasas' }]} />
      <div className={styles.content}>
        <section className={styles.saludSection} aria-label="Estado de las tasas">
          <div className={styles.saludHeader}>
            <h2 className={styles.sectionTitle}>Estado de las tasas</h2>
            {/* Fuera del Suspense: el botón no depende de los datos y así está
                disponible incluso si /salud tarda o falla. */}
            <RefreshTasasButton />
          </div>

          <Suspense fallback={<SaludSkeleton />}>
            <SaludSection />
          </Suspense>
        </section>

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
    <div className={styles.saludGrid}>
      {salud.map((t) => (
        <TasaSaludCard key={t.clave} salud={t} />
      ))}
    </div>
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
  let historial: { data: TasaFetchLog[]; meta: PaginationMeta };

  try {
    historial = await getTasasHistorial({
      page: parsePage(params.page),
      limit: 20,
      clave: params.clave || undefined,
      resultado: parseResultado(params.resultado),
      origen: parseOrigen(params.origen),
    });
  } catch (err) {
    /*
      El backend valida los filtros: 400 si no entiende uno, 404 si la clave no
      existe. Antes devolvía una lista vacía y el typo era invisible.

      Como los filtros salen de la URL, cualquiera puede escribir `?clave=typo` a
      mano: sin este catch el throw sube hasta el error boundary global —este
      segmento todavía no tiene error.tsx— y se lleva puesta también la sección
      de salud, que no tiene nada que ver. Se muestra el mensaje del backend,
      que dice cuál es el filtro malo.

      No se usa withFallback a propósito: caer a una lista vacía diría "no hay
      intentos con estos filtros", que ahora es una afirmación distinta y falsa.
    */
    unstable_rethrow(err);
    return (
      <p className={styles.historialError} role="alert">
        {err instanceof Error ? err.message : 'No se pudo obtener el historial de intentos.'}
      </p>
    );
  }

  const { data, meta } = historial;

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

/*
  Los dos parsers descartan un valor que no reconocen en vez de reenviarlo. El
  backend contesta 400 ante un filtro inválido y ese mensaje se muestra, así que
  reenviarlo también sería defendible; se filtra acá porque un `?resultado=`
  vacío o pegado de una URL vieja no es un error que valga interrumpir la
  pantalla. La clave sí viaja tal cual: sus valores válidos los conoce el
  backend, no este archivo.
*/
function parseResultado(raw: string | undefined): TasaResultado | undefined {
  return raw === 'exito' || raw === 'fallo' ? raw : undefined;
}

function parseOrigen(raw: string | undefined): TasaOrigen | undefined {
  return raw === 'programado' || raw === 'manual' ? raw : undefined;
}
