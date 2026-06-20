import { z } from 'zod';
import type { StockImportParsedItem } from '@/types';

// One entry per item in the preview form.
// All fields are optional at the schema level; conditional requirements are
// enforced in createConfirmSchema's superRefine, which has access to the
// parsed item metadata (match, requiere_revision).
export const confirmItemSchema = z.object({
  precio_venta_nuevo: z.number().positive('Debe ser mayor a 0'),
  // new-item fields
  nombre: z.string().optional(),
  categoria_id: z.number().int().optional(),
  ubicacion_stock: z.string().optional(),
  marca: z.string().optional(),
  // required true when requiere_revision is true
  revisado: z.boolean().optional(),
});

export type ConfirmItemFormData = z.infer<typeof confirmItemSchema>;

export const confirmBaseSchema = z.object({
  supplier_id: z.number().int().positive('Seleccioná un proveedor'),
  items: z.array(confirmItemSchema),
});

export type ConfirmFormData = z.infer<typeof confirmBaseSchema>;

// Build a schema that enforces conditional field requirements based on the
// parsed invoice items.  Call this once per parsed response and pass the
// result to zodResolver.
export function createConfirmSchema(parsedItems: StockImportParsedItem[]) {
  return confirmBaseSchema.superRefine((val, ctx) => {
    val.items.forEach((item, i) => {
      const parsed = parsedItems[i];
      if (!parsed) return;

      // New items (no match in catalogue) need nombre + categoria_id.
      if (parsed.match === null) {
        if (!item.nombre || item.nombre.trim() === '') {
          ctx.addIssue({
            code: 'custom',
            message: 'El nombre es requerido para ítems nuevos',
            path: ['items', i, 'nombre'],
          });
        }
        if (!item.categoria_id || item.categoria_id <= 0) {
          ctx.addIssue({
            code: 'custom',
            message: 'Seleccioná una categoría',
            path: ['items', i, 'categoria_id'],
          });
        }
      }

      // Items flagged for review must have the checkbox explicitly checked.
      if (parsed.requiere_revision && item.revisado !== true) {
        ctx.addIssue({
          code: 'custom',
          message: 'Confirmá que revisaste este ítem antes de continuar',
          path: ['items', i, 'revisado'],
        });
      }
    });
  });
}
