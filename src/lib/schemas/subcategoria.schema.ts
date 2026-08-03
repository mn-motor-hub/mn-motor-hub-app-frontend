import { z } from 'zod';

// Mismas reglas que CreateSubcategoriaDto en el backend (@IsUUID, @IsNotEmpty).
export const createSubcategoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  categoriaId: z.string().uuid('Seleccioná una categoría'),
});

export type CreateSubcategoriaData = z.infer<typeof createSubcategoriaSchema>;
