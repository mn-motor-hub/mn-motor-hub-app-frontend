import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { Badge } from '@mn/design-system/ui';
import { SubcategoriasTable } from '@/components/features/categorias/SubcategoriasTable';
import { getCategoria } from '@/lib/api/categorias';
import { listSubcategorias } from '@/lib/api/subcategorias';
import { formatDate } from '@/lib/utils/format';
import { withFallback } from '@/lib/utils/with-fallback';
import { ActivarDesactivarButton } from './ActivarDesactivarButton';
import type { Categoria, Subcategoria } from '@/types';
import styles from './detail.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoriaDetailPage({ params }: PageProps) {
  const { id } = await params;

  const categoria = await withFallback<Categoria | null>(getCategoria(id), null);
  if (!categoria) notFound();

  const subcategorias = await withFallback<Subcategoria[]>(
    listSubcategorias({ categoriaId: id }),
    [],
  );

  return (
    <>
      <Navbar
        title={categoria.nombre}
        breadcrumb={[
          { label: 'Panel' },
          { label: 'Categorías', href: '/categorias' },
          { label: categoria.nombre },
        ]}
      />

      <div className={styles.content}>
        <section className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{categoria.nombre}</h1>
              <Badge variant={categoria.activo ? 'success' : 'neutral'}>
                {categoria.activo ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            <div className={styles.meta}>
              <span className={styles.codigo}>{categoria.codigo}</span>
              <span className={styles.updated}>Actualizado {formatDate(categoria.updatedAt)}</span>
            </div>
            {categoria.descripcion ? (
              <p className={styles.descripcion}>{categoria.descripcion}</p>
            ) : null}
          </div>

          <ActivarDesactivarButton categoriaId={categoria.id} activo={categoria.activo} />
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Subcategorías</h2>
          <SubcategoriasTable
            subcategorias={subcategorias}
            basePath={`/categorias/${categoria.id}`}
            fixedCategoriaId={categoria.id}
          />
        </section>
      </div>
    </>
  );
}
