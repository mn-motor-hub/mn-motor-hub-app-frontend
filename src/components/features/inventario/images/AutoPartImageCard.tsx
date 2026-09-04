'use client'; // Estado de acciones en vuelo, modal de confirmación y drag

import { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImageOff,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react';
import { Badge, Button } from '@mn/design-system/ui';
import { Modal } from '@/components/ui/Modal/Modal';
import type { AutoPartImage } from '@/types';
import styles from './AutoPartImageCard.module.css';

const MAX_BYTES = 10 * 1024 * 1024;
const MIMES = ['image/png', 'image/jpeg', 'image/webp'];

export interface AutoPartImageCardProps {
  imagen: AutoPartImage;
  posicion: number;
  total: number;
  /** Deshabilita todo mientras otra card está resolviendo algo. */
  bloqueado: boolean;
  onPatch: (cambios: Partial<AutoPartImage>) => Promise<void>;
  onReemplazar: (archivo: File) => Promise<void>;
  onEliminar: () => Promise<void>;
  onMover: (direccion: -1 | 1) => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  arrastrando: boolean;
}

export function AutoPartImageCard({
  imagen,
  posicion,
  total,
  bloqueado,
  onPatch,
  onReemplazar,
  onEliminar,
  onMover,
  onDragStart,
  onDragOver,
  onDragEnd,
  arrastrando,
}: AutoPartImageCardProps) {
  const [enVuelo, setEnVuelo] = useState<string | null>(null);
  const [confirmarReemplazo, setConfirmarReemplazo] = useState(false);
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // El derivado de catálogo es lo que ve el cliente; si no existe todavía, el
  // master firmado alcanza para que el panel muestre de qué imagen se trata.
  const miniatura = imagen.catalogoUrl ?? imagen.masterUrl;
  const ocupado = bloqueado || enVuelo !== null;

  async function correr(clave: string, accion: () => Promise<void>) {
    setEnVuelo(clave);
    try {
      await accion();
    } finally {
      setEnVuelo(null);
    }
  }

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!f) return;

    if (!MIMES.includes(f.type)) {
      setErrorArchivo('Formato no permitido. Debe ser PNG, JPG o WEBP.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrorArchivo(`Excede los 10 MB (${(f.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    setErrorArchivo(null);
    setArchivoNuevo(f);
    setConfirmarReemplazo(true);
  }

  return (
    <li
      className={[
        styles.card,
        imagen.activo ? '' : styles.inactiva,
        arrastrando ? styles.arrastrando : '',
      ]
        .filter(Boolean)
        .join(' ')}
      draggable={!ocupado}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => e.preventDefault()}
    >
      <div className={styles.thumbWrap}>
        {miniatura ? (
          /* eslint-disable-next-line @next/next/no-img-element --
             next/image no sirve acá: masterUrl es una URL firmada que expira a
             los 300 s y lleva el token en el query string, así que el
             optimizador generaría una entrada nueva por cada refresco y
             cachearía links ya muertos. */
          <img src={miniatura} alt={`Imagen ${posicion} del repuesto`} className={styles.thumb} />
        ) : (
          <div className={styles.sinImagen}>
            <ImageOff size={22} aria-hidden="true" />
            <span>Sin vista previa</span>
          </div>
        )}

        <span className={styles.handle} aria-hidden="true" title="Arrastrar para reordenar">
          <GripVertical size={16} />
        </span>
        <span className={styles.posicion}>{posicion}</span>
      </div>

      <div className={styles.cuerpo}>
        <div className={styles.badges}>
          {imagen.esPrincipal && <Badge variant="success">Portada</Badge>}
          {!imagen.activo && <Badge variant="neutral">Inactiva</Badge>}
          {imagen.catalogoUrl === null && imagen.destinoCatalogo && (
            <Badge variant="warning">Sin derivado</Badge>
          )}
        </div>

        <div className={styles.toggles}>
          <Toggle
            activo={imagen.activo}
            disabled={ocupado}
            cargando={enVuelo === 'activo'}
            onClick={() => correr('activo', () => onPatch({ activo: !imagen.activo }))}
          >
            Activa
          </Toggle>
          <Toggle
            activo={imagen.destinoCatalogo}
            disabled={ocupado}
            cargando={enVuelo === 'catalogo'}
            onClick={() =>
              correr('catalogo', () => onPatch({ destinoCatalogo: !imagen.destinoCatalogo }))
            }
          >
            Catálogo
          </Toggle>
          <Toggle
            activo={imagen.destinoMercadoLibre}
            disabled={ocupado}
            cargando={enVuelo === 'ml'}
            onClick={() =>
              correr('ml', () => onPatch({ destinoMercadoLibre: !imagen.destinoMercadoLibre }))
            }
          >
            Mercado Libre
          </Toggle>
        </div>

        <div className={styles.acciones}>
          <Button
            variant="ghost"
            size="md"
            disabled={ocupado || imagen.esPrincipal || !imagen.activo}
            loading={enVuelo === 'principal'}
            // Una imagen inactiva no puede ser portada: el backend le quita el
            // flag igual, así que ofrecerlo sería una acción que no hace nada.
            title={
              imagen.activo
                ? 'Marcar como portada'
                : 'Activá la imagen para poder marcarla como portada'
            }
            onClick={() => correr('principal', () => onPatch({ esPrincipal: true }))}
          >
            <Star size={14} aria-hidden="true" /> Portada
          </Button>

          <Button
            variant="ghost"
            size="md"
            disabled={ocupado}
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCw size={14} aria-hidden="true" /> Reemplazar
          </Button>

          <Button
            variant="ghost"
            size="md"
            disabled={ocupado || !imagen.activo}
            loading={enVuelo === 'eliminar'}
            // Sin modal: es baja lógica y se revierte con el toggle "Activa".
            title={imagen.activo ? 'Dar de baja' : 'Ya está dada de baja'}
            onClick={() => correr('eliminar', onEliminar)}
          >
            <Trash2 size={14} aria-hidden="true" /> Eliminar
          </Button>
        </div>

        {errorArchivo && (
          <p className={styles.error} role="alert">
            {errorArchivo}
          </p>
        )}

        {/* El drag nativo no dispara en touch: estos botones son la única forma
            de reordenar desde un teléfono, y además dan acceso por teclado. */}
        <div className={styles.mover}>
          <button
            type="button"
            className={styles.moverBtn}
            aria-label="Mover antes"
            disabled={ocupado || posicion === 1}
            onClick={() => onMover(-1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.moverBtn}
            aria-label="Mover después"
            disabled={ocupado || posicion === total}
            onClick={() => onMover(1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className={styles.inputOculto}
        onChange={elegirArchivo}
      />

      <Modal
        open={confirmarReemplazo}
        onOpenChange={(abierto) => {
          setConfirmarReemplazo(abierto);
          if (!abierto) setArchivoNuevo(null);
        }}
        title="Reemplazar el original"
        description="Esta acción pisa el archivo original en el almacenamiento y no se puede deshacer. El archivo anterior no queda recuperable."
        size="sm"
      >
        <div className={styles.modalBody}>
          <p className={styles.modalArchivo}>
            Nuevo archivo: <strong>{archivoNuevo?.name}</strong>
          </p>
          <p className={styles.modalNota}>
            Si la imagen va al catálogo, su versión con marca de agua se regenera en el momento.
          </p>
          <div className={styles.modalAcciones}>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmarReemplazo(false);
                setArchivoNuevo(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={enVuelo === 'reemplazar'}
              onClick={async () => {
                if (!archivoNuevo) return;
                await correr('reemplazar', () => onReemplazar(archivoNuevo));
                setConfirmarReemplazo(false);
                setArchivoNuevo(null);
              }}
            >
              Reemplazar
            </Button>
          </div>
        </div>
      </Modal>
    </li>
  );
}

interface ToggleProps {
  activo: boolean;
  disabled: boolean;
  cargando: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * No hay switch en el design system ni en components/ui. Un button con
 * aria-pressed da el estado a lectores de pantalla y funciona con tap y con
 * teclado sin depender de hover.
 */
function Toggle({ activo, disabled, cargando, onClick, children }: ToggleProps) {
  return (
    <button
      type="button"
      className={[styles.toggle, activo ? styles.toggleOn : ''].filter(Boolean).join(' ')}
      aria-pressed={activo}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={styles.toggleDot} aria-hidden="true" />
      {children}
      {cargando && <span className={styles.toggleSpinner} aria-hidden="true" />}
    </button>
  );
}
