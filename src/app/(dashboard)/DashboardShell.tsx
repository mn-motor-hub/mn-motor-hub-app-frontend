'use client';

import { SidebarProvider } from '@/components/layout/Sidebar/SidebarContext';
import type { ReactNode } from 'react';

export function DashboardShell({ children }: { children: ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
