'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Users,
  Tag,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useSidebar } from './SidebarContext';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/proveedores', label: 'Proveedores', icon: Users },
  { href: '/categorias', label: 'Categorías', icon: Tag },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}
      >
        {/* Header */}
        <div className={styles.logoArea}>
          <LayoutDashboard size={20} className={styles.logoIcon} />
          <span className={`${styles.logoText} ${collapsed ? styles.textHidden : ''}`}>
            MN Motor Hub
          </span>
          <button
            className={styles.closeButton}
            onClick={closeMobile}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegación */}
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''} ${collapsed ? styles.navLinkCollapsed : ''}`}
                    title={collapsed ? label : undefined}
                    onClick={closeMobile}
                  >
                    <Icon size={18} className={styles.navIcon} />
                    <span className={`${styles.navLabel} ${collapsed ? styles.textHidden : ''}`}>
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Colapsar — solo desktop */}
        <button
          className={styles.collapseToggle}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
}
