import { Package, Zap, ShieldCheck, BarChart3 } from 'lucide-react';
import styles from './WhyUs.module.css';

const features = [
  {
    icon: Package,
    title: 'Inventario centralizado',
    desc: 'Gestiona todos tus repuestos desde una sola plataforma, con control de stock en tiempo real.',
  },
  {
    icon: Zap,
    title: 'Búsqueda rápida',
    desc: 'Encuentra cualquier pieza por código interno, OEM, descripción o compatibilidad de vehículo.',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-proveedor',
    desc: 'Compara precios USD y Bs de múltiples proveedores para el mismo repuesto.',
  },
  {
    icon: BarChart3,
    title: 'Control de stock mínimo',
    desc: 'Alertas automáticas cuando el stock cae por debajo del mínimo establecido.',
  },
];

export function WhyUs() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Por qué elegirnos</span>
          <h2 className={styles.title}>Diseñado para el taller moderno</h2>
        </div>

        <div className={styles.grid}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className={styles.card}>
              <div className={styles.iconWrapper}>
                <Icon size={24} />
              </div>
              <h3 className={styles.cardTitle}>{title}</h3>
              <p className={styles.cardDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
