@AGENTS.md

# CLAUDE.md — mn-motor-hub-frontend

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
│       ├── brecha-cambiaria/page.tsx   # Estado de la brecha + histórico de 30 días
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
│       ├── configuracion/
│       │   ├── page.tsx  actions.ts  # Lista genérica de claves de `configuraciones`
│       │   ├── EditarConfiguracionButton.tsx   # Editor por clave, reusado por pricing
│       │   └── motor-de-precios/
│       │       ├── page.tsx          # Factor K: estado, brecha, cálculo y aplicación
│       │       └── actions.ts        # 'use server' — calcularKSugerido / aplicarK
│       ├── proveedores/page.tsx
│       └── categorias/
│           ├── page.tsx  actions.ts  CategoriasTabs.tsx  NuevaCategoriaButton.tsx
│           ├── [id]/page.tsx         # Detalle + activar/desactivar
│           └── subcategorias/page.tsx
├── components/
│   ├── ui/                           # Genéricos PROPIOS de este repo (named exports)
│   │   └── Modal/  Select/  InfoPopover/  ScrollToBottomButton/
│   │                                 # Button, Input, Badge, Table, Pagination y StatCard
│   │                                 # NO están acá: vienen de @mn/design-system/ui
│   ├── charts/                       # Gráficos compartidos entre módulos
│   │   └── BrechaHistoricoChart/     # Recharts — brecha vs. banda, nulls sin conectar
│   ├── layout/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx           # navGroups hardcodeado — editar al sumar módulos
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
│       ├── brecha/BrechaStatusWidget.tsx
│       ├── pricing/
│       │   ├── MotorPreciosHeader.tsx    # Semáforo de K — se calcula en el front
│       │   ├── TasasReadout.tsx  KSugeridoPanel.tsx
│       │   └── AjustesAvanzados.tsx      # Edición manual, colapsada
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

`globals.css` importa `@mn/design-system/tokens.css` y `recipes.css`: los tokens
**no** se definen acá, se consumen. `--touch-min` (44px) sale de ahí.

### Primitivas: del paquete, no de este repo

`Button`, `Input`, `Badge`, `Table`, `Pagination` y `StatCard` se importan de
`@mn/design-system/ui`. En `components/ui/` viven solo las que son propias de
este repo: `Modal`, `Select`, `InfoPopover`, `ScrollToBottomButton`.

**`<Button size="sm">` libera el mínimo táctil a propósito** — su
`min-height: var(--touch-min)` se anula, y el botón queda en 24px. El propio
design system lo dice: *"compacto, para tablas densas de escritorio; no usar en
superficies touch"*. En una app mobile-first eso deja afuera filtros, modales y
botones de acción: para todo eso va `size="md"`, que respeta los 44px sin que
haya que forzar nada en CSS. Si un botón necesita `min-height` propio para
llegar a 44px, el tamaño elegido está mal.

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

### Fechas y horas

**Se formatean siempre desde `lib/utils/format.ts`. Nunca con un
`Intl.DateTimeFormat` armado en el componente ni con un helper local.**

El backend manda fechas de dos formas y son cosas distintas:

| Qué | De dónde | Cómo se formatea |
|---|---|---|
| **Instante** (`createdAt`, `updatedAt`, `ultimoExito`) | `timestamp` | `formatDate` / `formatDateTime` — en `America/Caracas` |
| **Día suelto `'YYYY-MM-DD'`** (`Sale.fecha`, `FinancialMovement.date`, `BrechaSnapshot.fecha`, `fechaValor`, las revisiones de K) | columnas `date` | `formatBusinessDay` — partiendo el string |

Las dos reglas y por qué existen:

1. **Un instante lleva `timeZone: 'America/Caracas'`.** El negocio opera en
   Venezuela. `Intl.DateTimeFormat('es-VE', …)` **no** alcanza: el locale
   decide el formato, la zona la decide el runtime. Sin fijarla, el mismo dato
   salía a 21:00 en un Server Component (servidor en UTC) y a 18:00 en uno
   Client (navegador en UTC−3) para la corrida de las 17:00 — y encima
   hidrataba distinto de lo que servía el SSR.
2. **Un día suelto NO pasa por `new Date()`.** Se parsea como medianoche UTC y
   en cualquier huso al oeste de Greenwich se muestra el día anterior. Un día
   no tiene zona que convertir. `formatDate` detecta la forma `'YYYY-MM-DD'` y
   delega en `formatBusinessDay`, así que el caller no puede equivocarse; aun
   así, cuando sabés que el dato es un día, llamá a `formatBusinessDay` directo
   y dejá la intención escrita.

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

**Sin excepciones — tampoco para el input de texto que se aplica en submit.** Ese
caso no necesita estado: el input va **sin controlar**, con `name`,
`defaultValue={filters.q}` y `key={filters.q}`, y el submit lee el valor con
`new FormData(e.currentTarget)`. El `key` es lo que lo resincroniza cuando la URL
cambia por otra vía ("Limpiar", el botón Atrás).

Antes esto era un `useState` espejo sincronizado con `useEffect`, y estaba
documentado acá como la única excepción admitida. No lo era: el `setState`
sincrónico dentro del efecto dispara renders en cascada —lo marca
`react-hooks/set-state-in-effect`— y además duplicaba una fuente de verdad que
esta misma sección dice que no se duplica. Ver `AutoPartFilters`, `SaleFilters` o
`SubcategoriasTable`.

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
| `/brecha-cambiaria` | Estado de la brecha vs. la banda + histórico de 30 días | ✅ |
| `/dashboard` | **Libre y reservado.** Pantalla general de la empresa, todavía sin implementar. No ocupar con otra cosa | ⬜ |
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
| `/configuracion/motor-de-precios` | Factor K: estado vs. banda, tasas del día, cálculo del K sugerido y aplicación con confirmación | ✅ |

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
un solo "última actualización": el job puede seguir intentando mientras el último
éxito queda días atrás, y con un solo campo esa caída es invisible.

La cadencia real del backend son **dos corridas diarias, 08:00 y 17:00 (hora de
Venezuela)**, más backoff **por fuente** ante un fallo transitorio y **ningún**
reintento ante uno determinista. Son dos porque el BCV publica después de las
17:00 la tasa del próximo día bancario: con una sola corrida a esa hora se
llegaba temprano y se traía el valor que ya se tenía.

**No hardcodear la cadencia en ningún texto de UI.** Ya cambió dos veces —
primero de horaria a diaria, ahora de diaria a dos corridas— y las dos veces el
front quedó afirmando una política que no existía. La fuente de verdad es
`proximoIntento` de `GET /api/tasas/salud`.

Las fechas de esta pantalla siguen la regla general de **Fechas y horas** (ver
Convenciones de código): los instantes van en hora de Venezuela y `fechaValor`,
que es un día suelto, se formatea con `formatBusinessDay`.

**Cuatro campos de `TasaSalud` que la pantalla no puede ignorar:**

| Campo | Por qué |
|---|---|
| `requiereAtencion` | Lo único que dice "esto no se arregla solo". Un error determinista lo marca desde el primer intento, con la tasa todavía fresca. Sin él, se pinta igual que un fallo que se cura en 15 min |
| `rachaTruncada` | `fallosConsecutivos` es un piso cuando llega al techo de filas que mira el backend. Sin el "al menos", un 200 se lee exacto |
| `valorManual` | Una automática con override se ve idéntica a una sin él, con el scraper refrescando en silencio un valor que nadie usa |
| `fechaValor` | El día de negocio para el que rige la tasa, según la fuente. Es lo único que distingue una tasa de hoy publicada anoche (correcta) de una que quedó vieja (incorrecta) — "hace 23 h" no lo hace, y esa ambigüedad es lo que dejó operar jornadas enteras con la tasa del día anterior |

**`fechaValor: null` significa "no se sabe", NUNCA "hoy".** Pasa en tres casos
legítimos: Binance no publica fecha valor (es precio de mercado vivo, no
referencia diaria), las manuales tampoco, y las filas viejas hasta el primer
fetch con el backend que la trae. Con null se cae al comportamiento anterior
—la antigüedad— y no se muestra ninguna fecha. Asumir hoy afirmaría que una
tasa vieja es la del día, que es peor que el bug original: no se nota.

Viene en tres lugares: `GET /api/tasas`, `GET /api/tasas/salud` y cada fila del
historial. En la tarjeta se muestra **junto a** la antigüedad, no en su lugar:
qué tasa es esta y hace cuánto que no traemos nada son dos preguntas distintas,
y la segunda es la que delata un scraper muerto. En el historial es una columna
al lado del valor — sobre la serie, un scraper atrasado se ve como un valor que
se repite mientras la fecha se queda quieta.

`requiereAtencion: true` **no** implica `proximoIntento: null`: al agotar los
reintentos la fuente vuelve al ciclo programado. Se muestran los dos juntos —
mostrar uno solo miente en las dos direcciones. `proximoIntento: null` tampoco
significa que se abandonó: el estado del scheduler vive en memoria del backend y
se pierde en un reinicio hasta el primer tick.

`providerId` y `fuenteFetch` son distintos y con granularidad distinta: `BCV_USD`
es una tasa, `BCV` es el request que sirve USD y EUR juntos. `meta.fallos` de
`POST /fetch` viene **una entrada por tasa**, así que una caída del BCV llega dos
veces con el mismo motivo — se agrupa por `fuenteFetch` antes de escribir
cualquier mensaje, o dice "falló BCV" dos veces.

La antigüedad sale de `horasSinActualizar` / `diasSinActualizar` y no de
`formatTimeAgo`: los días redondean hacia arriba a propósito (47 h eran "1 día"),
y mezclar los dos cálculos hace que la misma fecha se lea distinto en dos lugares
de la misma tarjeta.

El umbral de `stale` se deriva en el backend de la cadencia más
`tasas_stale_margen_horas`; acá solo se consume el booleano. No hardcodear el
número ni afirmar "hace más de 30 h": `stale` también se enciende cuando el
backend no pudo leer esa clave y degradó hacia "vencida".

`GET /historial` valida los filtros: 400 si no entiende uno, 404 si la clave no
existe. Ya no devuelve lista vacía, así que una lista vacía ahora significa de
verdad "no hay intentos con estos filtros" y el mensaje del backend se muestra
tal cual. Como los filtros salen de la URL, `HistorialSection` los atrapa en vez
de dejar que un `?clave=typo` se lleve puesta también la sección de salud.

#### Nota sobre `/configuracion/motor-de-precios`

`GET /api/pricing/k-sugerido` sale **solo** del botón "Calcular K sugerido", no
del render: es un cómputo que el usuario pide, y meterlo en la carga de la
pantalla lo cobraría sin que nadie lo haya pedido. `POST /aplicar-k` reescala los
precios sugeridos del catálogo, así que pide confirmación mostrando el delta
explícito y el impacto, nunca un "¿confirmar?" genérico.

Cinco estados de datos tienen tratamiento propio y ninguno cae en un fallback
genérico: `kSugerido` null con `muestraSuficiente` false (es el estado normal
mientras falta historial, no un error), `brechaPct` null en el histórico (se
corta la línea, nunca se grafica como 0), `tasaBcvStale` (se dice "tasa
desactualizada", no "sin dato P2P" — son causas distintas del mismo null),
`fueraDeRangoValido` (el recorte se avisa, si no la aritmética no cierra) y
`snapshotsExcluidos` (desglosado por motivo).

Los mínimos y umbrales del cálculo viven en el backend y no se duplican acá.
`K_MUESTRA_MINIMA` no viene en la respuesta, así que el copy habla de días
usados contra la ventana objetivo en vez de hardcodear el número.

**Ajustes avanzados** es un `<details>` colapsado que reutiliza
`EditarConfiguracionButton` de `/configuracion` sobre una lista explícita de
cuatro claves — la lista vive en `CLAVES_PRICING`, en `AjustesAvanzados.tsx`:

| Clave | Qué es |
|---|---|
| `factor_reposicion_cambiaria` | El K. Rango 1.00–2.00, máximo 2 decimales |
| `brecha_banda_min` | Piso de la banda objetivo, en % |
| `brecha_banda_max` | Techo de la banda objetivo, en % |
| `margen_ganancia_default` | Margen por defecto del catálogo, en % |

Es una lista y no un match por prefijo a propósito: `ultima_revision_k` también
es del motor de precios, pero guarda una fecha `YYYY-MM-DD` y el editor genérico
la abriría como número. Queda afuera porque además se escribe sola al aplicar un
K. Al sumar una clave de pricing nueva, agregarla a ese array — y solo si el
editor numérico genérico le sirve.

`updateConfiguracionAction` invalida `PRICING_TAG` y ambas rutas para cualquier
clave, no solo estas cuatro: el costo es un refetch, y filtrar ahí duplicaría la
lista en un segundo lugar.

Al sumar un módulo nuevo: crear la carpeta bajo `(dashboard)/` y agregar la
entrada al grupo que le corresponda en `navGroups` de `Sidebar.tsx` — catálogo
(inventario, proveedores, categorías), operación diaria (ventas, finanzas,
tasas, brecha) o ajustes. **No al final de la lista**: el orden ES el
agrupamiento. `navItems` se deriva aplanando esos grupos y marcando el primer
ítem de cada uno, que es lo que dibuja el separador.

El label del sidebar dice lo que la pantalla muestra, no cómo se llama la ruta.
La pantalla de brecha vive en `/brecha-cambiaria` y se llama **Brecha
cambiaria** porque es lo único que renderiza.

**`/dashboard` está libre a propósito.** Antes la ocupaba la pantalla de
brecha bajo el nombre "Dashboard", que prometía un resumen general que no
existía. Queda reservada para esa pantalla general —la información más
relevante de la empresa—, todavía sin implementar. No ocuparla con otra cosa:
mudarla después, con los favoritos ya repartidos, sale más caro que dejarla
vacía ahora.

El route group `(dashboard)/` sigue llamándose así y **no** es esa ruta: no
aparece en la URL, nombra al área privada y está en los imports de 16
componentes (`@/app/(dashboard)/…/actions`).

La raíz de todos los breadcrumbs es **`{ label: 'Panel' }`**, sin `href`.
Nombra al área privada, no a ninguna pantalla — por eso no dice "Dashboard",
que a partir de ahora es una ruta concreta y sin construir.

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
- **El rol todavía no se chequea en ninguna ruta.** `src/proxy.ts` (Next 16 renombró `middleware` a `proxy`) ya rebota a `/login` cualquier ruta que no sea pública si falta la cookie `mn_session`, y `apiFetch` redirige ante un 401. Pero el proxy solo mira que la cookie exista, no que sea válida — la seguridad real la hace el backend validando el JWT. Lo que falta es el permiso por rol: el TODO al inicio de `inventario/importar/page.tsx` sigue vigente por eso.
- **Sin `error.tsx` ni `loading.tsx`** en ningún route segment. Un throw de `lib/api/` sube hasta el error boundary global. Los `<Suspense>` de `inventario/page.tsx` además van sin `fallback` — el resto de las pantallas ya usa skeletons.
- **Media queries en `max-width`** — pendientes de migrar a mobile-first: `Sidebar.module.css`, `Navbar.module.css`, `inventario/[id]/detail.module.css`. Son los tres únicos casos que quedan.
- **Sin `.env.example`.** Además, `.gitignore` ignora `.env*` sin excepción: al crearlo hay que agregar `!.env.example`.
- **`hooks/usePagination.ts` no lo usa nadie.** El componente compartido es `components/ui/Pagination/` (lo usan ventas, finanzas y tasas); `inventario/page.tsx` sigue con su `PaginationControls` propio inline. Falta unificar y borrar el hook muerto.
- **`useUrlFilters` con `basePath` por wrapper.** Cada módulo tiene su hook de una línea (`useAutoPartFilters`, `useMovementFilters`, `useSaleFilters`, `useTasaFilters`). Funciona, pero son cuatro archivos que solo fijan una ruta y un array de claves.

## Git — commits

Siempre usar el skill /commit para cualquier commit. Nunca `git commit`
directo ni mensajes con trailers de atribución de IA.