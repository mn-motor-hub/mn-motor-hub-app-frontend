'use client'; // useState/refs + portal para posicionar sobre el viewport

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import styles from './InfoPopover.module.css';

interface InfoPopoverProps {
  /** Texto a mostrar dentro del popover. */
  text: string;
  /** aria-label del botón trigger, ej. "Ver descripción de Frenos". */
  label: string;
}

// Un solo popover abierto a la vez: al abrir uno se notifica a los demás
// para que se cierren, sin necesidad de levantar estado a un ancestro común.
const OPEN_EVENT = 'mn-info-popover:open';

export function InfoPopover({ text, label }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  // Escucha global: se cierra si otro InfoPopover se abre.
  useEffect(() => {
    function handleGlobalOpen(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (detail !== popoverId) setOpen(false);
    }
    window.addEventListener(OPEN_EVENT, handleGlobalOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleGlobalOpen);
  }, [popoverId]);

  // Posicionamiento + cierre por click afuera / Escape, solo mientras está abierto.
  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const margin = 16;
      const width = popoverRef.current?.offsetWidth ?? 240;
      const maxLeft = window.innerWidth - width - margin;
      const left = Math.max(margin, Math.min(rect.left, maxLeft));
      setCoords({ top: rect.bottom + 8, left });
    }

    updatePosition();

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleToggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next) window.dispatchEvent(new CustomEvent<string>(OPEN_EVENT, { detail: popoverId }));
      return next;
    });
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        onClick={handleToggle}
      >
        <Info size={16} aria-hidden="true" />
      </button>
      {open && coords
        ? createPortal(
            <div
              ref={popoverRef}
              id={popoverId}
              role="tooltip"
              className={styles.popover}
              style={{ top: coords.top, left: coords.left }}
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
