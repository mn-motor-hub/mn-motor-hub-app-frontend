import { Navbar } from '@/components/layout/Navbar/Navbar';
import { getAllSupplierRefs } from '@/lib/api/supplier-refs';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table/Table';
import { formatCurrencyUsd, formatDate } from '@/lib/utils/format';
import type { SupplierRef } from '@/types';
import styles from './proveedores.module.css';

export default async function ProveedoresPage() {
  let refs: SupplierRef[] = [];
  try {
    refs = await getAllSupplierRefs();
  } catch {
    // API no disponible en build time — se revalida en el primer request
  }

  const grouped = refs.reduce<Record<string, SupplierRef[]>>((acc, ref) => {
    if (!acc[ref.proveedor]) acc[ref.proveedor] = [];
    acc[ref.proveedor].push(ref);
    return acc;
  }, {});

  return (
    <>
      <Navbar
        title="Proveedores"
        breadcrumb={[{ label: 'Dashboard' }, { label: 'Proveedores' }]}
      />

      <div className={styles.content}>
        {Object.entries(grouped).length === 0 ? (
          <div className={styles.empty}>No hay referencias de proveedores registradas.</div>
        ) : (
          Object.entries(grouped).map(([proveedor, provRefs]) => (
            <section key={proveedor} className={styles.supplierSection}>
              <div className={styles.supplierHeader}>
                <h2 className={styles.supplierName}>{proveedor}</h2>
                <Badge variant="info">
                  {provRefs.length} referencia{provRefs.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <Table>
                <Thead>
                  <Tr>
                    <Th>Referencia</Th>
                    <Th>Precio compra</Th>
                    <Th>Notas</Th>
                    <Th>Actualizado</Th>
                    <Th>Estado</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {provRefs.map((ref) => (
                    <Tr key={ref.id}>
                      <Td className={styles.code}>{ref.referenciaProveedor ?? '—'}</Td>
                      <Td>
                        {ref.precioCompra != null
                          ? formatCurrencyUsd(Number(ref.precioCompra))
                          : <span className={styles.muted}>—</span>}
                      </Td>
                      <Td className={styles.notas}>{ref.notas ?? <span className={styles.muted}>—</span>}</Td>
                      <Td>{formatDate(ref.updatedAt)}</Td>
                      <Td>
                        {ref.activo ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="neutral">Inactivo</Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </section>
          ))
        )}
      </div>
    </>
  );
}
