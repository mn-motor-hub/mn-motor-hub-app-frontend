'use client'; // Recharts renderiza con SVG y hooks del cliente

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyUsd } from '@/lib/utils/format';
import type { FinancialSummaryByCategory } from '@/types';
import styles from './ExpensesByCategoryChart.module.css';

export interface ExpensesByCategoryChartProps {
  /** Ya filtrado a type === 'gasto' y ordenado desc por la page. */
  data: FinancialSummaryByCategory[];
}

const ROW_HEIGHT = 44; // alto por barra, suficiente para leer el nombre completo
const AXIS_WIDTH = 120;
const MAX_LABEL_CHARS = 16;

export function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
  const height = data.length * ROW_HEIGHT + 32;

  return (
    <div className={styles.wrapper} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 72, bottom: 8, left: 0 }}
          accessibilityLayer
        >
          {/* Solo líneas verticales: el eje de magnitud es el X */}
          <CartesianGrid
            horizontal={false}
            stroke="var(--color-outline-variant)"
            strokeWidth={1}
          />
          <XAxis
            type="number"
            tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-outline-variant)' }}
            tickFormatter={(value: number) => formatCompactUsd(value)}
          />
          <YAxis
            type="category"
            dataKey="categoryName"
            width={AXIS_WIDTH}
            tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={truncate}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-surface-high)', fillOpacity: 0.4 }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="total"
            fill="var(--color-primary)"
            barSize={20}
            // Extremo redondeado del lado del dato, escuadrado en la línea base
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="total"
              position="right"
              fill="var(--color-on-surface)"
              fontSize={12}
              formatter={(value) => formatCurrencyUsd(Number(value))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tooltip propio: el de Recharts trae fondo blanco y no respeta los tokens. */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: FinancialSummaryByCategory }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipName}>{item.categoryName}</p>
      <p className={styles.tooltipValue}>{formatCurrencyUsd(item.total)}</p>
    </div>
  );
}

function truncate(value: string): string {
  return value.length > MAX_LABEL_CHARS ? `${value.slice(0, MAX_LABEL_CHARS - 1)}…` : value;
}

/** Ticks del eje cortos para que no se amontonen: $1.2K en vez de $1,200.00 */
function formatCompactUsd(value: number): string {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value}`;
}
