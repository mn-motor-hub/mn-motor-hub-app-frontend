import Link from 'next/link';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { listConfiguraciones } from '@/lib/api/configuraciones';
import { withFallback } from '@/lib/utils/with-fallback';
import { EditarConfiguracionButton } from './EditarConfiguracionButton';
import type { Configuracion } from '@/types';
import styles from './configuracion.module.css';

export default async function ConfiguracionPage() {
  const configuraciones = await withFallback<Configuracion[]>(listConfiguraciones(), []);

  return (
    <>
      <Navbar
        title="Configuración"
        breadcrumb={[{ label: 'Dashboard' }, { label: 'Configuración' }]}
      />

      <div className={styles.content}>
        {/*
          El factor K tiene pantalla propia porque no se decide mirando el
          número: se decide mirando la brecha de los últimos días. Editarlo
          suelto acá abajo sigue siendo posible, pero no es el camino esperado.
        */}
        <Link href="/configuracion/motor-de-precios" className={styles.featureLink}>
          <SlidersHorizontal size={20} className={styles.featureIcon} aria-hidden="true" />
          <span className={styles.featureText}>
            <span className={styles.featureTitle}>Motor de precios</span>
            <span className={styles.featureDescription}>
              Factor de reposición cambiaria, brecha vs. banda y cálculo del K sugerido
            </span>
          </span>
          <ChevronRight size={18} className={styles.featureChevron} aria-hidden="true" />
        </Link>

        {configuraciones.length === 0 ? (
          <div className={styles.empty}>No hay configuraciones registradas.</div>
        ) : (
          <ul className={styles.list}>
            {configuraciones.map((config) => (
              <li key={config.clave} className={styles.card}>
                <div className={styles.cardInfo}>
                  <p className={styles.cardTitle}>{humanize(config.clave)}</p>
                  {config.descripcion ? (
                    <p className={styles.cardDescription}>{config.descripcion}</p>
                  ) : null}
                </div>

                <div className={styles.cardAction}>
                  <span className={styles.cardValue}>{config.valor}</span>
                  <EditarConfiguracionButton configuracion={config} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/** "margen_ganancia_default" → "Margen ganancia default" — genérico, no por clave. */
function humanize(clave: string): string {
  const texto = clave.split('_').join(' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
