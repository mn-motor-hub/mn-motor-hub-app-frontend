import { z } from 'zod';

export const createCategoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
});

export type CreateCategoriaData = z.infer<typeof createCategoriaSchema>;
