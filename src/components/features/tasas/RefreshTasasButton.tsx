'use client'; // estado de la petición en vuelo y del resultado del último refresco

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@mn/design-system/ui';
import { refreshTasasAction } from '@/app/(dashboard)/tasas/actions';
import type { TasaFetchFallo, TasaFetchResult } from '@/types';
import styles from './RefreshTasasButton.module.css';

/** Nombre presentable de cada fuente de fetch. */
const NOMBRE_FUENTE: Record<string, string> = {
  BCV: 'BCV',
  BINANCE: 'Binance',
};

type Resultado = {
  tono: 'exito' | 'parcial' | 'error';
  titulo: string;
  detalles: string[];
};

/**
 * Un fallo por FUENTE, no por tasa.
 *
 * `fallos` viene con una entrada por tasa: el BCV sirve USD y EUR en un solo
 * request, así que cuando se cae aparece DOS veces, con el mismo código y el
 * mismo motivo. Sin deduplicar, el mensaje dice "BCV falló, BCV falló" y hace
 * pensar que son dos problemas distintos.
 *
 * Se agrupa por `fuenteFetch` y no por `providerId` justamente por eso. El
 * fallback a `providerId` cubre una fila de `tasas` con un provider que el
 * backend ya no mapea a ninguna fuente: ahí no hay agrupación posible, pero
 * tampoco se puede tragar el fallo.
 */
function fallosPorFuente(fallos: TasaFetchFallo[]): Map<string, TasaFetchFallo> {
  const porFuente = new Map<string, TasaFetchFallo>();
  for (const fallo of fallos) {
    const key = fallo.fuenteFetch ?? fallo.providerId;
    if (!porFuente.has(key)) porFuente.set(key, fallo);
  }
  return porFuente;
}

/**
 * Qué decir después del click.
 *
 * El backend responde 200 con `meta.fallos` incluso cuando alguna fuente se
 * cayó: 2 de 3 actualizadas es trabajo hecho, no un fallo de la request. Pero
 * refrescar la pantalla sin decir nada deja al usuario viendo "listo" sobre una
 * tasa que sigue vieja — que es el mismo silencio que dejó pasar la caída del
 * scraper.
 *
 * El conteo se saca de las tasas automáticas con provider, que son las que el
 * refresco intenta. El clamp cubre el borde de una tasa desactivada que falla:
 * queda en `fallos` pero no en la lista, que solo trae las activas.
 */
function resultadoDe({ tasas, fallos }: TasaFetchResult): Resultado {
  const intentadas = tasas.filter((t) => t.tipo === 'automatica' && t.providerId != null).length;
  const porFuente = fallosPorFuente(fallos);

  const detalles = [...porFuente.values()].map((fallo) => {
    const fuente = NOMBRE_FUENTE[fallo.fuenteFetch ?? ''] ?? fallo.providerId;
    return `${fuente}: ${fallo.errorMotivo || fallo.errorCodigo}`;
  });

  if (fallos.length === 0) {
    return {
      tono: 'exito',
      titulo:
        intentadas === 1 ? 'Tasa actualizada.' : `${intentadas} tasas actualizadas.`,
      detalles: [],
    };
  }

  const actualizadas = Math.max(0, intentadas - fallos.length);
  const nombres = [...porFuente.values()]
    .map((f) => NOMBRE_FUENTE[f.fuenteFetch ?? ''] ?? f.providerId)
    .join(' y ');

  // Ninguna se actualizó: no es un éxito parcial, y decirlo en tono de aviso
  // suave haría pensar que algo se trajo.
  if (actualizadas === 0) {
    return { tono: 'error', titulo: `No se pudo actualizar ninguna tasa. Falló ${nombres}.`, detalles };
  }

  return {
    tono: 'parcial',
    titulo: `${actualizadas} de ${intentadas} actualizadas. Falló ${nombres}.`,
    detalles,
  };
}

/**
 * Dispara el scrapeo en vivo. Solo desde este click: la pantalla se carga de la
 * base, que es instantáneo, y llamar al fetch en el montaje metería hasta 25 s
 * en el camino del usuario además de martillar al BCV desde una sola IP.
 *
 * El botón queda deshabilitado durante toda la operación —que puede llegar a
 * esos 25 s si una fuente está caída— para que no se acumulen scrapeos.
 */
export function RefreshTasasButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  // El refresh del Server Component también cuenta como "en curso": sin esto el
  // botón se rehabilita antes de que aparezcan los valores nuevos.
  const [isPending, startTransition] = useTransition();

  const inFlight = busy || isPending;

  async function handleClick() {
    setBusy(true);
    setResultado(null);

    const result = await refreshTasasAction();

    if (result.ok) {
      setResultado(resultadoDe(result.data));
      startTransition(() => router.refresh());
    } else {
      setResultado({ tono: 'error', titulo: result.error, detalles: [] });
    }
    setBusy(false);
  }

  return (
    <div className={styles.wrapper}>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={handleClick}
        loading={inFlight}
        aria-label="Actualizar las tasas desde las fuentes ahora"
      >
        {!inFlight && <RefreshCw size={14} aria-hidden="true" />}
        {inFlight ? 'Consultando fuentes…' : 'Actualizar tasas ahora'}
      </Button>

      {inFlight && (
        <p className={styles.hint} role="status">
          Puede tardar hasta 25 s si una fuente no responde.
        </p>
      )}

      {resultado && !inFlight && (
        <div
          className={styles[resultado.tono]}
          role={resultado.tono === 'exito' ? 'status' : 'alert'}
        >
          <p className={styles.resultadoTitulo}>{resultado.titulo}</p>
          {/* El motivo va una vez por fuente, no una por tasa. */}
          {resultado.detalles.map((detalle) => (
            <p key={detalle} className={styles.resultadoDetalle}>
              {detalle}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
