'use client'; // estado del cálculo, del modal de confirmación y de la petición en vuelo

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Calculator, CheckCircle2 } from 'lucide-react';
import { Button } from '@mn/design-system/ui';
import { Modal } from '@/components/ui/Modal/Modal';
import {
  aplicarKAction,
  calcularKSugeridoAction,
} from '@/app/(dashboard)/configuracion/motor-de-precios/actions';
import { formatDate } from '@/lib/utils/format';
import type { KAplicado, KSugerido, SnapshotExcluido } from '@/types';
import styles from './KSugeridoPanel.module.css';

export function KSugeridoPanel() {
  const router = useRouter();

  const [resultado, setResultado] = useState<KSugerido | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [errorCalculo, setErrorCalculo] = useState<string | null>(null);

  const [confirmando, setConfirmando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [errorAplicar, setErrorAplicar] = useState<string | null>(null);
  // Confirmación instantánea de que el click funcionó. El resto del encabezado
  // —brechaImplicitaK, dentroDeBanda, proximaRevision— no viene en KAplicado y
  // llega con el refresh, que es visible y está bien: lo que no puede tardar es
  // ver que el K se aplicó.
  const [aplicado, setAplicado] = useState<KAplicado | null>(null);
  const [refrescando, startTransition] = useTransition();

  async function handleCalcular() {
    setCalculando(true);
    setErrorCalculo(null);
    setAplicado(null);

    const result = await calcularKSugeridoAction();
    if (result.ok) {
      setResultado(result.data);
    } else {
      setErrorCalculo(result.error);
      setResultado(null);
    }
    setCalculando(false);
  }

  async function handleAplicar() {
    if (resultado?.kSugerido == null) return;

    setAplicando(true);
    setErrorAplicar(null);

    const result = await aplicarKAction(resultado.kSugerido);
    if (result.ok) {
      setAplicado(result.data);
      setConfirmando(false);
      setResultado(null);
      startTransition(() => router.refresh());
    } else {
      setErrorAplicar(result.error);
    }
    setAplicando(false);
  }

  return (
    <section className={styles.panel} aria-label="Cálculo del factor K sugerido">
      <div className={styles.actionRow}>
        <Button variant="accent" type="button" onClick={handleCalcular} loading={calculando}>
          {!calculando && <Calculator size={16} aria-hidden="true" />}
          {calculando ? 'Calculando…' : 'Calcular K sugerido'}
        </Button>
      </div>

      {errorCalculo && (
        <p className={styles.error} role="alert">
          {errorCalculo}
        </p>
      )}

      {aplicado && (
        <div className={styles.applied} role="status">
          <CheckCircle2 size={16} aria-hidden="true" className={styles.appliedIcon} />
          <span>
            Factor K aplicado: <strong>{aplicado.factorReposicionCambiaria.toFixed(2)}</strong>.
            Revisión registrada el {formatDate(aplicado.ultimaRevisionK)}.
            {refrescando ? ' Actualizando el resto del encabezado…' : ''}
          </span>
        </div>
      )}

      {resultado && <Desglose resultado={resultado} onAplicar={() => setConfirmando(true)} />}

      {resultado?.kSugerido != null && (
        <Modal
          open={confirmando}
          onOpenChange={(v) => {
            if (!v && !aplicando) {
              setConfirmando(false);
              setErrorAplicar(null);
            }
          }}
          title="Aplicar factor K"
          size="sm"
        >
          <div className={styles.confirmBody}>
            <p className={styles.confirmText}>
              El factor de reposición cambiaria pasa de{' '}
              <strong>{resultado.kActual.toFixed(2)}</strong> a{' '}
              <strong>{resultado.kSugerido.toFixed(2)}</strong>.
            </p>

            <p className={styles.confirmDelta}>
              <span className={styles.confirmDeltaFrom}>K {resultado.kActual.toFixed(2)}</span>
              <span aria-hidden="true">→</span>
              <span className={styles.confirmDeltaTo}>K {resultado.kSugerido.toFixed(2)}</span>
            </p>

            {resultado.variacionPctCatalogo != null && (
              <p className={styles.confirmImpact}>
                Los precios sugeridos del catálogo se mueven{' '}
                <strong>{formatVariacion(resultado.variacionPctCatalogo)}</strong>.
              </p>
            )}

            <p className={styles.confirmNote}>
              Afecta los precios sugeridos de acá en adelante. No se deshace con un click:
              para volver atrás hay que aplicar el valor anterior a mano.
            </p>

            {errorAplicar && (
              <p className={styles.error} role="alert">
                {errorAplicar}
              </p>
            )}

            <div className={styles.confirmActions}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirmando(false);
                  setErrorAplicar(null);
                }}
                disabled={aplicando}
              >
                Cancelar
              </Button>
              <Button variant="accent" type="button" onClick={handleAplicar} loading={aplicando}>
                {aplicando ? 'Aplicando…' : `Aplicar K ${resultado.kSugerido.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

/** El desglose aritmético completo, no solo el número final. */
function Desglose({
  resultado,
  onAplicar,
}: {
  resultado: KSugerido;
  onAplicar: () => void;
}) {
  const { brechaMediana, kSugerido, muestraSuficiente } = resultado;

  return (
    <div className={styles.desglose}>
      <dl className={styles.pasos}>
        <div className={styles.paso}>
          <dt className={styles.pasoLabel}>Brecha mediana</dt>
          <dd className={styles.pasoValue}>
            {brechaMediana != null ? `${brechaMediana.toFixed(2)}%` : 'Sin dato'}
          </dd>
          <dd className={styles.pasoHint}>
            Método: {resultado.metodo} · {resultado.diasUsados} día
            {resultado.diasUsados !== 1 ? 's' : ''} usado
            {resultado.diasUsados !== 1 ? 's' : ''} de una ventana objetivo de{' '}
            {resultado.diasObjetivo}
          </dd>
        </div>

        {brechaMediana != null && (
          <div className={styles.paso}>
            <dt className={styles.pasoLabel}>Fórmula</dt>
            <dd className={styles.pasoValue}>
              1 + {brechaMediana.toFixed(2)} / 100 = {(1 + brechaMediana / 100).toFixed(4)}
            </dd>
            <dd className={styles.pasoHint}>K cubre la brecha que la mediana describe</dd>
          </div>
        )}

        {kSugerido != null && (
          <div className={styles.paso}>
            <dt className={styles.pasoLabel}>Redondeo</dt>
            <dd className={styles.pasoValue}>K = {kSugerido.toFixed(2)}</dd>
            <dd className={styles.pasoHint}>
              A 2 decimales, que es lo que acepta la configuración
            </dd>
          </div>
        )}

        <div className={styles.paso}>
          <dt className={styles.pasoLabel}>K actual</dt>
          <dd className={styles.pasoValue}>{resultado.kActual.toFixed(2)}</dd>
          <dd className={styles.pasoHint}>
            Banda objetivo {resultado.bandaObjetivo.min}% – {resultado.bandaObjetivo.max}% (centro{' '}
            {resultado.bandaObjetivo.centro}%)
          </dd>
        </div>
      </dl>

      {/*
        El recorte no puede pasar en silencio: sin este aviso la aritmética de
        arriba no cierra con el K sugerido y parece un error de cálculo.
      */}
      {resultado.fueraDeRangoValido && (
        <p className={styles.warning}>
          <AlertTriangle size={14} aria-hidden="true" />
          <span>
            El valor calculado cayó fuera del rango válido de K y se recortó al límite más
            cercano. Por eso no coincide exactamente con la fórmula de arriba.
          </span>
        </p>
      )}

      {resultado.snapshotsExcluidos.length > 0 && (
        <SnapshotsExcluidos excluidos={resultado.snapshotsExcluidos} />
      )}

      {muestraSuficiente && kSugerido != null ? (
        <div className={styles.aplicarRow}>
          {resultado.variacionPctCatalogo != null && (
            <p className={styles.impacto}>
              Aplicarlo mueve los precios sugeridos del catálogo{' '}
              <strong>{formatVariacion(resultado.variacionPctCatalogo)}</strong>.
            </p>
          )}
          <Button variant="accent" type="button" onClick={onAplicar}>
            Aplicar K {kSugerido.toFixed(2)}
          </Button>
        </div>
      ) : (
        /*
          Muestra insuficiente NO es un error ni un botón deshabilitado sin
          explicación: es el estado normal mientras se junta historial.
          El mínimo exacto de días vive en el backend y no viene en la
          respuesta, así que el copy habla de lo que sí sabemos —días usados
          contra la ventana objetivo— en vez de hardcodear un número que
          puede desincronizarse.
        */
        <p className={styles.insuficiente}>
          Con {resultado.diasUsados} día{resultado.diasUsados !== 1 ? 's' : ''} de historial
          válido todavía no alcanza para sugerir un valor confiable — con tan pocos puntos un
          solo día raro mueve la mediana entera. El cálculo apunta a una ventana de{' '}
          {resultado.diasObjetivo} días: volvé a intentar en unos días.
          {brechaMediana != null && (
            <>
              {' '}
              Mientras tanto, la mediana provisoria es {brechaMediana.toFixed(2)}%.
            </>
          )}
        </p>
      )}
    </div>
  );
}

/** Por qué el cálculo descartó días — si no se dice, "3 días usados" no se entiende. */
function SnapshotsExcluidos({ excluidos }: { excluidos: SnapshotExcluido[] }) {
  const sinBrecha = excluidos.filter((e) => e.motivo === 'sin_brecha').length;
  const preFix = excluidos.filter((e) => e.motivo === 'pre_fix').length;

  return (
    <details className={styles.excluidos}>
      <summary className={styles.excluidosSummary}>
        {excluidos.length} día{excluidos.length !== 1 ? 's' : ''} excluido
        {excluidos.length !== 1 ? 's' : ''} de la muestra
      </summary>
      <ul className={styles.excluidosList}>
        {sinBrecha > 0 && (
          <li>
            <strong>{sinBrecha}</strong> sin brecha calculable: o el P2P no respondió ese día, o
            la tasa BCV venía vencida.
          </li>
        )}
        {preFix > 0 && (
          <li>
            <strong>{preFix}</strong> anteriores al fix del scraper BCV: no se sabe de cuándo era
            la tasa con la que se calculó su brecha.
          </li>
        )}
      </ul>
    </details>
  );
}

/** "+3,20%" / "−1,50%" — el signo importa más que el número. */
function formatVariacion(pct: number): string {
  const signo = pct > 0 ? '+' : '';
  return `${signo}${pct.toFixed(2)}%`;
}
