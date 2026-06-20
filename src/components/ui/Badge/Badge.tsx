import { HTMLAttributes } from 'react';
import styles from './Badge.module.css';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export function Badge({ variant = 'neutral', children, className, ...props }: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[variant], className ?? ''].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
