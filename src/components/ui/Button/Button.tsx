import { ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className, ...props }, ref) => {
    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      loading ? styles.loading : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
