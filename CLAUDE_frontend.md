# CLAUDE.md — mn-motor-hub-web

Guía de referencia para Claude Code. Leer completo antes de generar cualquier archivo.

**Nombre del proyecto:** `mn-motor-hub-web`
**Descripción:** Frontend del sistema de gestión de inventario, proveedores y ventas para MN Motor Hub.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 (strict mode) |
| Estilos | CSS Modules exclusivamente |
| Componentes | React Server Components por defecto |
| HTTP Client | fetch nativo (Next.js) |
| Formularios | react-hook-form + zod |
| Tablas | TanStack Table v8 |
| UI primitives | Radix UI (sin estilos propios) |
| Iconos | lucide-react |
| Deployment | Vercel |

---

## Estructura de carpetas

```
src/
├── app/                          # App Router de Next.js
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page (home público)
│   ├── globals.css               # Variables CSS globales, reset
│   └── (dashboard)/              # Route group — área privada de gestión
│       ├── layout.tsx            # Layout del dashboard (sidebar, navbar)
│       ├── inventario/
│       │   ├── page.tsx          # Listado de repuestos
│       │   └── [id]/
│       │       └── page.tsx      # Detalle de repuesto
│       ├── proveedores/
│       │   └── page.tsx
│       └── categorias/
│           └── page.tsx
├── components/
│   ├── ui/                       # Componentes genéricos reutilizables
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   └── Input.module.css
│   │   ├── Table/
│   │   │   ├── Table.tsx
│   │   │   └── Table.module.css
│   │   ├── Badge/
│   │   │   ├── Badge.tsx
│   │   │   └── Badge.module.css
│   │   └── Modal/
│   │       ├── Modal.tsx
│   │       └── Modal.module.css
│   ├── layout/                   # Componentes estructurales
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Sidebar.module.css
│   │   └── Navbar/
│   │       ├── Navbar.tsx
│   │       └── Navbar.module.css
│   └── features/                 # Componentes por módulo de negocio
│       ├── inventario/
│       │   ├── AutoPartCard.tsx
│       │   ├── AutoPartCard.module.css
│       │   ├── AutoPartTable.tsx
│       │   └── AutoPartFilters.tsx
│       └── proveedores/
│           └── SupplierRefList.tsx
├── lib/
│   ├── api/                      # Funciones de fetch al backend
│   │   ├── auto-parts.ts
│   │   ├── categorias.ts
│   │   └── supplier-refs.ts
│   ├── schemas/                  # Schemas Zod para validación de formularios
│   │   ├── auto-part.schema.ts
│   │   └── supplier-ref.schema.ts
│   └── utils/
│       └── format.ts             # Formateo de moneda, fechas, códigos
├── hooks/                        # Custom hooks (solo Client Components)
│   ├── useAutoPartFilters.ts
│   └── usePagination.ts
└── types/
    └── index.ts                  # Tipos globales compartidos
```

---

## Design system

### Variables CSS globales

Definidas en `src/app/globals.css`. **Nunca usar valores hardcodeados de color, spacing o tipografía** fuera de estas variables.

```css
:root {
  /* Colores principales */
  --color-primary: #1a1a2e;        /* Azul noche — navbar, sidebar */
  --color-primary-hover: #16213e;
  --color-accent: #e94560;         /* Rojo automotriz — CTAs, badges */
  --color-accent-hover: #c73652;

  /* Neutros */
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #1a202c;
  --color-text-muted: #718096;

  /* Semánticos */
  --color-success: #38a169;
  --color-warning: #d69e2e;
  --color-danger: #e53e3e;
  --color-info: #3182ce;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Tipografía */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;

  /* Bordes y sombras */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
}
```

### Assets existentes

- Hero image: `/public/images/hero-bg.png` — imagen procesada, sin watermark
- Logo: dirección estética automotive-first (referencias: BBS, Brembo, ACDelco, Sparco)

---

## Conexión con el backend

### URL base

```ts
// src/lib/api/client.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
```

### Variables de entorno

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000   # desarrollo
NEXT_PUBLIC_API_URL=https://api.mn-motor-hub.com  # producción
```

### Patrón de fetch en Server Components

```typescript
// src/lib/api/auto-parts.ts
export async function getAutoParts(params?: {
  page?: number;
  limit?: number;
  categoria?: string;
}) {
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/auto-parts`);
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.categoria) url.searchParams.set('categoria', params.categoria);

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 }, // cache 60 segundos
  });

  if (!res.ok) throw new Error('Error al obtener repuestos');
  return res.json();
}
```

### Respuesta paginada esperada del backend

```typescript
// src/types/index.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AutoPart {
  id: number;
  codigoInterno: string;      // MNM-FRE-00001
  descripcion: string;
  tipoPieza: string;
  vehiculoCompat: string;
  categoria: string;
  marcaRepuesto: string;
  oem: string;
  unidad: string;
  stockActual: number;
  stockMinimo: number;
  ubicacionStock: string;
  activo: boolean;
}

export interface SupplierRef {
  id: number;
  autoPartId: number;
  proveedor: string;
  codigoProveedor: string;
  precioUsd: number;
  precioBs: number;
  monedaOriginal: string;
  precioActualizado: string;
  activo: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  prefijo: string;
  descripcion: string;
  activo: boolean;
}
```

---

## Convenciones de código

### Server vs Client Components

```typescript
// Server Component (por defecto — NO agregar 'use client')
// src/app/(dashboard)/inventario/page.tsx
export default async function InventarioPage() {
  const data = await getAutoParts();
  return <AutoPartTable data={data} />;
}

// Client Component (solo cuando hay interactividad: useState, eventos, hooks)
// src/components/features/inventario/AutoPartFilters.tsx
'use client';
import { useState } from 'react';
export function AutoPartFilters({ onFilter }: Props) { ... }
```

**Regla:** si el componente no necesita `useState`, `useEffect`, o event handlers del browser, es Server Component. No agregar `'use client'` por defecto.

### CSS Modules

```typescript
// CORRECTO
import styles from './Button.module.css';
export function Button({ children }: Props) {
  return <button className={styles.button}>{children}</button>;
}

// INCORRECTO — nunca inline styles, nunca clases Tailwind en el codebase
export function Button({ children }: Props) {
  return <button style={{ backgroundColor: 'red' }}>{children}</button>;
}
```

### Componentes

- Un componente por archivo
- El archivo CSS Module tiene el mismo nombre que el componente
- Props siempre tipadas con `interface`, nunca `type` para props de componentes
- No exportar componentes como `default` en `components/ui/` — usar named exports

### Formularios

```typescript
// Patrón estándar con react-hook-form + zod
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { autoPartSchema, AutoPartFormData } from '@/lib/schemas/auto-part.schema';

export function AutoPartForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<AutoPartFormData>({
    resolver: zodResolver(autoPartSchema),
  });
  // ...
}
```

---

## Páginas planificadas

### Landing pública (`/`)

| Sección | Estado |
|---|---|
| Hero | ✅ Implementada |
| FeaturedProducts | 🔲 Pendiente |
| WhyUs | 🔲 Pendiente |
| CTABanner | 🔲 Pendiente |

### Dashboard privado (`/(dashboard)`)

| Ruta | Descripción |
|---|---|
| `/inventario` | Tabla de repuestos con filtros y paginación |
| `/inventario/[id]` | Detalle de repuesto + referencias de proveedores |
| `/proveedores` | Listado de supplier_refs agrupadas por proveedor |
| `/categorias` | Listado y gestión de categorías |

---

## Prohibiciones explícitas

- ❌ No usar Tailwind dentro del codebase — solo en prototipos Stitch externos
- ❌ No usar estilos inline (`style={{ }}`) salvo valores verdaderamente dinámicos (ej: progress bar con width en %)
- ❌ No agregar `'use client'` sin justificación — documentar el motivo en un comentario
- ❌ No mezclar CSS Modules con clases globales en el mismo elemento
- ❌ No usar `any` en TypeScript
- ❌ No hacer fetch directamente en componentes Client — el fetch va en `lib/api/` o en Server Components
- ❌ No crear autenticación todavía — fuera del alcance de esta fase

---

## Orden de implementación sugerido

1. `globals.css` con variables CSS del design system
2. Tipos globales en `src/types/index.ts`
3. Funciones de API en `src/lib/api/`
4. Componentes `ui/` base (Button, Input, Table, Badge)
5. Layout del dashboard (Sidebar + Navbar)
6. Página `/inventario` con listado paginado
7. Página `/inventario/[id]` con detalle y supplier_refs
8. Páginas `/categorias` y `/proveedores`
9. Secciones pendientes de la landing: FeaturedProducts, WhyUs, CTABanner
