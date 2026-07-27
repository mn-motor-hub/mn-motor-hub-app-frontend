import { z } from 'zod';
import type { FinancialCategory } from '@/types';

// Espeja CreateFinancialMovementDto del backend. Los mensajes están en español
// porque se muestran directo en el formulario.
export const createFinancialMovementSchema = z.object({
  type: z.enum(['ingreso', 'gasto'], { message: 'Seleccioná el tipo de movimiento' }),

  amount: z
    .number({ message: 'Ingresá un monto' })
    .positive('El monto debe ser mayor a 0')
    .multipleOf(0.01, 'El monto admite hasta 2 decimales'),

  // El backend valida /^\d{4}-\d{2}-\d{2}$/ — mismo formato que emite <input type="date">
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),

  description: z.string().trim().min(1, 'La descripción es requerida'),

  financialCategoryId: z
    .number({ message: 'Seleccioná una categoría' })
    .int()
    .positive('Seleccioná una categoría'),

  registeredBy: z.string().trim().min(1, 'Indicá quién registra el movimiento'),

  // Opcional: si no se envía, el backend lo deriva de la fecha
  // (futura → planificado, hoy o pasada → confirmado).
  status: z.enum(['confirmado', 'planificado']).optional(),
});

export type CreateFinancialMovementData = z.infer<typeof createFinancialMovementSchema>;

export const updateFinancialMovementSchema = createFinancialMovementSchema
  .partial()
  .extend({ active: z.boolean().optional() });

export type UpdateFinancialMovementData = z.infer<typeof updateFinancialMovementSchema>;

/**
 * Schema del formulario, derivado de las categorías disponibles.
 * Se construye una vez por lista de categorías y se pasa a zodResolver.
 *
 * El backend ya rechaza con 400 un movimiento cuyo tipo no coincide con el de su
 * categoría; esto adelanta esa validación al cliente para que el error aparezca
 * en el campo y no como banner después del submit.
 */
export function createMovementFormSchema(categorias: FinancialCategory[]) {
  return createFinancialMovementSchema.superRefine((val, ctx) => {
    const categoria = categorias.find((c) => c.id === val.financialCategoryId);

    if (!categoria) {
      ctx.addIssue({
        code: 'custom',
        message: 'Seleccioná una categoría',
        path: ['financialCategoryId'],
      });
      return;
    }

    if (categoria.type !== val.type) {
      ctx.addIssue({
        code: 'custom',
        message: `"${categoria.name}" es una categoría de ${categoria.type}. Elegí una de ${val.type}.`,
        path: ['financialCategoryId'],
      });
    }
  });
}
