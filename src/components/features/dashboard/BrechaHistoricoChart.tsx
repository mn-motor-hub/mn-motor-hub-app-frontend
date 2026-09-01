'use client'; // Recharts renderiza con SVG y hooks del cliente

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDate } from '@/lib/utils/format';
import type { BrechaHistoricoPoint } from '@/types';
import styles from './BrechaHistoricoChart.module.css';

export interface BrechaHistoricoChartProps {
  data: BrechaHistoricoPoint[];
  /** Banda vigente (configuraciones.brecha_banda_min/max) — nunca hardcodear el 15/25 default. */
  bandaMin?: number;
  bandaMax?: number;
}

export function BrechaHistoricoChart({ data, bandaMin, bandaMax }: BrechaHistoricoChartProps) {
  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Todavía no hay histórico de brecha registrado.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }} accessibilityLayer>
          <CartesianGrid stroke="var(--color-outline-variant)" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="fecha"
            tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-outline-variant)' }}
            tickFormatter={(value: string) => formatDate(value)}
          />
          <YAxis
            tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `${value}%`}
          />
          <Tooltip cursor={{ stroke: 'var(--color-outline)' }} content={<ChartTooltip />} />
          {bandaMin != null && (
            <ReferenceLine
              y={bandaMin}
              stroke="var(--color-warning)"
              strokeDasharray="4 4"
              label={{
                value: `Banda mín. ${bandaMin}%`,
                position: 'insideBottomLeft',
                fill: 'var(--color-warning)',
                fontSize: 11,
              }}
            />
          )}
          {bandaMax != null && (
            <ReferenceLine
              y={bandaMax}
              stroke="var(--color-warning)"
              strokeDasharray="4 4"
              label={{
                value: `Banda máx. ${bandaMax}%`,
                position: 'insideTopLeft',
                fill: 'var(--color-warning)',
                fontSize: 11,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="brechaPct"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** El tooltip default de Recharts trae fondo blanco y no respeta los tokens. */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BrechaHistoricoPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{formatDate(item.fecha)}</p>
      <p className={styles.tooltipValue}>
        {item.brechaPct != null ? `${item.brechaPct.toFixed(2)}%` : 'Sin dato P2P'}
      </p>
    </div>
  );
}
