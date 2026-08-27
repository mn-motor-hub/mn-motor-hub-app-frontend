import { z } from 'zod';

// Edición de un AutoPart existente — codigoInterno queda fuera a propósito:
// lo genera el backend y no es editable. Ver PATCH /api/auto-parts/:id.
export const editAutoPartSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  marca: z.string().optional(),
  // UUID — Subcategoria.id en el backend.
  subcategoriaId: z.string().min(1, 'Seleccioná una subcategoría'),
  precioVenta: z.number().min(0, 'El precio no puede ser negativo'),
});

export type EditAutoPartFormData = z.infer<typeof editAutoPartSchema>;
