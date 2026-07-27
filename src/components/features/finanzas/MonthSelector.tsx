import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './MonthSelector.module.css';

interface MonthSelectorProps {
  month: number; // 1-12
  year: number;
  basePath: string;
  /**
   * searchParams de la página, para preservar el resto de los filtros al cambiar
   * de mes. Se recibe por prop porque es un Server Component y no puede leer
   * useSearchParams(); la page ya los tiene resueltos.
   */
  searchParams?: Record<string, string | string[] | undefined>;
}

export function MonthSelector({ month, year, basePath, searchParams }: MonthSelectorProps) {
  const prev = shiftMonth(month, year, -1);
  const next = shiftMonth(month, year, 1);

  function hrefFor(target: { month: number; year: number }): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (key === 'month' || key === 'year' || value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else params.set(key, value);
    }
    params.set('month', String(target.month));
    params.set('year', String(target.year));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav className={styles.nav} aria-label="Seleccionar mes">
      <Link
        href={hrefFor(prev)}
        className={styles.arrow}
        rel="prev"
        aria-label={`Ir a ${formatMonthYear(prev.month, prev.year)}`}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </Link>

      <p className={styles.label} aria-live="polite">
        {formatMonthYear(month, year)}
      </p>

      <Link
        href={hrefFor(next)}
        className={styles.arrow}
        rel="next"
        aria-label={`Ir a ${formatMonthYear(next.month, next.year)}`}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </nav>
  );
}

function shiftMonth(month: number, year: number, delta: number): { month: number; year: number } {
  const zeroBased = month - 1 + delta;
  return {
    month: ((zeroBased % 12) + 12) % 12 + 1,
    year: year + Math.floor(zeroBased / 12),
  };
}

function formatMonthYear(month: number, year: number): string {
  const name = new Intl.DateTimeFormat('es-VE', { month: 'long' }).format(
    new Date(year, month - 1, 1),
  );
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}
