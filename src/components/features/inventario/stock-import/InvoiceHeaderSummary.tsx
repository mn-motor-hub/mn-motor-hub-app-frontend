'use client';

import { AlertTriangle } from 'lucide-react';
import { SupplierSelector } from './SupplierSelector';
import type { StockImportParseResponse } from '@/types';
import styles from './InvoiceHeaderSummary.module.css';

export interface InvoiceHeaderSummaryProps {
  parseResult: StockImportParseResponse;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function InvoiceHeaderSummary({ parseResult }: InvoiceHeaderSummaryProps) {
  const { proveedor, numero_factura, fecha_emision, supplier_match, factura_ya_importada } =
    parseResult;

  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>Datos de la factura</h2>

      {factura_ya_importada && (
        <div className={styles.duplicateAlert} role="alert">
          <AlertTriangle size={24} className={styles.duplicateIcon} aria-hidden="true" />
          <div>
            <p className={styles.duplicateTitle}>Factura ya importada — no se puede continuar</p>
            <p className={styles.duplicateBody}>
              La factura <strong>{numero_factura}</strong> ya existe en el sistema y no puede
              importarse dos veces. Si creés que es un error, consultá con el administrador.
            </p>
          </div>
        </div>
      )}

      <div className={styles.fields}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Proveedor extraído por IA</span>
          <span className={styles.fieldValue}>
            {proveedor.nombre || '—'}
            {proveedor.rif ? (
              <span className={styles.rif}> ({proveedor.rif})</span>
            ) : null}
          </span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Número de factura</span>
          <span className={`${styles.fieldValue} ${styles.mono}`}>{numero_factura || '—'}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Fecha de emisión</span>
          <span className={styles.fieldValue}>{formatDate(fecha_emision)}</span>
        </div>
      </div>

      {!factura_ya_importada && <SupplierSelector supplierMatch={supplier_match} />}
    </section>
  );
}
