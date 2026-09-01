---
name: fase
description: Ejecuta una tarea siguiendo el protocolo de trabajo por fases de MN Motor Hub — diagnóstico obligatorio antes de escribir código, reporte de hallazgos, confirmación explícita entre fases, y prohibiciones duras sobre migraciones y configuración. Usar al arrancar cualquier tarea de implementación, refactor, migración o corrección. También cuando el usuario pase el link o el nombre de una página de Notion como requerimiento.
---

# Protocolo de trabajo por fases

Este skill define **cómo** se trabaja en este repo. No define qué construir —
eso viene del requerimiento.

## Paso 0 — Identificar el repo y el requerimiento

**Confirmá en qué repo estás antes de tocar nada.** Los tres repos del proyecto
tienen nombres parecidos y estructuras distintas:

| Repo | Qué es | Estructura |
|---|---|---|
| `mn-motor-hub-backend` | API (Express + TypeORM + PostgreSQL) | `src/modules/` |
| `mn-motor-hub-frontend` | Panel interno (Next.js) | **con** `src/` |
| `mn-motor-hub-web` | Landing pública (Next.js) | **sin** `src/` — archivos en la raíz |

Si el requerimiento no dice explícitamente a qué repo apunta, **preguntá**.
Nunca lo deduzcas del contexto.

Si el usuario pasó un link o nombre de página de Notion, leelo con el MCP de
Notion antes de seguir. Ese es el requerimiento, no lo que recuerdes.

## Paso 1 — Diagnóstico (NO escribir código)

Antes de proponer nada, leé el código y respondé por escrito:

- ¿Qué existe hoy que resuelva o toque esto? Listá archivos y líneas.
- ¿Hay lógica duplicada, o no existe todavía y hay que crearla?
- ¿Qué contratos consume o rompe el cambio? Nombrá los callers.
- ¿Qué esquema de base está involucrado? ¿Hay filas reales en esas tablas?
- ¿Qué patrón ya usado en el repo hay que seguir (transacciones, auth,
  validación, seeds)?

**Reportá los hallazgos y esperá confirmación explícita.** No sigas a la
implementación en el mismo turno.

Si durante el diagnóstico encontrás que un supuesto del requerimiento es
falso, decilo. Un requerimiento equivocado detectado en diagnóstico cuesta un
mensaje; detectado después de implementar cuesta el trabajo entero.

## Paso 2 — Plan

Proponé el plan por fases numeradas. Cada fase tiene que ser commiteable por
separado. Marcá explícitamente cuáles tocan la base de datos.

Esperá confirmación antes de ejecutar.

## Paso 3 — Ejecución

Una fase por vez. Al cerrar cada una: `tsc --noEmit`, tests, commit.
Reportá y seguí con la siguiente.

**Backend antes que frontend, siempre.**

## Paso 4 — Camino de falla

Probar el camino feliz no es probar. Por cada operación con efectos:

- Forzá un error a mitad de la transacción y verificá el rollback.
- Verificá que no queden registros huérfanos en ninguna dirección.
- Si el test no falla contra la implementación anterior, no está probando nada.

---

# Prohibiciones duras

Estas no se negocian y no dependen del requerimiento:

- **Ninguna migración sin confirmación explícita previa.** Proponé el DDL,
  esperá el sí, después ejecutá.
- **Nunca levantar servidores.** Ni de desarrollo, ni para probar.
- **Nunca editar `.env`** ni pedir que se edite dentro del código.
- **Nunca modificar `tsconfig.json`** para silenciar errores de tipo.
- **Nunca mezclar repos en una sesión.** Si la tarea necesita tocar otro repo,
  decilo y frená — se abre una sesión aparte.
- **`export const dynamic = 'force-dynamic'` está prohibido** (repos Next).
  Usá `next: { revalidate: N }`, `revalidatePath()` / `revalidateTag()` tras
  mutaciones, o `cache: 'no-store'` solo cuando esté justificado.

---

# Criterios de diseño

Cosas que se aprendieron rompiéndolas. Aplicalas sin que te las pidan.

**Una carencia existente no es un estándar.** Si un flujo viejo no registra el
actor, no traza, o no valida, eso es un hueco — no un patrón a replicar en el
código nuevo. Señalalo y hacé lo correcto en lo nuevo.

**Los nombres tienen que decir la verdad.** Si un campo se llama
`factor_k_aplicado` pero guarda el K vigente al momento de vender y no el
embebido en el precio, el nombre miente. Renombralo o cambiá la semántica —
no dejes las dos cosas en desacuerdo.

**Los snapshots se congelan, no se recalculan.** Precio, costo y tasa de una
operación pasada se leen de la fila, nunca por JOIN al valor actual.

**Leé dentro de la transacción lo que vas a comparar dentro de la
transacción.** Un valor leído antes de abrir el queryRunner puede estar viejo
cuando escribís.

**Los valores de configuración se leen de `configuraciones`.** No se
hardcodean, no se aceptan por query param, y toda clave nueva necesita
validador registrado con rango. Una clave sin validador acepta cualquier
string.

**El actor de una operación se deriva de la sesión.** Nunca de input del
cliente.

---

# Convenciones

- Prompts y comunicación: **español**.
- Identificadores y comentarios de código: **inglés**.
- Strings de UI y contenido de negocio: **español**.
- Commits: uno por fase, mensaje descriptivo.

---

# Al cerrar la tarea

1. Reportá qué quedó hecho, con los hashes de commit.
2. Listá lo que quedó pendiente y por qué.
3. Si encontraste otras cosas desactualizadas o rotas fuera del alcance,
   **listalas sin tocarlas** y pedí confirmación aparte.
4. Si la tarea agregó un módulo, tabla, seed o script: **actualizá `CLAUDE.md`
   en el mismo commit**. No en una tarea futura.