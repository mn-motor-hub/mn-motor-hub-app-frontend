import { InputHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, id, className, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={styles.wrapper}>
        {label ? (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {props.required ? <span className={styles.required}>*</span> : null}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={[styles.input, error ? styles.inputError : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error ? <span className={styles.error}>{error}</span> : null}
        {helper && !error ? <span className={styles.helper}>{helper}</span> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
