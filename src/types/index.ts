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

// ─── Imágenes de repuesto ─────────────────────────────────────
export interface AutoPartImage {
  id: number;
  autoPartId: number;
  /** Base 1. NO es único entre imágenes de un mismo repuesto. */
  orden: number;
  esPrincipal: boolean;
  /** Soft delete: el panel las muestra igual, atenuadas, para reactivarlas. */
  activo: boolean;
  destinoCatalogo: boolean;
  /** Hoy solo se guarda el dato — la sync con Mercado Libre no existe todavía. */
  destinoMercadoLibre: boolean;
  masterPath: string;
  /** Firmada y de vida corta (300 s). Puede venir null si Storage no la firmó. */
  masterUrl: string | null;
  catalogoPath: string | null;
  /** Pública. null mientras no se generó el derivado con marca de agua. */
  catalogoUrl: string | null;
  createdAt: string;
}

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
// TasaFetchLogPlain, FetchFallo). Única diferencia: las fechas son `string`, que
// es lo que sobrevive al JSON — nunca `Date`.
export type TasaTipo = 'automatica' | 'manual';
export type TasaFuente = 'online' | 'manual';
export type TasaResultado = 'exito' | 'fallo';
export type TasaOrigen = 'programado' | 'manual';

/**
 * Unidad de FETCH: un request HTTP, no una tasa. El BCV sirve USD y EUR en una
 * sola llamada, así que un fallo suyo es UNO y no dos — al armar un mensaje de
 * error hay que deduplicar por acá, o dice "falló BCV" dos veces.
 *
 * No confundir con `TasaFuente` ('online' | 'manual'), que es otra cosa: de
 * dónde salió el valor vigente de la fila. Por eso el campo se llama
 * `fuenteFetch` y no `fuente`.
 */
export type TasaFuenteFetch = 'BCV' | 'BINANCE';

export interface Tasa {
  id: string;
  clave: string;
  label: string;
  tipo: TasaTipo;
  /** Qué tasa es (BCV_USD, BCV_EUR, BINANCE_USDT). null si tipo='manual'. */
  providerId: string | null;
  valorAutomatico: number | null;
  valorManual: number | null;
  // manual ?? automatico — lo que debe usar cualquier consumidor
  valorEfectivo: number | null;
  fetchedAt: string | null;
  fuente: TasaFuente;
  activo: boolean;
  orden: number;
  /**
   * true si tipo='automatica' y el último fetch exitoso quedó más viejo que el
   * umbral, o si nunca se completó uno. Las tasas manuales nunca son stale.
   *
   * El umbral NO es fijo: el backend lo deriva de la cadencia diaria más
   * `tasas_stale_margen_horas` (30h con el default). Acá no se replica el
   * número — se consume el booleano ya resuelto. Ojo con el copy: `stale`
   * también es true cuando el backend no pudo leer esa clave de configuración
   * y degradó hacia "vencida", así que afirmar "hace más de 30h" sería inventar
   * un dato que no medimos.
   */
  stale: boolean;
}

/** Una fila por tasa activa: estado actual + salud del scraper que la alimenta. */
export interface TasaSalud {
  clave: string;
  label: string;
  tipo: TasaTipo;
  /** Granularidad de TASA (BCV_USD, BCV_EUR…). null si tipo='manual'. */
  providerId: string | null;
  /**
   * Granularidad de REQUEST. BCV_USD y BCV_EUR comparten `fuenteFetch: 'BCV'`.
   * null si tipo='manual' (no hay fetch que agrupar).
   */
  fuenteFetch: TasaFuenteFetch | null;
  valorEfectivo: number | null;
  /**
   * Override manual sobre una tasa automática. Si no es null, `valorEfectivo`
   * es este valor y el scraper puede estar refrescando en silencio un
   * automático que nadie usa: sin mostrarlo, las dos situaciones se ven igual.
   */
  valorManual: number | null;
  fetchedAt: string | null;
  stale: boolean;
  // ultimoIntento y ultimoExito NO son lo mismo y no deben colapsarse en un
  // solo "última actualización": el job puede seguir intentando cada hora
  // mientras el último éxito queda clavado días atrás. Esa distinción es la
  // razón de ser de la pantalla de tasas.
  ultimoIntento: string | null;
  ultimoExito: string | null;
  /** Intentos seguidos fallando; 0 si el último salió bien. */
  fallosConsecutivos: number;
  /**
   * true si la racha llegó al techo de filas que el backend mira hacia atrás:
   * `fallosConsecutivos` es entonces un PISO, no el total. Sin esto, un 200
   * pelado se lee como un número exacto.
   */
  rachaTruncada: boolean;
  /** Solo presente si fallosConsecutivos > 0. */
  ultimoError: { codigo: string | null; motivo: string | null; fecha: string } | null;
  /**
   * Desde el último éxito. Las horas redondean hacia abajo y los días hacia
   * ARRIBA — el backend lo hace a propósito: el número de días dispara la
   * alarma y un piso subestima justo lo que se quiere ver (47h eran "1 día").
   * Los dos son null si nunca hubo un éxito.
   */
  horasSinActualizar: number | null;
  diasSinActualizar: number | null;
  /**
   * Cuándo se vuelve a intentar. null si la tasa es manual, o si el scheduler
   * no está corriendo en el proceso del backend (vive en memoria y se pierde en
   * un reinicio, hasta el primer tick).
   *
   * OJO: tras abandonar los reintentos NO es null — el ciclo diario sigue. Un
   * `requiereAtencion: true` con `proximoIntento` presente es el caso normal, no
   * una contradicción: hay que mostrar los dos.
   */
  proximoIntento: string | null;
  /**
   * El fallo no se cura solo: o es determinista (CERTS_NOT_LOADED,
   * PARSE_FAILED…), o se agotaron los reintentos. Es lo único que dice "esto
   * necesita que una persona toque algo" — `proximoIntento` no lo dice.
   */
  requiereAtencion: boolean;
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

/**
 * Una tasa que no se pudo refrescar en el intento. Espejo de `FetchFallo`.
 *
 * Viene UNA POR TASA, no por fuente: un fallo del BCV llega dos veces —
 * BCV_USD y BCV_EUR— con el mismo `fuenteFetch`, `errorCodigo` y `errorMotivo`.
 * Deduplicar por `fuenteFetch` antes de escribir cualquier mensaje.
 */
export interface TasaFetchFallo {
  fuenteFetch: TasaFuenteFetch | null;
  providerId: string;
  clave: string;
  errorCodigo: string;
  errorMotivo: string;
}

/**
 * Resultado del refresco manual (POST /api/tasas/fetch).
 *
 * `fallos` vacío con `tasas` poblado es el éxito total; `fallos` con entradas y
 * un 200 es un éxito PARCIAL, que es el caso normal y no un error de la
 * request: 2 de 3 actualizadas sigue siendo trabajo hecho.
 */
export interface TasaFetchResult {
  tasas: Tasa[];
  fallos: TasaFetchFallo[];
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
// Espejo de los tipos exportados por el backend en
// src/modules/pricing/brecha.service.ts. Fechas como `string`, que es lo que
// sobrevive al JSON.

/** Espejo de BrechaStatus. */
export interface BrechaStatus {
  tasaBcv: number;
  // Informativa — null si el scraper P2P no tenía valor disponible.
  tasaP2p: number | null;
  // null por DOS motivos distintos: sin dato P2P, o tasaBcvStale. No los
  // colapses en un solo mensaje — mirá tasaBcvStale para distinguirlos.
  brechaPct: number | null;
  factorKConfigurado: number;
  // (factorKConfigurado - 1) * 100 — la brecha que K asume implícitamente.
  brechaImplicitaK: number;
  // null si brechaPct es null — no asumir false.
  dentroDeBanda: boolean | null;
  bandaMin: number;
  bandaMax: number;
  diasConsecutivosFueraDeBanda: number;
  ultimaRevision: string;
  proximaRevision: string;
  // true si la tasa BCV en uso viene de un fetch vencido. Con esto en true el
  // backend devuelve brechaPct y dentroDeBanda en null a propósito: no calcula
  // una brecha contra un dato viejo. La UI muestra "tasa desactualizada",
  // nunca un cero ni un guion que parezca dato faltante genérico.
  tasaBcvStale: boolean;
}

/** Espejo de BrechaSnapshotPlain — una fila del histórico diario. */
export interface BrechaHistoricoPoint {
  fecha: string;
  tasaBcv: number;
  tasaP2p: number | null;
  // null = "no se pudo calcular", NUNCA 0. Graficarlo como 0 dibuja una caída
  // que no ocurrió: el punto se omite o se marca como sin dato.
  brechaPct: number | null;
  factorKConfigurado: number;
  // null = fila anterior al fix de zona horaria del scraper BCV, procedencia
  // dudosa. El backend las excluye de la muestra de K; cualquier cálculo del
  // lado del cliente sobre el histórico tiene que excluirlas igual.
  tasaBcvFetchedAt: string | null;
}

/** Por qué un snapshot no entró en la muestra de K sugerido. */
export interface SnapshotExcluido {
  fecha: string;
  // 'sin_brecha': brechaPct null — o el P2P no respondió, o el BCV venía
  // vencido. 'pre_fix': fila anterior al fix del scraper (tasaBcvFetchedAt null).
  motivo: 'sin_brecha' | 'pre_fix';
}

/** Espejo de KSugerido — resultado de GET /api/pricing/k-sugerido. */
export interface KSugerido {
  // null cuando muestraSuficiente es false: el backend nunca devuelve una
  // sugerencia que aparente un respaldo estadístico que no tiene. Ese es el
  // estado normal al inicio, no un error.
  kSugerido: number | null;
  kActual: number;
  metodo: 'mediana';
  diasUsados: number;
  diasObjetivo: number;
  muestraSuficiente: boolean;
  // Se devuelve aunque la muestra sea insuficiente — es informativa y permite
  // mostrar "mediana de 2 días" en vez de dejar el panel vacío.
  brechaMediana: number | null;
  bandaObjetivo: { min: number; max: number; centro: number };
  variacionPctCatalogo: number | null;
  // true si 1 + mediana/100 cayó fuera del rango válido de K y hubo que
  // clampear. Siempre boolean, nunca undefined. Se muestra: el recorte no
  // puede pasar en silencio.
  fueraDeRangoValido: boolean;
  snapshotsExcluidos: SnapshotExcluido[];
}

/**
 * Espejo de KAplicado — respuesta de POST /api/pricing/aplicar-k.
 * OJO: es un subconjunto de BrechaStatus. Alcanza para confirmar el K aplicado
 * al instante, pero brechaImplicitaK, dentroDeBanda y proximaRevision no vienen
 * acá: esos se refrescan con router.refresh().
 */
export interface KAplicado {
  factorReposicionCambiaria: number;
  ultimaRevisionK: string;
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
