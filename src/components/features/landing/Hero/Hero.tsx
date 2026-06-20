import Link from 'next/link';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <span className={styles.eyebrow}>Sistema de Gestión Automotriz</span>
        <h1 className={styles.title}>
          MN Motor Hub
        </h1>
        <p className={styles.subtitle}>
          Inventario de repuestos, proveedores y ventas para el taller moderno.
          Control total desde un solo lugar.
        </p>
        <div className={styles.actions}>
          <Link href="/inventario" className={styles.ctaPrimary}>
            Ver Inventario
          </Link>
          <Link href="/proveedores" className={styles.ctaSecondary}>
            Proveedores
          </Link>
        </div>
      </div>
    </section>
  );
}
