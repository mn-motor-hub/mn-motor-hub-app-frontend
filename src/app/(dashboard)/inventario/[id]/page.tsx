import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { Badge } from '@/components/ui/Badge/Badge';
import { SupplierRefList } from '@/components/features/proveedores/SupplierRefList';
import { getAutoPart } from '@/lib/api/auto-parts';
import { formatCurrencyUsd, formatDate } from '@/lib/utils/format';
import styles from './detail.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AutoPartDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) notFound();

  const part = await getAutoPart(numId).catch(() => null);
  if (!part) notFound();

  const isBelowMin = part.stockActual <= part.stockMinimo;

  return (
    <>
      <Navbar
        title={part.codigoInterno}
        breadcrumb={[
          { label: 'Inventario', href: '/inventario' },
          { label: part.codigoInterno },
        ]}
      />

      <div className={styles.content}>
        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Información general</h2>
            <dl className={styles.fieldGrid}>
              <Field label="Código Interno" value={part.codigoInterno} mono />
              <Field label="Nombre" value={part.nombre} span />
              {part.descripcion ? <Field label="Descripción" value={part.descripcion} span /> : null}
              {part.marca ? <Field label="Marca" value={part.marca} /> : null}
              <Field
                label="Categoría"
                value={
                  part.categoria ? (
                    <Badge variant="info">{part.categoria.nombre}</Badge>
                  ) : (
                    String(part.categoriaId)
                  )
                }
              />
              <Field label="Ubicación Stock" value={part.ubicacionStock} mono />
              {part.precioVenta != null ? (
                <Field label="Precio Venta" value={formatCurrencyUsd(Number(part.precioVenta))} />
              ) : null}
              <Field label="Creado" value={formatDate(part.createdAt)} />
              <Field label="Actualizado" value={formatDate(part.updatedAt)} />
              <Field
                label="Estado"
                value={
                  <Badge variant={part.activo ? 'success' : 'neutral'}>
                    {part.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                }
              />
            </dl>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Stock</h2>
            <div className={styles.stockDisplay}>
              <div className={styles.stockNum}>
                <span className={isBelowMin ? styles.stockLow : styles.stockOk}>
                  {part.stockActual}
                </span>
                <span className={styles.stockUnit}>uds.</span>
              </div>
              <p className={styles.stockMin}>
                Mínimo: <strong>{part.stockMinimo} uds.</strong>
              </p>
              {isBelowMin && <Badge variant="danger">Stock por debajo del mínimo</Badge>}
            </div>
          </section>
        </div>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Referencias de proveedores</h2>
          <SupplierRefList refs={part.supplierRefs ?? []} />
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
