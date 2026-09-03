import { Navbar } from '@/components/layout/Navbar/Navbar';
import { BrechaStatusWidget } from '@/components/features/brecha/BrechaStatusWidget';
import { BrechaHistoricoChart } from '@/components/charts/BrechaHistoricoChart/BrechaHistoricoChart';
import { getBrechaStatus, getBrechaHistorico } from '@/lib/api/pricing';
import { withFallback } from '@/lib/utils/with-fallback';
import type { BrechaHistoricoPoint, BrechaStatus } from '@/types';
import styles from './brecha-cambiaria.module.css';

export default async function BrechaCambiariaPage() {
  const [status, historico] = await Promise.all([
    withFallback<BrechaStatus | null>(getBrechaStatus(), null),
    withFallback<BrechaHistoricoPoint[]>(getBrechaHistorico(), []),
  ]);

  return (
    <>
      {/*
        El título dice lo que la pantalla muestra —brecha y su histórico— y no
        "Dashboard", que prometía un resumen general que nunca existió y que
        ahora tiene `/dashboard` reservada para cuando se construya.

        La raíz del breadcrumb es "Panel" por lo mismo: nombra al área privada,
        va sin `href`, y decirle "Dashboard" iba a chocar de frente con la
        pantalla que viene.
      */}
      <Navbar
        title="Brecha cambiaria"
        breadcrumb={[{ label: 'Panel' }, { label: 'Brecha cambiaria' }]}
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
