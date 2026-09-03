'use client'; // window.print()

import { Printer } from 'lucide-react';
import { Button } from '@mn/design-system/ui';
import styles from './comprobante.module.css';

export function PrintButton() {
  return (
    <Button variant="accent"
      type="button"
      onClick={() => window.print()}
      className={styles.noPrint}
    >
      <Printer size={16} aria-hidden="true" />
      Imprimir / Guardar como PDF
    </Button>
  );
}
