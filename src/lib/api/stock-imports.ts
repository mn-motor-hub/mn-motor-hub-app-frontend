import { BASE_URL, apiFetch } from './client';
import type {
  StockImportParseResponse,
  StockImportConfirmRequest,
  StockImportConfirmResponse,
  ClassifySubcategoriaRequestItem,
  ClassifySubcategoriaResultItem,
} from '@/types';

const PARSE_ERROR_MESSAGES: Record<number, string> = {
  400: 'El archivo enviado no es válido o está mal formado.',
  422: 'No se pudo extraer información de la factura. Verificá que el archivo sea legible y corresponda a una factura real.',
  429: 'El servicio de extracción con IA está saturado (límite de solicitudes). Esperá un momento y reintentá.',
  500: 'El servicio de extracción con IA falló al procesar este archivo.',
  502: 'El servicio de extracción con IA no está disponible en este momento. Intentá de nuevo en unos minutos.',
  503: 'El servicio de extracción con IA no está disponible en este momento. Intentá de nuevo en unos minutos.',
  504: 'La extracción tardó demasiado tiempo. El archivo puede ser demasiado complejo (muchas páginas o ítems).',
};

export async function parseInvoice(file: File): Promise<StockImportParseResponse> {
  const formData = new FormData();
  formData.append('archivo', file);

  const res = await apiFetch(`${BASE_URL}/api/stock-imports/parse`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    // El body puede traer detalle real (ej. el proveedor de IA rechazando la
    // solicitud por saldo/cuota) — antes se descartaba y solo se mostraba un
    // mensaje genérico por status, así que un 500 real era indistinguible de
    // cualquier otro fallo. Se loguea completo server-side (Server Action) y
    // se antepone al usuario cuando el backend lo da.
    const body = (await res.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;
    const backendMessage = body?.message ?? body?.error;

    console.error(
      `[stock-imports.parseInvoice] HTTP ${res.status} al parsear "${file.name}" ` +
        `(${file.size} bytes, ${file.type}):`,
      backendMessage ?? '(el backend no devolvió mensaje)',
    );

    const generic = PARSE_ERROR_MESSAGES[res.status];
    const friendly =
      generic && backendMessage
        ? `${generic} Detalle: ${backendMessage}`
        : (backendMessage ?? generic ?? `Error inesperado al procesar la factura (HTTP ${res.status}).`);

    throw new Error(friendly);
  }

  return res.json();
}

export async function classifySubcategorias(
  items: ClassifySubcategoriaRequestItem[],
): Promise<ClassifySubcategoriaResultItem[]> {
  const res = await apiFetch(`${BASE_URL}/api/stock-imports/classify-subcategorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // El DTO del backend valida un objeto { items }, no un array suelto.
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(
      body?.message ?? `Error al sugerir subcategorías con IA (HTTP ${res.status}).`,
    );
  }

  const body: { data: ClassifySubcategoriaResultItem[] } = await res.json();
  return body.data;
}

export class DuplicateInvoiceError extends Error {
  readonly code = 'DUPLICATE_INVOICE';
  constructor() {
    super('Esta factura ya fue importada anteriormente.');
  }
}

export async function confirmImport(
  data: StockImportConfirmRequest
): Promise<StockImportConfirmResponse> {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(data));

  const res = await apiFetch(`${BASE_URL}/api/stock-imports/confirm`, {
    method: 'POST',
    // Sin Content-Type: el navegador lo setea automáticamente con el boundary correcto
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 409) throw new DuplicateInvoiceError();
    const body = await res.json().catch(() => null) as { message?: string } | null;
    if (res.status === 400)
      throw new Error(body?.message ?? 'Hay ítems con revisión pendiente sin confirmar o datos inválidos.');
    if (res.status === 404)
      throw new Error(body?.message ?? 'El proveedor seleccionado no existe o fue eliminado.');
    throw new Error(body?.message ?? `Error inesperado al confirmar la importación (HTTP ${res.status}).`);
  }

  return res.json();
}
