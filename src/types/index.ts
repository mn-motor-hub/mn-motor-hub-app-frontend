export interface Categoria {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategoria {
  id: string;
  categoriaId: string;
  codigoSublinea: string;
  nombre: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRef {
  id: number;
  autoPartId: number;
  supplierId: number;
  // Solo viene poblado en GET /api/supplier-refs — create/update devuelven
  // el mismo shape pero sin recargar la relación tras guardar.
  supplier?: { id: number; nombre: string; rif: string | null };
  referenciaProveedor: string | null;
  precioCompra: number | null;
  notas: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutoPart {
  id: number;
  codigoInterno: string;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  subcategoriaId: string;
  stockActual: number;
  stockMinimo: number;
  // numeric(10,2) en Postgres — el driver `pg` lo devuelve como string sin
  // importar el tipo declarado en la entidad de TypeORM; convertir con
  // Number() en el punto de uso, nunca operar sobre esto directo.
  precioVenta: string | null;
  ubicacionStock: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  subcategoria?: Subcategoria;
  supplierRefs?: SupplierRef[];
}

/**
 * GET /api/auto-parts/:id/precio-sugerido — de solo lectura, nunca escribe
 * precio_venta. costoUsd sale del supplier_ref activo del repuesto; si no hay
 * uno con precio_compra, precioSugeridoUsd y desviacionPct vienen en null
 * (margenAplicado/kAplicado igual se resuelven desde configuraciones).
 */
export interface PrecioSugerido {
  precioSugeridoUsd: number | null;
  // Passthrough de auto_parts.precio_venta — mismo caso que AutoPart.precioVenta:
  // convertir con Number() en el punto de uso.
  precioActual: string | null;
  desviacionPct: number | null;
  margenAplicado: number;
  kAplicado: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface ApiError {
  error: true;
  status: number;
  message: string;
}

/**
 * Resultado de una Server Action.
 * Las acciones devuelven este objeto en vez de lanzar: Next redacta los
 * mensajes de error que cruzan el límite servidor→cliente en producción, así
 * que un throw llegaría al usuario como "An error occurred in the Server
 * Components render". `code` permite discriminar casos puntuales sin depender
 * de `instanceof`, que tampoco sobrevive la serialización.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

// ─── Suppliers ────────────────────────────────────────────────
export interface Supplier {
  id: number;
  nombre: string;
  rif: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Finanzas ─────────────────────────────────────────────────
export type FinancialType = 'ingreso' | 'gasto';
export type FinancialMovementStatus = 'confirmado' | 'planificado';

export interface FinancialCategory {
  id: number;
  name: string;
  type: FinancialType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialMovement {
  id: number;
  type: FinancialType;
  amount: number;
  date: string; // YYYY-MM-DD — fecha real del movimiento, distinta de createdAt
  description: string;
  financialCategoryId: number;
  // Presente solo cuando el backend carga la relación (listado y detalle, no en el POST crudo)
  categoryName?: string;
  registeredBy: string;
  source: 'manual';
  status: FinancialMovementStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummaryByCategory {
  categoryId: number;
  categoryName: string;
  type: FinancialType;
  total: number;
}

export interface FinancialSummary {
  period: { month: number; year: number; from: string; to: string };
  totalIncomeConfirmed: number;
  totalExpensesConfirmed: number;
  balanceConfirmed: number;
  totalIncomePlanned: number;
  totalExpensesPlanned: number;
  byCategory: FinancialSummaryByCategory[];
}

// ─── Tasas de cambio ──────────────────────────────────────────
// Espejo de los tipos exportados por el backend en
// src/modules/tasas/tasas.service.ts (TasaPlain, TasaSaludPlain,
// TasaFetchLogPlain). Única diferencia: las fechas son `string`, que es lo que
// sobrevive al JSON — nunca `Date`.
export type TasaTipo = 'automatica' | 'manual';
export type TasaFuente = 'online' | 'manual';
export type TasaResultado = 'exito' | 'fallo';
export type TasaOrigen = 'programado' | 'manual';

export interface Tasa {
  id: string;
  clave: string;
  label: string;
  tipo: TasaTipo;
  providerId: string | null;
  valorAutomatico: number | null;
  valorManual: number | null;
  // manual ?? automatico — lo que debe usar cualquier consumidor
  valorEfectivo: number | null;
  fetchedAt: string | null;
  fuente: TasaFuente;
  activo: boolean;
  orden: number;
  // true si tipo='automatica' y el último fetch exitoso tiene más de 24h, o si
  // nunca se completó uno. Las tasas manuales nunca son stale.
  stale: boolean;
}

/** Una fila por tasa activa: estado actual + salud del scraper que la alimenta. */
export interface TasaSalud {
  clave: string;
  label: string;
  tipo: TasaTipo;
  valorEfectivo: number | null;
  fetchedAt: string | null;
  stale: boolean;
  // ultimoIntento y ultimoExito NO son lo mismo y no deben colapsarse en un
  // solo "última actualización": el job puede seguir intentando cada hora
  // mientras el último éxito queda clavado días atrás. Esa distinción es la
  // razón de ser de la pantalla de tasas.
  ultimoIntento: string | null;
  ultimoExito: string | null;
  // Intentos seguidos fallando; 0 si el último salió bien.
  fallosConsecutivos: number;
  // Solo presente si fallosConsecutivos > 0.
  ultimoError: { codigo: string | null; motivo: string | null; fecha: string } | null;
  // Días enteros desde el último éxito. null si nunca hubo uno.
  diasSinActualizar: number | null;
}

/** Un registro por intento de actualización y por tasa, falle o no. */
export interface TasaFetchLog {
  id: string;
  tasaClave: string;
  providerId: string | null;
  resultado: TasaResultado;
  valor: number | null;
  valorAnterior: number | null;
  errorCodigo: string | null;
  errorMotivo: string | null;
  duracionMs: number | null;
  origen: TasaOrigen;
  actorId: number | null;
  // Resuelto por JOIN al leer; ya viene como '—' si no aplica.
  actorNombre: string;
  createdAt: string;
}

// ─── Ventas ───────────────────────────────────────────────────
export type FormaPago = 'usd' | 'bs';
export type SaleEstado = 'en_proceso' | 'confirmada' | 'anulada';

export interface SaleItem {
  id: number;
  saleId: number;
  autoPartId: number;
  autoPartNombre: string;
  autoPartCodigoInterno: string | null;
  cantidad: number;
  // Snapshots al momento de la venta — nunca reflejan el precio/costo actual del catálogo.
  precioUnitarioUsd: number;
  costoUnitarioUsd: number;
  subtotalUsd: number;
}

export interface Sale {
  id: number;
  fecha: string;
  clienteNombre: string;
  // Cédula o RIF en un solo campo de texto libre — ej. "V-12345678", "J-500088906".
  clienteDocumento: string;
  clienteTelefono: string | null;
  subtotalUsd: number;
  // Descuento comercial en USD a nivel venta — reemplaza al viejo override manual de tasa.
  descuentoUsd: number;
  totalUsd: number;
  totalBs: number;
  costoTotalUsd: number;
  // true si totalUsd < costoTotalUsd — advertencia, nunca bloqueó la venta.
  ventaBajoCosto: boolean;
  formaPago: FormaPago;
  montoEnFormaPago: number;
  estado: SaleEstado;
  notas: string | null;
  createdAt: string;
  createdBy: string;
  items: SaleItem[];
}

/**
 * Contexto de tasa para el formulario de carga (GET /api/sales/contexto-tasa)
 * — nunca se manda de vuelta al POST, el backend recalcula todo internamente
 * al confirmar la venta. Toda venta se factura siempre a tasaClave = 'USD_BCV'.
 */
export interface TasaContexto {
  tasaClave: string;
  tasaValor: number;
  // true si el cron de tasas.service.ts no logró refrescar el valor recientemente.
  stale: boolean;
}

// ─── Brecha cambiaria (BCV vs P2P) ────────────────────────────
export interface BrechaStatus {
  tasaBcv: number;
  // Informativa — null si el scraper P2P no tenía valor disponible.
  tasaP2p: number | null;
  brechaPct: number | null;
  factorKConfigurado: number;
  // (factorKConfigurado - 1) * 100 — la brecha que K asume implícitamente.
  brechaImplicitaK: number;
  // null si brechaPct es null (sin dato P2P) — no asumir false.
  dentroDeBanda: boolean | null;
  bandaMin: number;
  bandaMax: number;
  diasConsecutivosFueraDeBanda: number;
  ultimaRevision: string;
  proximaRevision: string;
}

export interface BrechaHistoricoPoint {
  fecha: string;
  tasaBcv: number;
  tasaP2p: number | null;
  brechaPct: number | null;
  factorKConfigurado: number;
}

// ─── Configuración del sistema ──────────────────────────────
export interface Configuracion {
  clave: string;
  // La columna es varchar de punta a punta en el backend (Configuracion.entity.ts) —
  // el GET nunca devuelve number, aunque el valor represente algo numérico.
  valor: string;
  descripcion: string;
  updatedAt: string;
}

// ─── Stock Import ─────────────────────────────────────────────
export interface StockImportMatchedPart {
  auto_part_id: number;
  codigo_interno: string;
  nombre: string;
  stock_actual: number;
  precio_compra_actual: number | null;
  precio_venta_actual: number | null;
  margen_actual: number | null;
}

export interface StockImportParsedItem {
  codigo_proveedor: string;
  descripcion: string;
  cantidad: number;
  precio_unitario_usd: number;
  requiere_revision: boolean;
  motivo_revision: string | null;
  match: StockImportMatchedPart | null;
  subcategoria_id: string | null;
}

export interface StockImportParseResponse {
  proveedor: { nombre: string; rif: string | null };
  numero_factura: string;
  fecha_emision: string;
  supplier_match: { id: number; nombre: string } | null;
  factura_ya_importada: boolean;
  tiene_items_con_revision: boolean;
  items: StockImportParsedItem[];
}

export interface StockImportConfirmItem {
  codigo_proveedor: string;
  descripcion: string;
  cantidad: number;
  precio_unitario_usd: number;
  requiere_revision: false;
  auto_part_id: number | null;
  precio_venta_nuevo: number;
  nombre?: string;
  categoria_id?: string;
  subcategoria_id?: string;
  ubicacion_stock?: string;
  marca?: string;
}

export interface StockImportConfirmRequest {
  supplier_id: number;
  numero_factura: string;
  fecha_emision: string;
  items: StockImportConfirmItem[];
}

// Sugerencia de subcategoría por IA (endpoint separado, on-demand desde el staging).
export interface ClassifySubcategoriaRequestItem {
  tempId: string;
  nombre: string;
  descripcion: string;
}

export interface ClassifySubcategoriaCandidato {
  subcategoriaId: string;
  codigoSublinea: string;
  nombre: string;
  categoriaNombre: string;
  // Fracción 0–1, no porcentaje — mismo criterio que StockImportMatchedPart.margen_actual.
  score: number;
}

export interface ClassifySubcategoriaResultItem {
  tempId: string;
  candidatos: ClassifySubcategoriaCandidato[];
  requiereRevision: boolean;
}

export interface StockImportConfirmResultItem {
  accion: 'actualizado' | 'creado';
  codigo_interno: string;
}

export interface StockImportConfirmResponse {
  factura: unknown;
  resumen: {
    total_items: number;
    items_actualizados: number;
    items_nuevos: number;
  };
  items: StockImportConfirmResultItem[];
}
