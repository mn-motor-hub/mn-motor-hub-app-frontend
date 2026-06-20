'use client'; // Maneja estado de filtros con inputs controlados

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { useAutoPartFilters } from '@/hooks/useAutoPartFilters';
import type { Categoria } from '@/types';
import styles from './AutoPartFilters.module.css';

interface AutoPartFiltersProps {
  categorias: Categoria[];
}

export function AutoPartFilters({ categorias }: AutoPartFiltersProps) {
  const { filters, applyFilters, clearFilters } = useAutoPartFilters();
  const [localMarca, setLocalMarca] = useState(filters.marca);

  const hasActiveFilters = filters.categoriaId || filters.marca || filters.stockBajo;

  function handleMarcaSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ marca: localMarca });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleMarcaSubmit} className={styles.row}>
        <input
          type="text"
          placeholder="Filtrar por marca..."
          value={localMarca}
          onChange={(e) => setLocalMarca(e.target.value)}
          className={styles.textInput}
        />
        <Button type="submit" size="sm">Buscar</Button>

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

        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            <X size={14} />
            Limpiar
          </Button>
        ) : null}
      </form>
    </div>
  );
}
