import styles from './StatCard.module.css';

type StatCardVariant = 'info' | 'success' | 'danger';

interface StatCardProps {
  value: number | string;
  label: string;
  variant?: StatCardVariant;
}

export function StatCard({ value, label, variant }: StatCardProps) {
  return (
    <div className={[styles.statCard, variant ? styles[variant] : ''].filter(Boolean).join(' ')}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
