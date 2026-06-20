import { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import styles from './Table.module.css';

export function Table({ className, children, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className={styles.wrapper}>
      <table className={[styles.table, className ?? ''].filter(Boolean).join(' ')} {...props}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={styles.thead} {...props}>{children}</thead>;
}

export function Tbody({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props}>{children}</tbody>;
}

export function Tr({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={[styles.tr, className ?? ''].filter(Boolean).join(' ')} {...props}>
      {children}
    </tr>
  );
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={[styles.th, className ?? ''].filter(Boolean).join(' ')} {...props}>
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={[styles.td, className ?? ''].filter(Boolean).join(' ')} {...props}>
      {children}
    </td>
  );
}
