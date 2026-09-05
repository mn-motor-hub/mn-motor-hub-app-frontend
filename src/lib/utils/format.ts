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

/** 'YYYY-MM-DD' pelado: un día de negocio, sin hora ni zona. */
const BUSINESS_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "04/09/2026". El backend manda fechas de DOS formas y esta función las trata
 * distinto a propósito, porque son cosas distintas:
 *
 * - Un día suelto 'YYYY-MM-DD' —las columnas `date` de Postgres: `Sale.fecha`,
 *   `FinancialMovement.date`, `BrechaSnapshot.fecha`, las revisiones de K— se
 *   formatea partiendo el string, vía `formatBusinessDay`. NO se parsea:
 *   `new Date('2026-09-04')` es medianoche UTC, y en cualquier huso al oeste de
 *   Greenwich eso cae el 03/09. Es un día, no un instante; no tiene zona que
 *   convertir.
 * - Un instante ISO (`createdAt`, `updatedAt`) se formatea en hora de
 *   Venezuela, igual que `formatDateTime`.
 *
 * El caller no elige: las dos formas se distinguen sin ambigüedad y elegir mal
 * era silencioso —solo se veía al oeste de Greenwich, y como un día menos, no
 * como un error—. Estuvo vivo en las tablas de ventas, finanzas y brecha.
 */
export function formatDate(dateStr: string): string {
  if (BUSINESS_DAY.test(dateStr)) return formatBusinessDay(dateStr);

  return new Intl.DateTimeFormat('es-VE', {
    timeZone: TIMEZONE,
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
 * "04/09/2026" a partir de un día suelto 'YYYY-MM-DD' — un día de negocio, no
 * un instante. Es el formato de `fechaValor` y el de toda columna `date`.
 *
 * Parte el string a propósito y NO pasa por `Date`, por lo explicado en
 * `formatDate`. Usala directo cuando sabés que el dato es un día: deja la
 * intención escrita en el call site en vez de depender de la detección.
 *
 * Devuelve el string tal cual si no tiene la forma esperada: mostrar el dato
 * crudo del backend es mejor que inventarle una fecha o romper la pantalla.
 */
export function formatBusinessDay(day: string): string {
  const match = BUSINESS_DAY.exec(day);
  if (!match) return day;
  const [, year, month, dayOfMonth] = match;
  return `${dayOfMonth}/${month}/${year}`;
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
