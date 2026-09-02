export function formatCurrencyUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyBs(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * "02/09/2026 17:00" — fecha con hora y minutos.
 * En el historial de tasas la hora importa: distingue el ciclo diario de las
 * ráfagas de reintento horario, que es justamente la señal de que algo falla.
 */
export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateStr));
}

/**
 * "hace 3 h", "hace 2 días" — antigüedad aproximada de una fecha pasada.
 * Complementa a formatDateTime, no lo reemplaza: la fecha exacta siempre se
 * muestra también, porque "hace 7 días" no dice desde cuándo exactamente.
 */
export function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (diffMs < 0) return 'recién';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'recién';
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}

export function formatCode(code: string): string {
  return code.toUpperCase();
}

/**
 * "Bs 45,68" — a propósito no usa `style: 'currency', currency: 'VES'`:
 * el símbolo ICU para VES es "Bs.S", no "Bs".
 */
export function formatBs(amount: number): string {
  const formatted = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Bs ${formatted}`;
}
