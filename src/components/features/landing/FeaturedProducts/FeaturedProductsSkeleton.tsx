import styles from './FeaturedProducts.module.css';

/**
 * Fallback de <Suspense> para FeaturedProducts.
 * Reusa .section/.container/.heading/.grid del mismo módulo para que la grilla
 * coincida con la real y no haya layout shift al resolverse el fetch.
 */
export function FeaturedProductsSkeleton() {
  return (
    <section className={styles.section} aria-hidden="true">
      <div className={styles.container}>
        <div className={styles.heading}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonEyebrow}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonSubtitle}`} />
        </div>

        <div className={styles.grid}>
          {/* 6 = el mismo limit que pide FeaturedProducts */}
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${styles.skeletonBlock} ${styles.skeletonCard}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
