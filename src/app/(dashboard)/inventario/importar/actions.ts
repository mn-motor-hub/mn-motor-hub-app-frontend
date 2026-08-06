'use server';

import {
  classifySubcategorias,
  confirmImport,
  DuplicateInvoiceError,
  parseInvoice,
} from '@/lib/api/stock-imports';
import { createSupplier, getSuppliers } from '@/lib/api/suppliers';
import type {
  ActionResult,
  ClassifySubcategoriaRequestItem,
  ClassifySubcategoriaResultItem,
  StockImportConfirmRequest,
  StockImportConfirmResponse,
  StockImportParseResponse,
  Supplier,
} from '@/types';

/**
 * Estas acciones existen porque el token vive en una cookie httpOnly: el
 * navegador no puede leerlo, así que ningún Client Component puede llamar a
 * src/lib/api/ directamente. De paso cierra la deuda de CLAUDE.md sobre no
 * hacer fetch desde componentes cliente.
 */

export async function parseInvoiceAction(
  formData: FormData,
): Promise<ActionResult<StockImportParseResponse>> {
  const archivo = formData.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, error: 'No se recibió ningún archivo.' };
  }

  try {
    return { ok: true, data: await parseInvoice(archivo) };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al procesar la factura.') };
  }
}

export async function confirmImportAction(
  payload: StockImportConfirmRequest,
): Promise<ActionResult<StockImportConfirmResponse>> {
  try {
    return { ok: true, data: await confirmImport(payload) };
  } catch (err) {
    // instanceof no sobrevive el límite servidor→cliente: se manda un code.
    if (err instanceof DuplicateInvoiceError) {
      return {
        ok: false,
        code: err.code,
        error: 'Esta factura ya fue importada anteriormente. No se puede volver a importar.',
      };
    }
    return { ok: false, error: message(err, 'Error inesperado al confirmar la importación.') };
  }
}

export async function classifySubcategoriasAction(
  items: ClassifySubcategoriaRequestItem[],
): Promise<ActionResult<ClassifySubcategoriaResultItem[]>> {
  try {
    return { ok: true, data: await classifySubcategorias(items) };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al sugerir subcategorías con IA.') };
  }
}

export async function listSuppliersAction(): Promise<ActionResult<Supplier[]>> {
  try {
    return { ok: true, data: await getSuppliers() };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al obtener la lista de proveedores.') };
  }
}

export async function createSupplierAction(data: {
  nombre: string;
  rif?: string;
}): Promise<ActionResult<Supplier>> {
  try {
    return { ok: true, data: await createSupplier(data) };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al crear el proveedor.') };
  }
}

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
