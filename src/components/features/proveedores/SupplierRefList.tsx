import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table/Table';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatCurrencyUsd } from '@/lib/utils/format';
import type { SupplierRef } from '@/types';
import styles from './SupplierRefList.module.css';

interface SupplierRefListProps {
  refs: SupplierRef[];
}

export function SupplierRefList({ refs }: SupplierRefListProps) {
  if (refs.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay referencias de proveedores para este repuesto.</p>
      </div>
    );
  }

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Proveedor</Th>
          <Th>Referencia</Th>
          <Th>Precio compra</Th>
          <Th>Notas</Th>
          <Th>Estado</Th>
        </Tr>
      </Thead>
      <Tbody>
        {refs.map((ref) => (
          <Tr key={ref.id}>
            <Td className={styles.proveedor}>{ref.proveedor}</Td>
            <Td className={styles.code}>{ref.referenciaProveedor ?? '—'}</Td>
            <Td>
              {ref.precioCompra != null
                ? formatCurrencyUsd(Number(ref.precioCompra))
                : <span className={styles.muted}>—</span>}
            </Td>
            <Td className={styles.notas}>{ref.notas ?? <span className={styles.muted}>—</span>}</Td>
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
  );
}
