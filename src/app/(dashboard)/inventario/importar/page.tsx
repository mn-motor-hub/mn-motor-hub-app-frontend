// TODO: Proteger esta ruta con autenticación antes de ir a producción.
// Actualmente es pública. Cualquiera con acceso a la red puede importar
// stock y modificar el catálogo. Requiere sesión válida con rol >= operador.

import { Navbar } from '@/components/layout/Navbar/Navbar';
import { StockImportFlow } from '@/components/features/inventario/stock-import/StockImportFlow';
import { getCategorias } from '@/lib/api/categorias';
import { listSubcategorias } from '@/lib/api/subcategorias';
import { getConfiguracion } from '@/lib/api/configuraciones';
import type { Categoria, Subcategoria } from '@/types';
import { withFallback } from '@/lib/utils/with-fallback';

// Si la configuración no existe o el fetch falla, 60% es el default documentado del backend.
const MARGEN_GANANCIA_FALLBACK = 60;

export default async function ImportarFacturaPage() {
  const [categorias, subcategorias, margenConfig] = await Promise.all([
    withFallback<Categoria[]>(getCategorias(), []),
    withFallback<Subcategoria[]>(listSubcategorias(), []),
    withFallback(getConfiguracion('margen_ganancia_default'), null),
  ]);
  const margenDefault = margenConfig?.valor ?? MARGEN_GANANCIA_FALLBACK;

  return (
    <>
      <Navbar
        title="Importar factura"
        breadcrumb={[
          { label: 'Dashboard' },
          { label: 'Inventario', href: '/inventario' },
          { label: 'Importar factura' },
        ]}
      />
      <StockImportFlow
        categorias={categorias}
        subcategorias={subcategorias}
        margenDefault={margenDefault}
      />
    </>
  );
}
