import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { BrechaHistoricoChart } from '@/components/charts/BrechaHistoricoChart/BrechaHistoricoChart';
import { AjustesAvanzados } from '@/components/features/pricing/AjustesAvanzados';
import { KSugeridoPanel } from '@/components/features/pricing/KSugeridoPanel';
import { MotorPreciosHeader } from '@/components/features/pricing/MotorPreciosHeader';
import { TasasReadout } from '@/components/features/pricing/TasasReadout';
import { listConfiguraciones } from '@/lib/api/configuraciones';
import { getBrechaHistorico, getBrechaStatus } from '@/lib/api/pricing';
import { getTasasSalud } from '@/lib/api/tasas';
import { withFallback } from '@/lib/utils/with-fallback';
import type { BrechaHistoricoPoint, BrechaStatus, Configuracion, TasaSalud } from '@/types';
import styles from './motor-de-precios.module.css';

export default async function MotorDePreciosPage() {
  return (
    <>
      <Navbar
        title="Motor de precios"
        breadcrumb={[
          { label: 'Dashboard' },
          { label: 'Configuración', href: '/configuracion' },
          { label: 'Motor de precios' },
        ]}
      />

      <div className={styles.content}>
        <Suspense fallback={<HeaderSkeleton />}>
          <EstadoSection />
        </Suspense>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tasas del día</h2>
          <Suspense fallback={<ReadoutSkeleton />}>
            <TasasSection />
          </Suspense>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Brecha vs. banda — últimos 30 días</h2>
          <Suspense fallback={<ChartSkeleton />}>
            <GraficoSection />
          </Suspense>
        </section>

        {/*
          Sin Suspense y sin fetch en el server: el cálculo lo dispara el
          usuario con un botón. Pedirlo en el render metería el cómputo en el
          camino de carga de la pantalla sin que nadie lo haya pedido.
        */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Factor K sugerido</h2>
          <p className={styles.sectionIntro}>
            Calcula el K a partir de la mediana de la brecha de los últimos días. El valor no se
            aplica hasta que lo confirmes.
          </p>
          <KSugeridoPanel />
        </section>

        <Suspense fallback={<AjustesSkeleton />}>
          <AjustesSection />
        </Suspense>
      </div>
    </>
  );
}

async function EstadoSection() {
  const status = await withFallback<BrechaStatus | null>(getBrechaStatus(), null);

  if (!status) {
    return (
      <p className={styles.error} role="alert">
        No se pudo obtener el estado de la brecha cambiaria.
      </p>
    );
  }

  return <MotorPreciosHeader status={status} />;
}

async function TasasSection() {
  const salud = await withFallback<TasaSalud[]>(getTasasSalud(), []);
  return <TasasReadout salud={salud} />;
}

/**
 * La banda sale del mismo `brecha-status` que el encabezado — nunca del 15/25
 * por default. Si el status no cargó, el gráfico se dibuja sin las líneas de
 * banda en vez de inventarlas.
 */
async function GraficoSection() {
  const [historico, status] = await Promise.all([
    withFallback<BrechaHistoricoPoint[]>(getBrechaHistorico(), []),
    withFallback<BrechaStatus | null>(getBrechaStatus(), null),
  ]);

  return (
    <BrechaHistoricoChart
      data={historico}
      bandaMin={status?.bandaMin}
      bandaMax={status?.bandaMax}
    />
  );
}

async function AjustesSection() {
  const configuraciones = await withFallback<Configuracion[]>(listConfiguraciones(), []);
  return <AjustesAvanzados configuraciones={configuraciones} />;
}

function AjustesSkeleton() {
  return <div className={styles.skeletonAjustes} aria-hidden="true" />;
}

function HeaderSkeleton() {
  return <div className={styles.skeletonHeader} aria-hidden="true" />;
}

function ReadoutSkeleton() {
  return (
    <div className={styles.skeletonReadout} aria-hidden="true">
      <div className={styles.skeletonTasa} />
      <div className={styles.skeletonTasa} />
    </div>
  );
}

function ChartSkeleton() {
  return <div className={styles.skeletonChart} aria-hidden="true" />;
}
