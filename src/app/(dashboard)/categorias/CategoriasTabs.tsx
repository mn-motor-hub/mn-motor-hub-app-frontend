import Link from 'next/link';
import styles from './categorias.module.css';

interface CategoriasTabsProps {
  active: 'categorias' | 'subcategorias';
}

/**
 * Rutas reales en vez de un ?tab= — cada página ya sabe cuál es "active" al
 * renderizarse, así que no hace falta detectar el pathname en el cliente.
 */
export function CategoriasTabs({ active }: CategoriasTabsProps) {
  return (
    <nav className={styles.tabs} aria-label="Secciones de categorías">
      <Link
        href="/categorias"
        className={`${styles.tab} ${active === 'categorias' ? styles.tabActive : ''}`}
        aria-current={active === 'categorias' ? 'page' : undefined}
      >
        Categorías
      </Link>
      <Link
        href="/categorias/subcategorias"
        className={`${styles.tab} ${active === 'subcategorias' ? styles.tabActive : ''}`}
        aria-current={active === 'subcategorias' ? 'page' : undefined}
      >
        Subcategorías
      </Link>
    </nav>
  );
}
