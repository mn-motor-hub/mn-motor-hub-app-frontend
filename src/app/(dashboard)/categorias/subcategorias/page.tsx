import { Navbar } from '@/components/layout/Navbar/Navbar';
import { getCategorias } from '@/lib/api/categorias';
import { listSubcategorias } from '@/lib/api/subcategorias';
import { withFallback } from '@/lib/utils/with-fallback';
import { SubcategoriasTable } from '@/components/features/categorias/SubcategoriasTable';
import { CategoriasTabs } from '../CategoriasTabs';
import type { Categoria, Subcategoria } from '@/types';
import styles from '../categorias.module.css';

export default async function SubcategoriasPage() {
  const [categorias, subcategorias] = await Promise.all([
    withFallback<Categoria[]>(getCategorias(), []),
    withFallback<Subcategoria[]>(listSubcategorias(), []),
  ]);

  return (
    <>
      <Navbar
        title="Subcategorías"
        breadcrumb={[{ label: 'Panel' }, { label: 'Categorías', href: '/categorias' }, { label: 'Subcategorías' }]}
      />

      <div className={styles.content}>
        <CategoriasTabs active="subcategorias" />

        <SubcategoriasTable
          subcategorias={subcategorias}
          categorias={categorias}
          basePath="/categorias/subcategorias"
        />
      </div>
    </>
  );
}
