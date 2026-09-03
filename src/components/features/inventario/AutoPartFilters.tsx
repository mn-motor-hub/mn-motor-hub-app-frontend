'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@mn/design-system/ui';
import { useAutoPartFilters } from '@/hooks/useAutoPartFilters';
import type { Categoria, Subcategoria } from '@/types';
import styles from './AutoPartFilters.module.css';

interface AutoPartFiltersProps {
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  rightSlot?: React.ReactNode;
}

export function AutoPartFilters({ categorias, subcategorias, rightSlot }: AutoPartFiltersProps) {
  const { filters, applyFilters, clearFilters } = useAutoPartFilters();
  const [localQ, setLocalQ] = useState(filters.q);

  useEffect(() => {
    setLocalQ(filters.q);
  }, [filters.q]);

  const hasActiveFilters =
    filters.categoriaId || filters.subcategoriaId || filters.q || filters.stockBajo;

  const subcategoriasDeCategoria = filters.categoriaId
    ? subcategorias.filter((s) => s.categoriaId === filters.categoriaId)
    : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ q: localQ });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.row}>

        {/* Controles de filtro — lado izquierdo */}
        <div className={styles.controls}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              className={styles.textInput}
            />
            <button type="submit" className={styles.searchIcon} aria-label="Buscar">
              <Search size={16} aria-hidden="true" />
            </button>
          </div>

          <select
            className={styles.select}
            value={filters.categoriaId}
            onChange={(e) =>
              // Cambiar la categoría invalida la subcategoría elegida — se
              // limpia para no dejar una combinación inconsistente en la URL.
              applyFilters({ categoriaId: e.target.value, subcategoriaId: '' })
            }
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={filters.subcategoriaId}
            disabled={!filters.categoriaId}
            onChange={(e) => applyFilters({ subcategoriaId: e.target.value })}
          >
            <option value="">Todas las subcategorías</option>
            {subcategoriasDeCategoria.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.nombre}
              </option>
            ))}
          </select>

          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={filters.stockBajo}
              onChange={(e) => applyFilters({ stockBajo: e.target.checked })}
              className={styles.checkbox}
            />
            Stock bajo
          </label>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} />
              Limpiar
            </Button>
          )}
        </div>

        {/* Acción — todo a la derecha */}
        {rightSlot && (
          <div className={styles.rightGroup}>
            {rightSlot}
          </div>
        )}

      </form>
    </div>
  );
}
