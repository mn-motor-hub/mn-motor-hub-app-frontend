# CLAUDE.md — mn-motor-hub-web

Guía de referencia para Claude Code. Leer completo antes de generar cualquier archivo.

**Nombre del proyecto:** `mn-motor-hub-web`
**Descripción:** Frontend del sistema de gestión de inventario, proveedores y ventas para MN Motor Hub.

---

## Mobile First — Regla crítica

**Nuestros usuarios acceden principalmente desde teléfonos.** Toda UI se diseña y codea para móvil primero y se expande hacia escritorio.

### Breakpoints
```css
/* Base → móvil (375px+) — aquí va todo el CSS por defecto */
@media (min-width: 768px)  { /* tablet  */ }
@media (min-width: 1280px) { /* desktop */ }
```

### Reglas obligatorias
- **Media queries**: siempre `min-width`. Nunca `max-width` salvo casos excepcionales justificados.
- **Touch targets**: mínimo `44 × 44px` para cualquier elemento interactivo (botones, links, íconos clicables).
- **Inputs**: `font-size: max(1rem, 16px)` — previene zoom automático en iOS Safari.
- **Spacing táctil**: mínimo `8px` de separación entre elementos interactivos adyacentes.
- **Tipografía base**: nunca menos de `14px` en mobile; texto de datos/labels a `14px`, cuerpo a `16px`.
- **Layouts**: columna única en mobile; grid/flex multi-columna solo desde `768px+`.
- **Navegación**: en mobile el sidebar colapsa a un menú hamburguesa o bottom bar; nunca layout de sidebar fijo en pantallas `< 768px`.
- **Tablas**: en mobile usar tarjetas apiladas (`display: block` por fila) o scroll horizontal con `overflow-x: auto` en un wrapper, nunca tabla sin scroll que desborde.
- **Imágenes**: siempre `max-width: 100%`, nunca anchos fijos en mobile.
- **No hover-only**: toda interacción que dependa de hover debe tener equivalente en tap/focus.

### Orden de revisión antes de hacer PR
1. Redimensionar a 375px — ¿se ve y funciona?
2. Redimensionar a 768px — ¿la transición es correcta?
3. Targets táctiles ≥ 44px verificados.
4. Sin scroll horizontal no intencional.

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

Compartido con `mn-motor-hub-web`. Fuente de verdad visual: `mn-motor-hub-web/design/DESIGN.md`.
**Nunca inventar colores, radios ni tipografías.** Todo valor viene de las CSS variables en `src/app/globals.css`.

### Paleta (Industrial Dark — "Onyx")

```css
/* Surfaces — elevación tonal, no shadows */
--color-background:        #131313   /* canvas base */
--color-surface-lowest:    #0e0e0e
--color-surface-low:       #1c1b1b   /* sidebar, navbar */
--color-surface-container: #201f1f   /* cards, paneles */
--color-surface-high:      #2a2a2a   /* hover states, tooltips */
--color-surface-variant:   #353534   /* chips inactivos */

/* Brand — Ignition Orange */
--color-primary:           #ff571a   /* botones CTA, precios, acciones */
--color-primary-dim:       #ffb59e   /* texto/íconos naranjas sobre fondo oscuro */
--color-primary-hover:     #d63f00
--color-on-primary:        #521300   /* texto sobre botón naranja */

/* Texto */
--color-on-surface:        #e5e2e1   /* texto principal */
--color-on-surface-variant:#e6beb2   /* texto secundario */

/* Bordes */
--color-outline:           #ad897e
--color-outline-variant:   #5c4037

/* Semánticos (badges, alertas) */
--color-success: #4caf7d  --color-success-dim: rgba(76,175,125,0.12)
--color-warning: #f0a845  --color-warning-dim: rgba(240,168,69,0.12)
--color-danger:  #f05252  --color-danger-dim:  rgba(240,82,82,0.12)
--color-info:    #4da6ff  --color-info-dim:    rgba(77,166,255,0.12)
```

### Tipografía

```css
--font-oswald: 'Oswald'         /* headings, uppercase, display — cargada en layout.tsx */
--font-inter:  'Inter'          /* body, labels, descripciones */
--font-mono:   'JetBrains Mono' /* códigos internos MNM-XXX-00000 */
```

- Headings: Oswald, uppercase, `font-weight: 600–700`
- Body / labels: Inter
- Códigos y valores numéricos técnicos: JetBrains Mono

### Bordes, radios y espaciado

```css
--radius-sm: 2px   /* chips, tags */
--radius-md: 4px   /* botones, inputs */
--radius-lg: 8px   /* cards, modals */

--spacing-base: 8px   --space-sm: 8px   --space-md: 16px
--spacing-gutter: 24px  --space-lg: 24px  --space-xl: 32px
--spacing-section: 80px --space-2xl: 48px
--container-max: 1280px
```

### Variables de compatibilidad (deprecar gradualmente)

Estas siguen funcionando como aliases pero **no usar en código nuevo**:
`--color-bg` `--color-surface` `--color-accent` `--color-border` `--color-text` `--color-text-muted` `--font-sans`

### Assets

- Logo SVG: `public/images/logo.svg` y `src/app/icon.svg` (favicon)

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
