import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { getCategorias } from '@/lib/api/categorias';
import { listSubcategorias } from '@/lib/api/subcategorias';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@mn/design-system/ui';
import { InfoPopover } from '@/components/ui/InfoPopover/InfoPopover';
import { formatDate } from '@/lib/utils/format';
import { withFallback } from '@/lib/utils/with-fallback';
import { NuevaCategoriaButton } from './NuevaCategoriaButton';
import { CategoriasTabs } from './CategoriasTabs';
import type { Categoria, Subcategoria } from '@/types';
import styles from './categorias.module.css';

export default async function CategoriasPage() {
  const [categorias, subcategorias] = await Promise.all([
    withFallback<Categoria[]>(getCategorias(), []),
    withFallback<Subcategoria[]>(listSubcategorias(), []),
  ]);

  // 205 subcategorías es poco volumen: se cuentan en memoria en vez de pedirle
  // al backend un endpoint de agregación aparte.
  const counts = new Map<string, number>();
  for (const sub of subcategorias) {
    counts.set(sub.categoriaId, (counts.get(sub.categoriaId) ?? 0) + 1);
  }

  return (
    <>
      <Navbar
        title="Categorías"
        breadcrumb={[{ label: 'Panel' }, { label: 'Categorías' }]}
      />

      <div className={styles.content}>
        <CategoriasTabs active="categorias" />

        <div className={styles.header}>
          <p className={styles.count}>
            {categorias.length} categoría{categorias.length !== 1 ? 's' : ''} registrada
            {categorias.length !== 1 ? 's' : ''}
          </p>
          <NuevaCategoriaButton />
        </div>

        {categorias.length === 0 ? (
          <div className={styles.empty}>No hay categorías registradas.</div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>Código</Th>
                <Th>Subcategorías</Th>
                <Th>Actualizado</Th>
                <Th>Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categorias.map((cat) => (
                <Tr key={cat.id} className={styles.clickableRow}>
                  <Td>
                    <div className={styles.nombreCell}>
                      <Link href={`/categorias/${cat.id}`} className={styles.rowLink}>
                        {cat.nombre}
                      </Link>
                      {cat.descripcion ? (
                        <span className={styles.popoverSlot}>
                          <InfoPopover
                            text={cat.descripcion}
                            label={`Ver descripción de ${cat.nombre}`}
                          />
                        </span>
                      ) : null}
                    </div>
                  </Td>
                  <Td>
                    <span className={styles.codigo}>{cat.codigo}</span>
                  </Td>
                  <Td>
                    <Badge variant="neutral">{counts.get(cat.id) ?? 0}</Badge>
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
