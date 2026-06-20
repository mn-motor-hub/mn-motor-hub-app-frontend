import Link from 'next/link';
import styles from './Navbar.module.css';

interface NavbarProps {
  title: string;
  breadcrumb?: { label: string; href?: string }[];
}

export function Navbar({ title, breadcrumb }: NavbarProps) {
  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav aria-label="Migas de pan" className={styles.breadcrumb}>
            {breadcrumb.map((crumb, i) => (
              <span key={i} className={styles.crumbItem}>
                {i > 0 ? <span className={styles.separator}>/</span> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className={styles.crumbLink}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={styles.crumbCurrent}>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className={styles.title}>{title}</h1>
      </div>
    </header>
  );
}
