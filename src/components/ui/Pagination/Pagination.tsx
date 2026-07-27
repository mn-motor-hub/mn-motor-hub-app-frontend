import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  /**
   * searchParams de la página, para preservar los filtros activos al cambiar de
   * página. Se recibe por prop porque este es un Server Component y no puede
   * leer useSearchParams(); la page ya los tiene resueltos.
   */
  searchParams?: Record<string, string | string[] | undefined>;
  /** Cuántas páginas mostrar alrededor de la actual. */
  siblingCount?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
  siblingCount = 1,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const page = clamp(currentPage, 1, totalPages);

  function hrefFor(target: number): string {
    const params = new URLSearchParams();
    // Se preservan todos los params existentes salvo `page`, que se reescribe.
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (key === 'page' || value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else params.set(key, value);
    }
    params.set('page', String(target));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav className={styles.nav} aria-label="Paginación">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={styles.arrow} rel="prev" aria-label="Página anterior">
          <ChevronLeft size={16} aria-hidden="true" />
          <span className={styles.arrowLabel}>Anterior</span>
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          <ChevronLeft size={16} />
          <span className={styles.arrowLabel}>Anterior</span>
        </span>
      )}

      <ul className={styles.pages}>
        {buildPageList(page, totalPages, siblingCount).map((item, i) =>
          item === 'ellipsis' ? (
            <li key={`gap-${i}`} className={styles.ellipsis} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefFor(item)}
                className={`${styles.page} ${item === page ? styles.pageActive : ''}`}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ul>

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={styles.arrow} rel="next" aria-label="Página siguiente">
          <span className={styles.arrowLabel}>Siguiente</span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          <span className={styles.arrowLabel}>Siguiente</span>
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(Number.isFinite(n) ? n : min, min), max);
}

/**
 * Ventana de páginas alrededor de la actual, con la primera y la última siempre
 * visibles y puntos suspensivos en los saltos. Ej. (7, 20, 1) → 1 … 6 7 8 … 20
 */
function buildPageList(
  current: number,
  total: number,
  siblingCount: number,
): Array<number | 'ellipsis'> {
  const first = 1;
  const last = total;
  const start = Math.max(first, current - siblingCount);
  const end = Math.min(last, current + siblingCount);

  const pages: Array<number | 'ellipsis'> = [];

  if (start > first) {
    pages.push(first);
    // Sin salto real: la página contigua se muestra en vez de los puntos.
    if (start > first + 1) pages.push(start > first + 2 ? 'ellipsis' : first + 1);
  }

  for (let p = start; p <= end; p++) pages.push(p);

  if (end < last) {
    if (end < last - 1) pages.push(end < last - 2 ? 'ellipsis' : last - 1);
    pages.push(last);
  }

  return pages;
}
