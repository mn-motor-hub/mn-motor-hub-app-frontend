@AGENTS.md

# CLAUDE.md — mn-motor-hub-web

Documento único de referencia para Claude Code. Leer completo antes de generar cualquier archivo.

**Descripción:** Frontend del sistema de gestión de inventario, proveedores y ventas para MN Motor Hub.
**Backend:** Express, `http://localhost:3000` en desarrollo. Este frontend corre en `:3001`.

---

## Mobile First — Regla crítica

**Nuestros usuarios acceden principalmente desde teléfonos.** Toda UI se diseña y codea para móvil primero y se expande hacia escritorio.

```css
/* Base → móvil (375px+) — aquí va todo el CSS por defecto */
@media (min-width: 768px)  { /* tablet  */ }
@media (min-width: 1280px) { /* desktop */ }
```

### Reglas obligatorias

- **Media queries**: siempre `min-width`. Nunca `max-width` salvo casos excepcionales justificados.
- **Touch targets**: mínimo `44 × 44px` para cualquier elemento interactivo.
- **Inputs**: `font-size: max(1rem, 16px)` — previene zoom automático en iOS Safari. Ya está aplicado globalmente en el reset de `globals.css`.
- **Spacing táctil**: mínimo `8px` entre elementos interactivos adyacentes.
- **Tipografía**: nunca menos de `14px` en mobile — datos/labels a `14px`, cuerpo a `16px`.
- **Layouts**: columna única en mobile; grid/flex multi-columna solo desde `768px+`.
- **Navegación**: en mobile el sidebar colapsa a menú hamburguesa; nunca sidebar fijo en `< 768px`.
- **Tablas**: tarjetas apiladas o `overflow-x: auto` en un wrapper. Nunca tabla que desborde sin scroll.
- **Imágenes**: siempre `max-width: 100%`, nunca anchos fijos en mobile.
- **No hover-only**: toda interacción por hover necesita equivalente en tap/focus.

### Checklist antes de PR

1. 375px — ¿se ve y funciona?
2. 768px — ¿la transición es correcta?
3. Targets táctiles ≥ 44px.
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
| Formularios | react-hook-form + zod **v4** |
| Tablas | TanStack Table v8 |
| UI primitives | Radix UI (sin estilos propios) |
| Iconos | lucide-react |
| Deployment | Vercel |

Zod v4: la sintaxis de issues cambió — usar `code: 'custom'` como string, no `z.ZodIssueCode.custom`.

---

## Estructura de carpetas

```
src/
├── app/
│   ├── layout.tsx                    # Root layout — fuentes, globals.css
│   ├── page.tsx                      # Landing pública
│   ├── globals.css                   # Tokens del design system + reset
│   ├── icon.svg                      # Favicon
│   ├── login/                        # page.tsx + actions.ts — cookie de sesión
│   ├── ventas/[id]/comprobante/      # Comprobante imprimible — fuera del dashboard
│   └── (dashboard)/                  # Route group — área privada de gestión
│       ├── layout.tsx                # Sidebar + main
│       ├── DashboardShell.tsx        # Client wrapper — provee SidebarContext
│       ├── actions.ts                # Acciones compartidas del área privada
│       ├── dashboard/page.tsx        # Home privada — widgets de brecha cambiaria
│       ├── inventario/
│       │   ├── page.tsx              # Listado paginado con filtros
│       │   ├── actions.ts
│       │   ├── [id]/page.tsx         # Detalle editable + supplier_refs
│       │   └── importar/             # page.tsx + actions.ts — facturas de proveedor
│       ├── ventas/
│       │   ├── page.tsx  actions.ts  # Listado con filtros
│       │   ├── nueva/page.tsx        # Formulario de carga
│       │   └── [id]/page.tsx         # Detalle + confirmar / anular
│       ├── finanzas/
│       │   ├── page.tsx  actions.ts  # Resumen mensual
│       │   └── movimientos/page.tsx  # Listado paginado con filtros
│       ├── tasas/
│       │   ├── page.tsx              # Salud de las tasas + historial de intentos
│       │   └── actions.ts            # 'use server' — refreshTasasAction (POST /fetch)
│       ├── configuracion/            # page.tsx + actions.ts — claves de `configuraciones`
│       ├── proveedores/page.tsx
│       └── categorias/
│           ├── page.tsx  actions.ts  CategoriasTabs.tsx  NuevaCategoriaButton.tsx
│           ├── [id]/page.tsx         # Detalle + activar/desactivar
│           └── subcategorias/page.tsx
├── components/
│   ├── ui/                           # Genéricos reutilizables (named exports)
│   │   ├── Button/  Input/  Select/  Table/  Badge/  Modal/
│   │   └── Pagination/  StatCard/  InfoPopover/  ScrollToBottomButton/
│   ├── layout/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx           # navItems hardcodeado — editar al sumar módulos
│   │   │   ├── SidebarContext.tsx    # Estado de apertura en mobile
│   │   │   └── ExchangeRatesWidget.tsx  # Tasas vigentes, polling cada 7 min
│   │   └── Navbar/
│   └── features/                     # Componentes por módulo de negocio
│       ├── inventario/
│       │   ├── AutoPartCard.tsx  AutoPartTable.tsx  AutoPartFilters.tsx
│       │   ├── EditAutoPartButton.tsx
│       │   └── stock-import/         # Flujo de importación de facturas
│       │       ├── StockImportFlow.tsx      # Orquestador — máquina de estados
│       │       ├── FileUploadStep.tsx  InvoiceHeaderSummary.tsx
│       │       ├── InvoiceItemsPreview.tsx  SupplierSelector.tsx
│       │       └── ImportSuccessView.tsx
│       ├── ventas/
│       │   ├── SaleForm.tsx  SalesTable.tsx  SaleFilters.tsx
│       │   └── SaleEstadoBadge.tsx  ConfirmarSaleButton.tsx  AnularSaleButton.tsx
│       ├── finanzas/
│       │   ├── MovementsTable.tsx  MovementFilters.tsx  MovementFormModal.tsx
│       │   └── NewMovementButton.tsx  MonthSelector.tsx  ExpensesByCategoryChart.tsx
│       ├── dashboard/BrechaStatusWidget.tsx  BrechaHistoricoChart.tsx
│       ├── tasas/
│       │   ├── TasaSaludCard.tsx     # Semáforo por tasa — se calcula en el front
│       │   ├── HistorialFilters.tsx  HistorialTable.tsx
│       │   └── RefreshTasasButton.tsx
│       ├── categorias/SubcategoriasTable.tsx  NuevaSubcategoriaButton.tsx
│       ├── proveedores/SupplierRefList.tsx
│       └── landing/
│           ├── Hero/  FeaturedProducts/  WhyUs/  CTABanner/
├── lib/
│   ├── api/                          # Funciones de fetch al backend
│   │   ├── client.ts                 # BASE_URL, apiFetch, getAuthHeaders, cookies
│   │   ├── auto-parts.ts  categorias.ts  subcategorias.ts  suppliers.ts
│   │   ├── supplier-refs.ts  stock-imports.ts  pricing.ts
│   │   ├── sales.ts  financial-movements.ts  financial-categories.ts
│   │   └── configuraciones.ts  tasas.ts
│   ├── schemas/                      # Schemas Zod
│   │   ├── auto-part.schema.ts  categoria.schema.ts  subcategoria.schema.ts
│   │   ├── supplier-ref.schema.ts  stock-import.schema.ts
│   │   └── sale.schema.ts  financial-movement.schema.ts  configuracion.schema.ts
│   ├── constants/company.ts          # Datos fijos de la empresa — comprobante
│   └── utils/
│       ├── format.ts                 # Moneda (USD/Bs), fechas, códigos
│       └── with-fallback.ts          # Fallback que deja pasar redirect / notFound
├── hooks/                            # Solo para Client Components
│   ├── useUrlFilters.ts              # Base: la URL como única fuente de verdad
│   ├── useAutoPartFilters.ts  useMovementFilters.ts  useSaleFilters.ts
│   ├── useSubcategoriaFilters.ts  useTasaFilters.ts
│   └── usePagination.ts              # Sin usar — ver deuda técnica
└── types/index.ts                    # Tipos globales — fuente de verdad
```

Cada componente vive en su carpeta junto a su `.module.css` del mismo nombre.

---

## Design system

Compartido con `mn-motor-hub-web`. Fuente de verdad visual: `mn-motor-hub-web/design/DESIGN.md`.

**Los valores viven en `src/app/globals.css`. Nunca inventar colores, radios ni tipografías, y nunca escribir un valor literal en un componente — siempre `var(--token)`.**

### Paleta (Industrial Dark — "Onyx")

| Grupo | Tokens |
|---|---|
| Surfaces (elevación tonal, no shadows) | `--color-background` `--color-surface-lowest` `--color-surface-low` `--color-surface-container` `--color-surface-high` `--color-surface-variant` |
| Brand (Ignition Orange `#ff571a`) | `--color-primary` `--color-primary-dim` `--color-primary-hover` `--color-on-primary` |
| Texto | `--color-on-surface` `--color-on-surface-variant` |
| Bordes | `--color-outline` `--color-outline-variant` |
| Semánticos | `--color-success` `--color-warning` `--color-danger` `--color-info` (+ variante `-dim` de cada uno para fondos) |

Uso: `--color-primary` para CTAs, precios y acentos; `--color-primary-dim` para texto/íconos naranjas sobre fondo oscuro; `--color-surface-low` para sidebar/navbar; `--color-surface-container` para cards y paneles.

### Otras escalas

| Grupo | Tokens |
|---|---|
| Tipografía | `--font-oswald` (headings, uppercase, 600–700) · `--font-inter` (body, labels) · `--font-mono` (códigos `MNM-XXX-00000` y valores numéricos técnicos) |
| Escala de texto | `--text-xs` … `--text-3xl` (12px → 32px) |
| Radios | `--radius-sm` 2px · `--radius-md` 4px · `--radius-lg` 8px · `--radius-full` |
| Espaciado | `--space-xs` … `--space-2xl` (4px → 48px) · `--spacing-gutter` · `--spacing-edge` · `--spacing-section` · `--container-max` |
| Elevación | `--shadow-sm` `--shadow-md` `--shadow-lg` |

### Aliases de compatibilidad — no usar en código nuevo

`--color-bg` `--color-surface` `--color-accent` `--color-border` `--color-text` `--color-text-muted` `--font-sans`

### Assets

Logo: `public/images/logo.svg` · Favicon: `src/app/icon.svg`

---

## Conexión con el backend

### URL base y entorno

```ts
// src/lib/api/client.ts
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
```

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000            # desarrollo
NEXT_PUBLIC_API_URL=https://api.mn-motor-hub.com     # producción
```

### Tipos

**La fuente de verdad de los tipos es `src/types/index.ts`, no este documento. No duplicar interfaces acá** — hacerlo fue la causa del drift anterior. Al necesitar la forma de `AutoPart`, `Categoria`, `Supplier`, `PaginatedResponse<T>` o cualquier otro tipo, leer el archivo.

### Patrón de cache — obligatorio

- **Por defecto: `next: { revalidate: N }`.** Listados y detalle a `60`, datos casi estáticos (categorías) a `300`.
- **`cache: 'no-store'` solo cuando esté justificado**, y con el motivo en un comentario.
- **Tras una mutación: `revalidatePath()`** desde el Server Action, y `router.refresh()` en el cliente si hace falta refrescar el Server Component visible.
- **❌ Nunca `export const dynamic = 'force-dynamic'`** (ni `force-static`). Si un dato parece necesitarlo, es señal de que el `revalidate` está mal elegido.

```typescript
// src/lib/api/auto-parts.ts
export async function getAutoParts(params?: { page?: number; categoriaId?: number }) {
  const url = new URL(`${BASE_URL}/api/auto-parts`);
  if (params?.page) url.searchParams.set('page', String(params.page));

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Error al obtener repuestos');
  return res.json();
}
```

### Errores

Cada función de `lib/api/` mapea los status HTTP a mensajes en español y lanza `Error`. Para casos que el llamador necesita discriminar, exportar una clase de error dedicada (ver `DuplicateInvoiceError` en `stock-imports.ts`) y ramificar con `instanceof`.

---

## Convenciones de código

### Server vs Client Components

**Regla:** si el componente no necesita `useState`, `useEffect` o event handlers del browser, es Server Component. No agregar `'use client'` por defecto, y cuando se agregue, documentar el motivo en un comentario en la misma línea.

```typescript
// Server Component (por defecto)
export default async function InventarioPage() {
  const data = await getAutoParts();
  return <AutoPartTable data={data} />;
}

// Client Component
'use client'; // useReactTable es un hook de TanStack
```

### CSS Modules

```typescript
// CORRECTO
import styles from './Button.module.css';
<button className={styles.button}>

// INCORRECTO — nunca inline styles, nunca Tailwind
<button style={{ backgroundColor: 'red' }}>
```

### Componentes

- Un componente por archivo; el `.module.css` lleva el mismo nombre.
- Props tipadas con `interface`, nunca `type`.
- En `components/ui/`: named exports, nunca `default`.

### Formularios — react-hook-form + zod

```typescript
'use client';
const { register, handleSubmit, formState: { errors } } = useForm<AutoPartFormData>({
  resolver: zodResolver(autoPartSchema),
});
```

Para formularios de varias secciones o con listas de ítems, usar `FormProvider` en el contenedor y `useFormContext()` en los hijos, en vez de prop-drilling de `register`. Cuando la validación depende de datos del servidor, derivar el schema con `superRefine` a partir de esos datos y memoizarlo. Referencia completa: el flujo de `components/features/inventario/stock-import/`.

### Filtros y paginación en listados — patrón estándar

**La URL es la única fuente de verdad para filtros y página.** Sin `useState` espejo: un hook lee `useSearchParams()`, y aplicar un filtro reconstruye los params, resetea `page=1` y hace `router.push()`. Así el botón Atrás del browser funciona y el Server Component recibe todo por `searchParams`.

Única excepción admitida: estado local para un input de texto que se aplica en submit y no en cada tecla, sincronizado con `useEffect` cuando cambia la URL.

La base es `hooks/useUrlFilters.ts`, que recibe el `basePath` y las claves; cada
módulo lo envuelve en un hook de una línea (`useAutoPartFilters`,
`useMovementFilters`, `useSaleFilters`, `useTasaFilters`). Al sumar un módulo,
escribir ese wrapper — no copiar la lógica. El array de claves va como constante
a nivel de módulo, nunca inline: se usa como dependencia de los memos.

Referencia de la pantalla completa: `finanzas/movimientos/page.tsx` +
`components/features/finanzas/MovementFilters.tsx` — filtros y paginación por
URL, `<Suspense>` con `key` en los params y `<Pagination>` compartido.

---

## Estado de las páginas

### Landing pública (`/`)

Hero, FeaturedProducts, WhyUs y CTABanner — todas implementadas en `src/components/features/landing/`.

### Dashboard privado (`/(dashboard)`)

| Ruta | Descripción | Estado |
|---|---|---|
| `/dashboard` | Home privada — widget de brecha cambiaria e histórico | ✅ |
| `/inventario` | Tabla de repuestos con filtros y paginación | ✅ |
| `/inventario/[id]` | Detalle editable + referencias de proveedores | ✅ |
| `/inventario/importar` | Importación de facturas: upload, preview editable, selector de proveedor, confirmación con `requiere_revision` | ✅ |
| `/ventas` | Listado de ventas con filtros | ✅ |
| `/ventas/nueva` | Carga de venta contra `contexto-tasa` + descuento comercial | ✅ |
| `/ventas/[id]` | Detalle con confirmar y anular | ✅ |
| `/finanzas` | Resumen mensual: ingresos, gastos y gastos por categoría | ✅ |
| `/finanzas/movimientos` | Listado paginado con filtros de tipo, categoría, estado y fechas | ✅ |
| `/tasas` | Salud de las tasas de cambio + historial de intentos del scraper, con refresco manual | ✅ |
| `/proveedores` | supplier_refs agrupadas por proveedor | ✅ |
| `/categorias` | Listado y gestión de categorías, con pestaña de subcategorías | ✅ |
| `/categorias/[id]` | Detalle de categoría + activar/desactivar | ✅ |
| `/configuracion` | Edición de las claves de `configuraciones` | ✅ |

Fuera del route group: `/` es la landing pública, `/login` monta la cookie de
sesión y `/ventas/[id]/comprobante` es el comprobante imprimible, que a
propósito no lleva el chrome del dashboard.

#### Nota sobre `/tasas`

`POST /api/tasas/fetch` sale **únicamente** de `refreshTasasAction`, disparada por
el click en "Actualizar tasas ahora". Nunca en el montaje de un componente ni en
el render de la page: el scrapeo tarda hasta 25 s si una fuente está caída y sale
de una sola IP contra el BCV. La pantalla se dibuja leyendo de la base
(`/salud` e `/historial`), que es instantáneo.

`ultimoIntento` y `ultimoExito` se muestran siempre separados y no se colapsan en
un solo "última actualización": el job puede seguir intentando cada hora mientras
el último éxito queda días atrás, y con un solo campo esa caída es invisible.

Al sumar un módulo nuevo: crear la carpeta bajo `(dashboard)/` y agregar la entrada al array `navItems` de `Sidebar.tsx`.

---

## Prohibiciones explícitas

- ❌ No usar Tailwind dentro del codebase — solo en prototipos Stitch externos
- ❌ No usar estilos inline (`style={{ }}`) salvo valores verdaderamente dinámicos (ej: width en % de una progress bar)
- ❌ No agregar `'use client'` sin justificación — documentar el motivo en un comentario
- ❌ No mezclar CSS Modules con clases globales en el mismo elemento
- ❌ No usar `any` en TypeScript
- ❌ No hacer fetch directamente en componentes Client — el fetch va en `lib/api/` o en Server Components
- ❌ No usar `force-dynamic` ni `force-static`
- ❌ No crear autenticación todavía — fuera del alcance de esta fase

---

## Deuda técnica conocida

Registrada acá para no volver a reportarla como hallazgo nuevo en cada auditoría. No corregir de forma oportunista: cada punto se aborda en su propio cambio.

- **Fetch en Client Component.** `components/features/inventario/stock-import/SupplierSelector.tsx` llama a `getSuppliers()` desde un `useEffect`, violando la prohibición de arriba. La regla se mantiene vigente; este es el único caso existente y está pendiente de corrección.
- **Sin `middleware.ts` que proteja las rutas.** Ya hay sesión (`/login` monta la cookie httpOnly `mn_session`, `apiFetch` redirige a `/login` ante un 401), pero la protección es indirecta: depende de que cada fetch reciba el 401. Un segmento que no pidiera datos se renderizaría igual. El TODO al inicio de `inventario/importar/page.tsx` sigue vigente por el mismo motivo, más el rol que todavía no se chequea.
- **Sin `error.tsx` ni `loading.tsx`** en ningún route segment. Un throw de `lib/api/` sube hasta el error boundary global. Los `<Suspense>` de `inventario/page.tsx` además van sin `fallback` — el resto de las pantallas ya usa skeletons.
- **Media queries en `max-width`** — pendientes de migrar a mobile-first: `Sidebar.module.css`, `Navbar.module.css`, `inventario/[id]/detail.module.css`. Son los tres únicos casos que quedan.
- **Sin `.env.example`.** Además, `.gitignore` ignora `.env*` sin excepción: al crearlo hay que agregar `!.env.example`.
- **`hooks/usePagination.ts` no lo usa nadie.** El componente compartido es `components/ui/Pagination/` (lo usan ventas, finanzas y tasas); `inventario/page.tsx` sigue con su `PaginationControls` propio inline. Falta unificar y borrar el hook muerto.
- **`useUrlFilters` con `basePath` por wrapper.** Cada módulo tiene su hook de una línea (`useAutoPartFilters`, `useMovementFilters`, `useSaleFilters`, `useTasaFilters`). Funciona, pero son cuatro archivos que solo fijan una ruta y un array de claves.
