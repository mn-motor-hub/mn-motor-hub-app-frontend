'use client'; // Radix Select requiere estado (búsqueda, apertura) e interacción del cliente

import { useMemo, useRef, useState } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, Search } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  /** Valor seleccionado. `''` representa "sin selección". */
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  /** Label del ítem que limpia la selección, ej. "— Sin subcategoría —". Si se omite, no se ofrece esa opción. */
  emptyOptionLabel?: string;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  'aria-label'?: string;
}

// Radix no admite '' como value de Select.Item — se usa este sentinel puertas
// adentro y se traduce a '' en la API pública del componente.
const NONE_VALUE = '__none__';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = 'Buscar…',
  emptyOptionLabel,
  disabled,
  error,
  id,
  'aria-label': ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const needle = normalize(search);
    return options.filter((o) => normalize(o.label).includes(needle));
  }, [options, search]);

  // Select.Value normalmente toma el texto del Select.Item seleccionado, pero
  // ese ítem solo existe en el DOM mientras el Content está abierto — con un
  // valor precargado (ítem existente con subcategoría) nunca se vería el label
  // hasta la primera apertura. Se lo pasamos como children para evitar eso.
  const displayText = value === '' ? emptyOptionLabel : options.find((o) => o.value === value)?.label;

  return (
    <RadixSelect.Root
      value={value === '' ? NONE_VALUE : value}
      onValueChange={(v) => onValueChange(v === NONE_VALUE ? '' : v)}
      disabled={disabled}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setSearch('');
          requestAnimationFrame(() => searchInputRef.current?.focus());
        }
      }}
    >
      <RadixSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={[styles.trigger, error ? styles.triggerError : ''].filter(Boolean).join(' ')}
      >
        <RadixSelect.Value className={displayText ? undefined : styles.placeholderText}>
          {displayText ?? placeholder}
        </RadixSelect.Value>
        <RadixSelect.Icon className={styles.icon}>
          <ChevronDown size={16} aria-hidden="true" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={styles.content}
          position="popper"
          sideOffset={4}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className={styles.searchRow}>
            <Search size={14} className={styles.searchIcon} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                // Con texto de búsqueda, Enter confirma el primer resultado filtrado.
                // Sin texto (recién abierto, nada tipeado todavía) no hace nada — evita
                // seleccionar el primer ítem de la lista completa por accidente.
                // El resto de las teclas se retiene acá para no disparar el type-ahead
                // nativo de Radix (que buscaría ítems por la letra tipeada).
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (search.trim() && filteredOptions.length > 0) {
                    onValueChange(filteredOptions[0].value);
                    setOpen(false);
                  }
                  return;
                }
                if (e.key !== 'Escape') {
                  e.stopPropagation();
                }
              }}
            />
          </div>
          <RadixSelect.Viewport className={styles.viewport}>
            {emptyOptionLabel && (
              <RadixSelect.Item value={NONE_VALUE} className={styles.item}>
                <RadixSelect.ItemText>{emptyOptionLabel}</RadixSelect.ItemText>
              </RadixSelect.Item>
            )}
            {filteredOptions.length === 0 ? (
              <div className={styles.empty}>Sin resultados</div>
            ) : (
              filteredOptions.map((opt) => (
                <RadixSelect.Item key={opt.value} value={opt.value} className={styles.item}>
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className={styles.itemIndicator}>
                    <Check size={14} aria-hidden="true" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))
            )}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
