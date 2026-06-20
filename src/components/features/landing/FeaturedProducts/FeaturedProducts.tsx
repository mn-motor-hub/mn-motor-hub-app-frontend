import { getAutoParts } from '@/lib/api/auto-parts';
import { AutoPartCard } from '@/components/features/inventario/AutoPartCard';
import styles from './FeaturedProducts.module.css';

export async function FeaturedProducts() {
  let parts: Awaited<ReturnType<typeof getAutoParts>>['data'] = [];

  try {
    const result = await getAutoParts({ limit: 6 });
    parts = result.data;
  } catch {
    return null;
  }

  if (parts.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>Catálogo</span>
          <h2 className={styles.title}>Repuestos disponibles</h2>
          <p className={styles.subtitle}>
            Selección de piezas de alta calidad para tu vehículo.
          </p>
        </div>

        <div className={styles.grid}>
          {parts.map((part) => (
            <AutoPartCard key={part.id} part={part} />
          ))}
        </div>
      </div>
    </section>
  );
}
