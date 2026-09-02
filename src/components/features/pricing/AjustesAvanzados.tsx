import { EditarConfiguracionButton } from '@/app/(dashboard)/configuracion/EditarConfiguracionButton';
import type { Configuracion } from '@/types';
import styles from './AjustesAvanzados.module.css';

interface AjustesAvanzadosProps {
  configuraciones: Configuracion[];
}

/**
 * Las claves que gobiernan el motor de precios, en el orden en que se entienden:
 * primero el factor que se aplica, después la banda contra la que se lo juzga,
 * después el margen.
 *
 * Es una lista explícita y no un prefijo: `ultima_revision_k` también es de
 * pricing, pero guarda una fecha (YYYY-MM-DD) y el editor genérico la trataría
 * como número. Queda fuera a propósito — se escribe sola al aplicar un K.
 */
const CLAVES_PRICING = [
  {
    clave: 'factor_reposicion_cambiaria',
    label: 'Factor de reposición cambiaria (K)',
  },
  { clave: 'brecha_banda_min', label: 'Banda mínima de brecha (%)' },
  { clave: 'brecha_banda_max', label: 'Banda máxima de brecha (%)' },
  { clave: 'margen_ganancia_default', label: 'Margen de ganancia por defecto (%)' },
] as const;

export function AjustesAvanzados({ configuraciones }: AjustesAvanzadosProps) {
  // flatMap y no map+filter: descarta las claves ausentes sin necesidad de un
  // type predicate, que con las labels literales de `as const` no tipa bien.
  const items = CLAVES_PRICING.flatMap(({ clave, label }) => {
    const configuracion = configuraciones.find((c) => c.clave === clave);
    return configuracion ? [{ configuracion, label }] : [];
  });

  if (items.length === 0) return null;

  return (
    // <details> nativo: colapsado por default sin necesidad de estado ni de
    // convertir la sección entera en Client Component.
    <details className={styles.details}>
      <summary className={styles.summary}>
        Ajustes avanzados
        <span className={styles.summaryHint}>Edición manual, valor por valor</span>
      </summary>

      <div className={styles.body}>
        <p className={styles.warning}>
          Editar el factor K acá se salta el cálculo sugerido: el valor se aplica tal cual, sin
          mirar la brecha de los últimos días y sin registrar la fecha de revisión. Usá el
          cálculo de arriba salvo que sepas exactamente por qué no.
        </p>

        <ul className={styles.list}>
          {items.map(({ configuracion, label }) => (
            <li key={configuracion.clave} className={styles.item}>
              <div className={styles.itemInfo}>
                <p className={styles.itemLabel}>{label}</p>
                <p className={styles.itemClave}>{configuracion.clave}</p>
                {configuracion.descripcion && (
                  <p className={styles.itemDescription}>{configuracion.descripcion}</p>
                )}
              </div>

              <div className={styles.itemAction}>
                <span className={styles.itemValue}>{configuracion.valor}</span>
                <EditarConfiguracionButton configuracion={configuracion} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
