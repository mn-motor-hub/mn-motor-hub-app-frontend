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

/**
 * El negocio opera en Venezuela: la hora que se muestra es la de allá, no la
 * del navegador de quien mira ni la del servidor que renderiza.
 *
 * `Intl.DateTimeFormat('es-VE', …)` NO alcanza para eso: el locale decide el
 * formato (dd/mm/aaaa, 24h), la zona la decide el runtime. Sin fijarla, el
 * mismo instante se lee distinto según el componente sea Server o Client —
 * 21:00 en la tarjeta de tasas (servidor en UTC) y 18:00 en el historial
 * (navegador en UTC−3), para la corrida de las 17:00. Además de mentir, eso
 * hace que un componente cliente renderice un valor en SSR y otro al hidratar.
 */
const TIMEZONE = 'America/Caracas';

/**
 * OJO: sus callers le pasan dos cosas distintas — instantes ISO (`createdAt`,
 * `updatedAt`) y días sueltos 'YYYY-MM-DD' (`Sale.fecha`, `Movement.date`,
 * `BrechaHistoricoPoint.fecha`). Por eso NO lleva `timeZone: TIMEZONE`: un día
 * suelto se parsea como medianoche UTC, y en Caracas (UTC−4) eso retrocede al
 * día anterior. Un día suelto se formatea partiendo el string, sin pasar por
 * `Date`; separar los callers de esta función es tarea aparte.
 */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * "02/09/2026 17:00" — un instante, siempre en hora de Venezuela.
 * En el historial de tasas la hora importa: es lo que distingue una corrida
 * programada de una ráfaga de reintentos, que es la señal de que algo falla.
 */
export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: TIMEZONE,
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
