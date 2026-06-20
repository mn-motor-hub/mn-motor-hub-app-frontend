import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatCurrencyUsd } from '@/lib/utils/format';
import type { AutoPart } from '@/types';
import styles from './AutoPartCard.module.css';

interface AutoPartCardProps {
  part: AutoPart;
}

export function AutoPartCard({ part }: AutoPartCardProps) {
  const isBelowMin = part.stockActual <= part.stockMinimo;

  return (
    <Link href={`/inventario/${part.id}`} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.code}>{part.codigoInterno}</span>
        <Badge variant={part.activo ? 'success' : 'neutral'}>
          {part.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <p className={styles.nombre}>{part.nombre}</p>

      {part.descripcion ? (
        <p className={styles.descripcion}>{part.descripcion}</p>
      ) : null}

      <div className={styles.meta}>
        {part.marca ? (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Marca:</span> {part.marca}
          </span>
        ) : null}
        {part.categoria ? (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Categoría:</span> {part.categoria.nombre}
          </span>
        ) : null}
      </div>

      <div className={styles.footer}>
        <span className={isBelowMin ? styles.stockLow : styles.stockOk}>
          Stock: {part.stockActual}
        </span>
        {part.precioVenta != null ? (
          <span className={styles.precio}>{formatCurrencyUsd(Number(part.precioVenta))}</span>
        ) : null}
      </div>
    </Link>
  );
}
