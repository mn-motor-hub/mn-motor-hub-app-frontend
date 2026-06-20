'use client'; // Link activo requiere usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Users, Tag, LayoutDashboard } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/proveedores', label: 'Proveedores', icon: Users },
  { href: '/categorias', label: 'Categorías', icon: Tag },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <LayoutDashboard size={24} className={styles.logoIcon} />
        <span className={styles.logoText}>MN Motor Hub</span>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[styles.navLink, isActive ? styles.navLinkActive : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
