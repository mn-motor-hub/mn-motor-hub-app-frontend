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
