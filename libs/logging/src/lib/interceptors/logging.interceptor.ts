import { inject } from '@angular/core';
import { HttpContextToken, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';
import { LogContext } from '../models/log-event.model';
import { LoggingService } from '../services/logging.service';
export const XTEIN_LOG_CONTEXT = new HttpContextToken<LogContext>(() => ({}));
export const loggingInterceptor: HttpInterceptorFn = (request, next) => {
  const logging = inject(LoggingService);
  const context = { ...request.context.get(XTEIN_LOG_CONTEXT), ID_CORRELACION: crypto.randomUUID() };
  const started = Date.now();
  let body = request.body;
  const serialized = typeof body === 'string';
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
  // Preserve the established API envelope; reporting/binary endpoints keep their own protocol.
  if (body && typeof body === 'object' && 'prmAccion' in body) {
    body = { ...body, prmLog: context };
    request = request.clone({ body: serialized ? JSON.stringify(body) : body });
  }
  const details = (status: number, output: unknown) => ({ ENDPOINT: request.url.split('?')[0], METODO_HTTP: request.method,
    ACCION: body && typeof body === 'object' ? (body as Record<string, unknown>)['prmAccion'] : undefined,
    DURACION_MS: Date.now() - started, ESTADO_HTTP: status, ENTRADA: body, SALIDA: output });
  return next(request).pipe(tap({
    next: event => {
      if (event instanceof HttpResponse) {
        const message = reportedError(event.body);
        if (message) logging.error(message, context, details(event.status, event.body));
      }
    },
    error: error => logging.error(error, context, { ...details(error.status || 0, error.error), CATEGORIA: error.status === 0 ? 'CONEXION' : 'HTTP' })
  }));
};
function reportedError(value: unknown, depth = 0): string | null {
  if (depth > 8 || !value) return null;
  if (typeof value === 'string') { try { return reportedError(JSON.parse(value), depth + 1); } catch { return null; } }
  if (Array.isArray(value)) { for (const row of value.slice(0, 100)) { const error = reportedError(row, depth + 1); if (error) return error; } return null; }
  if (typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  return typeof row['ErrMensaje'] === 'string' && row['ErrMensaje'].trim() ? row['ErrMensaje'] : reportedError(row['data'], depth + 1);
}
