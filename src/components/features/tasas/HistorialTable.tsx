'use client'; // estado local de qué fila tiene el detalle del error abierto

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table/Table';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatBs, formatDateTime } from '@/lib/utils/format';
import type { TasaFetchLog } from '@/types';
import styles from './HistorialTable.module.css';

interface HistorialTableProps {
  data: TasaFetchLog[];
}

/**
 * Se usan las primitivas de ui/Table y no TanStack como en MovementsTable: la
 * fila de detalle del error es un <tr> extra que no corresponde a ninguna fila
 * del modelo de datos, y expresarla con getExpandedRowModel sería más código
 * que este map.
 */
export function HistorialTable({ data }: HistorialTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <p className={styles.empty}>
        No hay intentos registrados con estos filtros.
      </p>
    );
  }

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Fecha</Th>
          <Th>Tasa</Th>
          <Th>Resultado</Th>
          <Th>Valor</Th>
          <Th>Anterior</Th>
          <Th>Origen</Th>
          <Th>Duración</Th>
        </Tr>
      </Thead>
      <Tbody>
        {data.map((log) => {
          const isFallo = log.resultado === 'fallo';
          const isOpen = expanded === log.id;

          return (
            <Fragment key={log.id}>
              <Tr className={isFallo ? styles.rowFallo : undefined}>
                <Td className={styles.date}>{formatDateTime(log.createdAt)}</Td>
                <Td className={styles.clave}>{log.tasaClave}</Td>
                <Td>
                  {isFallo ? (
                    <button
                      type="button"
                      className={styles.failButton}
                      onClick={() => setExpanded(isOpen ? null : log.id)}
                      aria-expanded={isOpen}
                      aria-label={`Ver el detalle del fallo de ${log.tasaClave}`}
                    >
                      {isOpen ? (
                        <ChevronDown size={14} aria-hidden="true" />
                      ) : (
                        <ChevronRight size={14} aria-hidden="true" />
                      )}
                      <Badge variant="danger">Fallo</Badge>
                      {log.errorCodigo && (
                        <span className={styles.errorCode}>{log.errorCodigo}</span>
                      )}
                    </button>
                  ) : (
                    <Badge variant="success">Éxito</Badge>
                  )}
                </Td>
                <Td className={styles.valor}>
                  {log.valor != null ? formatBs(log.valor) : <span className={styles.muted}>—</span>}
                </Td>
                <Td className={styles.valorAnterior}>
                  {log.valorAnterior != null ? (
                    formatBs(log.valorAnterior)
                  ) : (
                    <span className={styles.muted}>—</span>
                  )}
                </Td>
                <Td>
                  {log.origen === 'manual' ? (
                    <span className={styles.origenManual}>Manual · {log.actorNombre}</span>
                  ) : (
                    <span className={styles.muted}>Programado</span>
                  )}
                </Td>
                <Td className={styles.duracion}>
                  {log.duracionMs != null ? (
                    `${log.duracionMs} ms`
                  ) : (
                    <span className={styles.muted}>—</span>
                  )}
                </Td>
              </Tr>

              {/* errorMotivo es texto largo: va acá, a un clic, nunca en la celda. */}
              {isFallo && isOpen && (
                <Tr className={styles.detailRow}>
                  <Td colSpan={7}>
                    <p className={styles.detailText}>
                      {log.errorMotivo ?? 'La fuente no devolvió un motivo.'}
                    </p>
                    {/*
                      "Provider" y no "Fuente": BCV_USD es una tasa, y la fuente
                      del request es BCV, que sirve USD y EUR en una sola
                      llamada. Llamarle fuente a esto hace contar dos caídas
                      donde hubo una.
                    */}
                    <p className={styles.detailMeta}>
                      {log.providerId && <>Provider: {log.providerId} · </>}
                      Código: {log.errorCodigo ?? 'sin código'}
                    </p>
                  </Td>
                </Tr>
              )}
            </Fragment>
          );
        })}
      </Tbody>
    </Table>
  );
}
