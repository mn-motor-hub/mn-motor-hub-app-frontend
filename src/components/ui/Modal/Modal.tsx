'use client'; // Radix Dialog requiere interactividad del cliente

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onOpenChange, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={[styles.content, styles[size]].join(' ')}>
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Close className={styles.closeButton} aria-label="Cerrar">
              <X size={18} />
            </Dialog.Close>
          </div>
          {description ? (
            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          ) : null}
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
