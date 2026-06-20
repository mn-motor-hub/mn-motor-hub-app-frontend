---
paths:
  - "app/**/*.{tsx,ts}"
  - "components/**/*.{tsx,ts}"
  - "**/*.module.css"
---

# Reglas de Diseño Frontend — MN Motor Hub

Estas reglas se cargan automáticamente cuando Claude Code toca componentes,
páginas o estilos. No duplican `CLAUDE.md` — son el detalle de *cómo* construir
UI, no las prohibiciones generales del proyecto.

## 1. Mobile-first, sin excepciones

- Todo estilo se escribe primero para el viewport más chico (360px) y se
  expande con `min-width` media queries. **Nunca** `max-width` como base.
- Breakpoints estándar del proyecto (usar estas variables, no números sueltos):

  ```css
  /* tokens.css o variables.module.css */
  --bp-sm: 360px;  /* Android chico */
  --bp-md: 390px;  /* iPhone estándar */
  --bp-lg: 768px;  /* tablet / sidebar aparece */
  --bp-xl: 1024px; /* desktop */
  --bp-2xl: 1280px;/* desktop ancho */
  ```

- Ningún componente nuevo se considera terminado si no fue revisado en 360px,
  390px y 768px como mínimo.
- Imágenes y hero sections: usar `next/image` con `sizes` definido explícito
  por breakpoint — nunca un ancho fijo que rompa en mobile.

## 2. Flexbox-first

- **Flexbox es el default.** Usar CSS Grid solo cuando hay necesidad real de
  alinear en dos ejes simultáneos (ej: catálogo de productos en cuadrícula,
  dashboard con áreas fijas). Si la duda es "¿flex o grid?", la respuesta es
  flex.
- Patrón estándar para listas/cards en mobile → fila en desktop:

  ```css
  .container {
    display: flex;
    flex-direction: column; /* mobile: stack vertical */
    gap: var(--space-md);
  }

  @media (min-width: 768px) {
    .container {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
  ```

- Usar `gap` en vez de márgenes manuales entre elementos flex. Evita el
  "margin collapse hacking" y es más fácil de mantener.
- `justify-content` y `align-items` explícitos siempre — no depender del
  comportamiento default del navegador.
- Grid se reserva para: `FeaturedProducts` (cuadrícula de catálogo) y
  layouts de dashboard interno. Todo lo demás (Hero, CTABanner, WhyUs,
  navegación, formularios) es flex.

## 3. Ordenamiento de elementos para mejor visibilidad

El orden visual no es decorativo — sigue el peso de decisión del usuario.

- **Regla de los 3 segundos**: lo primero que ve el usuario en mobile debe
  responder "¿qué es esto y qué hago ahora?". Orden estándar por sección:
  1. Identificador visual (logo/ícono de categoría)
  2. Texto de mayor peso semántico (título/nombre de producto)
  3. Dato accionable (precio, disponibilidad de stock)
  4. CTA (botón de acción)
  5. Detalle secundario (descripción, specs técnicas)

- En mobile, usar `order` de flexbox para reordenar sin tocar el HTML
  cuando el orden semántico (accesibilidad/SEO) difiere del orden visual:

  ```css
  .price { order: 1; }
  .cta   { order: 2; }
  .specs { order: 3; }
  ```

  ⚠️ Usar `order` con criterio: el DOM debe seguir siendo lógico para
  lectores de pantalla. Si el reordenamiento visual contradice la lectura
  natural, replantear el markup en vez de forzar `order`.

- CTAs primarios (agregar al carrito, contactar por WhatsApp, ver detalle)
  siempre dentro del "área de pulgar" en mobile: mitad inferior de la
  pantalla o sticky al fondo del viewport en pantallas de producto.
- Jerarquía tipográfica: máximo 3 niveles de peso visual por sección
  (título, subtítulo/dato clave, cuerpo). Si una sección necesita un 4to
  nivel, dividir en dos secciones.

## 4. Buenas prácticas generales (refuerzo, no duplicado de CLAUDE.md)

- **CSS Modules exclusivamente** (ya definido en CLAUDE.md): nombres de
  clase en `camelCase`, un archivo `.module.css` por componente, sin estilos
  inline salvo valores dinámicos calculados en runtime.
- **Touch targets**: mínimo 44x44px en cualquier elemento interactivo
  (botones, links de navegación, ítems de carrito). Esto es no negociable
  en un ecommerce de repuestos donde el usuario probablemente compra desde
  el celular en un taller.
- **Contraste y legibilidad**: paleta inspirada en BBS/Brembo/Sparco usa
  negros, rojos y grises de alto contraste — verificar que el texto sobre
  fondos oscuros cumpla mínimo WCAG AA (4.5:1).
- **Server Components por default**: solo usar `"use client"` cuando hay
  estado, eventos del DOM, o hooks de React. Formularios con
  `react-hook-form` + Zod son la excepción esperada (necesitan client).
- **Skeleton/loading states**: cualquier componente que dependa de datos del
  backend (stock, precios) debe tener un estado de carga con la misma
  estructura flex que el contenido final, para evitar layout shift.
- **Sin `export const dynamic = 'force-dynamic'`** (recordatorio — la regla
  completa vive en CLAUDE.md). Usar `revalidate` o `revalidateTag`.

## 5. Checklist antes de marcar un componente como terminado

- [ ] Probado en 360px, 390px y 768px
- [ ] Flexbox como base; Grid solo si está justificado arriba
- [ ] CTA principal alcanzable con el pulgar en mobile
- [ ] Touch targets ≥ 44x44px
- [ ] Sin layout shift entre estado de carga y estado final
- [ ] CSS Module con nombres camelCase, sin estilos inline estáticos
- [ ] Server Component salvo justificación explícita de cliente
