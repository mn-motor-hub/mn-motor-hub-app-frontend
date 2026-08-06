'use client'; // fetch periódico con setInterval — necesita efectos del navegador

import { useEffect, useState } from 'react';
import { getTasasAction } from './actions';
import { formatBs } from '@/lib/utils/format';
import type { Tasa } from '@/types';
import styles from './ExchangeRatesWidget.module.css';

interface ExchangeRatesWidgetProps {
  /** Rail colapsado del sidebar (solo íconos) — estado de desktop, ver Sidebar.tsx. */
  collapsed: boolean;
}

// El backend refresca por cron cada 1 hora (tasas.service.ts#fetchOnline); este
// intervalo solo evita que el widget quede desactualizado en una sesión larga.
const REFRESH_MS = 7 * 60 * 1000;

const ITEMS: Array<{ clave: string; label: string }> = [
  { clave: 'USD_BCV', label: 'BCV USD' },
  { clave: 'EUR_BCV', label: 'BCV EUR' },
  { clave: 'BINANCE_USDT', label: 'Binance USDT' },
];

export function ExchangeRatesWidget({ collapsed }: ExchangeRatesWidgetProps) {
  // Se conserva el último valor bueno en memoria: si un refresh falla, el
  // widget sigue mostrando el dato anterior en vez de romperse o vaciarse.
  const [tasas, setTasas] = useState<Tasa[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getTasasAction();
      if (!cancelled && result.ok) setTasas(result.data);
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`${styles.widget} ${collapsed ? styles.collapsed : ''}`}
      aria-label="Tasas de cambio"
    >
      {ITEMS.map(({ clave, label }) => {
        const valor = tasas?.find((t) => t.clave === clave)?.valorEfectivo;
        return (
          <div key={clave} className={styles.row}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{valor != null ? formatBs(valor) : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}
