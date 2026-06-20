'use client';

import { useState, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import { getSuppliers, createSupplier } from '@/lib/api/suppliers';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import type { ConfirmFormData } from '@/lib/schemas/stock-import.schema';
import type { Supplier } from '@/types';
import styles from './SupplierSelector.module.css';

interface SupplierSelectorProps {
  supplierMatch: { id: number; nombre: string } | null;
}

export function SupplierSelector({ supplierMatch }: SupplierSelectorProps) {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ConfirmFormData>();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createNombre, setCreateNombre] = useState('');
  const [createRif, setCreateRif] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    getSuppliers()
      .then(setSuppliers)
      .catch(() => {})
      .finally(() => setLoadingSuppliers(false));
  }, []);

  function openCreateForm() {
    setShowCreateForm(true);
    setCreateError(null);
  }

  function closeCreateForm() {
    setShowCreateForm(false);
    setCreateNombre('');
    setCreateRif('');
    setCreateError(null);
  }

  async function handleCreate() {
    if (!createNombre.trim()) {
      setCreateError('El nombre del proveedor es requerido.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const payload = createRif.trim()
        ? { nombre: createNombre.trim(), rif: createRif.trim() }
        : { nombre: createNombre.trim() };
      const newSupplier = await createSupplier(payload);
      setSuppliers((prev) => [...prev, newSupplier]);
      setValue('supplier_id', newSupplier.id, { shouldValidate: true });
      closeCreateForm();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear el proveedor.');
    } finally {
      setCreating(false);
    }
  }

  const supplierError = errors.supplier_id?.message;

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow}>
        <label htmlFor="supplier-select" className={styles.label}>
          Proveedor <span className={styles.required}>*</span>
        </label>
        {supplierMatch && (
          <span className={styles.matchBadge}>Detectado automáticamente — podés cambiarlo</span>
        )}
      </div>

      <Controller
        name="supplier_id"
        control={control}
        render={({ field }) => (
          <select
            id="supplier-select"
            className={[styles.select, supplierError ? styles.selectError : ''].filter(Boolean).join(' ')}
            value={field.value > 0 ? String(field.value) : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__create__') {
                openCreateForm();
                return;
              }
              setShowCreateForm(false);
              field.onChange(val ? Number(val) : 0);
            }}
            disabled={loadingSuppliers}
            aria-describedby={supplierError ? 'supplier-error' : undefined}
          >
            <option value="">
              {loadingSuppliers ? 'Cargando proveedores...' : '— Seleccioná un proveedor —'}
            </option>
            {suppliers.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.nombre}
                {s.rif ? ` (${s.rif})` : ''}
              </option>
            ))}
            <option value="__create__">+ Crear proveedor nuevo</option>
          </select>
        )}
      />

      {supplierError && (
        <span id="supplier-error" className={styles.error} role="alert">
          {supplierError}
        </span>
      )}

      {showCreateForm && (
        <div className={styles.createForm}>
          <div className={styles.createFormHeader}>
            <p className={styles.createFormTitle}>Nuevo proveedor</p>
            <button
              type="button"
              onClick={closeCreateForm}
              className={styles.createFormClose}
              aria-label="Cancelar creación de proveedor"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.createFormFields}>
            <Input
              label="Nombre"
              required
              value={createNombre}
              onChange={(e) => setCreateNombre(e.target.value)}
              placeholder="Ej: Importadora ABC"
            />
            <Input
              label="RIF (opcional)"
              value={createRif}
              onChange={(e) => setCreateRif(e.target.value)}
              placeholder="Ej: J-12345678-9"
            />
          </div>

          {createError && (
            <p className={styles.createError} role="alert">
              {createError}
            </p>
          )}

          <div className={styles.createFormActions}>
            <Button type="button" variant="ghost" size="sm" onClick={closeCreateForm}>
              Cancelar
            </Button>
            <Button type="button" size="sm" loading={creating} onClick={handleCreate}>
              Crear proveedor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
