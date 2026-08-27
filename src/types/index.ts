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
export type TasaTipo = 'automatica' | 'manual';
export type TasaFuente = 'online' | 'manual';

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
  totalUsd: number;
  tasaEurValor: number;
  descuentoTasaVentaPctAplicado: number;
  tasaVentaEfectiva: number;
  tasaFueOverride: boolean;
  totalBs: number;
  costoTotalUsd: number;
  formaPago: FormaPago;
  montoEnFormaPago: number;
  estado: SaleEstado;
  notas: string | null;
  createdAt: string;
  createdBy: string;
  items: SaleItem[];
}

/** Preview de tasa para el formulario de carga — nunca se manda de vuelta al POST. */
export interface TasaEfectivaPreview {
  tasaEurValor: number;
  descuentoTasaVentaPctAplicado: number;
  tasaVentaEfectiva: number;
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
