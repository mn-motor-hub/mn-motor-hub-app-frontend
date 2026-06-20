import { BASE_URL } from './client';
import type {
  StockImportParseResponse,
  StockImportConfirmRequest,
  StockImportConfirmResponse,
} from '@/types';

const PARSE_ERROR_MESSAGES: Record<number, string> = {
  400: 'El archivo enviado no es válido o está mal formado.',
  422: 'No se pudo extraer información de la factura. Verificá que el archivo sea legible y corresponda a una factura real.',
  502: 'El servicio de extracción con IA no está disponible en este momento. Intentá de nuevo en unos minutos.',
  504: 'La extracción tardó demasiado tiempo. El archivo puede ser demasiado complejo.',
};

export async function parseInvoice(file: File): Promise<StockImportParseResponse> {
  const formData = new FormData();
  formData.append('archivo', file);

  const res = await fetch(`${BASE_URL}/api/stock-imports/parse`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(
      PARSE_ERROR_MESSAGES[res.status] ??
        `Error inesperado al procesar la factura (HTTP ${res.status}).`
    );
  }

  return res.json();
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
  const res = await fetch(`${BASE_URL}/api/stock-imports/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    if (res.status === 409) throw new DuplicateInvoiceError();
    if (res.status === 400)
      throw new Error('Hay ítems con revisión pendiente sin confirmar o datos inválidos.');
    if (res.status === 404)
      throw new Error('El proveedor seleccionado no existe o fue eliminado.');
    throw new Error(`Error inesperado al confirmar la importación (HTTP ${res.status}).`);
  }

  return res.json();
}
