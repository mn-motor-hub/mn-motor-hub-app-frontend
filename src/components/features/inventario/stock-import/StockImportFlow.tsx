'use client';

import { useState, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { confirmImport, DuplicateInvoiceError } from '@/lib/api/stock-imports';
import {
  createConfirmSchema,
  confirmBaseSchema,
  type ConfirmFormData,
} from '@/lib/schemas/stock-import.schema';
import type {
  Categoria,
  StockImportParseResponse,
  StockImportConfirmResponse,
  StockImportConfirmItem,
} from '@/types';
import { FileUploadStep } from './FileUploadStep';
import { InvoiceHeaderSummary } from './InvoiceHeaderSummary';
import { InvoiceItemsPreview } from './InvoiceItemsPreview';
import { ImportSuccessView } from './ImportSuccessView';
import styles from './StockImportFlow.module.css';

type FlowPhase = 'upload' | 'preview' | 'confirming' | 'success';

export interface StockImportFlowProps {
  categorias: Categoria[];
}

export function StockImportFlow({ categorias }: StockImportFlowProps) {
  const [phase, setPhase] = useState<FlowPhase>('upload');
  const [parseResult, setParseResult] = useState<StockImportParseResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<StockImportConfirmResponse | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Schema is derived from parsed items so superRefine has access to match/requiere_revision.
  // react-hook-form stores the resolver in a mutable ref and picks up changes each render.
  const schema = useMemo(
    () => (parseResult ? createConfirmSchema(parseResult.items) : confirmBaseSchema),
    [parseResult],
  );

  const form = useForm<ConfirmFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { supplier_id: 0, items: [] },
  });

  const handleParseSuccess = useCallback(
    (result: StockImportParseResponse) => {
      setParseResult(result);
      form.reset({
        supplier_id: result.supplier_match?.id ?? 0,
        items: result.items.map((item) => ({
          // Existing items: seed with cost × (1 + current margin).
          // New items: 0 — fails validation until user enters a real price.
          precio_venta_nuevo: item.match
            ? roundTwo(item.precio_unitario_usd * (1 + (item.match.margen_actual ?? 0)))
            : 0,
          nombre: item.match === null ? item.descripcion : '',
          categoria_id: undefined,
          ubicacion_stock: 'PRINCIPAL',
          marca: '',
          revisado: false,
        })),
      });
      setPhase('preview');
    },
    [form],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    if (!parseResult) return;
    setConfirmError(null);
    setPhase('confirming');

    try {
      const items: StockImportConfirmItem[] = parseResult.items.map((parsed, i) => {
        const fd = data.items[i];
        const base = {
          codigo_proveedor: parsed.codigo_proveedor,
          descripcion: parsed.descripcion,
          cantidad: parsed.cantidad,
          precio_unitario_usd: parsed.precio_unitario_usd,
          requiere_revision: false as const,
          auto_part_id: parsed.match?.auto_part_id ?? null,
          precio_venta_nuevo: fd.precio_venta_nuevo,
        };
        if (parsed.match === null) {
          return {
            ...base,
            nombre: fd.nombre || parsed.descripcion,
            categoria_id: fd.categoria_id,
            ubicacion_stock: fd.ubicacion_stock || 'PRINCIPAL',
            ...(fd.marca ? { marca: fd.marca } : {}),
          };
        }
        return base;
      });

      const result = await confirmImport({
        supplier_id: data.supplier_id,
        numero_factura: parseResult.numero_factura,
        fecha_emision: parseResult.fecha_emision,
        items,
      });

      setConfirmResult(result);
      setPhase('success');
    } catch (err) {
      setPhase('preview');
      setConfirmError(
        err instanceof DuplicateInvoiceError
          ? 'Esta factura ya fue importada anteriormente. No se puede volver a importar.'
          : err instanceof Error
            ? err.message
            : 'Error inesperado al confirmar la importación.',
      );
    }
  });

  function resetFlow() {
    setPhase('upload');
    setParseResult(null);
    setConfirmResult(null);
    setConfirmError(null);
    form.reset({ supplier_id: 0, items: [] });
  }

  if (phase === 'success' && confirmResult && parseResult) {
    return (
      <ImportSuccessView
        result={confirmResult}
        facturaNumero={parseResult.numero_factura}
        onNewImport={resetFlow}
      />
    );
  }

  return (
    <div className={styles.container}>
      {phase === 'upload' && <FileUploadStep onSuccess={handleParseSuccess} />}

      {(phase === 'preview' || phase === 'confirming') && parseResult && (
        <FormProvider {...form}>
          <form onSubmit={onSubmit} noValidate className={styles.form}>
            <InvoiceHeaderSummary parseResult={parseResult} />

            {!parseResult.factura_ya_importada && (
              <>
                <InvoiceItemsPreview parseResult={parseResult} categorias={categorias} />

                {confirmError && (
                  <p className={styles.confirmError} role="alert">
                    {confirmError}
                  </p>
                )}

                <div className={styles.submitRow}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={phase === 'confirming' || !form.formState.isValid}
                  >
                    {phase === 'confirming' ? (
                      <>
                        <span className={styles.spinner} aria-hidden="true" />
                        Confirmando importación...
                      </>
                    ) : (
                      'Confirmar importación'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </FormProvider>
      )}
    </div>
  );
}

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}
