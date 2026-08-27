'use client'; // escucha scroll/resize del contenedor y decide su propia visibilidad

import { useEffect, useRef, useState } from 'react';
import { ChevronsDown } from 'lucide-react';
import styles from './ScrollToBottomButton.module.css';

interface ScrollToBottomButtonProps {
  label?: string;
}

// Umbral en px: por debajo de esto se considera "ya está al final" y el
// botón se oculta, para no ofrecer una acción que no hace nada.
const NEAR_BOTTOM_PX = 48;

// `position: fixed` solo cambia dónde se pinta el botón, no su lugar en el
// árbol del DOM — se puede subir desde el propio nodo para encontrar el
// contenedor real con scroll (en este layout es `.main` de dashboard.module.css,
// pero el componente no depende de esa clase para seguir siendo reutilizable).
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function ScrollToBottomButton({ label = 'Ir hasta el final' }: ScrollToBottomButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollParent = getScrollParent(buttonRef.current);
    scrollParentRef.current = scrollParent;
    if (!scrollParent) return;

    function updateVisibility() {
      const el = scrollParentRef.current;
      if (!el) return;
      const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const hasOverflow = el.scrollHeight > el.clientHeight + NEAR_BOTTOM_PX;
      setVisible(hasOverflow && distanceToBottom > NEAR_BOTTOM_PX);
    }

    updateVisibility();
    scrollParent.addEventListener('scroll', updateVisibility, { passive: true });
    const resizeObserver = new ResizeObserver(updateVisibility);
    resizeObserver.observe(scrollParent);

    return () => {
      scrollParent.removeEventListener('scroll', updateVisibility);
      resizeObserver.disconnect();
    };
  }, []);

  function handleClick() {
    scrollParentRef.current?.scrollTo({
      top: scrollParentRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      hidden={!visible}
      className={styles.button}
      onClick={handleClick}
      aria-label={label}
    >
      <ChevronsDown size={22} aria-hidden="true" />
    </button>
  );
}
