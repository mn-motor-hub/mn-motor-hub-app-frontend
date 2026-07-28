'use server';

import { createFinancialCategory } from '@/lib/api/financial-categories';
import {
  createFinancialMovement,
  deleteFinancialMovement,
  updateFinancialMovement,
} from '@/lib/api/financial-movements';
import type {
  CreateFinancialMovementData,
  UpdateFinancialMovementData,
} from '@/lib/schemas/financial-movement.schema';
import type {
  ActionResult,
  FinancialCategory,
  FinancialMovement,
  FinancialType,
} from '@/types';

/**
 * Estas acciones existen porque el token vive en una cookie httpOnly: el
 * navegador no puede leerlo, así que ningún Client Component puede llamar a
 * src/lib/api/ directamente. De paso cierra la deuda de CLAUDE.md sobre no
 * hacer fetch desde componentes cliente.
 */

export async function createFinancialCategoryAction(data: {
  name: string;
  type: FinancialType;
}): Promise<ActionResult<FinancialCategory>> {
  try {
    return { ok: true, data: await createFinancialCategory(data) };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al crear la categoría.') };
  }
}

export async function createMovementAction(
  data: CreateFinancialMovementData,
): Promise<ActionResult<FinancialMovement>> {
  try {
    return { ok: true, data: await createFinancialMovement(data) };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al registrar el movimiento.') };
  }
}

export async function updateMovementAction(
  id: number,
  data: UpdateFinancialMovementData,
): Promise<ActionResult<FinancialMovement>> {
  try {
    return { ok: true, data: await updateFinancialMovement(id, data) };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al actualizar el movimiento.') };
  }
}

export async function deleteMovementAction(id: number): Promise<ActionResult<null>> {
  try {
    await deleteFinancialMovement(id);
    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: message(err, 'Error al eliminar el movimiento.') };
  }
}

function message(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
