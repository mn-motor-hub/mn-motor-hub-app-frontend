import { z } from 'zod';

/**
 * Un ítem del form trae más campos que el CreateSaleDto real: nombre,
 * código y precio de venta son solo para el preview en pantalla (nombre del
 * ítem, subtotal estimado). Al armar el payload para POST /api/sales se
 * recorta a { autoPartId, cantidad } — ver mapSaleFormToPayload en
 * lib/api/sales.ts.
 */
export const saleItemFormSchema = z.object({
  autoPartId: z.number().int().positive(),
  cantidad: z
    .number({ message: 'Ingresá una cantidad' })
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1'),
  nombre: z.string(),
  // Sourced from AutoPart.codigoInterno, que el catálogo modela como string no-nulo.
  codigoInterno: z.string(),
  precioVentaUsd: z.number().nullable(),
  stockActual: z.number(),
});

export type SaleItemFormData = z.infer<typeof saleItemFormSchema>;

// Espeja CreateSaleDto del backend (createdBy queda fuera: se resuelve en el
// Server Action desde la cookie de sesión, no es un campo del form).
export const createSaleSchema = z
  .object({
    clienteNombre: z.string().trim().min(1, 'El nombre del cliente es requerido'),
    // Texto libre — cubre cédula ("V-12345678") y RIF ("J-500088906") en un
    // mismo campo, sin validar formato (así lo definió el backend a propósito).
    clienteDocumento: z.string().trim().min(1, 'La cédula o RIF es requerida'),
    clienteTelefono: z.string().trim().optional(),
    formaPago: z.enum(['usd', 'bs'], { message: 'Seleccioná la forma de pago' }),
    montoEnFormaPago: z
      .number({ message: 'Ingresá el monto' })
      .positive('El monto debe ser mayor a 0')
      .multipleOf(0.01, 'El monto admite hasta 2 decimales'),
    // Descuento comercial a nivel venta, no override de tasa — toda venta se
    // factura siempre a la tasa BCV. Espeja CreateSaleDto#descuentoUsd.
    descuentoUsd: z
      .number({ message: 'Ingresá el descuento' })
      .min(0, 'El descuento no puede ser negativo')
      .multipleOf(0.01, 'El descuento admite hasta 2 decimales'),
    notas: z.string().trim().optional(),
    items: z.array(saleItemFormSchema).min(1, 'Agregá al menos un ítem'),
  })
  .superRefine((data, ctx) => {
    const subtotalUsd = data.items.reduce(
      (sum, item) => sum + item.cantidad * (item.precioVentaUsd ?? 0),
      0,
    );
    if (data.descuentoUsd > subtotalUsd) {
      ctx.addIssue({
        code: 'custom',
        path: ['descuentoUsd'],
        message: 'El descuento no puede ser mayor al subtotal de la venta',
      });
    }
    // Refleja la validación del backend: notas es obligatorio cuando hay descuento.
    if (data.descuentoUsd > 0 && !data.notas) {
      ctx.addIssue({
        code: 'custom',
        path: ['notas'],
        message: 'Las notas son obligatorias cuando aplicás un descuento',
      });
    }
  });

export type CreateSaleFormData = z.infer<typeof createSaleSchema>;
