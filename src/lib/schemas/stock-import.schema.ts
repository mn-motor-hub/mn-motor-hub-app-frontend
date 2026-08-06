import { z } from 'zod';
import type { StockImportParsedItem } from '@/types';

// One entry per item in the preview form.
// All fields are optional at the schema level; conditional requirements are
// enforced in createConfirmSchema's superRefine, which has access to the
// parsed item metadata (match, requiere_revision).
export const confirmItemSchema = z.object({
  precio_unitario_usd: z.number().positive('Debe ser mayor a 0'),
  precio_venta_nuevo: z.number().positive('Debe ser mayor a 0'),
  // sugerida por IA en el parseo, editable en todas las filas
  subcategoria_id: z.string().optional(),
  // new-item fields
  nombre: z.string().optional(),
  // UUID — mismo tipo que Categoria.id/Subcategoria.categoriaId en el backend
  categoria_id: z.string().optional(),
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
// `revisionOverrides` son ítems marcados requiere_revision después del parseo
// (ej. por el clasificador de subcategorías por IA), indexados por posición en
// el array — se combinan con el requiere_revision original, nunca lo apagan.
export function createConfirmSchema(
  parsedItems: StockImportParsedItem[],
  revisionOverrides: Record<number, boolean> = {},
) {
  return confirmBaseSchema.superRefine((val, ctx) => {
    val.items.forEach((item, i) => {
      const parsed = parsedItems[i];
      if (!parsed) return;

      // New items (no match in catalogue) need nombre + categoria_id + subcategoria_id.
      // subcategoria_id es el que realmente exige el backend para crear el ítem
      // (ver ConfirmItemDto / stock-imports.service.ts) — validarlo acá evita el
      // viaje redondo al servidor para un 400 que se puede atajar en el cliente.
      if (parsed.match === null) {
        if (!item.nombre || item.nombre.trim() === '') {
          ctx.addIssue({
            code: 'custom',
            message: 'El nombre es requerido para ítems nuevos',
            path: ['items', i, 'nombre'],
          });
        }
        if (!item.categoria_id || item.categoria_id.trim() === '') {
          ctx.addIssue({
            code: 'custom',
            message: 'Seleccioná una categoría',
            path: ['items', i, 'categoria_id'],
          });
        }
        if (!item.subcategoria_id || item.subcategoria_id.trim() === '') {
          ctx.addIssue({
            code: 'custom',
            message: 'Seleccioná una subcategoría',
            path: ['items', i, 'subcategoria_id'],
          });
        }
      }

      // Items flagged for review must have the checkbox explicitly checked.
      const needsRevision = parsed.requiere_revision || revisionOverrides[i] === true;
      if (needsRevision && item.revisado !== true) {
        ctx.addIssue({
          code: 'custom',
          message: 'Confirmá que revisaste este ítem antes de continuar',
          path: ['items', i, 'revisado'],
        });
      }
    });
  });
}
