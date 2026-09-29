import { LogEvent } from '../models/log-event.model';

/** Queue age is browser metadata; the backend supplies the event date. */
export function normalizeLogDate(event: LogEvent): LogEvent {
  const { FECHA_EVENTO, FECHA_EVENTO_UTC, ...current } = event;
  const previous = FECHA_EVENTO ?? FECHA_EVENTO_UTC;
  const queuedAt = typeof current.ENCOLADO_EN === 'number'
    ? current.ENCOLADO_EN
    : typeof previous === 'string' ? Date.parse(previous) : NaN;
  return { ...current, ENCOLADO_EN: queuedAt };
}
