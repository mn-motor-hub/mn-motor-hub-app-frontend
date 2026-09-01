import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, FileText } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table/Table';
import { AnularSaleButton } from '@/components/features/ventas/AnularSaleButton';
import { ConfirmarSaleButton } from '@/components/features/ventas/ConfirmarSaleButton';
import { SaleEstadoBadge } from '@/components/features/ventas/SaleEstadoBadge';
import { getSale } from '@/lib/api/sales';
import { formatCurrencyUsd, formatDate } from '@/lib/utils/format';
import { withFallback } from '@/lib/utils/with-fallback';
import type { Sale } from '@/types';
import styles from './detalle.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VentaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) notFound();

  const sale = await withFallback<Sale | null>(getSale(numId), null);
  if (!sale) notFound();

  return (
    <>
      <Navbar
        title={sale.clienteNombre}
        breadcrumb={[
          { label: 'Ventas', href: '/ventas' },
          { label: sale.clienteNombre },
        ]}
      />

      <div className={styles.content}>
        {sale.ventaBajoCosto && (
          <p className={styles.bajoCostoWarning} role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            Esta venta se registró por debajo del costo del repuesto.
          </p>
        )}

        <div className={styles.headerRow}>
          <SaleEstadoBadge estado={sale.estado} />
          <div className={styles.headerActions}>
            <ConfirmarSaleButton sale={sale} />
            {sale.estado === 'confirmada' && (
              <Link href={`/ventas/${sale.id}/comprobante`} className={styles.comprobanteLink}>
                <FileText size={16} aria-hidden="true" />
                Emitir comprobante
              </Link>
            )}
            <AnularSaleButton sale={sale} />
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Información general</h2>
            <dl className={styles.fieldGrid}>
              <Field label="Cliente" value={sale.clienteNombre} span />
              <Field label="Documento" value={sale.clienteDocumento} mono />
              {sale.clienteTelefono ? (
                <Field label="Teléfono" value={sale.clienteTelefono} />
              ) : null}
              <Field label="Fecha" value={formatDate(sale.fecha)} />
              <Field label="Registrado por" value={sale.createdBy} />
              <Field
                label="Forma de pago"
                value={sale.formaPago === 'usd' ? 'USD' : 'Bs'}
              />
              <Field
                label={`Monto pagado (${sale.formaPago === 'usd' ? 'USD' : 'Bs'})`}
                value={
                  sale.formaPago === 'usd'
                    ? formatCurrencyUsd(sale.montoEnFormaPago)
                    : sale.montoEnFormaPago.toFixed(2)
                }
                mono
              />
              {sale.notas ? <Field label="Notas" value={sale.notas} span /> : null}
            </dl>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Totales (USD)</h2>
            <dl className={styles.fieldGrid}>
              <Field label="Subtotal" value={formatCurrencyUsd(sale.subtotalUsd)} mono />
              {sale.descuentoUsd > 0 ? (
                <Field label="Descuento" value={`-${formatCurrencyUsd(sale.descuentoUsd)}`} mono />
              ) : null}
              <Field label="Total" value={formatCurrencyUsd(sale.totalUsd)} mono />
              <Field label="Costo total" value={formatCurrencyUsd(sale.costoTotalUsd)} mono />
            </dl>
          </section>
        </div>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Ítems</h2>
          <Table>
            <Thead>
              <Tr>
                <Th>Código</Th>
                <Th>Repuesto</Th>
                <Th className={styles.numHeader}>Cantidad</Th>
                <Th className={styles.numHeader}>Precio unitario</Th>
                <Th className={styles.numHeader}>Subtotal</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sale.items.map((item) => (
                <Tr key={item.id}>
                  <Td className={styles.mono}>{item.autoPartCodigoInterno ?? '—'}</Td>
                  <Td>{item.autoPartNombre}</Td>
                  <Td className={styles.num}>{item.cantidad}</Td>
                  <Td className={styles.num}>{formatCurrencyUsd(item.precioUnitarioUsd)}</Td>
                  <Td className={styles.num}>{formatCurrencyUsd(item.subtotalUsd)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </section>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  mono,
  span,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  span?: boolean;
}) {
  return (
    <div className={[styles.field, span ? styles.fieldSpan : ''].filter(Boolean).join(' ')}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={[styles.fieldValue, mono ? styles.mono : ''].filter(Boolean).join(' ')}>
        {value}
      </dd>
    </div>
  );
}
