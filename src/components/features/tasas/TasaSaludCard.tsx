import { Badge } from '@mn/design-system/ui';
import { formatBs, formatBusinessDay, formatDateTime, formatTimeAgo } from '@/lib/utils/format';
import type { TasaSalud } from '@/types';
import styles from './TasaSaludCard.module.css';

interface TasaSaludCardProps {
  salud: TasaSalud;
}

type Estado = {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
};

/**
 * El semáforo se calcula entero en el frontend a partir de los campos de
 * GET /api/tasas/salud — el backend no devuelve un "estado" y no hace falta
 * que lo haga.
 *
 * El orden de los casos es la severidad, y `requiereAtencion` va primero a
 * propósito: es el único campo que dice "esto no se arregla solo". Un fallo
 * determinista —los certificados que el build no copió, el parser roto— lo
 * marca desde el PRIMER intento, cuando la tasa todavía no está vencida y la
 * racha es de 1. Sin este caso se pintaba igual que un fallo transitorio que se
 * cura en 15 minutos, que es exactamente cómo una caída pasa desapercibida.
 */
function estadoDe(salud: TasaSalud): Estado {
  // Una tasa manual no depende de un scraper: no tiene sentido decir que está
  // desactualizada ni que está fallando.
  if (salud.tipo === 'manual') return { label: 'Manual', variant: 'neutral' };
  if (salud.requiereAtencion) return { label: 'Requiere revisión', variant: 'danger' };
  if (salud.stale) return { label: 'Desactualizada', variant: 'danger' };
  if (salud.fallosConsecutivos > 0) return { label: 'Fallando', variant: 'warning' };
  return { label: 'Al día', variant: 'success' };
}

/**
 * Antigüedad del último éxito con los números que ya calculó el backend, no con
 * formatTimeAgo: son los que alimentan la alarma —los días redondean hacia
 * ARRIBA a propósito, porque un piso subestima justo lo que se quiere ver: 47 h
 * eran "1 día"— y no dependen del reloj del navegador. Calcularla de nuevo acá
 * haría que la misma fecha se lea "hace 1 día" en un lado y "2 días" en el otro.
 *
 * null cuando nunca hubo un éxito, que es el mismo caso en que `ultimoExito` es
 * null: los tres campos salen del mismo dato en el backend.
 */
function antiguedadDelExito(salud: TasaSalud): string | null {
  const { horasSinActualizar: horas, diasSinActualizar: dias } = salud;
  if (horas == null || dias == null) return null;
  if (horas < 1) return 'hace menos de 1 h';
  if (horas < 48) return `hace ${horas} h`;
  return `hace ${dias} día${dias !== 1 ? 's' : ''}`;
}

export function TasaSaludCard({ salud }: TasaSaludCardProps) {
  const estado = estadoDe(salud);
  const antiguedad = antiguedadDelExito(salud);
  const esAutomatica = salud.tipo === 'automatica';
  const hayFallos = salud.fallosConsecutivos > 0;
  const hayAviso = hayFallos || salud.requiereAtencion;

  return (
    <article
      className={`${styles.card} ${styles[estado.variant]}`}
      aria-label={`${salud.label}: ${estado.label}`}
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <h3 className={styles.label}>{salud.label}</h3>
          <span className={styles.clave}>{salud.clave}</span>
        </div>
        <Badge variant={estado.variant}>{estado.label}</Badge>
      </header>

      <p className={styles.valor}>
        {salud.valorEfectivo != null ? formatBs(salud.valorEfectivo) : 'Sin valor'}
      </p>

      {/*
        El día de negocio para el que rige la tasa, según lo publica la fuente.
        Responde una pregunta que la antigüedad de abajo no puede responder: una
        tasa traída "hace 23 h" puede ser la de hoy publicada anoche —correcta—
        o una que quedó vieja. Las dos líneas conviven porque son dos preguntas
        distintas: qué tasa es esta, y hace cuánto que no traemos nada.

        Sin fechaValor no se muestra NADA acá. null es "no se sabe" y nunca
        "hoy": Binance no publica fecha valor —es precio de mercado vivo—, las
        manuales tampoco, y las filas viejas la tienen en null hasta el primer
        fetch con el backend que la trae. Inventar "hoy" afirmaría que una tasa
        vieja es la del día, que es peor que el bug original: no se nota.
      */}
      {salud.fechaValor && (
        <p className={styles.fechaValor}>
          Tasa oficial del <strong>{formatBusinessDay(salud.fechaValor)}</strong>
        </p>
      )}

      {/*
        Un override manual sobre una tasa automática: sin decirlo se ve idéntica
        a una sin override, y el scraper puede estar refrescando en silencio un
        valor que nadie usa. El automático no se muestra porque /salud no lo
        trae — solo el efectivo y el manual.
      */}
      {esAutomatica && salud.valorManual != null && (
        <p className={styles.override}>
          Valor fijado a mano. El scraper sigue actualizando el automático, que no
          se está usando.
        </p>
      )}

      {/*
        ultimoExito y ultimoIntento van siempre separados y nunca colapsados en
        un solo "última actualización": el job puede seguir intentando mientras
        el último éxito queda clavado días atrás, y con un solo campo ese
        problema es invisible. Es la razón de ser de esta pantalla.
      */}
      <dl className={styles.timestamps}>
        <div className={styles.timestamp}>
          <dt className={styles.timestampLabel}>Último éxito</dt>
          <dd className={styles.timestampValue}>
            {salud.ultimoExito && antiguedad ? (
              <>
                <span className={styles.relative}>{antiguedad}</span>
                <span className={styles.absolute}>{formatDateTime(salud.ultimoExito)}</span>
              </>
            ) : (
              <span className={styles.never}>Nunca</span>
            )}
          </dd>
        </div>

        <div className={styles.timestamp}>
          <dt className={styles.timestampLabel}>Último intento</dt>
          <dd className={styles.timestampValue}>
            {salud.ultimoIntento ? (
              <>
                <span className={styles.relative}>{formatTimeAgo(salud.ultimoIntento)}</span>
                <span className={styles.absolute}>{formatDateTime(salud.ultimoIntento)}</span>
              </>
            ) : (
              <span className={styles.never}>Nunca</span>
            )}
          </dd>
        </div>
      </dl>

      {hayAviso && (
        <div className={salud.requiereAtencion ? styles.failure : styles.failureSoft}>
          {salud.requiereAtencion && (
            <p className={styles.failureHeadline}>
              No se va a arreglar solo — necesita que alguien lo revise.
            </p>
          )}

          {hayFallos && (
            <p className={styles.failureCount}>
              {/*
                `fallosConsecutivos` es un PISO cuando la racha llegó al techo de
                filas que el backend mira hacia atrás: sin el "al menos", un 200
                se lee como un número exacto.
              */}
              {salud.rachaTruncada && 'Al menos '}
              {salud.fallosConsecutivos} intento{salud.fallosConsecutivos !== 1 ? 's' : ''} seguido
              {salud.fallosConsecutivos !== 1 ? 's' : ''} fallando
            </p>
          )}

          {salud.ultimoError && (
            <p className={styles.failureReason}>
              {salud.ultimoError.motivo ?? 'No se pudo obtener el valor de la fuente.'}
              {salud.ultimoError.codigo && (
                <span className={styles.errorCode}>{salud.ultimoError.codigo}</span>
              )}
            </p>
          )}

          {/*
            `requiereAtencion` y `proximoIntento` NO son excluyentes: al agotar
            los reintentos —o ante un error determinista, que no tiene ninguno—
            la fuente vuelve al ciclo diario y sigue intentando. Mostrar solo uno
            de los dos miente en las dos direcciones: "nadie va a intentar de
            nuevo" por un lado, "ya se va a resolver solo" por el otro.

            proximoIntento null en una tasa automática es su propio caso, y no
            quiere decir que se abandonó: el estado del scheduler vive en memoria
            del backend y se pierde en un reinicio hasta el primer tick.
          */}
          <p className={styles.proximo}>
            {salud.proximoIntento
              ? `Se reintenta igual el ${formatDateTime(salud.proximoIntento)}`
              : 'Sin próximo intento programado'}
          </p>
        </div>
      )}

      {/*
        Vencida pero sin un solo intento fallido registrado. No es lo mismo que
        "el scraper falla": o nunca corrió, o el proceso del backend se reinició
        y perdió el ciclo, o el umbral de vencimiento no se pudo leer y el
        backend degradó hacia "vencida". Sin esta línea el badge dice
        "Desactualizada" y no hay nada en la tarjeta que lo explique.
      */}
      {esAutomatica && salud.stale && !hayAviso && (
        <p className={styles.staleSinFallos}>
          {salud.ultimoExito
            ? 'El valor está vencido y no hay intentos fallidos registrados: revisá que el scraper esté corriendo.'
            : 'Nunca se completó una actualización de esta tasa.'}
        </p>
      )}

      {/* Sin avisos, el próximo intento es información de rutina, no una alerta. */}
      {esAutomatica && !hayAviso && salud.proximoIntento && (
        <p className={styles.proximoTranquilo}>
          Próximo intento: {formatDateTime(salud.proximoIntento)}
        </p>
      )}
    </article>
  );
}
