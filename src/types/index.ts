export interface Categoria {
  id: number;
  nombre: string;
  prefijo: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRef {
  id: number;
  autoPartId: number;
  proveedor: string;
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
  categoriaId: number;
  stockActual: number;
  stockMinimo: number;
  precioVenta: number | null;
  ubicacionStock: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  categoria?: Categoria;
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

// ─── Suppliers ────────────────────────────────────────────────
export interface Supplier {
  id: number;
  nombre: string;
  rif: string | null;
  activo: boolean;
  createdAt: string;
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
  categoria_id?: number;
  ubicacion_stock?: string;
  marca?: string;
}

export interface StockImportConfirmRequest {
  supplier_id: number;
  numero_factura: string;
  fecha_emision: string;
  items: StockImportConfirmItem[];
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
