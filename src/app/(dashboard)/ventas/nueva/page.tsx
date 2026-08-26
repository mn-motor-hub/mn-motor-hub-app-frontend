import { Navbar } from '@/components/layout/Navbar/Navbar';
import { SaleForm } from '@/components/features/ventas/SaleForm';
import styles from './nueva.module.css';

export default function NuevaVentaPage() {
  return (
    <>
      <Navbar
        title="Nueva venta"
        breadcrumb={[{ label: 'Ventas', href: '/ventas' }, { label: 'Nueva venta' }]}
      />
      <div className={styles.content}>
        <SaleForm />
      </div>
    </>
  );
}
