import { z } from 'zod';

export const supplierRefSchema = z.object({
  autoPartId: z.number().int().positive(),
  proveedor: z.string().min(1, 'El proveedor es requerido'),
  referenciaProveedor: z.string().nullable().optional(),
  precioCompra: z.number().positive('El precio debe ser mayor a 0').nullable().optional(),
  notas: z.string().nullable().optional(),
  activo: z.boolean().default(true),
});

export type SupplierRefFormData = z.infer<typeof supplierRefSchema>;
