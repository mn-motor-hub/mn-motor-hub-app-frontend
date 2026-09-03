'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Users,
  Tag,
  Wallet,
  LayoutDashboard,
  LineChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ShoppingCart,
  Coins,
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import { useSidebar } from './SidebarContext';
import { ExchangeRatesWidget } from './ExchangeRatesWidget';
import styles from './Sidebar.module.css';

/**
 * La navegación agrupada por afinidad: catálogo, operación diaria y ajustes.
 * Al sumar un módulo, va dentro del grupo que le corresponde — no al final.
 *
 * "Brecha cambiaria" vive en `/brecha-cambiaria` y no en `/dashboard`: la
 * pantalla muestra el estado de la brecha y su histórico de 30 días, y nada
 * más. `/dashboard` queda libre a propósito, reservado para la pantalla general
 * de la empresa que todavía no existe — ocuparla con esto obligaba a mudarla
 * después, con los favoritos ya repartidos.
 */
const navGroups = [
  [
    { href: '/inventario', label: 'Inventario', icon: Package },
    { href: '/proveedores', label: 'Proveedores', icon: Users },
    { href: '/categorias', label: 'Categorías', icon: Tag },
  ],
  [
    { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
    { href: '/finanzas', label: 'Finanzas', icon: Wallet },
    { href: '/tasas', label: 'Tasas', icon: Coins },
    { href: '/brecha-cambiaria', label: 'Brecha cambiaria', icon: LineChart },
  ],
  [{ href: '/configuracion', label: 'Configuración', icon: Settings }],
];

/**
 * Se aplana a una sola lista y el separador se dibuja en el primer ítem de cada
 * grupo salvo el primero. Una `<ul>` por grupo obligaría a ponerles un título a
 * los tres —copy que nadie pidió— o a dejar tres listas anónimas, que para un
 * lector de pantalla es peor que una sola.
 */
const navItems = navGroups.flatMap((grupo, i) =>
  grupo.map((item, j) => ({ ...item, startsGroup: i > 0 && j === 0 })),
);

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
            {navItems.map(({ href, label, icon: Icon, startsGroup }) => {
              const isActive = pathname.startsWith(href);
              return (
                <li key={href} className={startsGroup ? styles.navGroupStart : undefined}>
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

        {/* Tasas de cambio */}
        <ExchangeRatesWidget collapsed={collapsed} />

        {/* Cerrar sesión */}
        <form action={logoutAction} className={styles.logoutForm}>
          <button
            type="submit"
            className={`${styles.navLink} ${styles.logoutButton} ${collapsed ? styles.navLinkCollapsed : ''}`}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut size={18} className={styles.navIcon} />
            <span className={`${styles.navLabel} ${collapsed ? styles.textHidden : ''}`}>
              Cerrar sesión
            </span>
          </button>
        </form>

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
