'use client'; // Drag & drop, subida de archivos y refresco por foco de ventana

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2 } from 'lucide-react';
import {
  deleteAutoPartImageAction,
  patchAutoPartImageAction,
  reorderAutoPartImagesAction,
  replaceAutoPartImageAction,
  uploadAutoPartImageAction,
} from '@/app/(dashboard)/inventario/actions';
import type { AutoPartImage } from '@/types';
import { AutoPartImageCard } from './AutoPartImageCard';
import styles from './AutoPartImagesSection.module.css';

const MAX_BYTES = 10 * 1024 * 1024;
const MIMES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Las masterUrl viven 300 s. Se refresca al volver a la pestaña, pero no en
 * cada alt-tab: por debajo de este umbral las URLs siguen siendo válidas y
 * volver a pedir la lista sería puro ruido.
 */
const MS_ENTRE_REFRESCOS = 60_000;

export interface AutoPartImagesSectionProps {
  autoPartId: number;
  imagenes: AutoPartImage[];
}

export function AutoPartImagesSection({ autoPartId, imagenes }: AutoPartImagesSectionProps) {
  const router = useRouter();

  // Copia local para que reordenar se vea al instante. Se resincroniza cuando
  // el Server Component trae datos nuevos — ajustando el estado durante el
  // render, no en un efecto, para no encadenar un render de más.
  const firma = firmaDe(imagenes);
  const [firmaPrevia, setFirmaPrevia] = useState(firma);
  const [lista, setLista] = useState(imagenes);
  if (firma !== firmaPrevia) {
    setFirmaPrevia(firma);
    setLista(imagenes);
  }

  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [sobreDropzone, setSobreDropzone] = useState(false);
  const [arrastrando, setArrastrando] = useState<number | null>(null);

  // Destinos con los que se crea la imagen nueva. Se eligen ANTES de subir
  // porque el derivado se genera en esa misma request: subir con el catálogo
  // apagado y prenderlo después obliga a una segunda pasada por el backend.
  const [nuevaAlCatalogo, setNuevaAlCatalogo] = useState(true);
  const [nuevaAMercadoLibre, setNuevaAMercadoLibre] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  // Arranca en 0 y se fija al montar: Date.now() durante el render es impuro y
  // devolvería un valor distinto en cada re-render.
  const ultimoRefresco = useRef(0);

  const refrescar = useCallback(() => {
    ultimoRefresco.current = Date.now();
    router.refresh();
  }, [router]);

  // Al volver a la pestaña, las URLs firmadas pueden haber vencido mientras no
  // se miraba. El Server Component las pide con no-store, así que un refresh
  // alcanza para tener links nuevos.
  useEffect(() => {
    // El Server Component acaba de traer URLs frescas: este es el punto cero.
    ultimoRefresco.current = Date.now();

    function alVolver() {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - ultimoRefresco.current < MS_ENTRE_REFRESCOS) return;
      ultimoRefresco.current = Date.now();
      router.refresh();
    }

    window.addEventListener('focus', alVolver);
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.removeEventListener('focus', alVolver);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [router]);

  async function ejecutar<T>(accion: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>) {
    setError(null);
    setOcupado(true);
    try {
      const res = await accion();
      if (!res.ok) {
        setError(res.error);
        // Se vuelve a pedir igual: el estado local puede haber quedado
        // adelantado respecto del servidor (por ejemplo tras un reorden fallido).
        refrescar();
        return;
      }
      refrescar();
    } finally {
      setOcupado(false);
    }
  }

  function validar(archivo: File): string | null {
    if (!MIMES.includes(archivo.type)) return 'Formato no permitido. Debe ser PNG, JPG o WEBP.';
    if (archivo.size > MAX_BYTES)
      return `Excede los 10 MB (${(archivo.size / 1024 / 1024).toFixed(1)} MB).`;
    return null;
  }

  async function subir(archivo: File) {
    const invalido = validar(archivo);
    if (invalido) {
      setError(invalido);
      return;
    }
    setSubiendo(true);
    try {
      await ejecutar(() =>
        uploadAutoPartImageAction(autoPartId, archivo, {
          destinoCatalogo: nuevaAlCatalogo,
          destinoMercadoLibre: nuevaAMercadoLibre,
        }),
      );
    } finally {
      setSubiendo(false);
    }
  }

  async function guardarOrden(nuevo: AutoPartImage[]) {
    setLista(nuevo);
    await ejecutar(() =>
      reorderAutoPartImagesAction(
        autoPartId,
        nuevo.map((i) => i.id),
      ),
    );
  }

  function mover(indice: number, direccion: -1 | 1) {
    const destino = indice + direccion;
    if (destino < 0 || destino >= lista.length) return;
    const nuevo = [...lista];
    const [movida] = nuevo.splice(indice, 1);
    if (!movida) return;
    nuevo.splice(destino, 0, movida);
    void guardarOrden(nuevo);
  }

  function alPasarPorEncima(indiceDestino: number) {
    if (arrastrando === null || arrastrando === indiceDestino) return;
    const nuevo = [...lista];
    const [movida] = nuevo.splice(arrastrando, 1);
    if (!movida) return;
    nuevo.splice(indiceDestino, 0, movida);
    setArrastrando(indiceDestino);
    setLista(nuevo);
  }

  return (
    <div className={styles.seccion}>
      {error && (
        <p className={styles.errorGlobal} role="alert">
          {error}
        </p>
      )}

      {lista.length === 0 ? (
        <p className={styles.vacio}>
          Este repuesto todavía no tiene imágenes. Subí la primera para que aparezca en el catálogo.
        </p>
      ) : (
        <ul className={styles.grilla}>
          {lista.map((imagen, indice) => (
            <AutoPartImageCard
              key={imagen.id}
              imagen={imagen}
              posicion={indice + 1}
              total={lista.length}
              bloqueado={ocupado}
              arrastrando={arrastrando === indice}
              onPatch={async (cambios) => {
                await ejecutar(() => patchAutoPartImageAction(autoPartId, imagen.id, cambios));
              }}
              onReemplazar={async (archivo) => {
                await ejecutar(() =>
                  replaceAutoPartImageAction(autoPartId, imagen.id, archivo),
                );
              }}
              onEliminar={async () => {
                await ejecutar(() => deleteAutoPartImageAction(autoPartId, imagen.id));
              }}
              onMover={(direccion) => mover(indice, direccion)}
              onDragStart={() => setArrastrando(indice)}
              onDragOver={() => alPasarPorEncima(indice)}
              onDragEnd={() => {
                setArrastrando(null);
                void guardarOrden(lista);
              }}
            />
          ))}
        </ul>
      )}

      {/* Fuera del <label> del dropzone a propósito: adentro, tocar un check
          abriría además el selector de archivos. */}
      <fieldset className={styles.destinos} disabled={subiendo || ocupado}>
        <legend className={styles.destinosLegend}>Destinos de la imagen nueva</legend>
        <label className={styles.destino}>
          <input
            type="checkbox"
            checked={nuevaAlCatalogo}
            onChange={(e) => setNuevaAlCatalogo(e.target.checked)}
          />
          Catálogo
        </label>
        <label className={styles.destino}>
          <input
            type="checkbox"
            checked={nuevaAMercadoLibre}
            onChange={(e) => setNuevaAMercadoLibre(e.target.checked)}
          />
          Mercado Libre
        </label>
      </fieldset>

      <label
        className={[styles.dropzone, sobreDropzone ? styles.dropzoneActiva : '']
          .filter(Boolean)
          .join(' ')}
        onDragOver={(e) => {
          // Solo un archivo del sistema activa la zona: arrastrar una card para
          // reordenar no trae `Files` y no debe encenderla.
          if (!e.dataTransfer.types.includes('Files')) return;
          e.preventDefault();
          setSobreDropzone(true);
        }}
        onDragLeave={() => setSobreDropzone(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setSobreDropzone(false);
          const archivo = e.dataTransfer.files[0];
          if (archivo) void subir(archivo);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          className={styles.inputOculto}
          disabled={subiendo || ocupado}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = '';
            if (archivo) void subir(archivo);
          }}
        />
        {subiendo ? (
          <>
            <Loader2 size={20} className={styles.spinner} aria-hidden="true" />
            <span className={styles.dropzoneLabel}>Subiendo y generando la versión de catálogo…</span>
            <span className={styles.dropzoneHint}>Puede tardar unos segundos.</span>
          </>
        ) : (
          <>
            <ImagePlus size={20} aria-hidden="true" />
            <span className={styles.dropzoneLabel}>Agregar imagen</span>
            <span className={styles.dropzoneHint}>
              PNG, JPG o WEBP — máximo 10 MB. Ya procesada: acá no se recorta ni se edita.
            </span>
          </>
        )}
      </label>
    </div>
  );
}

/** Todo lo que la UI dibuja: si cambia algo de esto, hay que resincronizar. */
function firmaDe(imagenes: AutoPartImage[]): string {
  return imagenes
    .map((i) =>
      [
        i.id,
        i.orden,
        i.activo,
        i.esPrincipal,
        i.destinoCatalogo,
        i.destinoMercadoLibre,
        i.catalogoUrl,
        i.masterUrl,
      ].join('|'),
    )
    .join('~');
}
