// TODO: Proteger esta ruta con autenticación antes de ir a producción.
// Actualmente es pública. Cualquiera con acceso a la red puede importar
// stock y modificar el catálogo. Requiere sesión válida con rol >= operador.

import { Navbar } from '@/components/layout/Navbar/Navbar';
import { StockImportFlow } from '@/components/features/inventario/stock-import/StockImportFlow';
import { getCategorias } from '@/lib/api/categorias';
import type { Categoria } from '@/types';

export default async function ImportarFacturaPage() {
  const categorias = await getCategorias().catch((): Categoria[] => []);

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
      <StockImportFlow categorias={categorias} />
    </>
  );
}
