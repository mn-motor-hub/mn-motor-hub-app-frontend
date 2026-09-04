'use client';

import { useState, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { confirmImportAction } from '@/app/(dashboard)/inventario/importar/actions';
import {
  createConfirmSchema,
  confirmBaseSchema,
  type ConfirmFormData,
} from '@/lib/schemas/stock-import.schema';
import type {
  Categoria,
  Subcategoria,
  StockImportParseResponse,
  StockImportConfirmResponse,
  StockImportConfirmItem,
  StockImportParsedItem,
} from '@/types';
import { ScrollToBottomButton } from '@/components/ui/ScrollToBottomButton/ScrollToBottomButton';
import { FileUploadStep } from './FileUploadStep';
import { InvoiceHeaderSummary } from './InvoiceHeaderSummary';
import { InvoiceItemsPreview } from './InvoiceItemsPreview';
import { ImportSuccessView } from './ImportSuccessView';
import styles from './StockImportFlow.module.css';

type FlowPhase = 'upload' | 'preview' | 'confirming' | 'success';

export interface StockImportFlowProps {
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  /** % de margen de ganancia por defecto (ej. 60), desde /api/configuraciones. */
  margenDefault: number;
}

export function StockImportFlow({ categorias, subcategorias, margenDefault }: StockImportFlowProps) {
  const [phase, setPhase] = useState<FlowPhase>('upload');
  const [parseResult, setParseResult] = useState<StockImportParseResponse | null>(null);
  // El archivo que se parseó en el paso 1, retenido para re-enviarlo al
  // confirmar: es la única copia que queda del lado del cliente y el backend
  // lo necesita para archivarlo en Storage.
  const [archivo, setArchivo] = useState<File | null>(null);
  const [confirmResult, setConfirmResult] = useState<StockImportConfirmResponse | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  // Ítems que el clasificador de subcategorías por IA marcó requiere_revision
  // después del parseo, indexados por posición — ver createConfirmSchema.
  const [classifyRevision, setClassifyRevision] = useState<Record<number, boolean>>({});

  // Schema is derived from parsed items so superRefine has access to match/requiere_revision.
  // react-hook-form stores the resolver in a mutable ref and picks up changes each render.
  const schema = useMemo(
    () =>
      parseResult ? createConfirmSchema(parseResult.items, classifyRevision) : confirmBaseSchema,
    [parseResult, classifyRevision],
  );

  const form = useForm<ConfirmFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { supplier_id: 0, items: [] },
  });

  const handleParseSuccess = useCallback(
    (result: StockImportParseResponse, archivoParseado: File) => {
      setParseResult(result);
      setArchivo(archivoParseado);
      setClassifyRevision({});
      form.reset({
        supplier_id: result.supplier_match?.id ?? 0,
        items: result.items.map((item) => ({
          precio_unitario_usd: item.precio_unitario_usd,
          // Seed con costo × (1 + margen): margen propio del ítem si ya está en
          // catálogo, margen_ganancia_default si es nuevo. Se recalcula en vivo
          // en InvoiceItemsPreview mientras el usuario no toque precio_venta_nuevo.
          precio_venta_nuevo: roundTwo(
            item.precio_unitario_usd * (1 + margenFraction(item, margenDefault)),
          ),
          subcategoria_id: item.subcategoria_id ?? undefined,
          nombre: item.match === null ? item.descripcion : '',
          categoria_id: undefined,
          ubicacion_stock: 'PRINCIPAL',
          marca: '',
          revisado: false,
        })),
      });
      setPhase('preview');
    },
    [form, margenDefault],
  );

  const onSubmit = form.handleSubmit(async (data) => {
    if (!parseResult) return;
    setConfirmError(null);
    setPhase('confirming');

    {
      const items: StockImportConfirmItem[] = parseResult.items.map((parsed, i) => {
        const fd = data.items[i];
        const base = {
          codigo_proveedor: parsed.codigo_proveedor,
          descripcion: parsed.descripcion,
          cantidad: parsed.cantidad,
          precio_unitario_usd: fd.precio_unitario_usd,
          requiere_revision: false as const,
          auto_part_id: parsed.match?.auto_part_id ?? null,
          precio_venta_nuevo: fd.precio_venta_nuevo,
          ...(fd.subcategoria_id ? { subcategoria_id: fd.subcategoria_id } : {}),
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

      const result = await confirmImportAction(
        {
          supplier_id: data.supplier_id,
          numero_factura: parseResult.numero_factura,
          fecha_emision: parseResult.fecha_emision,
          items,
        },
        archivo,
      );

      if (result.ok) {
        setConfirmResult(result.data);
        setPhase('success');
        return;
      }

      // La acción ya distingue el caso de factura duplicada (code
      // DUPLICATE_INVOICE) y devuelve el texto correspondiente.
      setPhase('preview');
      setConfirmError(result.error);
    }
  });

  function resetFlow() {
    setPhase('upload');
    setParseResult(null);
    setArchivo(null);
    setConfirmResult(null);
    setConfirmError(null);
    setClassifyRevision({});
    form.reset({ supplier_id: 0, items: [] });
  }

  const handleClassifyRevision = useCallback((updates: Record<number, boolean>) => {
    setClassifyRevision((prev) => ({ ...prev, ...updates }));
  }, []);

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
                <InvoiceItemsPreview
                  parseResult={parseResult}
                  categorias={categorias}
                  subcategorias={subcategorias}
                  margenDefault={margenDefault}
                  revisionOverrides={classifyRevision}
                  onRevisionChange={handleClassifyRevision}
                />

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

                <ScrollToBottomButton label="Ir hasta el final para confirmar" />
              </>
            )}
          </form>
        </FormProvider>
      )}
    </div>
  );
}

export function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Margen como fracción (0.6, no 60): propio del ítem si ya está en catálogo, global si es nuevo. */
export function margenFraction(item: StockImportParsedItem, margenDefaultPct: number): number {
  return item.match ? (item.match.margen_actual ?? 0) : margenDefaultPct / 100;
}
