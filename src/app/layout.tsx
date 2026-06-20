import type { Metadata } from 'next';
import { Inter, Oswald, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MN Motor Hub — Gestión de Repuestos',
  description: 'Sistema de gestión de inventario, proveedores y ventas para MN Motor Hub.',
  icons: {
    icon: '/images/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${oswald.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
