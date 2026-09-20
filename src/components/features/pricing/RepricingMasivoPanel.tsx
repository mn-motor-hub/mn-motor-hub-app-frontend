'use client'; // selección de filas, modal de confirmación y la petición de aplicar

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@mn/design-system/ui';
import { Modal } from '@/components/ui/Modal/Modal';
import { aplicarReprecioMasivoAction } from '@/app/(dashboard)/configuracion/motor-de-precios/actions';
import { formatCurrencyUsd, formatDateTime } from '@/lib/utils/format';
import type { ReprecioMasivoPreviewItem, ReprecioMasivoResultado } from '@/types';
import styles from './RepricingMasivoPanel.module.css';

interface RepricingMasivoPanelProps {
  items: ReprecioMasivoPreviewItem[];
}

export function RepricingMasivoPanel({ items }: RepricingMasivoPanelProps) {
  const router = useRouter();

  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [confirmando, setConfirmando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ReprecioMasivoResultado | null>(null);
  // Congelado al momento de aplicar: `items` cambia tras el refresh (los
  // aplicados salen de la preview) y el reporte necesita seguir mostrando
  // código/nombre de ids que ya no están en la lista vigente.
  const [resultadoLookup, setResultadoLookup] = useState<Map<
    number,
    ReprecioMasivoPreviewItem
  > | null>(null);
  const [refrescando, startTransition] = useTransition();

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const seleccionadosItems = useMemo(
    () => items.filter((item) => seleccionados.has(item.id)),
    [items, seleccionados],
  );

  const todosSeleccionados = items.length > 0 && seleccionados.size === items.length;
  const algunosSeleccionados = seleccionados.size > 0 && !todosSeleccionados;

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = algunosSeleccionados;
  }, [algunosSeleccionados]);

  function toggleUno(id: number) {
    setResultado(null);
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    setResultado(null);
    setSeleccionados((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))));
  }

  async function handleAplicar() {
    setAplicando(true);
    setError(null);
    const lookupAlMomentoDeAplicar = itemsById;

    const result = await aplicarReprecioMasivoAction(Array.from(seleccionados));
    if (result.ok) {
      setResultado(result.data);
      setResultadoLookup(lookupAlMomentoDeAplicar);
      setConfirmando(false);
      setSeleccionados(new Set());
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
    setAplicando(false);
  }

  if (items.length === 0) {
    return (
      <p className={styles.empty}>
        Ningún repuesto supera el umbral configurado hoy: no hay nada para reprecio masivo.
      </p>
    );
  }

  const rango = calcularRangoDesviacion(seleccionadosItems);

  return (
    <div className={styles.panel}>
      {resultado && resultadoLookup && (
        <ResultadoResumen resultado={resultado} lookup={resultadoLookup} refrescando={refrescando} />
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <label className={styles.selectAllRow}>
        <input
          ref={selectAllRef}
          type="checkbox"
          className={styles.checkbox}
          checked={todosSeleccionados}
          onChange={toggleTodos}
          aria-label="Seleccionar todos los repuestos"
        />
        <span className={styles.selectAllText}>
          {seleccionados.size > 0
            ? `${seleccionados.size} de ${items.length} seleccionado${seleccionados.size !== 1 ? 's' : ''}`
            : `Seleccionar todos (${items.length})`}
        </span>
      </label>

      {/* Tarjetas apiladas — visibles bajo 768px */}
      <div className={styles.cardList}>
        {items.map((item) => (
          <RepricingCard
            key={item.id}
            item={item}
            checked={seleccionados.has(item.id)}
            onToggle={() => toggleUno(item.id)}
          />
        ))}
      </div>

      {/* Tabla — visible desde 768px */}
      <div className={styles.tableWrapper}>
        <Table>
          <Thead>
            <Tr>
              <Th>
                <span className={styles.srOnly}>Seleccionar fila</span>
              </Th>
              <Th>Código</Th>
              <Th>Nombre</Th>
              <Th>Precio actual</Th>
              <Th>Precio sugerido</Th>
              <Th>Desviación</Th>
              <Th>Última modificación</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <label className={styles.tableCheckboxCell}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={seleccionados.has(item.id)}
                      onChange={() => toggleUno(item.id)}
                      aria-label={`Seleccionar ${item.codigoInterno}`}
                    />
                  </label>
                </Td>
                <Td>
                  <span className={styles.code}>{item.codigoInterno}</span>
                </Td>
                <Td>{item.nombre}</Td>
                <Td>
                  {item.precioActual != null ? (
                    formatCurrencyUsd(item.precioActual)
                  ) : (
                    <span className={styles.muted}>—</span>
                  )}
                </Td>
                <Td>{formatCurrencyUsd(item.precioSugerido)}</Td>
                <Td>
                  <DesviacionBadge pct={item.desviacionPct} />
                </Td>
                <Td>
                  {item.ultimaModificacion ? (
                    formatDateTime(item.ultimaModificacion)
                  ) : (
                    <span className={styles.muted}>Nunca</span>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      <div className={styles.aplicarRow}>
        <Button
          variant="accent"
          type="button"
          disabled={seleccionados.size === 0}
          onClick={() => setConfirmando(true)}
        >
          Aplicar repricing masivo
          {seleccionados.size > 0 ? ` (${seleccionados.size})` : ''}
        </Button>
      </div>

      <Modal
        open={confirmando}
        onOpenChange={(v) => {
          if (!v && !aplicando) setConfirmando(false);
        }}
        title="Aplicar repricing masivo"
        size="sm"
      >
        <div className={styles.confirmBody}>
          <p className={styles.confirmText}>
            Se va a actualizar el precio de venta de{' '}
            <strong>
              {seleccionados.size} repuesto{seleccionados.size !== 1 ? 's' : ''}
            </strong>{' '}
            al precio sugerido.
          </p>

          {rango && (
            <p className={styles.confirmImpact}>
              Rango de desviación entre precio actual y sugerido:{' '}
              <strong>
                {formatVariacion(rango.min)} y {formatVariacion(rango.max)}
              </strong>
              .
            </p>
          )}

          <p className={styles.confirmNote}>
            El backend recalcula cada fila al momento de aplicar: si algo cambió entre esta
            vista y la confirmación, ese repuesto queda omitido en vez de aplicarse con un dato
            viejo. No se deshace con un click.
          </p>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.confirmActions}>
            <Button type="button" variant="ghost" onClick={() => setConfirmando(false)} disabled={aplicando}>
              Cancelar
            </Button>
            <Button variant="accent" type="button" onClick={handleAplicar} loading={aplicando}>
              {aplicando ? 'Aplicando…' : 'Sí, aplicar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Tarjeta mobile ──────────────────────────────────────────────────────────

function RepricingCard({
  item,
  checked,
  onToggle,
}: {
  item: ReprecioMasivoPreviewItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className={[styles.card, checked ? styles.cardChecked : ''].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        onChange={onToggle}
        aria-label={`Seleccionar ${item.codigoInterno}`}
      />
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <span className={styles.code}>{item.codigoInterno}</span>
          <DesviacionBadge pct={item.desviacionPct} />
        </div>
        <p className={styles.cardNombre}>{item.nombre}</p>
        <div className={styles.cardPrecios}>
          <span className={styles.cardPrecioActual}>
            {item.precioActual != null ? formatCurrencyUsd(item.precioActual) : '—'}
          </span>
          <span aria-hidden="true">→</span>
          <span className={styles.cardPrecioSugerido}>{formatCurrencyUsd(item.precioSugerido)}</span>
        </div>
        <p className={styles.cardModificacion}>
          Última modificación:{' '}
          {item.ultimaModificacion ? formatDateTime(item.ultimaModificacion) : 'Nunca'}
        </p>
      </div>
    </label>
  );
}

// ── Resultado ────────────────────────────────────────────────────────────────

function ResultadoResumen({
  resultado,
  lookup,
  refrescando,
}: {
  resultado: ReprecioMasivoResultado;
  lookup: Map<number, ReprecioMasivoPreviewItem>;
  refrescando: boolean;
}) {
  return (
    <div className={styles.resultado} role="status">
      {resultado.aplicados.length > 0 && (
        <div className={styles.resultadoBloque}>
          <p className={styles.resultadoHeader}>
            <CheckCircle2 size={16} aria-hidden="true" className={styles.resultadoIconOk} />
            <strong>{resultado.aplicados.length}</strong> aplicado
            {resultado.aplicados.length !== 1 ? 's' : ''}
            {refrescando ? ' · actualizando el catálogo…' : ''}
          </p>
          <ul className={styles.resultadoList}>
            {resultado.aplicados.map((a) => (
              <li key={a.id}>
                <span className={styles.code}>{lookup.get(a.id)?.codigoInterno ?? `#${a.id}`}</span>{' '}
                {formatCurrencyUsd(a.precioAnterior)} → {formatCurrencyUsd(a.precioNuevo)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resultado.omitidos.length > 0 && (
        <div className={styles.resultadoBloque}>
          <p className={styles.resultadoHeader}>
            <AlertTriangle size={16} aria-hidden="true" className={styles.resultadoIconWarn} />
            <strong>{resultado.omitidos.length}</strong> omitido
            {resultado.omitidos.length !== 1 ? 's' : ''}
          </p>
          <ul className={styles.resultadoList}>
            {resultado.omitidos.map((o) => (
              <li key={o.id}>
                <span className={styles.code}>{lookup.get(o.id)?.codigoInterno ?? `#${o.id}`}</span>{' '}
                — {o.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resultado.errores.length > 0 && (
        <div className={styles.resultadoBloque}>
          <p className={styles.resultadoHeader}>
            <XCircle size={16} aria-hidden="true" className={styles.resultadoIconError} />
            <strong>{resultado.errores.length}</strong> con error
          </p>
          <ul className={styles.resultadoList}>
            {resultado.errores.map((e) => (
              <li key={e.id}>
                <span className={styles.code}>{lookup.get(e.id)?.codigoInterno ?? `#${e.id}`}</span>{' '}
                — {e.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function DesviacionBadge({ pct }: { pct: number }) {
  return <Badge variant={pct > 0 ? 'warning' : 'info'}>{formatVariacion(pct)}</Badge>;
}

function formatVariacion(pct: number): string {
  const signo = pct > 0 ? '+' : '';
  return `${signo}${pct.toFixed(2)}%`;
}

function calcularRangoDesviacion(
  items: ReprecioMasivoPreviewItem[],
): { min: number; max: number } | null {
  if (items.length === 0) return null;
  const valores = items.map((i) => i.desviacionPct);
  return { min: Math.min(...valores), max: Math.max(...valores) };
}
