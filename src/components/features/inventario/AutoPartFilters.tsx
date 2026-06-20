'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { useAutoPartFilters } from '@/hooks/useAutoPartFilters';
import type { Categoria } from '@/types';
import styles from './AutoPartFilters.module.css';

interface AutoPartFiltersProps {
  categorias: Categoria[];
  rightSlot?: React.ReactNode;
}

export function AutoPartFilters({ categorias, rightSlot }: AutoPartFiltersProps) {
  const { filters, applyFilters, clearFilters } = useAutoPartFilters();
  const [localMarca, setLocalMarca] = useState(filters.marca);

  useEffect(() => {
    setLocalMarca(filters.marca);
  }, [filters.marca]);

  const hasActiveFilters = filters.categoriaId || filters.marca || filters.stockBajo;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ marca: localMarca });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.row}>

        {/* Controles de filtro — lado izquierdo */}
        <div className={styles.controls}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Filtrar por marca..."
              value={localMarca}
              onChange={(e) => setLocalMarca(e.target.value)}
              className={styles.textInput}
            />
            <button type="submit" className={styles.searchIcon} aria-label="Buscar">
              <Search size={16} aria-hidden="true" />
            </button>
          </div>

          <select
            className={styles.select}
            value={filters.categoriaId}
            onChange={(e) => applyFilters({ categoriaId: e.target.value })}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.nombre}
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
