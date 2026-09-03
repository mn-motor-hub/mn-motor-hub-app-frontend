import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { MonthSelector } from '@/components/features/finanzas/MonthSelector';
import { ExpensesByCategoryChart } from '@/components/features/finanzas/ExpensesByCategoryChart';
import { NewMovementButton } from '@/components/features/finanzas/NewMovementButton';
import { StatCard } from '@/components/ui/StatCard/StatCard';
import { getFinancialSummary } from '@/lib/api/financial-movements';
import { getFinancialCategories } from '@/lib/api/financial-categories';
import { formatCurrencyUsd } from '@/lib/utils/format';
import type { FinancialCategory } from '@/types';
import styles from './finanzas.module.css';
import { withFallback } from '@/lib/utils/with-fallback';

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function FinanzasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const month = parseMonth(params.month) ?? now.getMonth() + 1;
  const year = parseYear(params.year) ?? now.getFullYear();

  // Se precargan acá (cache 300s) para que el modal no tenga que hacer su propio
  // fetch al abrir — el catálogo cambia poco y así el form abre sin espera.
  const categorias = await withFallback<FinancialCategory[]>(
    getFinancialCategories({ active: true }),
    [],
  );

  return (
    <>
      <Navbar title="Finanzas" breadcrumb={[{ label: 'Panel' }, { label: 'Finanzas' }]} />
      <div className={styles.content}>
        <div className={styles.header}>
          <MonthSelector month={month} year={year} basePath="/finanzas" searchParams={params} />
          <NewMovementButton categorias={categorias} />
        </div>

        {/* key: al cambiar de mes vuelve a suspender y muestra el skeleton */}
        <Suspense key={`${year}-${month}`} fallback={<SummarySkeleton />}>
          <SummarySection month={month} year={year} />
        </Suspense>
      </div>
    </>
  );
}

async function SummarySection({ month, year }: { month: number; year: number }) {
  const summary = await getFinancialSummary({ month, year });

  const gastos = summary.byCategory
    .filter((c) => c.type === 'gasto')
    .sort((a, b) => b.total - a.total);

  const balance = summary.balanceConfirmed;

  return (
    <>
      <div className={styles.stats}>
        <StatCard
          value={formatCurrencyUsd(summary.totalIncomeConfirmed)}
          label="Ingresos confirmados"
        />
        <StatCard
          value={formatCurrencyUsd(summary.totalExpensesConfirmed)}
          label="Egresos confirmados"
        />
        <StatCard
          value={formatCurrencyUsd(balance)}
          label="Balance confirmado"
          variant={balance > 0 ? 'success' : balance < 0 ? 'danger' : undefined}
        />
        <StatCard
          value={formatCurrencyUsd(summary.totalExpensesPlanned)}
          label="Egresos planificados"
        />
        {summary.totalIncomePlanned > 0 && (
          <StatCard
            value={formatCurrencyUsd(summary.totalIncomePlanned)}
            label="Ingresos planificados"
          />
        )}
      </div>

      <section className={styles.chartSection}>
        <h2 className={styles.chartHeading}>Gastos por categoría</h2>
        {gastos.length > 0 ? (
          <ExpensesByCategoryChart data={gastos} />
        ) : (
          <div className={styles.empty}>
            <p>Todavía no hay gastos confirmados este mes.</p>
          </div>
        )}

        {/* Abre el listado ya filtrado al mismo mes que se está viendo.
            `period.to` del backend es exclusivo y el filtro dateTo es inclusivo,
            de ahí el día anterior. */}
        <Link
          href={`/finanzas/movimientos?dateFrom=${summary.period.from}&dateTo=${previousDay(summary.period.to)}`}
          className={styles.allMovementsLink}
        >
          Ver todos los movimientos
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}

/** Día anterior a una fecha YYYY-MM-DD. En UTC para que no corra por zona horaria. */
function previousDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

function SummarySkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skeletonStats}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
      <div className={styles.skeletonChart} />
    </div>
  );
}

function parseMonth(raw: string | undefined): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

function parseYear(raw: string | undefined): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : null;
}
