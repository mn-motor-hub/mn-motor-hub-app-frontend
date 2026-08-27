import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { Badge } from '@/components/ui/Badge/Badge';
import { SupplierRefList } from '@/components/features/proveedores/SupplierRefList';
import { EditAutoPartButton } from '@/components/features/inventario/EditAutoPartButton';
import { getAutoPart } from '@/lib/api/auto-parts';
import { getCategorias } from '@/lib/api/categorias';
import { listSubcategorias } from '@/lib/api/subcategorias';
import { getSupplierRefs } from '@/lib/api/supplier-refs';
import { formatCurrencyUsd, formatDate } from '@/lib/utils/format';
import { withFallback } from '@/lib/utils/with-fallback';
import type { AutoPart, Categoria, Subcategoria, SupplierRef } from '@/types';
import styles from './detail.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AutoPartDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) notFound();

  const [part, categorias, subcategorias, supplierRefs] = await Promise.all([
    withFallback<AutoPart | null>(getAutoPart(numId), null),
    withFallback<Categoria[]>(getCategorias(), []),
    withFallback<Subcategoria[]>(listSubcategorias(), []),
    // Vía /api/supplier-refs (no part.supplierRefs): es el único endpoint que
    // hoy carga la relación supplier con el nombre del proveedor.
    withFallback<SupplierRef[]>(getSupplierRefs(numId), []),
  ]);
  if (!part) notFound();

  // auto_parts guarda subcategoria_id; el nombre de la categoría padre no viene
  // anidado en la relación (el backend no carga subcategoria.categoria), así
  // que se resuelve contra el catálogo — mismo patrón que en /inventario/importar.
  const categoriaNombre = categorias.find((c) => c.id === part.subcategoria?.categoriaId)?.nombre;

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
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Información general</h2>
              <EditAutoPartButton part={part} categorias={categorias} subcategorias={subcategorias} />
            </div>
            <dl className={styles.fieldGrid}>
              <Field label="Código Interno" value={part.codigoInterno} mono />
              <Field label="Nombre" value={part.nombre} span />
              {part.descripcion ? <Field label="Descripción" value={part.descripcion} span /> : null}
              {part.marca ? <Field label="Marca" value={part.marca} /> : null}
              <Field
                label="Categoría"
                value={categoriaNombre ? <Badge variant="info">{categoriaNombre}</Badge> : '—'}
              />
              <Field
                label="Subcategoría"
                value={
                  part.subcategoria ? (
                    <Badge variant="info">{part.subcategoria.nombre}</Badge>
                  ) : (
                    '—'
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
          <SupplierRefList autoPartId={part.id} refs={supplierRefs} />
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
