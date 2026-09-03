'use client'; // filtros URL-driven (búsqueda + dropdown) sobre la lista ya cargada

import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@mn/design-system/ui';
import { NuevaSubcategoriaButton } from './NuevaSubcategoriaButton';
import { useSubcategoriaFilters } from '@/hooks/useSubcategoriaFilters';
import { formatDate } from '@/lib/utils/format';
import type { Categoria, Subcategoria } from '@/types';
import styles from './SubcategoriasTable.module.css';

export interface SubcategoriasTableProps {
  subcategorias: Subcategoria[];
  /** Necesarias para el dropdown y para resolver el nombre de la categoría padre. */
  categorias?: Categoria[];
  /** Base de la URL para los filtros de este render — cada ruta que reusa la tabla pasa la suya. */
  basePath: string;
  /** Si viene: oculta el dropdown de categoría y fija el filtro (vista de detalle). */
  fixedCategoriaId?: string;
}

export function SubcategoriasTable({
  subcategorias,
  categorias = [],
  basePath,
  fixedCategoriaId,
}: SubcategoriasTableProps) {
  const { filters, applyFilters, clearFilters } = useSubcategoriaFilters(basePath);
  const [localQ, setLocalQ] = useState(filters.q);

  useEffect(() => {
    setLocalQ(filters.q);
  }, [filters.q]);

  const categoriaNombreById = useMemo(
    () => new Map(categorias.map((cat) => [cat.id, cat.nombre])),
    [categorias],
  );

  const categoriaIdFiltro = fixedCategoriaId ?? filters.categoriaId;

  const filtradas = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return subcategorias.filter((sub) => {
      if (categoriaIdFiltro && sub.categoriaId !== categoriaIdFiltro) return false;
      if (q && !sub.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [subcategorias, categoriaIdFiltro, filters.q]);

  const hasActiveFilters = (!fixedCategoriaId && Boolean(filters.categoriaId)) || Boolean(filters.q);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ q: localQ });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.toolbar}>
        <div className={styles.controls}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              className={styles.textInput}
            />
            <button type="submit" className={styles.searchIcon} aria-label="Buscar">
              <Search size={16} aria-hidden="true" />
            </button>
          </div>

          {!fixedCategoriaId && (
            <select
              className={styles.select}
              value={filters.categoriaId}
              onChange={(e) => applyFilters({ categoriaId: e.target.value })}
              aria-label="Filtrar por categoría"
            >
              <option value="">Categoría: Todas</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} />
              Limpiar
            </Button>
          )}
        </div>

        <div className={styles.rightGroup}>
          <NuevaSubcategoriaButton categorias={categorias} fixedCategoriaId={fixedCategoriaId} />
        </div>
      </form>

      {filtradas.length === 0 ? (
        <div className={styles.empty}>No se encontraron subcategorías.</div>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Código</Th>
              <Th>Nombre</Th>
              {!fixedCategoriaId && <Th>Categoría</Th>}
              <Th>Actualizado</Th>
              <Th>Estado</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtradas.map((sub) => (
              <Tr key={sub.id}>
                <Td>
                  <span className={styles.codigo}>{sub.codigoSublinea}</span>
                </Td>
                <Td>{sub.nombre}</Td>
                {!fixedCategoriaId && <Td>{categoriaNombreById.get(sub.categoriaId) ?? '—'}</Td>}
                <Td className={styles.fecha}>{formatDate(sub.updatedAt)}</Td>
                <Td>
                  {sub.activo ? (
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
  );
}
