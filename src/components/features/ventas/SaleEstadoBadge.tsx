import { Badge } from '@/components/ui/Badge/Badge';
import type { SaleEstado } from '@/types';

const LABELS: Record<SaleEstado, string> = {
  en_proceso: 'En proceso',
  confirmada: 'Confirmada',
  anulada: 'Anulada',
};

const VARIANTS: Record<SaleEstado, 'warning' | 'success' | 'danger'> = {
  en_proceso: 'warning',
  confirmada: 'success',
  anulada: 'danger',
};

export function SaleEstadoBadge({ estado }: { estado: SaleEstado }) {
  return <Badge variant={VARIANTS[estado]}>{LABELS[estado]}</Badge>;
}
