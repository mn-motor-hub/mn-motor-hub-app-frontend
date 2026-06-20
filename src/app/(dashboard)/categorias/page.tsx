import { Navbar } from '@/components/layout/Navbar/Navbar';
import { getCategorias } from '@/lib/api/categorias';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table/Table';
import { formatDate } from '@/lib/utils/format';
import type { Categoria } from '@/types';
import styles from './categorias.module.css';

export default async function CategoriasPage() {
  let categorias: Categoria[] = [];
  try {
    categorias = await getCategorias();
  } catch {
    // API no disponible en build time — se revalida en el primer request
  }

  return (
    <>
      <Navbar
        title="Categorías"
        breadcrumb={[{ label: 'Dashboard' }, { label: 'Categorías' }]}
      />

      <div className={styles.content}>
        <div className={styles.header}>
          <p className={styles.count}>
            {categorias.length} categoría{categorias.length !== 1 ? 's' : ''} registrada
            {categorias.length !== 1 ? 's' : ''}
          </p>
        </div>

        {categorias.length === 0 ? (
          <div className={styles.empty}>No hay categorías registradas.</div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>Prefijo</Th>
                <Th>Actualizado</Th>
                <Th>Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categorias.map((cat) => (
                <Tr key={cat.id}>
                  <Td className={styles.nombre}>{cat.nombre}</Td>
                  <Td>
                    <span className={styles.prefijo}>{cat.prefijo}</span>
                  </Td>
                  <Td className={styles.fecha}>{formatDate(cat.updatedAt)}</Td>
                  <Td>
                    {cat.activo ? (
                      <Badge variant="success">Activa</Badge>
                    ) : (
                      <Badge variant="neutral">Inactiva</Badge>
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
