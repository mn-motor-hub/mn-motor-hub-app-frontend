import { Navbar } from '@/components/layout/Navbar/Navbar';
import { BrechaStatusWidget } from '@/components/features/dashboard/BrechaStatusWidget';
import { BrechaHistoricoChart } from '@/components/charts/BrechaHistoricoChart/BrechaHistoricoChart';
import { getBrechaStatus, getBrechaHistorico } from '@/lib/api/pricing';
import { withFallback } from '@/lib/utils/with-fallback';
import type { BrechaHistoricoPoint, BrechaStatus } from '@/types';
import styles from './home.module.css';

export default async function DashboardHomePage() {
  const [status, historico] = await Promise.all([
    withFallback<BrechaStatus | null>(getBrechaStatus(), null),
    withFallback<BrechaHistoricoPoint[]>(getBrechaHistorico(), []),
  ]);

  return (
    <>
      {/*
        El título dice lo que la pantalla muestra —brecha y su histórico— y no
        "Dashboard", que prometía un resumen general que nunca existió. El
        breadcrumb queda con la misma forma que el de las otras pantallas: la
        raíz "Dashboard" nombra al panel privado, no a esta página.
      */}
      <Navbar
        title="Brecha cambiaria"
        breadcrumb={[{ label: 'Dashboard' }, { label: 'Brecha cambiaria' }]}
      />

      <div className={styles.content}>
        <BrechaStatusWidget initialStatus={status} />

        <section className={styles.chartSection}>
          <h2 className={styles.chartHeading}>Brecha cambiaria — últimos 30 días</h2>
          <BrechaHistoricoChart data={historico} bandaMin={status?.bandaMin} bandaMax={status?.bandaMax} />
        </section>
      </div>
    </>
  );
}
