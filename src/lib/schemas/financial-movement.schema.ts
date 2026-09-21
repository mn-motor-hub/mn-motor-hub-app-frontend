import { z } from 'zod';
import type { FinancialCategory, FinancialMovement, FinancialMovementStatus } from '@/types';

/** Hoy en local como YYYY-MM-DD — toISOString() correría el día por UTC. */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * En qué status termina el movimiento. Espeja la derivación del backend: sin
 * `status` explícito, una fecha futura da 'planificado' y hoy o pasada da
 * 'confirmado'. Es lo que decide si `metodoPago` es obligatorio — mirar solo el
 * `status` que eligió el usuario dejaría pasar un movimiento de hoy sin status
 * que el backend rechaza con 400.
 */
export function resolveMovementStatus(
  date: string,
  status?: FinancialMovementStatus,
): FinancialMovementStatus {
  return status ?? (date > todayISO() ? 'planificado' : 'confirmado');
}

/**
 * `metodoPago` es obligatorio cuando el movimiento resuelve a 'confirmado'.
 *
 * `original` es el movimiento que se está editando. El backend deja editar
 * otros campos de un confirmado anterior a la columna (sin método) sin exigirlo,
 * así que acá tampoco: obligar a elegir uno sería inventar un dato histórico.
 */
export function isMetodoPagoRequired(
  values: { date: string; status?: FinancialMovementStatus },
  original?: Pick<FinancialMovement, 'status' | 'metodoPago'>,
): boolean {
  if (resolveMovementStatus(values.date, values.status) !== 'confirmado') return false;
  return !(original?.status === 'confirmado' && !original.metodoPago);
}

const metodoPagoSchema = z.enum(
  ['pago_movil', 'transferencia_bancaria', 'zelle', 'binance', 'efectivo'],
  { message: 'Seleccioná el método de pago' },
);

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

  // Opcional a nivel de forma, obligatorio según el status resuelto — esa regla
  // cruzada vive en createMovementFormSchema (ver isMetodoPagoRequired), no acá:
  // un refine en este objeto rompería el .partial() del schema de edición.
  metodoPago: metodoPagoSchema.optional(),
});

export type CreateFinancialMovementData = z.infer<typeof createFinancialMovementSchema>;

export const updateFinancialMovementSchema = createFinancialMovementSchema
  .partial()
  .extend({
    active: z.boolean().optional(),
    // null borra el método en el PATCH (válido en un planificado).
    metodoPago: metodoPagoSchema.nullable().optional(),
  });

export type UpdateFinancialMovementData = z.infer<typeof updateFinancialMovementSchema>;

/**
 * Schema del formulario, derivado de las categorías disponibles.
 * Se construye una vez por lista de categorías y se pasa a zodResolver.
 *
 * El backend ya rechaza con 400 un movimiento cuyo tipo no coincide con el de su
 * categoría; esto adelanta esa validación al cliente para que el error aparezca
 * en el campo y no como banner después del submit. Lo mismo para `metodoPago`,
 * que el backend exige con 400 cuando el movimiento queda confirmado.
 */
export function createMovementFormSchema(
  categorias: FinancialCategory[],
  original?: Pick<FinancialMovement, 'status' | 'metodoPago'>,
) {
  return createFinancialMovementSchema.superRefine((val, ctx) => {
    // Va antes del chequeo de categoría porque ese hace return temprano.
    if (!val.metodoPago && isMetodoPagoRequired(val, original)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Seleccioná el método de pago',
        path: ['metodoPago'],
      });
    }

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
