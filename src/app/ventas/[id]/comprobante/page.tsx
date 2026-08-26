import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { getSale } from '@/lib/api/sales';
import { withFallback } from '@/lib/utils/with-fallback';
import { formatCurrencyUsd, formatBs, formatDate } from '@/lib/utils/format';
import { COMPANY } from '@/lib/constants/company';
import type { Sale } from '@/types';
import { PrintButton } from './PrintButton';
import styles from './comprobante.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ComprobanteVentaPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) notFound();

  const sale = await withFallback<Sale | null>(getSale(numId), null);
  if (!sale) notFound();

  if (sale.estado !== 'confirmada') {
    return (
      <main className={styles.blockedPage}>
        <p className={styles.blockedText}>
          Esta venta no está confirmada todavía — el comprobante solo se puede emitir
          una vez que se verificó el pago.
        </p>
        <Link href={`/ventas/${sale.id}`} className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a la venta
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={`${styles.actions} ${styles.noPrint}`}>
        <Link href={`/ventas/${sale.id}`} className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a la venta
        </Link>
        <PrintButton />
      </div>

      <article className={styles.document}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Image src="/images/logo.svg" alt="" width={56} height={56} className={styles.logo} />
            <div>
              <p className={styles.companyName}>{COMPANY.nombre}</p>
              <p className={styles.companyMeta}>RIF: {COMPANY.rif}</p>
              <p className={styles.companyMeta}>{COMPANY.direccion}</p>
              <p className={styles.companyMeta}>{COMPANY.telefono}</p>
            </div>
          </div>
          <div className={styles.docInfo}>
            <p className={styles.docTitle}>Comprobante de venta</p>
            <p className={styles.docNumber}>N.° {String(sale.id).padStart(6, '0')}</p>
            <p className={styles.docMeta}>Fecha: {formatDate(sale.fecha)}</p>
          </div>
        </header>

        <section className={styles.clienteBlock}>
          <ClienteField label="Cliente" value={sale.clienteNombre} />
          <ClienteField label="Documento" value={sale.clienteDocumento} />
          {sale.clienteTelefono && <ClienteField label="Teléfono" value={sale.clienteTelefono} />}
          <ClienteField label="Atendido por" value={sale.createdBy} />
        </section>

        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th className={styles.num}>Cant.</th>
              <th className={styles.num}>Precio unit.</th>
              <th className={styles.num}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className={styles.mono}>{item.autoPartCodigoInterno ?? '—'}</td>
                <td>{item.autoPartNombre}</td>
                <td className={styles.num}>{item.cantidad}</td>
                <td className={styles.num}>{formatCurrencyUsd(item.precioUnitarioUsd)}</td>
                <td className={styles.num}>{formatCurrencyUsd(item.subtotalUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatCurrencyUsd(sale.subtotalUsd)}</span>
          </div>
          <div className={styles.totalRowMain}>
            <span>Total</span>
            <span>{formatCurrencyUsd(sale.totalUsd)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Forma de pago</span>
            <span>{sale.formaPago === 'usd' ? 'USD' : 'Bolívares'}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Monto pagado</span>
            <span>
              {sale.formaPago === 'usd'
                ? formatCurrencyUsd(sale.montoEnFormaPago)
                : formatBs(sale.montoEnFormaPago)}
            </span>
          </div>
        </section>

        {sale.notas && (
          <section className={styles.notas}>
            <p className={styles.notasLabel}>Notas</p>
            <p>{sale.notas}</p>
          </section>
        )}

        <footer className={styles.footer}>
          Comprobante interno de venta — no válido como factura fiscal.
        </footer>
      </article>
    </main>
  );
}

function ClienteField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.clienteField}>
      <span className={styles.clienteLabel}>{label}</span>
      <span className={styles.clienteValue}>{value}</span>
    </div>
  );
}
