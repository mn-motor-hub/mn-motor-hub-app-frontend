import Link from 'next/link';
import styles from './CTABanner.module.css';

export function CTABanner() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>¿Listo para ordenar tu inventario?</h2>
        <p className={styles.subtitle}>
          Accede al dashboard y comienza a gestionar repuestos, proveedores y categorías.
        </p>
        <Link href="/inventario" className={styles.cta}>
          Ir al Dashboard
        </Link>
      </div>
    </section>
  );
}
