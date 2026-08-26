'use client'; // window.print()

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import styles from './comprobante.module.css';

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className={styles.noPrint}
    >
      <Printer size={16} aria-hidden="true" />
      Imprimir / Guardar como PDF
    </Button>
  );
}
