'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { parseInvoice } from '@/lib/api/stock-imports';
import type { StockImportParseResponse } from '@/types';
import styles from './FileUploadStep.module.css';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

function validateFile(f: File): string | null {
  if (f.size > MAX_BYTES)
    return `El archivo excede el límite de 10 MB (tamaño actual: ${(f.size / 1024 / 1024).toFixed(1)} MB).`;
  if (!ALLOWED_MIME.includes(f.type))
    return 'Formato no permitido. El archivo debe ser PDF, PNG, JPG o WEBP.';
  return null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface FileUploadStepProps {
  onSuccess: (result: StockImportParseResponse) => void;
}

export function FileUploadStep({ onSuccess }: FileUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(f);
    setError(null);
  }

  function clearFile() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await parseInvoice(file);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al procesar la factura.');
      setUploading(false);
    }
  }

  if (uploading) {
    return (
      <div className={styles.card}>
        <div className={styles.loadingState}>
          <span className={styles.loadingSpinner} aria-hidden="true" />
          <div className={styles.loadingText}>
            <p className={styles.loadingTitle}>Procesando factura...</p>
            <p className={styles.loadingHint}>
              Esto puede tardar hasta 40 segundos mientras la IA extrae los datos del documento.
              Por favor, no cerrés esta página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Cargar factura de proveedor</h2>
      <p className={styles.description}>
        Subí la factura en PDF o imagen. La IA extraerá automáticamente los ítems, precios y datos
        del proveedor para que los revises antes de confirmar.
      </p>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        {/* Input nativo oculto, activado por el label dropzone */}
        <input
          ref={inputRef}
          id="archivo"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className={styles.hiddenInput}
          aria-describedby={error ? 'upload-error' : 'upload-hint'}
        />

        {file ? (
          <div className={styles.selectedFile}>
            <FileText size={20} className={styles.fileIcon} aria-hidden="true" />
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>{formatSize(file.size)}</span>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className={styles.clearButton}
              aria-label="Quitar archivo seleccionado"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label htmlFor="archivo" className={styles.dropzone}>
            <Upload size={32} className={styles.uploadIcon} aria-hidden="true" />
            <span className={styles.dropzoneLabel}>Seleccioná un archivo</span>
            <span id="upload-hint" className={styles.dropzoneHint}>
              PDF, PNG, JPG o WEBP — máximo 10 MB
            </span>
          </label>
        )}

        {error && (
          <p id="upload-error" className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.submitButton} disabled={!file}>
          Analizar factura
        </button>
      </form>
    </div>
  );
}
