import { Navbar } from '@/components/layout/Navbar/Navbar';
import { getSuppliers } from '@/lib/api/suppliers';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table/Table';
import { formatDate } from '@/lib/utils/format';
import { withFallback } from '@/lib/utils/with-fallback';
import type { Supplier } from '@/types';
import styles from './proveedores.module.css';

export default async function ProveedoresPage() {
  const suppliers = await withFallback<Supplier[] | null>(getSuppliers(), null);

  return (
    <>
      <Navbar
        title="Proveedores"
        breadcrumb={[{ label: 'Panel' }, { label: 'Proveedores' }]}
      />

      <div className={styles.content}>
        {suppliers === null ? (
          <div className={styles.empty}>
            No se pudo cargar la lista de proveedores. Intentá de nuevo más tarde.
          </div>
        ) : suppliers.length === 0 ? (
          <div className={styles.empty}>No hay proveedores registrados.</div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>RIF</Th>
                <Th>Actualizado</Th>
                <Th>Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {suppliers.map((supplier) => (
                <Tr key={supplier.id}>
                  <Td>{supplier.nombre}</Td>
                  <Td className={styles.code}>{supplier.rif ?? <span className={styles.muted}>—</span>}</Td>
                  <Td>{formatDate(supplier.updatedAt)}</Td>
                  <Td>
                    {supplier.activo ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="neutral">Inactivo</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>
    </>
  );
}
