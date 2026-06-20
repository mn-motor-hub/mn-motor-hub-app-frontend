import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { DashboardShell } from './DashboardShell';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.main}>{children}</div>
      </div>
    </DashboardShell>
  );
}
