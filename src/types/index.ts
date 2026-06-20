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
