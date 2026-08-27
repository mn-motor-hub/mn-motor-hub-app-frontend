import { z } from 'zod';

// Edición inline de una fila de SupplierRefList — reasignar el proveedor
// (supplierId) queda fuera del alcance de este form. Ver PATCH /api/supplier-refs/:id.
export const editSupplierRefSchema = z.object({
  referenciaProveedor: z.string().optional(),
  precioCompra: z.number().min(0, 'El precio no puede ser negativo').optional(),
  notas: z.string().optional(),
});

export type EditSupplierRefFormData = z.infer<typeof editSupplierRefSchema>;
