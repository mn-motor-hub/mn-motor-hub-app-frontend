import { z } from 'zod';

export const autoPartSchema = z.object({
  codigoInterno: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().nullable().optional(),
  marca: z.string().nullable().optional(),
  categoriaId: z.number().int().positive('Debe seleccionar una categoría'),
  stockActual: z.number().int().min(0, 'El stock no puede ser negativo'),
  stockMinimo: z.number().int().min(0, 'El stock mínimo no puede ser negativo'),
  precioVenta: z.number().positive('El precio debe ser mayor a 0').nullable().optional(),
  ubicacionStock: z.string().min(1, 'La ubicación es requerida'),
  activo: z.boolean().default(true),
});

export type AutoPartFormData = z.infer<typeof autoPartSchema>;
